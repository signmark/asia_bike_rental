import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import { insertUserSchema, insertVehicleSchema, insertBookingSchema, insertPaymentSchema } from "@shared/schema";
import { z } from "zod";
import crypto from "crypto";
import connectPgSimple from "connect-pg-simple";
import { Pool } from "pg";

const PgSession = connectPgSimple(session);

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "rentmybike_salt").digest("hex");
}

function requireAuth(req: Request, res: Response, next: Function) {
  if (!(req.session as any).userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

function requireAdmin(req: Request, res: Response, next: Function) {
  if ((req.session as any).userRole !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  const isProd = process.env.NODE_ENV === "production";

  app.use(
    session({
      store: new PgSession({ pool, createTableIfMissing: true }),
      secret: process.env.SESSION_SECRET || "rentmybike-secret-key",
      resave: false,
      saveUninitialized: false,
      name: "rmb.sid",
      cookie: {
        secure: isProd,   // true in prod (Traefik terminates HTTPS → sets X-Forwarded-Proto)
        httpOnly: true,
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      },
    })
  );

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = insertUserSchema.extend({
        password: z.string().min(6),
        email: z.string().email(),
        username: z.string().min(3),
      }).parse(req.body);

      const existing = await storage.getUserByUsername(data.username);
      if (existing) return res.status(400).json({ error: "Username already taken" });

      const existingEmail = await storage.getUserByEmail(data.email);
      if (existingEmail) return res.status(400).json({ error: "Email already registered" });

      const user = await storage.createUser({
        ...data,
        password: hashPassword(data.password),
      });

      (req.session as any).userId = user.id;
      (req.session as any).userRole = user.role;

      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== hashPassword(password)) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      (req.session as any).userId = user.id;
      (req.session as any).userRole = user.role;

      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Forgot password — generate token, return reset link (no email service)
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "Email required" });

      const user = await storage.getUserByEmail(email);
      // Always respond OK — don't reveal if email exists
      if (!user) return res.json({ ok: true });

      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await storage.createResetToken(user.id, token, expiresAt);

      // Return token directly (no email service — caller shows the link)
      res.json({ ok: true, token });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Verify reset token
  app.get("/api/auth/reset-password/:token", async (req, res) => {
    try {
      const row = await storage.getResetToken(req.params.token);
      if (!row || row.used || row.expiresAt < new Date()) {
        return res.status(400).json({ valid: false });
      }
      res.json({ valid: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Reset password with token
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      if (!token || !password || password.length < 6) {
        return res.status(400).json({ error: "Invalid request" });
      }

      const row = await storage.getResetToken(token);
      if (!row || row.used || row.expiresAt < new Date()) {
        return res.status(400).json({ error: "Token invalid or expired" });
      }

      await storage.updateUser(row.userId, { password: hashPassword(password) });
      await storage.markResetTokenUsed(row.id);

      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {});
    res.json({ ok: true });
  });

  app.get("/api/auth/me", async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const user = await storage.getUser(userId);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  });

  // Vehicles
  app.get("/api/vehicles", async (req, res) => {
    try {
      const { type, engineType, search, ownerId, status } = req.query as Record<string, string>;
      const userId = (req.session as any).userId;

      const filters: any = {};
      if (type) filters.type = type;
      if (engineType) filters.engineType = engineType;
      if (search) filters.search = search;

      if (ownerId) {
        if (ownerId !== userId && (req.session as any).userRole !== "admin") {
          return res.status(403).json({ error: "Forbidden" });
        }
        filters.ownerId = ownerId;
        if (status) filters.status = status;
        else filters.status = undefined;
      } else {
        filters.status = "active";
      }

      const list = await storage.getVehicles(filters);
      res.json(list);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/vehicles/admin", requireAuth, requireAdmin, async (req, res) => {
    try {
      const list = await storage.getVehicles({ status: req.query.status as string || "pending" });
      res.json(list);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/vehicles/:id", async (req, res) => {
    try {
      const v = await storage.getVehicle(req.params.id);
      if (!v) return res.status(404).json({ error: "Not found" });
      res.json(v);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/vehicles", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const user = await storage.getUser(userId);
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      if (user.subscriptionStatus !== "business" && user.role !== "admin") {
        const vehicleCount = await storage.countOwnerVehicles(userId);
        if (vehicleCount >= 1) {
          return res.status(403).json({ error: "LIMIT_REACHED", message: "Upgrade to Business to add more vehicles" });
        }
      }

      const data = insertVehicleSchema.parse(req.body);
      const v = await storage.createVehicle(userId, data);
      res.json(v);
    } catch (e: any) {
      if (e.name === "ZodError") return res.status(400).json({ error: e.errors[0].message });
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/vehicles/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const v = await storage.getVehicle(req.params.id);
      if (!v) return res.status(404).json({ error: "Not found" });

      const isAdmin = (req.session as any).userRole === "admin";
      if (v.ownerId !== userId && !isAdmin) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const updated = await storage.updateVehicle(req.params.id, req.body);
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/vehicles/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const v = await storage.getVehicle(req.params.id);
      if (!v) return res.status(404).json({ error: "Not found" });

      const isAdmin = (req.session as any).userRole === "admin";
      if (v.ownerId !== userId && !isAdmin) {
        return res.status(403).json({ error: "Forbidden" });
      }

      await storage.deleteVehicle(req.params.id);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Bookings
  app.get("/api/bookings/my", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const list = await storage.getBookingsByRenter(userId);
      res.json(list);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/bookings/owner", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const list = await storage.getBookingsByOwner(userId);
      res.json(list);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/bookings/admin", requireAuth, requireAdmin, async (req, res) => {
    try {
      const list = await storage.getAllBookings();
      res.json(list);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/bookings/vehicle/:vehicleId", async (req, res) => {
    try {
      const list = await storage.getBookingsByVehicle(req.params.vehicleId);
      res.json(list);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/bookings", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const data = insertBookingSchema.parse(req.body);
      const b = await storage.createBooking(userId, data);
      res.json(b);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.patch("/api/bookings/:id", requireAuth, async (req, res) => {
    try {
      const b = await storage.updateBooking(req.params.id, req.body);
      res.json(b);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Payments
  app.get("/api/payments/my", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const list = await storage.getPaymentsByUser(userId);
      res.json(list);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/payments/admin", requireAuth, requireAdmin, async (req, res) => {
    try {
      const list = await storage.getAllPayments();
      res.json(list);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/payments", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const data = insertPaymentSchema.parse(req.body);
      const p = await storage.createPayment(userId, data);
      res.json(p);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.patch("/api/payments/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      const payment = await storage.getPayment(req.params.id);
      if (!payment) return res.status(404).json({ error: "Not found" });

      const updated = await storage.updatePayment(req.params.id, { status });

      if (status === "approved") {
        await storage.updateUser(payment.userId, { subscriptionStatus: "business", role: "business" });
      }

      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Admin
  app.get("/api/admin/users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const list = await storage.getAllUsers();
      res.json(list.map(({ password: _, ...u }) => u));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/admin/users/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const updated = await storage.updateUser(req.params.id, req.body);
      const { password: _, ...safeUser } = updated;
      res.json(safeUser);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Stats
  app.get("/api/admin/stats", requireAuth, requireAdmin, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const allVehicles = await storage.getVehicles({ status: "active" });
      const pendingVehicles = await storage.getVehicles({ status: "pending" });
      const allBookings = await storage.getAllBookings();
      const allPayments = await storage.getAllPayments();

      const totalRevenue = allPayments
        .filter(p => p.status === "approved")
        .reduce((sum, p) => sum + Number(p.amount), 0);

      res.json({
        totalUsers: allUsers.length,
        businessUsers: allUsers.filter(u => u.subscriptionStatus === "business").length,
        totalVehicles: allVehicles.length,
        pendingVehicles: pendingVehicles.length,
        totalBookings: allBookings.length,
        totalRevenue,
        pendingPayments: allPayments.filter(p => p.status === "pending").length,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  return httpServer;
}

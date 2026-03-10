import { db } from "./db";
import { users, vehicles, bookings, payments } from "@shared/schema";
import { eq, and, ne, count, desc, or, ilike } from "drizzle-orm";
import type {
  User, InsertUser, Vehicle, InsertVehicle,
  Booking, InsertBooking, Payment, InsertPayment,
  VehicleWithOwner, BookingWithDetails, PaymentWithUser,
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
  getAllUsers(): Promise<User[]>;

  // Vehicles
  getVehicle(id: string): Promise<VehicleWithOwner | undefined>;
  getVehicles(filters?: { type?: string; engineType?: string; status?: string; ownerId?: string; search?: string }): Promise<VehicleWithOwner[]>;
  createVehicle(ownerId: string, vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: string, data: Partial<Vehicle>): Promise<Vehicle>;
  deleteVehicle(id: string): Promise<void>;
  countOwnerVehicles(ownerId: string): Promise<number>;

  // Bookings
  getBooking(id: string): Promise<BookingWithDetails | undefined>;
  getBookingsByRenter(renterId: string): Promise<BookingWithDetails[]>;
  getBookingsByVehicle(vehicleId: string): Promise<BookingWithDetails[]>;
  getBookingsByOwner(ownerId: string): Promise<BookingWithDetails[]>;
  getAllBookings(): Promise<BookingWithDetails[]>;
  createBooking(renterId: string, booking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, data: Partial<Booking>): Promise<Booking>;

  // Payments
  getPayment(id: string): Promise<PaymentWithUser | undefined>;
  getPaymentsByUser(userId: string): Promise<Payment[]>;
  getAllPayments(): Promise<PaymentWithUser[]>;
  createPayment(userId: string, payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, data: Partial<Payment>): Promise<Payment>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getVehicle(id: string): Promise<VehicleWithOwner | undefined> {
    const result = await db.select().from(vehicles)
      .leftJoin(users, eq(vehicles.ownerId, users.id))
      .where(eq(vehicles.id, id));
    if (!result[0]) return undefined;
    return { ...result[0].vehicles, owner: result[0].users! };
  }

  async getVehicles(filters?: { type?: string; engineType?: string; status?: string; ownerId?: string; search?: string }): Promise<VehicleWithOwner[]> {
    const conditions = [];

    if (filters?.status) {
      conditions.push(eq(vehicles.status, filters.status as any));
    } else {
      conditions.push(eq(vehicles.status, "active"));
    }

    if (filters?.type) conditions.push(eq(vehicles.type, filters.type as any));
    if (filters?.engineType) conditions.push(eq(vehicles.engineType, filters.engineType as any));
    if (filters?.ownerId) conditions.push(eq(vehicles.ownerId, filters.ownerId));

    let query = db.select().from(vehicles)
      .leftJoin(users, eq(vehicles.ownerId, users.id));

    const result = conditions.length > 0
      ? await query.where(and(...conditions)).orderBy(desc(vehicles.createdAt))
      : await query.orderBy(desc(vehicles.createdAt));

    return result.map(r => ({ ...r.vehicles, owner: r.users! }))
      .filter(v => {
        if (!filters?.search) return true;
        const s = filters.search.toLowerCase();
        return v.title.toLowerCase().includes(s) ||
          v.brand.toLowerCase().includes(s) ||
          v.model.toLowerCase().includes(s) ||
          (v.description?.toLowerCase().includes(s));
      });
  }

  async createVehicle(ownerId: string, vehicle: InsertVehicle): Promise<Vehicle> {
    const [v] = await db.insert(vehicles).values({ ...vehicle, ownerId }).returning();
    return v;
  }

  async updateVehicle(id: string, data: Partial<Vehicle>): Promise<Vehicle> {
    const [v] = await db.update(vehicles).set(data).where(eq(vehicles.id, id)).returning();
    return v;
  }

  async deleteVehicle(id: string): Promise<void> {
    await db.update(vehicles).set({ status: "deleted" }).where(eq(vehicles.id, id));
  }

  async countOwnerVehicles(ownerId: string): Promise<number> {
    const [result] = await db.select({ count: count() }).from(vehicles)
      .where(and(eq(vehicles.ownerId, ownerId), ne(vehicles.status, "deleted")));
    return Number(result.count);
  }

  async getBooking(id: string): Promise<BookingWithDetails | undefined> {
    const result = await db.select().from(bookings)
      .leftJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
      .leftJoin(users, eq(bookings.renterId, users.id))
      .where(eq(bookings.id, id));
    if (!result[0]) return undefined;
    return { ...result[0].bookings, vehicle: result[0].vehicles!, renter: result[0].users! };
  }

  async getBookingsByRenter(renterId: string): Promise<BookingWithDetails[]> {
    const result = await db.select().from(bookings)
      .leftJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
      .leftJoin(users, eq(bookings.renterId, users.id))
      .where(eq(bookings.renterId, renterId))
      .orderBy(desc(bookings.createdAt));
    return result.map(r => ({ ...r.bookings, vehicle: r.vehicles!, renter: r.users! }));
  }

  async getBookingsByVehicle(vehicleId: string): Promise<BookingWithDetails[]> {
    const result = await db.select().from(bookings)
      .leftJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
      .leftJoin(users, eq(bookings.renterId, users.id))
      .where(eq(bookings.vehicleId, vehicleId))
      .orderBy(desc(bookings.createdAt));
    return result.map(r => ({ ...r.bookings, vehicle: r.vehicles!, renter: r.users! }));
  }

  async getBookingsByOwner(ownerId: string): Promise<BookingWithDetails[]> {
    const result = await db.select().from(bookings)
      .leftJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
      .leftJoin(users, eq(bookings.renterId, users.id))
      .where(eq(vehicles.ownerId, ownerId))
      .orderBy(desc(bookings.createdAt));
    return result.map(r => ({ ...r.bookings, vehicle: r.vehicles!, renter: r.users! }));
  }

  async getAllBookings(): Promise<BookingWithDetails[]> {
    const result = await db.select().from(bookings)
      .leftJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
      .leftJoin(users, eq(bookings.renterId, users.id))
      .orderBy(desc(bookings.createdAt));
    return result.map(r => ({ ...r.bookings, vehicle: r.vehicles!, renter: r.users! }));
  }

  async createBooking(renterId: string, booking: InsertBooking): Promise<Booking> {
    const [b] = await db.insert(bookings).values({ ...booking, renterId }).returning();
    return b;
  }

  async updateBooking(id: string, data: Partial<Booking>): Promise<Booking> {
    const [b] = await db.update(bookings).set(data).where(eq(bookings.id, id)).returning();
    return b;
  }

  async getPayment(id: string): Promise<PaymentWithUser | undefined> {
    const result = await db.select().from(payments)
      .leftJoin(users, eq(payments.userId, users.id))
      .where(eq(payments.id, id));
    if (!result[0]) return undefined;
    return { ...result[0].payments, user: result[0].users! };
  }

  async getPaymentsByUser(userId: string): Promise<Payment[]> {
    return db.select().from(payments).where(eq(payments.userId, userId)).orderBy(desc(payments.createdAt));
  }

  async getAllPayments(): Promise<PaymentWithUser[]> {
    const result = await db.select().from(payments)
      .leftJoin(users, eq(payments.userId, users.id))
      .orderBy(desc(payments.createdAt));
    return result.map(r => ({ ...r.payments, user: r.users! }));
  }

  async createPayment(userId: string, payment: InsertPayment): Promise<Payment> {
    const [p] = await db.insert(payments).values({ ...payment, userId }).returning();
    return p;
  }

  async updatePayment(id: string, data: Partial<Payment>): Promise<Payment> {
    const [p] = await db.update(payments).set(data).where(eq(payments.id, id)).returning();
    return p;
  }
}

export const storage = new DatabaseStorage();

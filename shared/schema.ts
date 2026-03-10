import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["guest", "user", "business", "admin"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["free", "business", "pending"]);
export const vehicleTypeEnum = pgEnum("vehicle_type", ["bike", "car", "scooter"]);
export const engineTypeEnum = pgEnum("engine_type", ["electric", "gasoline"]);
export const vehicleStatusEnum = pgEnum("vehicle_status", ["pending", "active", "rejected", "deleted"]);
export const bookingStatusEnum = pgEnum("booking_status", ["pending", "confirmed", "cancelled", "completed"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "approved", "rejected"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default("user"),
  subscriptionStatus: subscriptionStatusEnum("subscription_status").notNull().default("free"),
  displayName: text("display_name"),
  phone: text("phone"),
  avatar: text("avatar"),
  telegramUsername: text("telegram_username"),
  verified: boolean("verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const vehicles = pgTable("vehicles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  type: vehicleTypeEnum("type").notNull().default("bike"),
  engineType: engineTypeEnum("engine_type").notNull().default("electric"),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  year: integer("year"),
  color: text("color"),
  seats: integer("seats").notNull().default(2),
  pricePerDay: decimal("price_per_day", { precision: 10, scale: 2 }).notNull(),
  pricePerWeek: decimal("price_per_week", { precision: 10, scale: 2 }),
  pricePerMonth: decimal("price_per_month", { precision: 10, scale: 2 }),
  location: text("location").notNull().default("Nha Trang"),
  images: text("images").array().notNull().default(sql`'{}'::text[]`),
  status: vehicleStatusEnum("status").notNull().default("pending"),
  featured: boolean("featured").notNull().default(false),
  available: boolean("available").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vehicleId: varchar("vehicle_id").notNull().references(() => vehicles.id),
  renterId: varchar("renter_id").notNull().references(() => users.id),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  status: bookingStatusEnum("status").notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  plan: text("plan").notNull().default("business"),
  status: paymentStatusEnum("status").notNull().default("pending"),
  proofImage: text("proof_image"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  role: true,
  subscriptionStatus: true,
  verified: true,
});
export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
  ownerId: true,
  status: true,
  featured: true,
  createdAt: true,
});
export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  renterId: true,
  status: true,
  createdAt: true,
});
export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  userId: true,
  status: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

export type VehicleWithOwner = Vehicle & { owner: User };
export type BookingWithDetails = Booking & { vehicle: Vehicle; renter: User };
export type PaymentWithUser = Payment & { user: User };

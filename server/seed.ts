import { db } from "./db";
import { users, vehicles } from "@shared/schema";
import { eq, count } from "drizzle-orm";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "rentmybike_salt").digest("hex");
}

export async function seedDatabase() {
  const [userCount] = await db.select({ count: count() }).from(users);
  if (Number(userCount.count) > 0) return;

  console.log("Seeding database...");

  const [admin] = await db.insert(users).values({
    username: "admin",
    email: "admin@rentmybike.vn",
    password: hashPassword("admin123"),
    role: "admin",
    subscriptionStatus: "business",
    displayName: "Admin",
    verified: true,
  }).returning();

  const [owner1] = await db.insert(users).values({
    username: "minh_vf",
    email: "minh@example.com",
    password: hashPassword("password123"),
    role: "business",
    subscriptionStatus: "business",
    displayName: "Minh Nguyen",
    phone: "+84 90 123 4567",
    verified: true,
  }).returning();

  const [owner2] = await db.insert(users).values({
    username: "lan_rental",
    email: "lan@example.com",
    password: hashPassword("password123"),
    role: "user",
    subscriptionStatus: "free",
    displayName: "Lan Tran",
    phone: "+84 91 234 5678",
    verified: true,
  }).returning();

  const [renter1] = await db.insert(users).values({
    username: "alex_tourist",
    email: "alex@example.com",
    password: hashPassword("password123"),
    role: "user",
    subscriptionStatus: "free",
    displayName: "Alex Johnson",
    verified: false,
  }).returning();

  await db.insert(vehicles).values([
    {
      ownerId: owner1.id,
      title: "VinFast Klara S - Premium Electric",
      description: "Brand new VinFast Klara S electric scooter. Perfect for city rides and beach trips in Nha Trang. Fully charged, smooth ride, and eco-friendly. Includes helmet and lock.",
      type: "bike",
      engineType: "electric",
      brand: "VinFast",
      model: "Klara S",
      year: 2024,
      color: "White",
      seats: 2,
      pricePerDay: "12.00",
      pricePerWeek: "70.00",
      pricePerMonth: "250.00",
      location: "Nha Trang Center",
      images: [
        "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&q=80",
        "https://images.unsplash.com/photo-1558981359-219d6364c9c8?w=800&q=80",
      ],
      status: "active",
      featured: true,
      available: true,
    },
    {
      ownerId: owner1.id,
      title: "VinFast Theon - Sport Electric Bike",
      description: "Powerful VinFast Theon sport electric bike. Great performance with a range of up to 120km per charge. Perfect for exploring the coastline around Nha Trang.",
      type: "bike",
      engineType: "electric",
      brand: "VinFast",
      model: "Theon",
      year: 2023,
      color: "Blue",
      seats: 2,
      pricePerDay: "18.00",
      pricePerWeek: "110.00",
      pricePerMonth: "380.00",
      location: "Nha Trang Beach",
      images: [
        "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800&q=80",
        "https://images.unsplash.com/photo-1572307480813-ceb0e59d8325?w=800&q=80",
      ],
      status: "active",
      featured: true,
      available: true,
    },
    {
      ownerId: owner2.id,
      title: "Honda Wave Alpha - Reliable City Scooter",
      description: "Classic Honda Wave Alpha, very fuel-efficient and reliable. Great for city rides and short trips around Nha Trang. Easy to ride for beginners.",
      type: "scooter",
      engineType: "gasoline",
      brand: "Honda",
      model: "Wave Alpha",
      year: 2022,
      color: "Red",
      seats: 2,
      pricePerDay: "8.00",
      pricePerWeek: "45.00",
      pricePerMonth: "150.00",
      location: "Nha Trang Old Town",
      images: [
        "https://images.unsplash.com/photo-1547549082-6bc09f2049ae?w=800&q=80",
        "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?w=800&q=80",
      ],
      status: "active",
      featured: false,
      available: true,
    },
    {
      ownerId: owner1.id,
      title: "Yamaha Janus - Stylish & Comfortable",
      description: "Yamaha Janus with spacious underseat storage. Very comfortable for long rides. Great for couples exploring Nha Trang's beautiful beaches and landmarks.",
      type: "scooter",
      engineType: "gasoline",
      brand: "Yamaha",
      model: "Janus",
      year: 2023,
      color: "Black",
      seats: 2,
      pricePerDay: "10.00",
      pricePerWeek: "58.00",
      pricePerMonth: "200.00",
      location: "Vinpearl Area",
      images: [
        "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=800&q=80",
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
      ],
      status: "active",
      featured: false,
      available: true,
    },
    {
      ownerId: owner2.id,
      title: "VinFast Evo200 - Latest Model 2024",
      description: "Brand new VinFast Evo200 electric scooter, the latest flagship model. Powerful, stylish, and fully connected with smartphone integration.",
      type: "bike",
      engineType: "electric",
      brand: "VinFast",
      model: "Evo200",
      year: 2024,
      color: "Silver",
      seats: 2,
      pricePerDay: "22.00",
      pricePerWeek: "130.00",
      pricePerMonth: "450.00",
      location: "Airport District",
      images: [
        "https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800&q=80",
        "https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?w=800&q=80",
      ],
      status: "active",
      featured: true,
      available: true,
    },
    {
      ownerId: owner1.id,
      title: "Suzuki Raider R150 - Sport Motorbike",
      description: "Powerful Suzuki Raider R150 sport motorbike for experienced riders. Great for day trips to Ba Ho Waterfall or Yang Bay.",
      type: "bike",
      engineType: "gasoline",
      brand: "Suzuki",
      model: "Raider R150",
      year: 2022,
      color: "Orange",
      seats: 2,
      pricePerDay: "20.00",
      pricePerWeek: "120.00",
      pricePerMonth: "400.00",
      location: "Nha Trang Center",
      images: [
        "https://images.unsplash.com/photo-1558618047-f4e90e929f45?w=800&q=80",
        "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&q=80",
      ],
      status: "active",
      featured: false,
      available: true,
    },
  ]);

  console.log("Database seeded successfully.");
}

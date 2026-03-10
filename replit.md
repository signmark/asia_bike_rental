# RentMyBike.vn

A P2P vehicle rental marketplace for Nha Trang, Vietnam. Focused on electric VinFast bikes and local scooters, connecting vehicle owners with renters.

## Architecture

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + TypeScript (tsx)
- **Database**: PostgreSQL (Drizzle ORM)
- **Auth**: Session-based (express-session + connect-pg-simple)
- **State**: TanStack Query v5

## Key Features

1. **Marketplace** - Browse vehicles with filters (type, engine) and search
2. **User Auth** - Register/Login with session cookies
3. **Vehicle Listings** - Create, edit, delete vehicle listings
4. **Bookings** - Request bookings, owner confirms/declines
5. **Business Subscription** - Free plan (1 listing) vs Business plan (unlimited)
6. **Payment Flow** - Manual payment proof submission → Admin approval
7. **Admin Panel** - Vehicle moderation, payment approvals, user management

## User Roles

- `guest` - Browse marketplace only
- `user` / `free` - 1 vehicle listing max, can book vehicles
- `business` - Unlimited listings, featured placement
- `admin` - Full platform management

## Demo Accounts

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Admin |
| minh_vf | password123 | Business Owner |
| lan_rental | password123 | Free User |
| alex_tourist | password123 | Free User (renter) |

## Routes

- `/` - Marketplace homepage
- `/login` - Login page
- `/register` - Registration page
- `/vehicle/:id` - Vehicle detail + booking
- `/dashboard` - User dashboard (My listings, received bookings, my bookings)
- `/add-vehicle` - Add new vehicle listing
- `/edit-vehicle/:id` - Edit existing vehicle
- `/upgrade` - Upgrade to Business plan
- `/admin` - Admin control center

## API Endpoints

### Auth
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Current user

### Vehicles
- `GET /api/vehicles` - List active vehicles (filter: type, engineType, search, ownerId)
- `GET /api/vehicles/admin` - Admin: all vehicles by status
- `GET /api/vehicles/:id` - Vehicle detail
- `POST /api/vehicles` - Create (auth, 1-listing limit for free users)
- `PATCH /api/vehicles/:id` - Update (owner or admin)
- `DELETE /api/vehicles/:id` - Soft delete (owner or admin)

### Bookings
- `GET /api/bookings/my` - My bookings as renter
- `GET /api/bookings/owner` - Bookings for my vehicles
- `GET /api/bookings/admin` - All bookings (admin)
- `POST /api/bookings` - Create booking
- `PATCH /api/bookings/:id` - Update booking status

### Payments
- `GET /api/payments/my` - My payments
- `GET /api/payments/admin` - All payments (admin)
- `POST /api/payments` - Submit payment proof
- `PATCH /api/payments/:id` - Approve/reject (admin, auto-upgrades user)

### Admin
- `GET /api/admin/users` - All users
- `PATCH /api/admin/users/:id` - Update user
- `GET /api/admin/stats` - Platform statistics

## Database Schema

- `users` - User accounts with role and subscription status
- `vehicles` - Vehicle listings with owner reference
- `bookings` - Rental bookings between renters and vehicle owners
- `payments` - Business plan payment requests and approvals
- `session` - Session storage table (connect-pg-simple)

## Business Logic

- Free users: max 1 vehicle (enforced on backend)
- Vehicles start as `pending`, admin approves/rejects
- Payment approval automatically upgrades user to business plan
- Business plan: $29/month via manual bank transfer

## Running

The app runs via `npm run dev` which starts both Express backend (API) and Vite dev server on port 5000.

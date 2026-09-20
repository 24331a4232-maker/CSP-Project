import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, doublePrecision } from 'drizzle-orm/pg-core';

// Define the 'users' table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  fullName: text('full_name'),
  role: text('role').default('donor'),
  phone: text('phone').default(''),
  organization: text('organization').default(''),
  profilePicUrl: text('profile_pic_url').default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'donations' table
export const donations = pgTable('donations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  title: text('title').notNull(),
  foodType: text('food_type').notNull(),
  quantity: text('quantity').notNull(),
  servings: integer('servings').notNull().default(10),
  donorName: text('donor_name').notNull(),
  donorPhone: text('donor_phone').notNull(),
  donorEmail: text('donor_email').notNull(),
  pickupAddress: text('pickup_address').notNull(),
  pickupTime: text('pickup_time').notNull(),
  expiryTime: text('expiry_time').notNull(),
  status: text('status').default('available'),
  volunteerName: text('volunteer_name').default(''),
  volunteerPhone: text('volunteer_phone').default(''),
  deliveryProofUrl: text('delivery_proof_url').default(''),
  deliveryNote: text('delivery_note').default(''),
  imageUrl: text('image_url').default(''),
  urgency: text('urgency').default('medium'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Define the 'volunteers' table
export const volunteers = pgTable('volunteers', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  fullName: text('full_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').default(''),
  bio: text('bio').default(''),
  vehicleType: text('vehicle_type').default('Electric Vehicle / Bike'),
  serviceCity: text('service_city').default('Central District'),
  availability: text('availability').default('Weekdays & Evenings'),
  emergencyContact: text('emergency_contact').default(''),
  profilePicUrl: text('profile_pic_url').default(''),
  badgeLevel: text('badge_level').default('Rescue Captain'),
  totalRescues: integer('total_rescues').default(0),
  totalHours: integer('total_hours').default(0),
  rating: doublePrecision('rating').default(5.0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define relationships
export const usersRelations = relations(users, ({ many }) => ({
  donations: many(donations),
  volunteers: many(volunteers),
}));

export const donationsRelations = relations(donations, ({ one }) => ({
  donor: one(users, {
    fields: [donations.userId],
    references: [users.id],
  }),
}));

export const volunteersRelations = relations(volunteers, ({ one }) => ({
  user: one(users, {
    fields: [volunteers.userId],
    references: [users.id],
  }),
}));

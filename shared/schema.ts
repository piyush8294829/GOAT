import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionStatus: varchar("subscription_status"), // active, canceled, past_due, etc.
  subscriptionPlan: varchar("subscription_plan"), // monthly, yearly
  trialEndsAt: timestamp("trial_ends_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User onboarding data
export const userOnboarding = pgTable("user_onboarding", {
  id: varchar("id").primaryKey().notNull(),
  userId: varchar("user_id").notNull().references(() => users.id),
  focusGoal: varchar("focus_goal"), // work, study, health, custom
  sessionPreferences: jsonb("session_preferences"), // array of pomodoro, long, strict
  appBlockingEnabled: boolean("app_blocking_enabled").default(false),
  motivationTypes: jsonb("motivation_types"), // array of streaks, achievements, rewards
  onboardingCompleted: boolean("onboarding_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Focus sessions
export const focusSessions = pgTable("focus_sessions", {
  id: varchar("id").primaryKey().notNull(),
  userId: varchar("user_id").notNull().references(() => users.id),
  sessionType: varchar("session_type").notNull(), // pomodoro, long, strict
  plannedDuration: integer("planned_duration").notNull(), // in minutes
  actualDuration: integer("actual_duration"), // in minutes
  completed: boolean("completed").default(false),
  distractionsBlocked: integer("distractions_blocked").default(0),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User achievements
export const userAchievements = pgTable("user_achievements", {
  id: varchar("id").primaryKey().notNull(),
  userId: varchar("user_id").notNull().references(() => users.id),
  achievementType: varchar("achievement_type").notNull(), // streak, session_count, focus_time
  achievementName: varchar("achievement_name").notNull(),
  description: varchar("description"),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Referral codes
export const referralCodes = pgTable("referral_codes", {
  id: varchar("id").primaryKey().notNull(),
  code: varchar("code").unique().notNull(),
  discountType: varchar("discount_type").notNull(), // percentage, amount, free
  discountValue: integer("discount_value"), // percentage (0-100) or amount in cents
  maxUses: integer("max_uses"), // null for unlimited
  currentUses: integer("current_uses").default(0),
  isActive: boolean("is_active").default(true),
  description: varchar("description"),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// Referral code usage tracking
export const referralCodeUsage = pgTable("referral_code_usage", {
  id: varchar("id").primaryKey().notNull(),
  referralCodeId: varchar("referral_code_id").notNull().references(() => referralCodes.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  subscriptionId: varchar("subscription_id"),
  usedAt: timestamp("used_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const insertUserOnboardingSchema = createInsertSchema(userOnboarding).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFocusSessionSchema = createInsertSchema(focusSessions).omit({
  id: true,
  createdAt: true,
});

export type InsertUserOnboarding = z.infer<typeof insertUserOnboardingSchema>;
export type UserOnboarding = typeof userOnboarding.$inferSelect;
export type FocusSession = typeof focusSessions.$inferSelect;
export type InsertFocusSession = z.infer<typeof insertFocusSessionSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type ReferralCode = typeof referralCodes.$inferSelect;
export type ReferralCodeUsage = typeof referralCodeUsage.$inferSelect;

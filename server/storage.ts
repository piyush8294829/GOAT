import {
  users,
  userOnboarding,
  focusSessions,
  userAchievements,
  referralCodes,
  referralCodeUsage,
  type User,
  type UpsertUser,
  type UserOnboarding,
  type InsertUserOnboarding,
  type FocusSession,
  type InsertFocusSession,
  type UserAchievement,
  type ReferralCode,
  type ReferralCodeUsage,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, count, sum } from "drizzle-orm";
import { nanoid } from "nanoid";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Subscription operations
  updateUserStripeInfo(userId: string, customerId: string, subscriptionId?: string): Promise<User>;
  updateSubscriptionStatus(userId: string, status: string, plan?: string): Promise<User>;
  
  // Onboarding operations
  getUserOnboarding(userId: string): Promise<UserOnboarding | undefined>;
  upsertUserOnboarding(userId: string, data: Partial<InsertUserOnboarding>): Promise<UserOnboarding>;
  completeOnboarding(userId: string): Promise<UserOnboarding>;
  
  // Focus session operations
  createFocusSession(data: InsertFocusSession): Promise<FocusSession>;
  getUserFocusSessions(userId: string, limit?: number): Promise<FocusSession[]>;
  getTodayStats(userId: string): Promise<{
    totalSessions: number;
    totalFocusTime: number;
    distractionsBlocked: number;
    streakDays: number;
  }>;
  
  // Achievement operations
  getUserAchievements(userId: string): Promise<UserAchievement[]>;
  addUserAchievement(userId: string, type: string, name: string, description: string): Promise<UserAchievement>;
  
  // Referral code operations
  validateReferralCode(code: string): Promise<{ valid: boolean; referralCode?: ReferralCode; message?: string }>;
  useReferralCode(code: string, userId: string, subscriptionId?: string): Promise<ReferralCodeUsage>;
  createReferralCode(code: string, discountType: string, discountValue: number, description?: string, maxUses?: number, expiresAt?: Date): Promise<ReferralCode>;
}

export class DatabaseStorage implements IStorage {
  private ensureDb() {
    if (!db) {
      throw new Error('Database not available. Please configure DATABASE_URL environment variable.');
    }
    return db;
  }

  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    const database = this.ensureDb();
    const [user] = await database.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const database = this.ensureDb();
    const [user] = await database
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Subscription operations
  async updateUserStripeInfo(userId: string, customerId: string, subscriptionId?: string): Promise<User> {
    const database = this.ensureDb();
    const [user] = await database
      .update(users)
      .set({
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateSubscriptionStatus(userId: string, status: string, plan?: string): Promise<User> {
    const database = this.ensureDb();
    const updateData: Partial<User> = {
      subscriptionStatus: status,
      updatedAt: new Date(),
    };
    
    if (plan) {
      updateData.subscriptionPlan = plan;
    }
    
    if (status === 'active' && !plan) {
      // Set trial end date to 7 days from now
      updateData.trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    const [user] = await database
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Onboarding operations
  async getUserOnboarding(userId: string): Promise<UserOnboarding | undefined> {
    const database = this.ensureDb();
    const [onboarding] = await database
      .select()
      .from(userOnboarding)
      .where(eq(userOnboarding.userId, userId));
    return onboarding;
  }

  async upsertUserOnboarding(userId: string, data: Partial<InsertUserOnboarding>): Promise<UserOnboarding> {
    const database = this.ensureDb();
    const onboardingData = {
      id: nanoid(),
      userId,
      ...data,
    };

    const [result] = await database
      .insert(userOnboarding)
      .values(onboardingData)
      .onConflictDoUpdate({
        target: userOnboarding.userId,
        set: {
          ...data,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  async completeOnboarding(userId: string): Promise<UserOnboarding> {
    const database = this.ensureDb();
    const [result] = await database
      .update(userOnboarding)
      .set({
        onboardingCompleted: true,
        updatedAt: new Date(),
      })
      .where(eq(userOnboarding.userId, userId))
      .returning();
    return result;
  }

  // Focus session operations
  async createFocusSession(data: InsertFocusSession): Promise<FocusSession> {
    const sessionData = {
      id: nanoid(),
      ...data,
    };

    const [session] = await (this.ensureDb())
      .insert(focusSessions)
      .values(sessionData)
      .returning();
    return session;
  }

  async getUserFocusSessions(userId: string, limit = 10): Promise<FocusSession[]> {
    return await (this.ensureDb())
      .select()
      .from(focusSessions)
      .where(eq(focusSessions.userId, userId))
      .orderBy(desc(focusSessions.createdAt))
      .limit(limit);
  }

  async getTodayStats(userId: string): Promise<{
    totalSessions: number;
    totalFocusTime: number;
    distractionsBlocked: number;
    streakDays: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get today's sessions
    const todaySessions = await (this.ensureDb())
      .select({
        count: count(),
        totalTime: sum(focusSessions.actualDuration),
        totalBlocked: sum(focusSessions.distractionsBlocked),
      })
      .from(focusSessions)
      .where(
        and(
          eq(focusSessions.userId, userId),
          gte(focusSessions.startedAt, today)
        )
      );

    // Calculate streak (simplified - could be more sophisticated)
    const recentSessions = await (this.ensureDb())
      .select({
        date: focusSessions.startedAt,
      })
      .from(focusSessions)
      .where(eq(focusSessions.userId, userId))
      .orderBy(desc(focusSessions.startedAt))
      .limit(30);

    // Simple streak calculation
    let streakDays = 0;
    const sessionDates = new Set();
    
    for (const session of recentSessions) {
      const sessionDate = new Date(session.date!);
      sessionDate.setHours(0, 0, 0, 0);
      sessionDates.add(sessionDate.getTime());
    }

    // Count consecutive days from today backwards
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    while (sessionDates.has(currentDate.getTime())) {
      streakDays++;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    const stats = todaySessions[0];
    return {
      totalSessions: Number(stats?.count) || 0,
      totalFocusTime: Number(stats?.totalTime) || 0,
      distractionsBlocked: Number(stats?.totalBlocked) || 0,
      streakDays,
    };
  }

  // Achievement operations
  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return await (this.ensureDb())
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId))
      .orderBy(desc(userAchievements.unlockedAt));
  }

  async addUserAchievement(userId: string, type: string, name: string, description: string): Promise<UserAchievement> {
    const [achievement] = await (this.ensureDb())
      .insert(userAchievements)
      .values({
        id: nanoid(),
        userId,
        achievementType: type,
        achievementName: name,
        description,
      })
      .returning();
    return achievement;
  }

  // Referral code operations
  async validateReferralCode(code: string): Promise<{ valid: boolean; referralCode?: ReferralCode; message?: string }> {
    const [referralCode] = await (this.ensureDb())
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.code, code.toUpperCase()));

    if (!referralCode) {
      return { valid: false, message: "Invalid referral code" };
    }

    if (!referralCode.isActive) {
      return { valid: false, message: "Referral code is no longer active" };
    }

    if (referralCode.expiresAt && new Date() > referralCode.expiresAt) {
      return { valid: false, message: "Referral code has expired" };
    }

    if (referralCode.maxUses && (referralCode.currentUses ?? 0) >= referralCode.maxUses) {
      return { valid: false, message: "Referral code has reached maximum uses" };
    }

    return { valid: true, referralCode };
  }

  async useReferralCode(code: string, userId: string, subscriptionId?: string): Promise<ReferralCodeUsage> {
    const validation = await this.validateReferralCode(code);
    
    if (!validation.valid || !validation.referralCode) {
      throw new Error(validation.message || "Invalid referral code");
    }

    // Check if user has already used this code
    const [existingUsage] = await (this.ensureDb())
      .select()
      .from(referralCodeUsage)
      .where(
        and(
          eq(referralCodeUsage.referralCodeId, validation.referralCode.id),
          eq(referralCodeUsage.userId, userId)
        )
      );

    if (existingUsage) {
      throw new Error("You have already used this referral code");
    }

    // Record usage
    const [usage] = await (this.ensureDb())
      .insert(referralCodeUsage)
      .values({
        id: nanoid(),
        referralCodeId: validation.referralCode.id,
        userId,
        subscriptionId,
      })
      .returning();

    // Update usage count
    await (this.ensureDb())
      .update(referralCodes)
      .set({
        currentUses: (validation.referralCode!.currentUses ?? 0) + 1,
      })
      .where(eq(referralCodes.id, validation.referralCode!.id));

    return usage;
  }

  async createReferralCode(
    code: string, 
    discountType: string, 
    discountValue: number, 
    description?: string, 
    maxUses?: number, 
    expiresAt?: Date
  ): Promise<ReferralCode> {
    const [referralCode] = await (this.ensureDb())
      .insert(referralCodes)
      .values({
        id: nanoid(),
        code: code.toUpperCase(),
        discountType,
        discountValue,
        description,
        maxUses,
        expiresAt,
      })
      .returning();
    return referralCode;
  }
}

export const storage = new DatabaseStorage();

import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertUserOnboardingSchema, insertFocusSessionSchema } from "@shared/schema";
import { z } from "zod";

// Initialize Stripe only if secret key is available
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-05-28.basil",
  });
} else {
  console.warn('⚠️  STRIPE_SECRET_KEY not found. Payment features will be disabled.');
}

// Plan configurations
const PLANS = {
  monthly: {
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID || 'price_monthly_default',
    amount: 700, // $7.00 in cents
    interval: 'month' as const,
  },
  yearly: {
    priceId: process.env.STRIPE_YEARLY_PRICE_ID || 'price_yearly_default',
    amount: 6900, // $69.00 in cents
    interval: 'year' as const,
  },
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Subscription status check
  app.get('/api/subscription/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const hasActiveSubscription = user.subscriptionStatus === 'active' || 
                                   user.subscriptionStatus === 'trialing' ||
                                   (user.trialEndsAt && new Date(user.trialEndsAt) > new Date());

      res.json({
        hasActiveSubscription,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPlan: user.subscriptionPlan,
        trialEndsAt: user.trialEndsAt,
      });
    } catch (error) {
      console.error("Error checking subscription status:", error);
      res.status(500).json({ message: "Failed to check subscription status" });
    }
  });

  // Onboarding routes
  app.get('/api/onboarding', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const onboarding = await storage.getUserOnboarding(userId);
      res.json(onboarding);
    } catch (error) {
      console.error("Error fetching onboarding:", error);
      res.status(500).json({ message: "Failed to fetch onboarding data" });
    }
  });

  app.post('/api/onboarding', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      console.log("Onboarding request body:", req.body);
      console.log("User ID:", userId);

      const validatedData = insertUserOnboardingSchema.parse(req.body);

      const onboarding = await storage.upsertUserOnboarding(userId, validatedData);
      res.json(onboarding);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error:", error.errors);
        return res.status(400).json({ message: "Invalid onboarding data", errors: error.errors });
      }
      console.error("Error saving onboarding:", error);
      res.status(500).json({ message: "Failed to save onboarding data" });
    }
  });

  app.post('/api/onboarding/complete', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const onboarding = await storage.completeOnboarding(userId);
      res.json(onboarding);
    } catch (error) {
      console.error("Error completing onboarding:", error);
      res.status(500).json({ message: "Failed to complete onboarding" });
    }
  });

  // Stripe subscription routes
  app.post('/api/create-subscription', isAuthenticated, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ 
          message: "Payment processing is not available. Please contact support.",
          error: "STRIPE_NOT_CONFIGURED"
        });
      }

      const userId = req.user.claims.sub;
      const { plan, referralCode } = req.body;

      if (!PLANS[plan as keyof typeof PLANS]) {
        return res.status(400).json({ message: "Invalid plan selected" });
      }

      const user = await storage.getUser(userId);
      if (!user || !user.email) {
        return res.status(400).json({ message: "User not found or email missing" });
      }

      // Validate referral code if provided
      let validatedReferralCode = null;
      let discountPercent = 0;

      if (referralCode) {
        const validation = await storage.validateReferralCode(referralCode);
        if (!validation.valid) {
          return res.status(400).json({ message: validation.message });
        }
        validatedReferralCode = validation.referralCode;

        if (validatedReferralCode?.discountType === 'percentage') {
          discountPercent = validatedReferralCode.discountValue || 0;
        } else if (validatedReferralCode?.discountType === 'free') {
          discountPercent = 100; // 100% discount for free codes
        }
      }

      let customer;
      if (user.stripeCustomerId) {
        customer = await stripe.customers.retrieve(user.stripeCustomerId);
      } else {
        customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          metadata: {
            userId: userId,
            referralCode: referralCode || '',
          },
        });
        await storage.updateUserStripeInfo(userId, customer.id);
      }

      const selectedPlan = PLANS[plan as keyof typeof PLANS];

      // Create subscription configuration
      let subscriptionConfig: any = {
        customer: customer.id,
        items: [{
          price: selectedPlan.priceId,
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId: userId,
          plan: plan,
          referralCode: referralCode || '',
        },
      };

      // Apply discount or free trial based on referral code
      if (discountPercent === 100) {
        // 100% discount - create a free subscription
        subscriptionConfig.trial_period_days = 365; // 1 year free trial
        subscriptionConfig.metadata.freeSubscription = 'true';
      } else if (discountPercent > 0) {
        // Create a coupon for the discount
        const coupon = await stripe.coupons.create({
          percent_off: discountPercent,
          duration: 'forever',
          name: `Referral Discount ${discountPercent}%`,
        });

        subscriptionConfig.coupon = coupon.id;
        subscriptionConfig.trial_period_days = 7;
      } else {
        subscriptionConfig.trial_period_days = 7;
      }

      const subscription = await stripe.subscriptions.create(subscriptionConfig);

      // Record referral code usage if valid
      if (validatedReferralCode) {
        try {
          await storage.useReferralCode(referralCode, userId, subscription.id);
        } catch (error) {
          console.error("Error recording referral code usage:", error);
        }
      }

      // Update user subscription info
      await storage.updateUserStripeInfo(userId, customer.id, subscription.id);
      await storage.updateSubscriptionStatus(userId, 'trialing', plan);

      const latestInvoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = latestInvoice?.payment_intent as Stripe.PaymentIntent;

      res.json({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent?.client_secret,
        status: subscription.status,
        discount: discountPercent > 0 ? `${discountPercent}% off` : null,
      });
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Error creating subscription: " + error.message });
    }
  });

  // Stripe webhook for subscription updates
  app.post('/api/webhooks/stripe', async (req, res) => {
    if (!stripe) {
      return res.status(503).json({ message: "Stripe not configured" });
    }

    const sig = req.headers['stripe-signature'] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret) {
      return res.status(400).json({ message: "Webhook secret not configured" });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err: any) {
      console.error(`Webhook signature verification failed:`, err.message);
      return res.status(400).json({ message: `Webhook Error: ${err.message}` });
    }

    try {
      switch (event.type) {
        case 'customer.subscription.updated':
        case 'customer.subscription.created': {
          const subscription = event.data.object as Stripe.Subscription;
          const userId = subscription.metadata.userId;
          const plan = subscription.metadata.plan;

          if (userId) {
            await storage.updateSubscriptionStatus(userId, subscription.status, plan);
          }
          break;
        }
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const userId = subscription.metadata.userId;

          if (userId) {
            await storage.updateSubscriptionStatus(userId, 'canceled');
          }
          break;
        }
        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Stripe.Invoice;
          if (invoice.subscription) {
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
            const userId = subscription.metadata.userId;

            if (userId) {
              await storage.updateSubscriptionStatus(userId, 'active', subscription.metadata.plan);
            }
          }
          break;
        }
        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          if (invoice.subscription) {
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
            const userId = subscription.metadata.userId;

            if (userId) {
              await storage.updateSubscriptionStatus(userId, 'past_due');
            }
          }
          break;
        }
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).json({ message: 'Webhook processing failed' });
    }
  });

  // Focus session routes
  app.post('/api/focus-sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertFocusSessionSchema.parse({
        ...req.body,
        userId,
      });

      const session = await storage.createFocusSession(validatedData);
      res.json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid session data", errors: error.errors });
      }
      console.error("Error creating focus session:", error);
      res.status(500).json({ message: "Failed to create focus session" });
    }
  });

  app.get('/api/focus-sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 10;

      const sessions = await storage.getUserFocusSessions(userId, limit);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching focus sessions:", error);
      res.status(500).json({ message: "Failed to fetch focus sessions" });
    }
  });

  // Stats routes
  app.get('/api/stats/today', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getTodayStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching today's stats:", error);
      res.status(500).json({ message: "Failed to fetch today's stats" });
    }
  });

  // Achievements routes
  app.get('/api/achievements', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const achievements = await storage.getUserAchievements(userId);
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  // Referral code routes
  app.post('/api/referral-codes/validate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { code } = req.body;

      if (!code || typeof code !== 'string') {
        return res.status(400).json({ message: "Referral code is required" });
      }

      const referralCode = await storage.validateReferralCode(code);
      if (!referralCode) {
        return res.status(404).json({ message: "Invalid or expired referral code" });
      }

      // Check if user already used this code
      const hasUsed = await storage.hasUserUsedReferralCode(userId, referralCode.id);
      if (hasUsed) {
        return res.status(409).json({ message: "You have already used this referral code" });
      }

      res.json({
        code: referralCode.code,
        description: referralCode.description,
        discountType: referralCode.discountType,
        discountValue: referralCode.discountValue,
        valid: true,
      });
    } catch (error) {
      console.error("Error validating referral code:", error);
      res.status(500).json({ message: "Failed to validate referral code" });
    }
  });

  app.get('/api/referral-codes/usage', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const usage = await storage.getUserReferralUsage(userId);
      res.json(usage);
    } catch (error) {
      console.error("Error fetching referral usage:", error);
      res.status(500).json({ message: "Failed to fetch referral usage" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
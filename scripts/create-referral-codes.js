
import { storage } from '../server/storage.ts';

async function createInitialReferralCodes() {
  try {
    // Create a 100% free subscription code
    await storage.createReferralCode(
      'FLOXFREE100',
      'free',
      100,
      '100% Free Subscription - Limited Time Offer',
      50, // Max 50 uses
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Expires in 30 days
    );

    // Create a 50% discount code
    await storage.createReferralCode(
      'FLOX50OFF',
      'percentage',
      50,
      '50% Off Your Subscription',
      100, // Max 100 uses
      new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // Expires in 60 days
    );

    // Create a 25% discount code
    await storage.createReferralCode(
      'FLOX25OFF',
      'percentage',
      25,
      '25% Off Your Subscription',
      null, // Unlimited uses
      null // No expiration
    );

    // Create a special VIP code
    await storage.createReferralCode(
      'FLOXVIP',
      'free',
      100,
      'VIP Access - Lifetime Free',
      10, // Very limited
      null // No expiration
    );

    console.log('Successfully created initial referral codes:');
    console.log('- FLOXFREE100: 100% free (50 uses, expires in 30 days)');
    console.log('- FLOX50OFF: 50% discount (100 uses, expires in 60 days)');
    console.log('- FLOX25OFF: 25% discount (unlimited uses, no expiration)');
    console.log('- FLOXVIP: 100% free VIP (10 uses, no expiration)');
  } catch (error) {
    console.error('Error creating referral codes:', error);
  }
}

createInitialReferralCodes();

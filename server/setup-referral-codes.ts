
import { db } from "./db";
import { referralCodes } from "@shared/schema";
import { generateId } from "./utils";

// Initial referral codes to set up
const initialCodes = [
  {
    code: 'WELCOME10',
    description: '10% off your first subscription',
    discountType: 'percentage',
    discountValue: 10,
    maxUses: null, // unlimited
  },
  {
    code: 'EARLYBIRD',
    description: '20% off - Limited time offer',
    discountType: 'percentage',
    discountValue: 20,
    maxUses: 100,
    expiresAt: new Date('2025-12-31'),
  },
  {
    code: 'STUDENT',
    description: 'Student discount - 30% off',
    discountType: 'percentage',
    discountValue: 30,
    maxUses: null,
  },
  {
    code: 'TRIAL7',
    description: 'Extra 7 days free trial',
    discountType: 'trial_extension',
    discountValue: 7,
    maxUses: null,
  },
  {
    code: 'FRIEND',
    description: 'Friend referral - 15% off',
    discountType: 'percentage',
    discountValue: 15,
    maxUses: null,
  },
  {
    code: 'SPECIAL50',
    description: 'Special offer - $5 off',
    discountType: 'fixed',
    discountValue: 500, // $5.00 in cents
    maxUses: 50,
  },
];

export async function setupReferralCodes() {
  try {
    console.log('Setting up initial referral codes...');
    
    for (const codeData of initialCodes) {
      const existingCode = await db.select().from(referralCodes)
        .where(eq(referralCodes.code, codeData.code))
        .limit(1);

      if (existingCode.length === 0) {
        await db.insert(referralCodes).values({
          id: generateId(),
          ...codeData,
        });
        console.log(`Created referral code: ${codeData.code}`);
      } else {
        console.log(`Referral code already exists: ${codeData.code}`);
      }
    }
    
    console.log('Referral codes setup complete!');
  } catch (error) {
    console.error('Error setting up referral codes:', error);
  }
}

// Run if called directly
if (require.main === module) {
  setupReferralCodes();
}

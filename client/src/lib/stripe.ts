import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe only if public key is available
export const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  console.warn('⚠️ VITE_STRIPE_PUBLIC_KEY not found. Payment features will be disabled.');
}

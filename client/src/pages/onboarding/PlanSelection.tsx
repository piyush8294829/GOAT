import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreditCard, Check, Shield } from "lucide-react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripePromise } from "@/lib/stripe";

const plans = [
  {
    id: "monthly",
    name: "Monthly Pro",
    price: "$7",
    interval: "/month",
    features: [
      "Unlimited focus sessions",
      "Advanced app blocking",
      "Detailed analytics",
      "Achievement system",
    ],
    badge: { text: "7 Day Free Trial", color: "bg-gradient-to-r from-blue-500 to-purple-500" },
  },
  {
    id: "yearly",
    name: "Yearly Pro",
    price: "$69",
    interval: "/year",
    savings: "Save $15/year",
    features: [
      "Everything in Monthly",
      "Priority support",
      "Beta features access",
      "Yearly insights report",
    ],
    badge: { text: "Most Popular", color: "bg-gradient-to-r from-orange-500 to-red-500" },
    trialBadge: { text: "7 Day Free Trial", color: "bg-gradient-to-r from-blue-500 to-purple-500" },
  },
];

function PaymentForm({ plan, referralCode }: { plan: string; referralCode: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/onboarding/success`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: "Welcome to Flox AI Pro!",
      });
      setLocation("/onboarding/success");
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full button-primary text-white px-8 py-4 rounded-full text-lg font-semibold"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
            Processing...
          </>
        ) : (
          <>
            Start Free Trial
            <CreditCard className="ml-2 w-5 h-5" />
          </>
        )}
      </Button>
    </form>
  );
}

export default function PlanSelection() {
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [referralCode, setReferralCode] = useState("");
  const [codeApplied, setCodeApplied] = useState(false);
  const [codeValidation, setCodeValidation] = useState<any>(null);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const { toast } = useToast();

  const validateCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("POST", "/api/referral-codes/validate", { code });
      return response.json();
    },
    onSuccess: (data) => {
      setCodeValidation(data);
      setCodeApplied(true);
      toast({
        title: "Code Applied!",
        description: data.description,
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Invalid referral code";
      toast({
        title: "Invalid Code",
        description: errorMessage,
        variant: "destructive",
      });
      setCodeValidation(null);
      setCodeApplied(false);
    },
  });

  const createSubscriptionMutation = useMutation({
    mutationFn: async (data: { plan: string; referralCode?: string }) => {
      const response = await apiRequest("POST", "/api/create-subscription", data);
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      setShowPayment(true);
      if (data.discountApplied || data.trialExtensionDays) {
        toast({
          title: "Discount Applied!",
          description: data.discountApplied 
            ? `You saved $${(data.discountApplied / 100).toFixed(2)}!`
            : `You got ${data.trialExtensionDays} extra trial days!`,
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleApplyCode = () => {
    if (referralCode.trim() && !codeApplied) {
      setIsValidatingCode(true);
      validateCodeMutation.mutate(referralCode.trim());
      setIsValidatingCode(false);
    }
  };

  const handleContinue = () => {
    if (!selectedPlan) return;

    createSubscriptionMutation.mutate({
      plan: selectedPlan,
      referralCode: codeApplied ? referralCode : undefined,
    });
  };

  if (showPayment && clientSecret) {
    return (
      <OnboardingLayout currentStep={8} totalSteps={9}>
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-morphism p-8 rounded-3xl"
          >
            <h2 className="text-2xl font-bold mb-6 text-center text-gradient">
              Complete Your Subscription
            </h2>
            <Elements 
              stripe={stripePromise} 
              options={{ 
                clientSecret,
                appearance: {
                  theme: 'night',
                  variables: {
                    colorPrimary: '#8B5CF6',
                  },
                },
              }}
            >
              <PaymentForm plan={selectedPlan} referralCode={referralCode} />
            </Elements>
          </motion.div>
        </div>
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout currentStep={8} totalSteps={9}>
      <div className="text-center max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl font-bold mb-2 text-gradient"
        >
          Pick Your Plan
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-white/60 mb-8"
        >
          Start your focus journey with a 7-day free trial
        </motion.p>

        {/* Referral Code Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <div className="glass-morphism p-4 rounded-2xl max-w-md mx-auto">
            <div className="flex items-center space-x-2">
              <Input
                type="text"
                placeholder="Enter referral code"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                className="bg-transparent border-none outline-none flex-1 text-white placeholder-white/50"
                disabled={codeApplied}
              />
              <Button
                onClick={handleApplyCode}
                disabled={!referralCode.trim() || codeApplied || validateCodeMutation.isPending}
                variant="ghost"
                className="text-purple-400 hover:text-purple-300 p-2"
              >
                {validateCodeMutation.isPending ? (
                  <div className="animate-spin w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full" />
                ) : codeApplied ? (
                  <Check className="w-5 h-5 text-green-400" />
                ) : (
                  "Apply"
                )}
              </Button>
            </div>

            {/* Show discount info if code is applied */}
            {codeApplied && codeValidation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-3 pt-3 border-t border-white/20"
              >
                <div className="flex items-center text-green-400 text-sm">
                  <Check className="w-4 h-4 mr-2" />
                  <span>
                    {codeValidation.discountType === 'percentage' && `${codeValidation.discountValue}% off applied`}
                    {codeValidation.discountType === 'fixed' && `$${(codeValidation.discountValue / 100).toFixed(2)} off applied`}
                    {codeValidation.discountType === 'trial_extension' && `+${codeValidation.discountValue} extra trial days`}
                  </span>
                </div>
                <p className="text-white/60 text-xs mt-1">{codeValidation.description}</p>
              </motion.div>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
              onClick={() => handlePlanSelect(plan.id)}
              className={`glass-morphism p-8 rounded-3xl relative cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                selectedPlan === plan.id
                  ? "bg-purple-500/20 ring-2 ring-purple-400 scale-105"
                  : "hover:bg-white/10"
              }`}
            >
              {/* Main Badge */}
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className={`${plan.badge.color} text-white px-4 py-1 rounded-full text-sm font-semibold ${
                  plan.id === 'yearly' ? 'animate-bounce-slow' : 'animate-pulse-slow'
                }`}>
                  {plan.badge.text}
                </span>
              </div>

              {/* Trial Badge for Yearly */}
              {plan.trialBadge && (
                <div className="absolute -top-1 right-4">
                  <span className={`${plan.trialBadge.color} text-white px-3 py-1 rounded-full text-xs font-semibold animate-pulse`}>
                    {plan.trialBadge.text}
                  </span>
                </div>
              )}

              <div className="text-center pt-4">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-white/60">{plan.interval}</span>
                  {plan.savings && (
                    <div className="text-green-400 text-sm mt-1">{plan.savings}</div>
                  )}
                </div>
                <ul className="text-left space-y-2 text-white/80 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className={`w-6 h-6 border-2 border-purple-400 rounded-full mx-auto transition-all duration-300 flex items-center justify-center ${
                  selectedPlan === plan.id ? 'bg-purple-400' : ''
                }`}>
                  {selectedPlan === plan.id && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-white text-xs"
                    >
                      ✓
                    </motion.span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mb-6"
        >
          <div className="flex items-center justify-center text-white/60 text-sm">
            <Shield className="w-4 h-4 mr-2" />
            30-day money-back guarantee
          </div>
        </motion.div>

        <Button
          onClick={handleContinue}
          disabled={!selectedPlan || createSubscriptionMutation.isPending}
          className={`button-primary text-white px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300 ${
            selectedPlan && !createSubscriptionMutation.isPending
              ? "glow-animation"
              : "opacity-50 cursor-not-allowed"
          }`}
        >
          {createSubscriptionMutation.isPending ? (
            <>
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
              Setting up...
            </>
          ) : (
            <>
              Continue to Payment
              <CreditCard className="ml-2 w-5 h-5" />
            </>
          )}
        </Button>
      </div>
    </OnboardingLayout>
  );
}
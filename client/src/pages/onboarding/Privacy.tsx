import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Check } from "lucide-react";
import { useLocation } from "wouter";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";

const privacyFeatures = [
  "End-to-end encryption for all your data",
  "No personal information shared with third parties",
  "GDPR compliant data handling",
  "Local data processing whenever possible",
];

export default function Privacy() {
  const [allFeaturesRead, setAllFeaturesRead] = useState(false);
  const [, setLocation] = useLocation();

  // Simulate reading check (in real app, this could track scroll or time)
  useEffect(() => {
    const timer = setTimeout(() => {
      setAllFeaturesRead(true);
    }, 3000); // Enable button after 3 seconds

    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    setLocation("/onboarding/stats-intro");
  };

  return (
    <OnboardingLayout currentStep={6} totalSteps={9}>
      <div className="text-center max-w-2xl mx-auto">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="floating-animation mb-6"
        >
          <div className="w-20 h-20 mx-auto gradient-purple rounded-full flex items-center justify-center glow-animation">
            <Shield className="w-10 h-10 text-white animate-pulse" />
          </div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-3xl font-bold mb-6 text-gradient"
        >
          Your Privacy is Protected
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="glass-morphism p-8 rounded-2xl mb-8"
        >
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="stats-number text-3xl font-bold"
            >
              100,000+
            </motion.div>
            <p className="text-white/60">Focus sessions secured!</p>
          </div>

          <div className="space-y-4 text-left">
            {privacyFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                className="flex items-center"
              >
                <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                <span className="text-white/90">{feature}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {!allFeaturesRead && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-white/60 mb-6"
          >
            Please take a moment to review our privacy commitments...
          </motion.p>
        )}

        <Button
          onClick={handleContinue}
          disabled={!allFeaturesRead}
          className={`button-primary text-white px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300 ${
            allFeaturesRead
              ? "glow-animation"
              : "opacity-50 cursor-not-allowed"
          }`}
        >
          Continue
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
        
        {!allFeaturesRead && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4"
          >
            <div className="w-full bg-gray-700 rounded-full h-2">
              <motion.div 
                className="h-2 bg-purple-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 3 }}
              />
            </div>
            <p className="text-xs text-white/50 mt-2">Reading privacy features...</p>
          </motion.div>
        )}
      </div>
    </OnboardingLayout>
  );
}

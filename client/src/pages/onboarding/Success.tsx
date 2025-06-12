import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Trophy } from "lucide-react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Confetti } from "@/components/ui/confetti";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";

export default function Success() {
  const [countdown, setCountdown] = useState(3);
  const [showConfetti, setShowConfetti] = useState(true);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/onboarding/complete", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/status"] });
      setLocation("/");
    },
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          completeOnboardingMutation.mutate();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [completeOnboardingMutation]);

  const handleGoToDashboard = () => {
    completeOnboardingMutation.mutate();
  };

  return (
    <OnboardingLayout currentStep={9} totalSteps={9}>
      <Confetti show={showConfetti} onComplete={() => setShowConfetti(false)} />
      
      <div className="text-center max-w-md mx-auto">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="mb-8"
        >
          <div className="w-24 h-24 mx-auto gradient-purple rounded-full flex items-center justify-center confetti-animation glow-animation">
            <Trophy className="w-12 h-12 text-white" />
          </div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-4xl font-bold mb-4 text-gradient"
        >
          You're In!
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl text-white/80 mb-8"
        >
          Welcome to the future of focused productivity
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Button
            onClick={handleGoToDashboard}
            disabled={completeOnboardingMutation.isPending}
            className="button-primary text-white px-8 py-4 rounded-full text-lg font-semibold glow-animation group"
          >
            {completeOnboardingMutation.isPending ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                Setting up...
              </>
            ) : (
              <>
                Go to Dashboard
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-white/60 text-sm mt-4"
        >
          Auto-redirecting in <span className="font-bold text-white">{countdown}</span> seconds...
        </motion.p>
      </div>
    </OnboardingLayout>
  );
}

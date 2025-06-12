import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Hand } from "lucide-react";
import { useLocation } from "wouter";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";

export default function Welcome() {
  const [, setLocation] = useLocation();

  const handleGetStarted = () => {
    setLocation("/onboarding/goal-setting");
  };

  return (
    <OnboardingLayout currentStep={1} totalSteps={9}>
      <div className="text-center max-w-md mx-auto">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="floating-animation mb-8"
        >
          <div className="w-24 h-24 mx-auto gradient-purple rounded-full flex items-center justify-center mb-6 glow-animation">
            <Hand className="w-12 h-12 text-white animate-pulse" />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-4xl font-bold mb-4 text-gradient"
        >
          Welcome to Flox AI
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl text-white/80 mb-8"
        >
          Hey, let's customize your focus journey!
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Button
            onClick={handleGetStarted}
            className="button-primary text-white px-8 py-4 rounded-full text-lg font-semibold glow-animation group"
          >
            Get Started
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>
      </div>
    </OnboardingLayout>
  );
}

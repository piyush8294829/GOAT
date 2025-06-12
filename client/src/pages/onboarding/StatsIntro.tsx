import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";

export default function StatsIntro() {
  const [progress, setProgress] = useState(0);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setAnimationComplete(true), 500);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const handleNext = () => {
    setLocation("/onboarding/plan-selection");
  };

  return (
    <OnboardingLayout currentStep={7} totalSteps={9}>
      <div className="text-center max-w-2xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl font-bold mb-6 text-gradient"
        >
          Your Focus Profile is Ready!
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass-morphism p-8 rounded-2xl mb-8"
        >
          <div className="relative mb-6">
            <div className="w-full bg-gray-700 rounded-full h-4">
              <motion.div
                className="progress-bar h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                style={{ width: `${progress}%` }}
                initial={{ width: 0 }}
              />
            </div>
            <div className="text-center mt-4">
              <motion.span
                className="text-3xl font-bold stats-number"
                key={progress}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                {progress}%
              </motion.span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="stats-number text-xl font-bold">
                {progress >= 50 ? "3" : "0"}
              </div>
              <p className="text-white/60 text-sm">Sessions Ready</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <div className="stats-number text-xl font-bold">
                {progress >= 70 ? "3" : progress >= 30 ? "2" : progress >= 10 ? "1" : "0"}
              </div>
              <p className="text-white/60 text-sm">Goals Set</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <div className="stats-number text-xl font-bold">
                {progress >= 90 ? "5" : "0"}
              </div>
              <p className="text-white/60 text-sm">Achievements Available</p>
            </motion.div>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-white/80 italic mb-8 text-lg"
        >
          "The secret of getting ahead is getting started." - Mark Twain
        </motion.p>

        <Button
          onClick={handleNext}
          disabled={!animationComplete}
          className={`button-primary text-white px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300 ${
            animationComplete
              ? "glow-animation"
              : "opacity-50 cursor-not-allowed"
          }`}
        >
          Next
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </OnboardingLayout>
  );
}

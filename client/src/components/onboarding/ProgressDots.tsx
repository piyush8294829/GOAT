import { motion } from "framer-motion";

interface ProgressDotsProps {
  currentStep: number;
  totalSteps: number;
}

export default function ProgressDots({ currentStep, totalSteps }: ProgressDotsProps) {
  return (
    <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 flex space-x-2">
      {Array.from({ length: totalSteps }, (_, index) => {
        const step = index + 1;
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;
        
        return (
          <motion.div
            key={step}
            className={`h-2 rounded-full transition-all duration-300 ${
              isActive
                ? "w-8 bg-purple-400"
                : isCompleted
                ? "w-2 bg-green-400"
                : "w-2 bg-white/30"
            }`}
            initial={{ scale: 0.8 }}
            animate={{ 
              scale: isActive ? 1.2 : 1,
              width: isActive ? 32 : 8,
            }}
            transition={{ duration: 0.3 }}
          />
        );
      })}
    </div>
  );
}

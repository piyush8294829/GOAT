import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Briefcase, GraduationCap, Heart, Star } from "lucide-react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";

const goals = [
  { id: "work", label: "Work", icon: Briefcase },
  { id: "study", label: "Study", icon: GraduationCap },
  { id: "health", label: "Health", icon: Heart },
  { id: "custom", label: "Custom", icon: Star },
];

export default function GoalSetting() {
  const [selectedGoal, setSelectedGoal] = useState<string>("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing onboarding data
  const { data: onboardingData } = useQuery({
    queryKey: ["/api/onboarding"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Initialize with existing data if available
  useEffect(() => {
    if ((onboardingData as any)?.focusGoal) {
      setSelectedGoal((onboardingData as any).focusGoal);
    }
  }, [onboardingData]);

  const saveOnboardingMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/onboarding", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding"] });
      setLocation("/onboarding/session-preferences");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save your goal. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleNext = () => {
    if (!selectedGoal) return;

    saveOnboardingMutation.mutate({
      focusGoal: selectedGoal,
    });
  };

  return (
    <OnboardingLayout currentStep={2} totalSteps={9}>
      <div className="text-center max-w-2xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl font-bold mb-6 text-gradient"
        >
          What's your #1 focus goal?
        </motion.h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {goals.map((goal, index) => {
            const Icon = goal.icon;
            const isSelected = selectedGoal === goal.id;

            return (
              <motion.button
                key={goal.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                onClick={() => setSelectedGoal(goal.id)}
                className={`glass-morphism p-6 rounded-2xl text-center transition-all duration-300 transform hover:scale-105 group ${
                  isSelected 
                    ? "bg-purple-500/30 ring-2 ring-purple-400 scale-105" 
                    : "hover:bg-white/20"
                }`}
              >
                <Icon 
                  className={`w-8 h-8 mx-auto mb-3 transition-colors duration-300 ${
                    isSelected 
                      ? "text-purple-300" 
                      : "text-purple-400 group-hover:text-purple-300"
                  }`} 
                />
                <p className="font-semibold">{goal.label}</p>
                
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center"
                  >
                    <span className="text-white text-xs">✓</span>
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>

        <Button
          onClick={handleNext}
          disabled={!selectedGoal || saveOnboardingMutation.isPending}
          className={`button-primary text-white px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300 ${
            selectedGoal && !saveOnboardingMutation.isPending
              ? "glow-animation"
              : "opacity-50 cursor-not-allowed"
          }`}
        >
          {saveOnboardingMutation.isPending ? (
            <>
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
              Saving...
            </>
          ) : (
            <>
              Next
              <ArrowRight className="ml-2 w-5 h-5" />
            </>
          )}
        </Button>
      </div>
    </OnboardingLayout>
  );
}

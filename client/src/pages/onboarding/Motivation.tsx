import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Flame, Trophy, Coins, Eye } from "lucide-react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";

const motivationTypes = [
  { 
    id: "streaks", 
    label: "Streaks", 
    description: "Build daily focus habits",
    icon: Flame,
    color: "text-orange-400"
  },
  { 
    id: "achievements", 
    label: "Achievements", 
    description: "Unlock focus milestones",
    icon: Trophy,
    color: "text-yellow-400"
  },
  { 
    id: "rewards", 
    label: "Reward Points", 
    description: "Earn points for focus time",
    icon: Coins,
    color: "text-green-400"
  },
];

export default function Motivation() {
  const [selectedMotivations, setSelectedMotivations] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
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
    if ((onboardingData as any)?.motivationTypes) {
      setSelectedMotivations((onboardingData as any).motivationTypes);
    }
  }, [onboardingData]);

  const saveOnboardingMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/onboarding", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding"] });
      setLocation("/onboarding/privacy");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save your motivation preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleMotivation = (motivationId: string) => {
    setSelectedMotivations(prev => 
      prev.includes(motivationId)
        ? prev.filter(id => id !== motivationId)
        : [...prev, motivationId]
    );
  };

  const handleNext = () => {
    saveOnboardingMutation.mutate({
      motivationTypes: selectedMotivations,
    });
  };

  return (
    <OnboardingLayout currentStep={5} totalSteps={9}>
      <div className="text-center max-w-2xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl font-bold mb-6 text-gradient"
        >
          How do you want to be motivated?
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {motivationTypes.map((motivation, index) => {
            const Icon = motivation.icon;
            const isSelected = selectedMotivations.includes(motivation.id);

            return (
              <motion.button
                key={motivation.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                onClick={() => toggleMotivation(motivation.id)}
                className={`glass-morphism p-6 rounded-2xl text-center transition-all duration-300 transform hover:scale-105 cursor-pointer group relative ${
                  isSelected 
                    ? "bg-purple-500/30 ring-2 ring-purple-400 scale-105" 
                    : "hover:bg-white/20"
                }`}
              >
                <Icon 
                  className={`w-10 h-10 mx-auto mb-4 transition-all duration-300 ${motivation.color} ${
                    motivation.id === 'streaks' ? 'animate-bounce' : 
                    motivation.id === 'achievements' ? 'animate-bounce' : 
                    'animate-bounce'
                  }`} 
                />
                <h3 className="font-semibold text-lg mb-2">{motivation.label}</h3>
                <p className="text-white/60 text-sm">{motivation.description}</p>
                
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-8"
        >
          <Button
            onClick={() => setShowPreview(!showPreview)}
            variant="outline"
            className="button-secondary text-white px-6 py-3 rounded-full text-base font-semibold group"
          >
            <Eye className="mr-2 w-5 h-5" />
            {showPreview ? "Hide Preview" : "Preview Rewards"}
          </Button>
        </motion.div>

        {showPreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-morphism p-6 rounded-2xl mb-8 overflow-hidden"
          >
            <h4 className="font-semibold text-lg mb-4">Preview: Your Motivation Dashboard</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <Flame className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                <div className="stats-number text-lg font-bold">7</div>
                <p className="text-white/60">Day Streak</p>
              </div>
              <div className="text-center">
                <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                <div className="stats-number text-lg font-bold">3</div>
                <p className="text-white/60">Achievements</p>
              </div>
              <div className="text-center">
                <Coins className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <div className="stats-number text-lg font-bold">250</div>
                <p className="text-white/60">Points</p>
              </div>
            </div>
          </motion.div>
        )}

        <Button
          onClick={handleNext}
          disabled={saveOnboardingMutation.isPending}
          className="button-primary text-white px-8 py-4 rounded-full text-lg font-semibold"
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

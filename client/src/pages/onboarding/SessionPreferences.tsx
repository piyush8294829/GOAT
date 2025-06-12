import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, HourglassIcon, Lock } from "lucide-react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";

const sessionTypes = [
  { 
    id: "pomodoro", 
    label: "Pomodoro", 
    description: "25min work, 5min break cycles",
    icon: Clock 
  },
  { 
    id: "long", 
    label: "Long Session", 
    description: "Deep work sessions 1-4 hours",
    icon: HourglassIcon 
  },
  { 
    id: "strict", 
    label: "Strict Mode", 
    description: "No breaks, maximum focus",
    icon: Lock 
  },
];

export default function SessionPreferences() {
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
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
    if ((onboardingData as any)?.sessionPreferences) {
      setSelectedSessions((onboardingData as any).sessionPreferences);
    }
  }, [onboardingData]);

  const saveOnboardingMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/onboarding", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding"] });
      setLocation("/onboarding/app-blocking");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save your preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleSession = (sessionId: string) => {
    setSelectedSessions(prev => 
      prev.includes(sessionId)
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  const handleNext = () => {
    if (selectedSessions.length === 0) return;

    saveOnboardingMutation.mutate({
      sessionPreferences: selectedSessions,
    });
  };

  return (
    <OnboardingLayout currentStep={3} totalSteps={9}>
      <div className="text-center max-w-2xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl font-bold mb-6 text-gradient"
        >
          How do you like your focus sessions?
        </motion.h2>

        <div className="space-y-4 mb-8">
          {sessionTypes.map((session, index) => {
            const Icon = session.icon;
            const isSelected = selectedSessions.includes(session.id);

            return (
              <motion.button
                key={session.id}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                onClick={() => toggleSession(session.id)}
                className={`glass-morphism p-6 rounded-2xl w-full transition-all duration-300 cursor-pointer group ${
                  isSelected 
                    ? "bg-purple-500/20 ring-2 ring-purple-400" 
                    : "hover:bg-white/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-left">
                    <Icon 
                      className={`w-6 h-6 mr-4 transition-colors duration-300 ${
                        session.id === 'strict' ? 'animate-pulse' : ''
                      } ${
                        isSelected 
                          ? "text-purple-300" 
                          : "text-purple-400 group-hover:text-purple-300"
                      }`} 
                    />
                    <div>
                      <h3 className="font-semibold text-lg">{session.label}</h3>
                      <p className="text-white/60 text-sm">{session.description}</p>
                    </div>
                  </div>
                  
                  <div className={`w-6 h-6 border-2 border-purple-400 rounded-full transition-all duration-300 flex items-center justify-center ${
                    isSelected ? 'bg-purple-400' : ''
                  }`}>
                    {isSelected && (
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
              </motion.button>
            );
          })}
        </div>

        {selectedSessions.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-morphism p-4 rounded-xl mb-6"
          >
            <p className="text-sm text-white/80">
              <strong>Selected:</strong> {selectedSessions.map(id => 
                sessionTypes.find(s => s.id === id)?.label
              ).join(", ")}
            </p>
          </motion.div>
        )}

        <Button
          onClick={handleNext}
          disabled={selectedSessions.length === 0 || saveOnboardingMutation.isPending}
          className={`button-primary text-white px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300 ${
            selectedSessions.length > 0 && !saveOnboardingMutation.isPending
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

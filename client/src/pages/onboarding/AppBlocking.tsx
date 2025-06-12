import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ArrowRight, Shield } from "lucide-react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";

const blockedApps = [
  { name: "YouTube", icon: "🎥", color: "text-red-300" },
  { name: "Instagram", icon: "📷", color: "text-pink-300" },
  { name: "Twitter", icon: "🐦", color: "text-blue-300" },
  { name: "Facebook", icon: "📘", color: "text-blue-300" },
];

export default function AppBlocking() {
  const [blockingEnabled, setBlockingEnabled] = useState(false);
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
    if ((onboardingData as any)?.appBlockingEnabled !== undefined) {
      setBlockingEnabled((onboardingData as any).appBlockingEnabled);
    }
  }, [onboardingData]);

  const saveOnboardingMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/onboarding", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding"] });
      setLocation("/onboarding/motivation");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save your blocking preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleNext = () => {
    saveOnboardingMutation.mutate({
      appBlockingEnabled: blockingEnabled,
    });
  };

  return (
    <OnboardingLayout currentStep={4} totalSteps={9}>
      <div className="text-center max-w-2xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl font-bold mb-6 text-gradient"
        >
          Want Flox AI to block distractions?
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass-morphism p-8 rounded-2xl mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="text-left">
              <h3 className="text-xl font-semibold">App/Website Blocking</h3>
              <p className="text-white/60">Block distracting apps and websites during focus sessions</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`text-sm ${blockingEnabled ? 'text-green-400' : 'text-white/60'}`}>
                {blockingEnabled ? 'Enabled' : 'Disabled'}
              </span>
              <Switch
                checked={blockingEnabled}
                onCheckedChange={setBlockingEnabled}
                className="data-[state=checked]:bg-purple-600"
              />
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ 
              opacity: blockingEnabled ? 1 : 0, 
              height: blockingEnabled ? "auto" : 0 
            }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {blockingEnabled && (
              <>
                <p className="text-sm text-white/60 mb-4">What will be blocked:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {blockedApps.map((app, index) => (
                    <motion.span
                      key={app.name}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className={`px-3 py-1 bg-red-500/20 ${app.color} rounded-full text-sm flex items-center`}
                    >
                      <span className="mr-2">{app.icon}</span>
                      {app.name}
                    </motion.span>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex items-center justify-center mb-8"
        >
          <Shield className="w-5 h-5 text-green-400 mr-2" />
          <p className="text-sm text-white/60">No personal data is ever shared</p>
        </motion.div>

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

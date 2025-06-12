import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { queryClient } from "./lib/queryClient";
import { useQuery } from "@tanstack/react-query";

// Pages
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/not-found";

// Onboarding pages
import Welcome from "@/pages/onboarding/Welcome";
import GoalSetting from "@/pages/onboarding/GoalSetting";
import SessionPreferences from "@/pages/onboarding/SessionPreferences";
import AppBlocking from "@/pages/onboarding/AppBlocking";
import Motivation from "@/pages/onboarding/Motivation";
import Privacy from "@/pages/onboarding/Privacy";
import StatsIntro from "@/pages/onboarding/StatsIntro";
import PlanSelection from "@/pages/onboarding/PlanSelection";
import Success from "@/pages/onboarding/Success";

function AuthenticatedApp() {
  // Check onboarding status
  const { data: onboardingData } = useQuery({
    queryKey: ["/api/onboarding"],
    retry: false,
  });

  const isOnboardingComplete = onboardingData?.onboardingCompleted;

  return (
    <Switch>
      <Route path="/" component={Welcome} />
      <Route path="/onboarding/goal-setting" component={GoalSetting} />
      <Route path="/onboarding/session-preferences" component={SessionPreferences} />
      <Route path="/onboarding/app-blocking" component={AppBlocking} />
      <Route path="/onboarding/motivation" component={Motivation} />
      <Route path="/onboarding/privacy" component={Privacy} />
      <Route path="/onboarding/stats-intro" component={StatsIntro} />
      <Route path="/onboarding/plan-selection" component={PlanSelection} />
      <Route path="/onboarding/success" component={Success} />
      <Route path="/dashboard" component={Dashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen dark-bg flex items-center justify-center">
        <div className="glass-morphism p-8 rounded-2xl">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white/80">Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <Route path="/*?" component={AuthenticatedApp} />
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen dark-bg text-white">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
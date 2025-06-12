import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

export function useOnboarding() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  const { data: onboardingData, isLoading } = useQuery({
    queryKey: ["/api/onboarding"],
    enabled: false, // Temporarily disabled to stop infinite loop
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchOnMount: false,
  });

  return {
    onboardingData: onboardingData as any,
    isLoading: authLoading || isLoading,
    isAuthenticated,
  };
}
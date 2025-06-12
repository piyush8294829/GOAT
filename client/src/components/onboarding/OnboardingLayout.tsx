import { ReactNode } from "react";
import ProgressDots from "./ProgressDots";

interface OnboardingLayoutProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
}

export default function OnboardingLayout({ 
  children, 
  currentStep, 
  totalSteps 
}: OnboardingLayoutProps) {
  return (
    <div className="min-h-screen dark-bg">
      <ProgressDots currentStep={currentStep} totalSteps={totalSteps} />
      <div className="min-h-screen flex items-center justify-center p-6">
        {children}
      </div>
    </div>
  );
}

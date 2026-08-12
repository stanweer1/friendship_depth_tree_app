import { GroveProvider } from "@/lib/grove-store";
import { Onboarding } from "@/components/app/Onboarding";

export default function OnboardingPage() {
  return (
    <GroveProvider>
      <Onboarding />
    </GroveProvider>
  );
}

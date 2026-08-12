import { Suspense } from "react";
import { GroveScreen } from "@/components/app/GroveScreen";
import { GroveProvider } from "@/lib/grove-store";

export default function GrovePage() {
  return (
    <GroveProvider>
      <Suspense
        fallback={
          <div className="grid min-h-screen place-items-center bg-dusk text-cream">
            Opening the grove…
          </div>
        }
      >
        <GroveScreen />
      </Suspense>
    </GroveProvider>
  );
}

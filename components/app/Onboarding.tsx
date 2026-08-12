"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImportDock } from "@/components/app/ImportDock";
import { useGrove } from "@/lib/grove-store";

export function Onboarding() {
  const { state, setYouName, completeOnboarding, loadDemo } = useGrove();
  const [name, setName] = useState(state.you.name === "You" ? "" : state.you.name);
  const router = useRouter();

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-5 py-16">
      <p className="grove-kicker">Plant your grove</p>
      <h1 className="font-display text-4xl leading-tight text-cream sm:text-5xl">
        Who stands at the trunk?
      </h1>
      <p className="mt-3 text-cream/70">
        Grove reads your photos, finds the people in them, and grows a branch for each one. The more
        you appear together, the thicker and fruitier their bough.
      </p>
      <label className="mt-8 text-xs uppercase tracking-[0.18em] text-cream/45">Your name</label>
      <input
        className="grove-input mt-2"
        placeholder="Alex"
        value={name}
        onChange={(event) => setName(event.target.value)}
        onBlur={() => setYouName(name || "You")}
      />
      <div className="mt-8">
        <ImportDock />
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          className="grove-btn-primary"
          onClick={() => {
            setYouName(name || "You");
            completeOnboarding();
            router.push("/grove");
          }}
        >
          Open my grove
        </button>
        <button
          type="button"
          className="grove-btn-ghost"
          onClick={() => {
            loadDemo(name || "Alex");
            router.push("/grove");
          }}
        >
          Preview with sample photos
        </button>
      </div>
    </div>
  );
}

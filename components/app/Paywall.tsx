"use client";

import { Check, X } from "lucide-react";
import Link from "next/link";
import { useGrove } from "@/lib/grove-store";
import { PRICES } from "@/lib/plans";

export function Paywall({ reason, onClose }: { reason: string; onClose: () => void }) {
  const { setPlan } = useGrove();

  const upgrade = async (plan: "plus" | "family") => {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, interval: "year" }),
    });
    const data = (await res.json()) as { url?: string; demo?: boolean; plan?: "plus" | "family" };
    if (data.url) {
      window.location.href = data.url;
      return;
    }
    setPlan(data.plan ?? plan);
    onClose();
  };

  return (
    <div className="grove-modal" role="dialog">
      <div className="grove-panel max-w-xl">
        <div className="mb-3 flex justify-end">
          <button type="button" className="grove-icon-btn" onClick={onClose} aria-label="Close">
            <X className="size-4" />
          </button>
        </div>
        <p className="grove-kicker">Grove Plus</p>
        <h2 className="font-display text-3xl text-cream">Let the tree keep growing</h2>
        <p className="mt-2 text-sm leading-6 text-cream/70">{reason}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <PlanCard
            name="Plus"
            price={`${PRICES.plus.yearLabel}/yr`}
            points={["Unlimited people & photos", "Live Google Photos / folder sync", "HD export, no watermark", "Four seasons"]}
            onPick={() => void upgrade("plus")}
          />
          <PlanCard
            name="Family"
            price={`${PRICES.family.yearLabel}/yr`}
            points={["Everything in Plus", "Up to 6 contributors", "Shared family grove", "Print discounts"]}
            featured
            onPick={() => void upgrade("family")}
          />
        </div>
        <p className="mt-4 text-center text-xs text-cream/45">
          Or browse <Link href="/pricing" className="underline decoration-gold/50">prints and plans</Link>. Demo checkout unlocks immediately if Stripe is not configured.
        </p>
      </div>
    </div>
  );
}

function PlanCard({
  name,
  price,
  points,
  featured,
  onPick,
}: {
  name: string;
  price: string;
  points: string[];
  featured?: boolean;
  onPick: () => void;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${featured ? "border-gold/50 bg-gold/10" : "border-white/10 bg-black/20"}`}>
      <p className="font-display text-xl text-cream">{name}</p>
      <p className="mt-1 text-sm text-gold">{price}</p>
      <ul className="mt-3 space-y-1.5 text-sm text-cream/75">
        {points.map((point) => (
          <li key={point} className="flex gap-2">
            <Check className="mt-0.5 size-3.5 shrink-0 text-gold" />
            {point}
          </li>
        ))}
      </ul>
      <button type="button" className={featured ? "grove-btn-gold mt-4 w-full" : "grove-btn-primary mt-4 w-full"} onClick={onPick}>
        Continue
      </button>
    </div>
  );
}

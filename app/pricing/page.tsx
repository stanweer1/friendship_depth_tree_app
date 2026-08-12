"use client";

import Link from "next/link";
import { Check, Trees } from "lucide-react";
import { PRICES } from "@/lib/plans";
import { GroveProvider, useGrove } from "@/lib/grove-store";

export default function PricingPage() {
  return (
    <GroveProvider>
      <PricingInner />
    </GroveProvider>
  );
}

function PricingInner() {
  const { setPlan, state } = useGrove();

  const buy = async (plan: "plus" | "family") => {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, interval: "year" }),
    });
    const data = (await res.json()) as { url?: string; demo?: boolean; plan?: "plus" | "family" };
    if (data.url) window.location.href = data.url;
    else setPlan(data.plan ?? plan);
  };

  return (
    <div className="min-h-screen bg-dusk px-5 py-10 text-cream">
      <header className="mx-auto flex max-w-5xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Trees className="size-5 text-gold" />
          <span className="font-display text-xl">Grove</span>
        </Link>
        <Link href="/grove" className="grove-btn-ghost">
          Open grove
        </Link>
      </header>
      <main className="mx-auto mt-14 max-w-5xl">
        <p className="grove-kicker">Monetization that matches the metaphor</p>
        <h1 className="font-display text-5xl">Keep the orchard alive.</h1>
        <p className="mt-3 max-w-2xl text-cream/70">
          The free seedling is enough to feel the idea. Plus is for people who want the tree to update
          itself. Family is for households who grow one grove together. Prints turn a year of attention
          into something you can hang.
        </p>
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          <Plan
            name="Seedling"
            price="Free"
            current={state.plan === "free"}
            points={["8 people", "120 photos", "Manual import", "Watermarked shares"]}
            cta="Stay free"
            onClick={() => setPlan("free")}
          />
          <Plan
            name="Plus"
            price={`${PRICES.plus.yearLabel}/yr`}
            sub={`${PRICES.plus.label}/mo`}
            current={state.plan === "plus"}
            featured
            points={[
              "Unlimited photos & people",
              "Live Google Photos and folder sync",
              "HD export, no watermark",
              "Spring, summer, autumn, winter",
            ]}
            cta="Grow Plus"
            onClick={() => void buy("plus")}
          />
          <Plan
            name="Family"
            price={`${PRICES.family.yearLabel}/yr`}
            sub={`${PRICES.family.label}/mo`}
            current={state.plan === "family"}
            points={[
              "Everything in Plus",
              "Up to 6 contributors",
              "Shared household grove",
              "20% off archival prints",
            ]}
            cta="Start Family"
            onClick={() => void buy("family")}
          />
        </div>
        <h2 className="mt-16 font-display text-3xl">Hang the year</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {PRICES.prints.map((print) => (
            <div key={print.id} className="rounded-3xl border border-white/10 p-5">
              <p className="font-display text-2xl">{print.name}</p>
              <p className="mt-2 text-gold">{print.label}</p>
              <p className="mt-2 text-sm text-cream/60">
                Museum-weight paper of your grove. Plus and Family skip the checkout watermark.
              </p>
              <button
                type="button"
                className="grove-btn-ghost mt-4"
                onClick={() => {
                  if (state.plan === "free") void buy("plus");
                  else alert("Print ordering connects to a fulfillment partner when you add PRINTFUL_API_KEY.");
                }}
              >
                Order print
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function Plan({
  name,
  price,
  sub,
  points,
  cta,
  featured,
  current,
  onClick,
}: {
  name: string;
  price: string;
  sub?: string;
  points: string[];
  cta: string;
  featured?: boolean;
  current?: boolean;
  onClick: () => void;
}) {
  return (
    <div className={`rounded-3xl border p-6 ${featured ? "border-gold/50 bg-gold/10" : "border-white/10"}`}>
      <p className="text-sm text-gold">{name}</p>
      <p className="mt-2 font-display text-4xl">{price}</p>
      {sub ? <p className="text-sm text-cream/50">{sub}</p> : null}
      <ul className="mt-5 space-y-2 text-sm text-cream/75">
        {points.map((point) => (
          <li key={point} className="flex gap-2">
            <Check className="mt-0.5 size-4 text-gold" />
            {point}
          </li>
        ))}
      </ul>
      <button type="button" className={featured ? "grove-btn-gold mt-6 w-full" : "grove-btn-primary mt-6 w-full"} onClick={onClick}>
        {current ? "Current plan" : cta}
      </button>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { Camera, Share2, Sparkles, Trees } from "lucide-react";
import { TreeCanvas } from "@/components/tree/TreeCanvas";
import { createDemoGrove } from "@/lib/demo-data";
import { PRICES } from "@/lib/plans";

function subscribe() {
  return () => undefined;
}

export function LandingView() {
  const isClient = useSyncExternalStore(subscribe, () => true, () => false);
  const demo = useMemo(() => (isClient ? createDemoGrove("Alex") : undefined), [isClient]);

  return (
    <div className="bg-dusk text-cream">
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-5">
        <Link href="/" className="flex items-center gap-2">
          <Trees className="size-5 text-gold" />
          <span className="font-display text-xl">Grove</span>
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/pricing" className="text-cream/70 hover:text-cream">
            Pricing
          </Link>
          <Link href="/onboarding" className="grove-btn-primary">
            Plant yours
          </Link>
        </nav>
      </header>

      <section className="relative min-h-[100svh] overflow-hidden">
        {demo ? (
          <TreeCanvas state={demo} onSelect={() => undefined} interactive={false} className="absolute inset-0 h-full w-full" />
        ) : (
          <div className="absolute inset-0 bg-dusk" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-dusk via-dusk/70 to-transparent" />
        <div className="relative z-10 flex min-h-[100svh] max-w-2xl flex-col justify-center px-6 py-28 sm:px-12">
          <p className="grove-kicker">A living tree of your people</p>
          <h1 className="font-display text-5xl leading-[1.05] sm:text-7xl">
            The more you remember someone, the heavier their fruit.
          </h1>
          <p className="mt-5 max-w-md text-lg leading-7 text-cream/75">
            Grove looks through Google Photos or the pictures on your phone, grows a branch for each
            person, and thickens it with every shared memory.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/onboarding" className="grove-btn-gold">
              Start your grove
            </Link>
            <Link href="/grove?demo=1" className="grove-btn-ghost">
              See a living example
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-8 px-6 py-24 sm:grid-cols-3">
        {[
          {
            icon: Camera,
            title: "Read the photos",
            body: "Connect Google Photos, a folder, or the camera roll. Grove finds faces and clusters the people who keep showing up.",
          },
          {
            icon: Sparkles,
            title: "Watch it grow",
            body: "New pictures — from a capture or a Photos sync — add fruit to the matching branch the moment they arrive.",
          },
          {
            icon: Share2,
            title: "Send someone their bough",
            body: "Share the whole tree, or a private link that shows a person how large they are in your life.",
          },
        ].map((item) => (
          <div key={item.title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <item.icon className="size-5 text-gold" />
            <h2 className="mt-4 font-display text-2xl">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-cream/70">{item.body}</p>
          </div>
        ))}
      </section>

      <section className="border-y border-white/10 bg-black/20 px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="grove-kicker">Not an ancestry chart</p>
          <h2 className="font-display text-4xl sm:text-5xl">
            It measures attention, not bloodlines.
          </h2>
          <p className="mt-4 text-cream/70">
            Partners, friends, pets, mentors, the niece you photograph constantly — whoever fills your
            camera becomes a branch. Distance is honest. Fruit is earned.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="grove-kicker">Grow with Plus</p>
            <h2 className="font-display text-4xl">A tree worth hanging on the wall.</h2>
          </div>
          <Link href="/pricing" className="grove-btn-ghost">
            See plans
          </Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { name: "Seedling", price: "Free", detail: "8 people, 120 photos, watermarked shares" },
            { name: "Plus", price: PRICES.plus.yearLabel, detail: "Unlimited, live sync, HD export" },
            { name: "Family", price: PRICES.family.yearLabel, detail: "6 contributors and print discounts" },
          ].map((plan) => (
            <div key={plan.name} className="rounded-3xl border border-white/10 p-5">
              <p className="text-sm text-gold">{plan.name}</p>
              <p className="mt-1 font-display text-3xl">{plan.price}</p>
              <p className="mt-2 text-sm text-cream/65">{plan.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="px-6 py-10 text-center text-xs text-cream/40">
        Grove keeps photos on your device whenever it can. Google Photos uses Google&apos;s picker, not a silent crawl of your library.
      </footer>
    </div>
  );
}

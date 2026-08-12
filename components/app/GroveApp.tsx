"use client";

import {
  Camera,
  Crown,
  Leaf,
  Share2,
  Sparkles,
  SunMedium,
  Trees,
  Snowflake,
  Flower2,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { memoryCount, useGrove } from "@/lib/grove-store";
import { PLAN_LIMITS } from "@/lib/plans";
import type { Season } from "@/lib/types";
import { ImportDock } from "./ImportDock";
import { Paywall } from "./Paywall";
import { PersonDrawer } from "./PersonDrawer";
import { ShareModal } from "./ShareModal";
import { TreeCanvas } from "@/components/tree/TreeCanvas";

const SEASONS: Array<{ id: Season; icon: typeof Leaf; label: string }> = [
  { id: "spring", icon: Flower2, label: "Spring" },
  { id: "summer", icon: SunMedium, label: "Summer" },
  { id: "autumn", icon: Leaf, label: "Autumn" },
  { id: "winter", icon: Snowflake, label: "Winter" },
];

export function GroveApp() {
  const {
    state,
    ready,
    selectedId,
    setSelectedId,
    scan,
    paywall,
    toast,
    dismissPaywall,
    setSeason,
    setLiveSync,
    importFiles,
  } = useGrove();
  const [shareOpen, setShareOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);

  const ranked = useMemo(
    () =>
      state.people
        .filter((person) => !person.hidden)
        .map((person) => ({ person, count: memoryCount(state, person.id) }))
        .sort((a, b) => b.count - a.count),
    [state],
  );

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-dusk text-cream">
        <p className="font-display text-2xl">Waking the grove…</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-dusk text-cream">
      <div className="pointer-events-none absolute inset-0 grain" />
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Trees className="size-5 text-gold" />
          <span className="font-display text-xl">Grove</span>
        </Link>
        <div className="flex items-center gap-2">
          <button type="button" className="grove-icon-btn" onClick={() => cameraRef.current?.click()} aria-label="Capture">
            <Camera className="size-4" />
          </button>
          <button type="button" className="grove-btn-ghost" onClick={() => setImportOpen(true)}>
            Add photos
          </button>
          <Link href="/pricing" className="grove-btn-ghost hidden sm:inline-flex">
            Plans
          </Link>
          <button type="button" className="grove-btn-primary" onClick={() => setShareOpen(true)}>
            <Share2 className="size-4" />
            Share
          </button>
        </div>
      </header>

      <div className="absolute inset-0">
        <TreeCanvas
          state={state}
          selectedId={selectedId}
          onSelect={setSelectedId}
          watermark={PLAN_LIMITS[state.plan].watermark}
          className="h-full w-full"
        />
      </div>

      <div className="absolute bottom-28 left-4 z-20 hidden max-w-xs rounded-2xl border border-white/10 bg-black/30 p-3 backdrop-blur-md md:block">
        <p className="grove-kicker">Season</p>
        <div className="mt-2 flex gap-1">
          {SEASONS.map((season) => {
            const Icon = season.icon;
            const active = state.season === season.id;
            return (
              <button
                key={season.id}
                type="button"
                title={season.label}
                className={`rounded-xl p-2 ${active ? "bg-gold text-dusk" : "text-cream/70 hover:bg-white/10"}`}
                onClick={() => setSeason(season.id)}
              >
                <Icon className="size-4" />
              </button>
            );
          })}
        </div>
        <label className="mt-3 flex items-center justify-between gap-3 text-sm text-cream/70">
          Live sync
          <input
            type="checkbox"
            checked={state.liveSync}
            onChange={(event) => setLiveSync(event.target.checked)}
          />
        </label>
        <p className="mt-2 text-[11px] leading-4 text-cream/45">
          {state.plan === "free"
            ? "Plus watches Google Photos and folders so new pictures grow fruit overnight."
            : "New photos thicken the matching branch as they arrive."}
        </p>
      </div>

      <nav className="absolute inset-x-0 bottom-0 z-20 overflow-x-auto border-t border-white/10 bg-black/35 px-3 py-3 backdrop-blur-md">
        <div className="flex min-w-max gap-2">
          {ranked.map(({ person, count }) => (
            <button
              key={person.id}
              type="button"
              onClick={() => setSelectedId(person.id)}
              className={`flex items-center gap-2 rounded-full border px-3 py-2 text-left ${
                selectedId === person.id
                  ? "border-gold bg-gold/15"
                  : "border-white/10 bg-black/20 hover:border-white/25"
              }`}
            >
              <span
                className="size-2.5 rounded-full"
                style={{ background: `hsl(${person.hue} 65% 55%)` }}
              />
              <span className="text-sm">{person.name}</span>
              <span className="text-xs text-cream/45">{count}</span>
            </button>
          ))}
          {!ranked.length ? (
            <p className="px-2 py-2 text-sm text-cream/60">
              Import photos to grow your first branches.
            </p>
          ) : null}
        </div>
      </nav>

      {selectedId ? <PersonDrawer /> : null}

      {importOpen ? (
        <div className="grove-modal">
          <div className="grove-panel max-w-md">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-2xl">Feed the tree</h2>
              <button type="button" className="text-cream/50" onClick={() => setImportOpen(false)}>
                Close
              </button>
            </div>
            <ImportDock compact />
          </div>
        </div>
      ) : null}

      {shareOpen ? <ShareModal onClose={() => setShareOpen(false)} /> : null}
      {paywall ? <Paywall reason={paywall} onClose={dismissPaywall} /> : null}

      {scan ? (
        <div className="absolute left-1/2 top-20 z-30 w-[min(420px,calc(100%-2rem))] -translate-x-1/2 rounded-2xl border border-white/10 bg-black/55 px-4 py-3 backdrop-blur-md">
          <p className="flex items-center gap-2 text-sm">
            <Sparkles className="size-4 text-gold" />
            {scan.status}
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-gold transition-all"
              style={{ width: `${scan.total ? (scan.done / scan.total) * 100 : 0}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-cream/50">
            {scan.done}/{scan.total} photos · {scan.faces} faces
          </p>
        </div>
      ) : null}

      {toast ? (
        <div className="absolute left-1/2 top-20 z-30 -translate-x-1/2 rounded-full border border-gold/30 bg-black/60 px-4 py-2 text-sm text-gold backdrop-blur-md">
          {toast}
        </div>
      ) : null}

      {state.plan !== "free" ? (
        <div className="absolute right-4 top-20 z-20 hidden items-center gap-1 rounded-full bg-gold/15 px-3 py-1 text-xs text-gold sm:flex">
          <Crown className="size-3.5" />
          {PLAN_LIMITS[state.plan].name}
        </div>
      ) : null}

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(event) => {
          const files = [...(event.target.files ?? [])];
          if (files.length) void importFiles(files, "camera");
          event.target.value = "";
        }}
      />
    </div>
  );
}

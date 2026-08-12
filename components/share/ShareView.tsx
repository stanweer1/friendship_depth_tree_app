"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Trees } from "lucide-react";
import { TreeCanvas } from "@/components/tree/TreeCanvas";
import { fruitName, relationshipLabel } from "@/lib/demo-data";
import { snapshotToGrove } from "@/lib/share";
import type { ShareSnapshot } from "@/lib/types";

export function ShareView({ snapshot, focusId }: { snapshot: ShareSnapshot; focusId?: string }) {
  const state = useMemo(() => snapshotToGrove(snapshot), [snapshot]);
  const focus = snapshot.people.find((person) => person.id === (focusId || snapshot.focusPersonId));

  return (
    <div className="relative min-h-screen overflow-hidden bg-dusk text-cream">
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Trees className="size-5 text-gold" />
          <span className="font-display text-xl">Grove</span>
        </Link>
        <Link href="/onboarding" className="grove-btn-primary">
          Plant yours
        </Link>
      </header>
      <TreeCanvas
        state={state}
        selectedId={focus?.id}
        onSelect={() => undefined}
        watermark={snapshot.watermark}
        interactive={false}
        className="absolute inset-0 h-full w-full"
      />
      <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-dusk via-dusk/80 to-transparent px-6 pb-10 pt-24">
        {focus ? (
          <div className="mx-auto max-w-xl text-center">
            <p className="grove-kicker">A branch in {snapshot.youName}&apos;s grove</p>
            <h1 className="font-display text-4xl sm:text-5xl">{focus.name}</h1>
            <p className="mt-3 text-lg text-cream/75">
              {focus.memoryCount} memories · {fruitName(focus.memoryCount, focus.relationship)} ·{" "}
              {relationshipLabel(focus.relationship)}
            </p>
            <p className="mt-2 text-sm text-cream/55">
              The more pictures you share, the thicker this bough becomes.
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-xl text-center">
            <p className="grove-kicker">{snapshot.youName}&apos;s grove</p>
            <h1 className="font-display text-4xl">Everyone who keeps showing up.</h1>
          </div>
        )}
      </div>
    </div>
  );
}

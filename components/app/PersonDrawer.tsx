"use client";

import { GitMerge, X } from "lucide-react";
import { useMemo, useState } from "react";
import { fruitName, relationshipLabel } from "@/lib/demo-data";
import { memoryCount, personMemories, useGrove } from "@/lib/grove-store";
import type { Relationship } from "@/lib/types";

const RELATIONSHIPS: Relationship[] = [
  "partner",
  "family",
  "friend",
  "mentor",
  "pet",
  "group",
  "other",
];

export function PersonDrawer() {
  const { state, selectedId, setSelectedId, renamePerson, setRelationship, mergePeople, hidePerson } =
    useGrove();
  const person = state.people.find((item) => item.id === selectedId);
  const [mergeId, setMergeId] = useState("");

  const photos = useMemo(
    () => (person ? personMemories(state, person.id).filter((photo) => photo.thumbUrl) : []),
    [person, state],
  );

  if (!person) return null;
  const count = memoryCount(state, person.id);
  const uniqueThumbs = [...new Map(photos.map((photo) => [photo.thumbUrl, photo])).values()].slice(0, 18);

  return (
    <aside className="grove-drawer">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {person.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={person.avatarUrl} alt="" className="size-14 rounded-full object-cover ring-2 ring-gold/40" />
          ) : (
            <div
              className="size-14 rounded-full"
              style={{ background: `hsl(${person.hue} 50% 40%)` }}
            />
          )}
          <div>
            <input
              className="grove-inline-input font-display text-2xl"
              value={person.name}
              onChange={(event) => renamePerson(person.id, event.target.value)}
            />
            <p className="text-sm text-gold/90">
              {count} memories · {fruitName(count, person.relationship)}
            </p>
          </div>
        </div>
        <button type="button" className="grove-icon-btn" onClick={() => setSelectedId(undefined)} aria-label="Close">
          <X className="size-4" />
        </button>
      </div>

      <label className="mt-5 block text-xs uppercase tracking-[0.18em] text-cream/45">
        Relationship
      </label>
      <select
        className="grove-input mt-1"
        value={person.relationship}
        onChange={(event) => setRelationship(person.id, event.target.value as Relationship)}
      >
        {RELATIONSHIPS.map((value) => (
          <option key={value} value={value}>
            {relationshipLabel(value)}
          </option>
        ))}
      </select>

      <p className="mt-4 text-sm leading-6 text-cream/70">
        The more photos you share, the thicker this bough and the heavier its fruit. Grove is not a family-tree
        of ancestry — it is a map of attention.
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {uniqueThumbs.map((photo) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={photo.id}
            src={photo.thumbUrl}
            alt=""
            className="aspect-square w-full rounded-xl object-cover"
          />
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-3">
        <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-cream/45">
          <GitMerge className="size-3.5" /> Merge duplicate
        </p>
        <div className="flex gap-2">
          <select className="grove-input" value={mergeId} onChange={(event) => setMergeId(event.target.value)}>
            <option value="">Someone else who is actually {person.name}</option>
            {state.people
              .filter((item) => item.id !== person.id && !item.hidden)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </select>
          <button
            type="button"
            className="grove-btn-ghost shrink-0"
            disabled={!mergeId}
            onClick={() => {
              if (mergeId) mergePeople(person.id, mergeId);
              setMergeId("");
            }}
          >
            Merge
          </button>
        </div>
      </div>

      <button type="button" className="mt-4 text-sm text-cream/40 hover:text-rose-200" onClick={() => hidePerson(person.id)}>
        Hide this branch
      </button>
    </aside>
  );
}

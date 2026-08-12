"use client";

import { Link2, Download, Send, X } from "lucide-react";
import { useState } from "react";
import { useGrove } from "@/lib/grove-store";
import { PLAN_LIMITS } from "@/lib/plans";
import { toShareSnapshot } from "@/lib/share";
import { shareCode } from "@/lib/id";
import { relationshipLabel } from "@/lib/demo-data";

export function ShareModal({ onClose }: { onClose: () => void }) {
  const { state, selectedId } = useGrove();
  const [focus, setFocus] = useState<string | undefined>(selectedId);
  const [link, setLink] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const watermark = PLAN_LIMITS[state.plan].watermark;

  const create = async () => {
    setBusy(true);
    setError(undefined);
    try {
      const code = shareCode();
      const snapshot = toShareSnapshot(state, code, focus);
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snapshot),
      });
      if (!res.ok) throw new Error("Could not create a share link.");
      const data = (await res.json()) as { code: string };
      const url = `${window.location.origin}/share/${data.code}${focus ? `?branch=${focus}` : ""}`;
      setLink(url);
      await navigator.clipboard.writeText(url).catch(() => undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Share failed.");
    } finally {
      setBusy(false);
    }
  };

  const nativeShare = async () => {
    if (!link || !navigator.share) return;
    await navigator.share({
      title: `${state.you.name}'s Grove`,
      text: focus
        ? `You're a branch in ${state.you.name}'s grove.`
        : `Look at the people who make up ${state.you.name}'s life.`,
      url: link,
    });
  };

  const download = () => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    if (!PLAN_LIMITS[state.plan].hdExport) {
      const url = canvas.toDataURL("image/jpeg", 0.72);
      const a = document.createElement("a");
      a.href = url;
      a.download = `grove-${state.you.name || "tree"}.jpg`;
      a.click();
      return;
    }
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `grove-${state.you.name || "tree"}.png`;
    a.click();
  };

  return (
    <div className="grove-modal" role="dialog" aria-labelledby="share-title">
      <div className="grove-panel max-w-lg">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="grove-kicker">Share</p>
            <h2 id="share-title" className="font-display text-2xl text-cream">
              Send someone their branch
            </h2>
          </div>
          <button type="button" className="grove-icon-btn" onClick={onClose} aria-label="Close">
            <X className="size-4" />
          </button>
        </div>
        <p className="mb-4 text-sm text-cream/70">
          Participants get a living picture of how much space they take up in your life.
          {watermark ? " Free shares include a Grove mark. Plus removes it." : ""}
        </p>
        <label className="mb-1 block text-xs uppercase tracking-[0.18em] text-cream/50">
          What they see
        </label>
        <select
          className="grove-input mb-4"
          value={focus ?? ""}
          onChange={(event) => setFocus(event.target.value || undefined)}
        >
          <option value="">The whole grove</option>
          {state.people
            .filter((person) => !person.hidden)
            .map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}&apos;s branch · {relationshipLabel(person.relationship)}
              </option>
            ))}
        </select>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="grove-btn-primary" onClick={() => void create()} disabled={busy}>
            <Link2 className="size-4" />
            {busy ? "Growing link…" : link ? "Copy link again" : "Create link"}
          </button>
          <button type="button" className="grove-btn-ghost" onClick={download}>
            <Download className="size-4" />
            Save image
          </button>
          {link && typeof navigator.share === "function" ? (
            <button type="button" className="grove-btn-ghost" onClick={() => void nativeShare()}>
              <Send className="size-4" />
              Send
            </button>
          ) : null}
        </div>
        {link ? (
          <p className="mt-3 break-all rounded-xl bg-black/25 px-3 py-2 text-xs text-gold/90">
            {link}
          </p>
        ) : null}
        {error ? <p className="mt-3 text-sm text-rose-200">{error}</p> : null}
      </div>
    </div>
  );
}

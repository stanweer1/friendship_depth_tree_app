"use client";

import { Camera, FolderOpen, Images, Sparkles } from "lucide-react";
import { useRef, useState } from "react";
import {
  googlePhotosAvailable,
  listImagesInFolder,
  openPhotosPicker,
  pickLocalFolder,
  requestGooglePhotosToken,
} from "@/lib/google-photos";
import { useGrove } from "@/lib/grove-store";
import { uid } from "@/lib/id";

export function ImportDock({ compact = false }: { compact?: boolean }) {
  const { importFiles, loadDemo, connectSource, watchFolder, state } = useGrove();
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();

  const run = async (label: string, fn: () => Promise<void>) => {
    setError(undefined);
    setBusy(label);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(undefined);
    }
  };

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      <div className={`grid gap-2 ${compact ? "grid-cols-2" : "sm:grid-cols-2"}`}>
        <button
          type="button"
          className="grove-btn-primary"
          onClick={() =>
            run("google", async () => {
              if (!googlePhotosAvailable()) {
                throw new Error(
                  "Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to connect a real Google Photos library. Meanwhile, try the sample grove or upload files.",
                );
              }
              const token = await requestGooglePhotosToken();
              const items = await openPhotosPicker(token);
              const files = items.map(
                (item) => new File([item.blob], item.name, { type: item.blob.type || "image/jpeg" }),
              );
              await importFiles(files, "google");
              connectSource({
                id: uid("src"),
                kind: "google",
                label: "Google Photos",
                connected: true,
                lastSyncAt: Date.now(),
                watchEnabled: true,
              });
            })
          }
        >
          <Images className="size-4" />
          {busy === "google" ? "Opening Photos…" : "Google Photos"}
        </button>
        <button type="button" className="grove-btn-ghost" onClick={() => fileRef.current?.click()}>
          <FolderOpen className="size-4" />
          Files
        </button>
        <button type="button" className="grove-btn-ghost" onClick={() => cameraRef.current?.click()}>
          <Camera className="size-4" />
          Camera
        </button>
        <button
          type="button"
          className="grove-btn-ghost"
          onClick={() =>
            run("folder", async () => {
              const handle = await pickLocalFolder();
              watchFolder(handle);
              const files = await listImagesInFolder(handle);
              await importFiles(files, "folder");
              connectSource({
                id: uid("src"),
                kind: "folder",
                label: handle.name,
                connected: true,
                lastSyncAt: Date.now(),
                watchEnabled: true,
              });
            })
          }
        >
          <FolderOpen className="size-4" />
          Watch a folder
        </button>
      </div>
      {!state.people.length ? (
        <button
          type="button"
          className="grove-btn-gold w-full"
          onClick={() => loadDemo(state.you.name || "Alex")}
        >
          <Sparkles className="size-4" />
          Grow a sample grove
        </button>
      ) : null}
      {error ? <p className="text-sm text-rose-200/90">{error}</p> : null}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(event) => {
          const files = [...(event.target.files ?? [])];
          if (files.length) void importFiles(files, "upload");
          event.target.value = "";
        }}
      />
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

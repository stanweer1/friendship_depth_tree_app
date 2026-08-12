import type { PhotoSource } from "./types";

const PICKER_SCOPE = "https://www.googleapis.com/auth/photospicker.mediaitems.readonly";

export type GooglePhotosConfig = {
  clientId?: string;
};

export function googleClientId() {
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
}

export function googlePhotosAvailable() {
  return Boolean(googleClientId());
}

type TokenClient = {
  requestAccessToken: (opts?: { prompt?: string }) => void;
};

function loadGis(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("window"));
  if ((window as unknown as { google?: { accounts?: { oauth2?: unknown } } }).google?.accounts?.oauth2) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const existing = document.querySelector("script[data-grove-gis]");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("GIS failed")));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.dataset.groveGis = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Google Identity"));
    document.head.appendChild(script);
  });
}

export async function requestGooglePhotosToken(): Promise<string> {
  const clientId = googleClientId();
  if (!clientId) {
    throw new Error("Set NEXT_PUBLIC_GOOGLE_CLIENT_ID to connect Google Photos.");
  }
  await loadGis();
  const oauth2 = (
    window as unknown as {
      google: {
        accounts: {
          oauth2: {
            initTokenClient: (config: {
              client_id: string;
              scope: string;
              callback: (resp: { access_token?: string; error?: string }) => void;
            }) => TokenClient;
          };
        };
      };
    }
  ).google.accounts.oauth2;

  return new Promise((resolve, reject) => {
    const client = oauth2.initTokenClient({
      client_id: clientId,
      scope: PICKER_SCOPE,
      callback: (resp) => {
        if (resp.access_token) resolve(resp.access_token);
        else reject(new Error(resp.error || "Google Photos permission was not granted."));
      },
    });
    client.requestAccessToken({ prompt: "consent" });
  });
}

export async function openPhotosPicker(accessToken: string) {
  const sessionRes = await fetch("https://photospicker.googleapis.com/v1/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });
  if (!sessionRes.ok) {
    throw new Error("Google Photos picker is unavailable for this Google Cloud project.");
  }
  const session = (await sessionRes.json()) as {
    id: string;
    pickerUri: string;
  };
  window.open(session.pickerUri, "_blank", "noopener,width=980,height=720");

  const started = Date.now();
  while (Date.now() - started < 5 * 60 * 1000) {
    await new Promise((r) => setTimeout(r, 2500));
    const poll = await fetch(
      `https://photospicker.googleapis.com/v1/sessions/${encodeURIComponent(session.id)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!poll.ok) continue;
    const body = (await poll.json()) as { mediaItemsSet?: boolean };
    if (body.mediaItemsSet) {
      return listPickedItems(accessToken, session.id);
    }
  }
  throw new Error("Timed out waiting for Google Photos.");
}

async function listPickedItems(accessToken: string, sessionId: string) {
  const files: Array<{ blob: Blob; name: string; takenAt?: number }> = [];
  let pageToken = "";
  do {
    const url = new URL("https://photospicker.googleapis.com/v1/mediaItems");
    url.searchParams.set("sessionId", sessionId);
    url.searchParams.set("pageSize", "50");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) break;
    const body = (await res.json()) as {
      nextPageToken?: string;
      mediaItems?: Array<{
        mediaFile?: { filename?: string; baseUrl?: string };
      }>;
    };
    for (const item of body.mediaItems ?? []) {
      const baseUrl = item.mediaFile?.baseUrl;
      if (!baseUrl) continue;
      const media = await fetch(`${baseUrl}=w1200-h1200`);
      if (!media.ok) continue;
      files.push({
        blob: await media.blob(),
        name: item.mediaFile?.filename || "google-photo.jpg",
      });
    }
    pageToken = body.nextPageToken ?? "";
  } while (pageToken);
  return files;
}

export async function pickLocalFolder() {
  const picker = (
    window as unknown as {
      showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
    }
  ).showDirectoryPicker;
  if (!picker) {
    throw new Error("Folder access is not supported in this browser. Use file upload instead.");
  }
  return picker();
}

export async function listImagesInFolder(handle: FileSystemDirectoryHandle) {
  const files: File[] = [];
  async function walk(dir: FileSystemDirectoryHandle, depth: number) {
    if (depth > 3) return;
    const iterate =
      dir.values?.bind(dir) ??
      async function* () {
        const entries = (
          dir as FileSystemDirectoryHandle & {
            entries?: () => AsyncIterable<[string, FileSystemHandle]>;
          }
        ).entries;
        if (!entries) return;
        for await (const [, handle] of entries.call(dir)) yield handle;
      };
    for await (const entry of iterate()) {
      if (entry.kind === "file") {
        const file = await (entry as FileSystemFileHandle).getFile();
        if (file.type.startsWith("image/")) files.push(file);
      } else if (entry.kind === "directory") {
        await walk(entry as FileSystemDirectoryHandle, depth + 1);
      }
    }
  }
  await walk(handle, 0);
  return files;
}

export function sourceLabel(kind: PhotoSource) {
  switch (kind) {
    case "google":
      return "Google Photos";
    case "camera":
      return "Camera";
    case "folder":
      return "Photo folder";
    case "upload":
      return "Uploaded files";
    default:
      return "Sample library";
  }
}

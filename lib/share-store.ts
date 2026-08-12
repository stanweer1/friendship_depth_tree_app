import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ShareSnapshot } from "./types";

const dir = path.join(process.cwd(), "data", "shares");
const memory = new Map<string, ShareSnapshot>();

async function ensureDir() {
  await mkdir(dir, { recursive: true });
}

export async function saveShare(snapshot: ShareSnapshot) {
  memory.set(snapshot.code, snapshot);
  try {
    await ensureDir();
    await writeFile(path.join(dir, `${snapshot.code}.json`), JSON.stringify(snapshot), "utf8");
  } catch {
    // Ephemeral hosts can still serve from memory for this process.
  }
  return snapshot.code;
}

export async function readShare(code: string): Promise<ShareSnapshot | undefined> {
  const cached = memory.get(code);
  if (cached) return cached;
  try {
    const raw = await readFile(path.join(dir, `${code}.json`), "utf8");
    const snapshot = JSON.parse(raw) as ShareSnapshot;
    memory.set(code, snapshot);
    return snapshot;
  } catch {
    return undefined;
  }
}

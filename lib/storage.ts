import { get, set, del } from "idb-keyval";
import type { GroveState } from "./types";

const KEY = "grove.state.v1";

export async function loadGrove(): Promise<GroveState | undefined> {
  try {
    return await get<GroveState>(KEY);
  } catch {
    return undefined;
  }
}

export async function saveGrove(state: GroveState) {
  try {
    await set(KEY, state);
  } catch {
    // Quota or private mode — the tree still works for this session.
  }
}

export async function clearGrove() {
  await del(KEY);
}

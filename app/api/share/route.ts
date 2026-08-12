import { NextResponse } from "next/server";
import { saveShare } from "@/lib/share-store";
import type { ShareSnapshot } from "@/lib/types";

export async function POST(request: Request) {
  const snapshot = (await request.json()) as ShareSnapshot;
  if (!snapshot?.code || !snapshot.youName || !Array.isArray(snapshot.people)) {
    return NextResponse.json({ error: "Invalid grove snapshot" }, { status: 400 });
  }
  const trimmed: ShareSnapshot = {
    ...snapshot,
    people: snapshot.people.slice(0, 40).map((person) => ({
      ...person,
      sampleThumbs: (person.sampleThumbs ?? []).slice(0, 4).map((thumb) =>
        thumb.length > 180_000 ? "" : thumb,
      ),
      avatarUrl:
        person.avatarUrl && person.avatarUrl.length > 180_000 ? undefined : person.avatarUrl,
    })),
  };
  const code = await saveShare(trimmed);
  return NextResponse.json({ code });
}

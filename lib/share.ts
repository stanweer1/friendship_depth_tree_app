import type { GroveState, Person, ShareSnapshot } from "./types";
import { memoryCount } from "./plans";
import { PLAN_LIMITS } from "./plans";

export function toShareSnapshot(
  state: GroveState,
  code: string,
  focusPersonId?: string,
): ShareSnapshot {
  const people = state.people
    .filter((person) => !person.hidden)
    .map((person) => ({
      id: person.id,
      name: person.name,
      relationship: person.relationship,
      hue: person.hue,
      memoryCount: memoryCount(state, person.id),
      avatarUrl: person.avatarUrl,
      sampleThumbs: state.photos
        .filter((photo) => photo.personIds.includes(person.id) && photo.thumbUrl)
        .slice(0, 4)
        .map((photo) => photo.thumbUrl),
    }))
    .sort((a, b) => b.memoryCount - a.memoryCount);

  return {
    version: 1,
    code,
    createdAt: Date.now(),
    youName: state.you.name,
    season: state.season,
    watermark: PLAN_LIMITS[state.plan].watermark,
    people,
    focusPersonId,
  };
}

export function snapshotToGrove(snapshot: ShareSnapshot): GroveState {
  const people: Person[] = snapshot.people.map((person) => ({
    id: person.id,
    name: person.name,
    relationship: person.relationship,
    hue: person.hue,
    avatarUrl: person.avatarUrl,
    createdAt: snapshot.createdAt,
  }));
  return {
    you: { name: snapshot.youName },
    people,
    photos: snapshot.people.flatMap((person) =>
      Array.from({ length: person.memoryCount }, (_, i) => ({
        id: `${person.id}_mem_${i}`,
        thumbUrl: person.sampleThumbs[i % Math.max(1, person.sampleThumbs.length)] ?? "",
        takenAt: snapshot.createdAt - i * 86400000,
        personIds: [person.id],
        source: "demo" as const,
      })),
    ),
    plan: "free",
    season: snapshot.season,
    sources: [],
    onboardingComplete: true,
    liveSync: false,
    watermarkOverride: snapshot.watermark,
  };
}

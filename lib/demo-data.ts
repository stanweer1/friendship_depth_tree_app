import { memoryDataUrl, portraitDataUrl } from "./portraits";
import type { GroveState, Person, Photo, Relationship } from "./types";

type DemoPerson = {
  name: string;
  relationship: Relationship;
  hue: number;
  memories: number;
};

const DEMO_PEOPLE: DemoPerson[] = [
  { name: "Maya", relationship: "partner", hue: 12, memories: 286 },
  { name: "Mom", relationship: "family", hue: 28, memories: 194 },
  { name: "Dad", relationship: "family", hue: 32, memories: 151 },
  { name: "Jordan", relationship: "friend", hue: 48, memories: 88 },
  { name: "Noodle", relationship: "pet", hue: 38, memories: 61 },
  { name: "Sam", relationship: "friend", hue: 96, memories: 67 },
  { name: "Ava", relationship: "family", hue: 350, memories: 52 },
  { name: "Elena", relationship: "friend", hue: 168, memories: 41 },
  { name: "Priya", relationship: "friend", hue: 200, memories: 29 },
  { name: "Coach R.", relationship: "mentor", hue: 220, memories: 18 },
];

export function createEmptyGrove(name = "You"): GroveState {
  return {
    you: { name },
    people: [],
    photos: [],
    plan: "free",
    season: "autumn",
    sources: [],
    onboardingComplete: false,
    liveSync: false,
  };
}

export function createDemoGrove(youName = "Alex"): GroveState {
  const now = 1_720_000_000_000;
  const people: Person[] = DEMO_PEOPLE.map((demo, index) => ({
    id: `person_demo_${index}`,
    name: demo.name,
    relationship: demo.relationship,
    hue: demo.hue,
    avatarUrl: portraitDataUrl(`${demo.name}-${index}`),
    createdAt: now - (index + 3) * 86400000 * 40,
  }));

  const photos: Photo[] = [];
  people.forEach((person, personIndex) => {
    const demo = DEMO_PEOPLE[personIndex];
    const sampleCount = Math.min(8, Math.max(3, Math.round(demo.memories / 40)));
    for (let i = 0; i < sampleCount; i += 1) {
      photos.push({
        id: `photo_demo_${personIndex}_${i}`,
        thumbUrl: memoryDataUrl(`${person.id}-${i}`, person.hue),
        takenAt: now - (i * 13 + personIndex * 7) * 86400000,
        personIds: [person.id],
        source: "demo",
        fileName: `${person.name.toLowerCase()}-${i}.jpg`,
      });
    }
    const extras = demo.memories - sampleCount;
    for (let i = 0; i < extras; i += 1) {
      photos.push({
        id: `photo_demo_${personIndex}_x_${i}`,
        thumbUrl: photos[photos.length - sampleCount + (i % sampleCount)]?.thumbUrl ?? "",
        takenAt: now - (i * 3 + 20) * 86400000,
        personIds: [person.id],
        source: "demo",
      });
    }
  });

  photos.push({
    id: "photo_demo_shared_dinner",
    thumbUrl: memoryDataUrl("maya-jordan-dinner", 18),
    takenAt: now - 9 * 86400000,
    personIds: [people[0].id, people[3].id],
    source: "demo",
    fileName: "dinner-together.jpg",
  });

  return {
    you: { name: youName, avatarUrl: portraitDataUrl(youName) },
    people,
    photos,
    plan: "free",
    season: "autumn",
    sources: [
      {
        id: "src_demo",
        kind: "demo",
        label: "Sample photo library",
        connected: true,
        lastSyncAt: now,
        watchEnabled: true,
      },
    ],
    onboardingComplete: true,
    liveSync: true,
  };
}

export function relationshipLabel(value: Relationship) {
  switch (value) {
    case "partner":
      return "Partner";
    case "family":
      return "Family";
    case "friend":
      return "Friend";
    case "mentor":
      return "Mentor";
    case "pet":
      return "Pet";
    case "group":
      return "Group";
    default:
      return "Someone";
  }
}

export function fruitName(count: number, relationship: Relationship) {
  if (relationship === "pet") return count > 20 ? "tennis balls" : "treats";
  if (count >= 180) return "heavy gold fruit";
  if (count >= 80) return "ripe fruit";
  if (count >= 30) return "berries";
  if (count >= 10) return "blossoms";
  return "buds";
}

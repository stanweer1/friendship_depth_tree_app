import type { GroveState, PlanId } from "./types";

export const PLAN_LIMITS = {
  free: {
    name: "Seedling",
    maxPeople: 8,
    maxPhotos: 120,
    liveSync: false,
    watermark: true,
    hdExport: false,
    contributors: 1,
    seasons: false,
    prints: false,
  },
  plus: {
    name: "Plus",
    maxPeople: Infinity,
    maxPhotos: Infinity,
    liveSync: true,
    watermark: false,
    hdExport: true,
    contributors: 1,
    seasons: true,
    prints: true,
  },
  family: {
    name: "Family",
    maxPeople: Infinity,
    maxPhotos: Infinity,
    liveSync: true,
    watermark: false,
    hdExport: true,
    contributors: 6,
    seasons: true,
    prints: true,
  },
} as const;

export const PRICES = {
  plus: { month: 599, year: 4900, label: "$5.99", yearLabel: "$49" },
  family: { month: 1199, year: 9900, label: "$11.99", yearLabel: "$99" },
  prints: [
    { id: "small", name: "12 × 16 archival print", price: 3600, label: "$36" },
    { id: "medium", name: "18 × 24 museum print", price: 6400, label: "$64" },
    { id: "large", name: "24 × 36 framed grove", price: 9800, label: "$98" },
  ],
} as const;

export function visiblePeople(state: GroveState) {
  return state.people.filter((person) => !person.hidden);
}

export function memoryCount(state: Pick<GroveState, "photos">, personId: string) {
  return state.photos.filter((photo) => photo.personIds.includes(personId)).length;
}

export function canAddPhotos(state: GroveState, incoming: number) {
  const limit = PLAN_LIMITS[state.plan].maxPhotos;
  return state.photos.length + incoming <= limit;
}

export function canAddPeople(state: GroveState, incoming: number) {
  const limit = PLAN_LIMITS[state.plan].maxPeople;
  return visiblePeople(state).length + incoming <= limit;
}

export function needsUpgrade(
  state: GroveState,
  feature: "liveSync" | "hdExport" | "seasons" | "contributors" | "prints",
) {
  return !PLAN_LIMITS[state.plan][feature];
}

export function planRank(plan: PlanId) {
  return plan === "family" ? 2 : plan === "plus" ? 1 : 0;
}

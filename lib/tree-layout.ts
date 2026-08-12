import { memoryCount } from "./plans";
import type { GroveState, Person, Season } from "./types";

export type Point = { x: number; y: number };

export type FruitLayout = {
  x: number;
  y: number;
  r: number;
  personId: string;
  photoIndex: number;
  hue: number;
  ripeness: number;
};

export type LeafLayout = {
  x: number;
  y: number;
  rot: number;
  s: number;
  personId: string;
};

export type BranchLayout = {
  personId: string;
  name: string;
  start: Point;
  c1: Point;
  c2: Point;
  end: Point;
  thickness: number;
  fruits: FruitLayout[];
  leaves: LeafLayout[];
  label: Point & { align: "left" | "right" };
  side: 1 | -1;
  hue: number;
  memoryCount: number;
};

export type TreeLayout = {
  width: number;
  height: number;
  trunk: { x: number; baseY: number; topY: number; width: number };
  branches: BranchLayout[];
  roots: Point[][];
};

function cubic(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const u = 1 - t;
  return {
    x: u ** 3 * p0.x + 3 * u ** 2 * t * p1.x + 3 * u * t ** 2 * p2.x + t ** 3 * p3.x,
    y: u ** 3 * p0.y + 3 * u ** 2 * t * p1.y + 3 * u * t ** 2 * p2.y + t ** 3 * p3.y,
  };
}

export function sampleBranch(branch: Pick<BranchLayout, "start" | "c1" | "c2" | "end">, steps = 24) {
  const points: Point[] = [];
  for (let i = 0; i <= steps; i += 1) {
    points.push(cubic(branch.start, branch.c1, branch.c2, branch.end, i / steps));
  }
  return points;
}

export function layoutTree(
  state: Pick<GroveState, "people" | "photos">,
  width: number,
  height: number,
  season: Season,
): TreeLayout {
  const people = state.people
    .filter((person) => !person.hidden)
    .map((person) => ({ person, count: memoryCount(state, person.id) }))
    .sort((a, b) => b.count - a.count);

  const trunkX = width * 0.5;
  const baseY = height * 0.93;
  const topY = height * 0.42;
  const maxCount = Math.max(1, people[0]?.count ?? 1);
  const trunkWidth = 22 + Math.min(18, people.length * 1.4);

  const branches: BranchLayout[] = people.map((entry, index) =>
    layoutBranch({
      entry,
      index,
      total: people.length,
      trunkX,
      baseY,
      topY,
      width,
      height,
      maxCount,
      season,
    }),
  );

  const roots = [-1, 0, 1].map((dir) => {
    const start: Point = { x: trunkX + dir * 8, y: baseY };
    return [
      start,
      { x: trunkX + dir * width * 0.08, y: baseY + height * 0.03 },
      { x: trunkX + dir * width * 0.16, y: baseY + height * 0.055 },
    ];
  });

  return {
    width,
    height,
    trunk: { x: trunkX, baseY, topY, width: trunkWidth },
    branches,
    roots,
  };
}

function layoutBranch({
  entry,
  index,
  total,
  trunkX,
  baseY,
  topY,
  width,
  height,
  maxCount,
  season,
}: {
  entry: { person: Person; count: number };
  index: number;
  total: number;
  trunkX: number;
  baseY: number;
  topY: number;
  width: number;
  height: number;
  maxCount: number;
  season: Season;
}): BranchLayout {
  const { person, count } = entry;
  const side: 1 | -1 = index % 2 === 0 ? -1 : 1;
  const rank = Math.floor(index / 2);
  const rows = Math.max(1, Math.ceil(total / 2));
  const strength = Math.sqrt(count / maxCount);
  const along = 0.18 + (rank / Math.max(1, rows - 0.2)) * 0.7;
  const start: Point = {
    x: trunkX + side * 6,
    y: baseY - (baseY - topY) * along,
  };
  const reach = (0.22 + strength * 0.32) * width;
  const lift = (0.18 + strength * 0.28) * height;
  const spread = 0.22 + rank * 0.08 + (1 - strength) * 0.1;
  const end: Point = {
    x: trunkX + side * reach,
    y: start.y - lift * (0.55 + spread * 0.4),
  };
  const c1: Point = {
    x: trunkX + side * reach * 0.28,
    y: start.y - lift * 0.12,
  };
  const c2: Point = {
    x: trunkX + side * reach * 0.72,
    y: end.y + lift * 0.18,
  };

  const thickness = 3.2 + strength * 15;
  const fruitCount = Math.min(22, 2 + Math.round(strength * 16 + Math.min(6, count / 40)));
  const leafCount = season === "winter" ? 3 : 7 + Math.round(strength * 10);
  const fruits: FruitLayout[] = [];
  const leaves: LeafLayout[] = [];

  for (let i = 0; i < fruitCount; i += 1) {
    const t = 0.28 + (i / Math.max(1, fruitCount - 1)) * 0.68;
    const p = cubic(start, c1, c2, end, t);
    const hang = 8 + (i % 3) * 5;
    const ripeness =
      count >= 180 ? 1 : count >= 80 ? 0.85 : count >= 30 ? 0.55 : count >= 10 ? 0.3 : 0.12;
    fruits.push({
      x: p.x + side * (i % 2 === 0 ? 6 : -4),
      y: p.y + hang,
      r: 4 + strength * 7 + (i % 4 === 0 ? 2 : 0),
      personId: person.id,
      photoIndex: i,
      hue: person.hue,
      ripeness,
    });
  }

  for (let i = 0; i < leafCount; i += 1) {
    const t = 0.2 + (i / Math.max(1, leafCount)) * 0.75;
    const p = cubic(start, c1, c2, end, t);
    leaves.push({
      x: p.x + side * (6 + (i % 5) * 3),
      y: p.y - 4,
      rot: side * (0.4 + (i % 4) * 0.2),
      s: 0.7 + strength * 0.6,
      personId: person.id,
    });
  }

  return {
    personId: person.id,
    name: person.name,
    start,
    c1,
    c2,
    end,
    thickness,
    fruits,
    leaves,
    label: {
      x: end.x + side * 12,
      y: end.y - 8,
      align: side < 0 ? "right" : "left",
    },
    side,
    hue: person.hue,
    memoryCount: count,
  };
}

export function nearestHit(
  layout: TreeLayout,
  x: number,
  y: number,
): { personId: string; kind: "fruit" | "branch" } | undefined {
  let best: { personId: string; kind: "fruit" | "branch"; d: number } | undefined;
  for (const branch of layout.branches) {
    for (const fruit of branch.fruits) {
      const d = Math.hypot(fruit.x - x, fruit.y - y);
      if (d < fruit.r + 10 && (!best || d < best.d)) {
        best = { personId: branch.personId, kind: "fruit", d };
      }
    }
    const points = sampleBranch(branch, 18);
    for (const point of points) {
      const d = Math.hypot(point.x - x, point.y - y);
      if (d < branch.thickness + 16 && (!best || d < best.d)) {
        best = { personId: branch.personId, kind: "branch", d };
      }
    }
  }
  return best;
}

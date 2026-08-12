"use client";

import { useEffect, useRef } from "react";
import { fruitName } from "@/lib/demo-data";
import { memoryCount } from "@/lib/plans";
import { layoutTree, nearestHit, sampleBranch, type TreeLayout } from "@/lib/tree-layout";
import type { GroveState, Person, Season } from "@/lib/types";

type Props = {
  state: GroveState;
  selectedId?: string;
  onSelect: (id?: string) => void;
  watermark?: boolean;
  interactive?: boolean;
  className?: string;
};

const SEASON_SKY: Record<Season, [string, string, string]> = {
  spring: ["#1b2a28", "#3d5a4c", "#d7c4a3"],
  summer: ["#102018", "#1e3b2c", "#c9b27a"],
  autumn: ["#0c1210", "#1a2418", "#c48a4a"],
  winter: ["#0a1016", "#1a2733", "#8aa0b5"],
};

const LEAF: Record<Season, string> = {
  spring: "#9dce7a",
  summer: "#5d9a46",
  autumn: "#c36b2e",
  winter: "#d7e4ef",
};

export function TreeCanvas({
  state,
  selectedId,
  onSelect,
  watermark,
  interactive = true,
  className,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layoutRef = useRef<TreeLayout | undefined>(undefined);
  const hoverRef = useRef<string | undefined>(undefined);
  const growRef = useRef(0);
  const timeRef = useRef(0);
  const stateRef = useRef(state);
  const selectedRef = useRef(selectedId);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    stateRef.current = state;
    selectedRef.current = selectedId;
    onSelectRef.current = onSelect;
  }, [state, selectedId, onSelect]);

  useEffect(() => {
    growRef.current = 0;
  }, [state.people.length, state.season, state.photos.length]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let frame = 0;
    let running = true;

    const resize = () => {
      const parent = canvas.parentElement;
      const w = parent?.clientWidth ?? 800;
      const h = parent?.clientHeight ?? 700;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      layoutRef.current = layoutTree(stateRef.current, w, h, stateRef.current.season);
    };

    resize();
    const observer = new ResizeObserver(resize);
    if (canvas.parentElement) observer.observe(canvas.parentElement);

    const layoutKeyRef = { current: "" };

    const draw = (now: number) => {
      if (!running) return;
      timeRef.current = now;
      growRef.current = Math.min(1, growRef.current + 0.012);
      const current = stateRef.current;
      const parent = canvas.parentElement;
      const w = parent?.clientWidth ?? canvas.clientWidth;
      const h = parent?.clientHeight ?? canvas.clientHeight;
      const key = `${w}x${h}:${current.people.length}:${current.photos.length}:${current.season}`;
      if (layoutKeyRef.current !== key) {
        layoutRef.current = layoutTree(current, w, h, current.season);
        layoutKeyRef.current = key;
      }
      const layout = layoutRef.current;
      if (layout) {
        paintTree(ctx, layout, current, {
          selectedId: selectedRef.current,
          hoverId: hoverRef.current,
          grow: easeOut(growRef.current),
          time: now,
          watermark: Boolean(watermark),
          w,
          h,
        });
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);

    const move = (event: PointerEvent) => {
      if (!interactive || !layoutRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const hit = nearestHit(layoutRef.current, event.clientX - rect.left, event.clientY - rect.top);
      hoverRef.current = hit?.personId;
      canvas.style.cursor = hit ? "pointer" : "default";
    };
    const click = (event: PointerEvent) => {
      if (!interactive || !layoutRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const hit = nearestHit(layoutRef.current, event.clientX - rect.left, event.clientY - rect.top);
      onSelectRef.current(hit?.personId);
    };

    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerdown", click);
    window.addEventListener("resize", resize);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerdown", click);
      window.removeEventListener("resize", resize);
    };
  }, [interactive, watermark]);

  return <canvas ref={canvasRef} className={className} aria-label="Friendship grove tree" />;
}

function easeOut(t: number) {
  return 1 - (1 - t) ** 3;
}

function paintTree(
  ctx: CanvasRenderingContext2D,
  layout: TreeLayout,
  state: GroveState,
  opts: {
    selectedId?: string;
    hoverId?: string;
    grow: number;
    time: number;
    watermark: boolean;
    w: number;
    h: number;
  },
) {
  const { w, h, grow, time, selectedId, hoverId, watermark } = opts;
  const sky = SEASON_SKY[state.season];
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, sky[0]);
  bg.addColorStop(0.55, sky[1]);
  bg.addColorStop(1, sky[2]);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  drawStars(ctx, w, h, time, state.season);
  drawMoon(ctx, w * 0.82, h * 0.14, state.season);
  drawDistantTrees(ctx, w, h, time);
  drawGround(ctx, w, h, sky[2]);

  const trunk = layout.trunk;
  drawRoots(ctx, layout, grow);
  drawTrunk(ctx, trunk, grow);

  const peopleById = new Map(state.people.map((person) => [person.id, person]));
  layout.branches.forEach((branch, i) => {
    const delay = i * 0.04;
    const localGrow = Math.max(0, Math.min(1, (grow - delay) / 0.55));
    if (localGrow <= 0) return;
    const active = branch.personId === selectedId || branch.personId === hoverId;
    drawBranch(ctx, branch, localGrow, time, active, state.season);
    if (localGrow > 0.55) {
      drawLeaves(ctx, branch, localGrow, time, state.season, active);
      drawFruit(ctx, branch, localGrow, time, active, peopleById.get(branch.personId));
    }
    if (localGrow > 0.8) {
      drawLabel(ctx, branch, active, state);
    }
  });

  drawYou(ctx, trunk, state.you.name, grow);

  if (watermark) {
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = "#f4efe6";
    ctx.font = "600 13px Outfit, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("Grove · seedling", w - 18, h - 18);
    ctx.restore();
  }
}

function drawStars(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, season: Season) {
  ctx.save();
  const n = season === "winter" ? 70 : 40;
  for (let i = 0; i < n; i += 1) {
    const x = ((i * 97) % w);
    const y = ((i * 53) % (h * 0.45));
    const twinkle = 0.35 + Math.sin(time * 0.002 + i) * 0.25;
    ctx.globalAlpha = twinkle;
    ctx.fillStyle = "#f7f1de";
    ctx.beginPath();
    ctx.arc(x, y, i % 7 === 0 ? 1.4 : 0.7, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawMoon(ctx: CanvasRenderingContext2D, x: number, y: number, season: Season) {
  ctx.save();
  ctx.fillStyle = season === "winter" ? "#e8f0f7" : "#f3e2b8";
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.arc(x, y, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(x + 10, y - 6, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawDistantTrees(ctx: CanvasRenderingContext2D, w: number, h: number, time: number) {
  ctx.save();
  ctx.fillStyle = "rgba(8, 14, 10, 0.45)";
  for (let i = 0; i < 9; i += 1) {
    const x = (w / 9) * i + 20;
    const sway = Math.sin(time * 0.0007 + i) * 4;
    ctx.beginPath();
    ctx.moveTo(x + sway, h * 0.78);
    ctx.lineTo(x - 18 + sway, h * 0.92);
    ctx.lineTo(x + 18 + sway, h * 0.92);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawGround(ctx: CanvasRenderingContext2D, w: number, h: number, color: string) {
  const g = ctx.createLinearGradient(0, h * 0.78, 0, h);
  g.addColorStop(0, "transparent");
  g.addColorStop(0.3, "rgba(20, 16, 10, 0.2)");
  g.addColorStop(1, color);
  ctx.fillStyle = g;
  ctx.fillRect(0, h * 0.78, w, h * 0.22);
}

function drawRoots(ctx: CanvasRenderingContext2D, layout: TreeLayout, grow: number) {
  ctx.save();
  ctx.strokeStyle = "#2a1c12";
  ctx.lineCap = "round";
  layout.roots.forEach((root, i) => {
    ctx.lineWidth = 6 - i;
    ctx.globalAlpha = 0.55 * grow;
    ctx.beginPath();
    ctx.moveTo(root[0].x, root[0].y);
    root.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.stroke();
  });
  ctx.restore();
}

function drawTrunk(
  ctx: CanvasRenderingContext2D,
  trunk: TreeLayout["trunk"],
  grow: number,
) {
  const top = trunk.baseY - (trunk.baseY - trunk.topY) * grow;
  const bark = ctx.createLinearGradient(trunk.x - 20, 0, trunk.x + 20, 0);
  bark.addColorStop(0, "#2a1b10");
  bark.addColorStop(0.45, "#5a3a22");
  bark.addColorStop(1, "#24160d");
  ctx.fillStyle = bark;
  ctx.beginPath();
  ctx.moveTo(trunk.x - trunk.width / 2, trunk.baseY);
  ctx.quadraticCurveTo(trunk.x - trunk.width * 0.2, (trunk.baseY + top) / 2, trunk.x - trunk.width * 0.28, top);
  ctx.lineTo(trunk.x + trunk.width * 0.28, top);
  ctx.quadraticCurveTo(trunk.x + trunk.width * 0.2, (trunk.baseY + top) / 2, trunk.x + trunk.width / 2, trunk.baseY);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(20, 12, 8, 0.35)";
  ctx.lineWidth = 1;
  for (let i = -2; i <= 2; i += 1) {
    ctx.beginPath();
    ctx.moveTo(trunk.x + i * 4, trunk.baseY - 8);
    ctx.quadraticCurveTo(trunk.x + i * 3, (trunk.baseY + top) / 2, trunk.x + i * 2, top + 10);
    ctx.stroke();
  }
}

function drawBranch(
  ctx: CanvasRenderingContext2D,
  branch: TreeLayout["branches"][number],
  grow: number,
  time: number,
  active: boolean,
  season: Season,
) {
  const points = sampleBranch(branch, 28);
  const sway = (t: number) => Math.sin(time * 0.001 + t * 4 + branch.side) * 5 * t * grow;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = active ? "#8a5a32" : "#3a2416";
  ctx.shadowColor = active ? "rgba(228, 184, 106, 0.35)" : "transparent";
  ctx.shadowBlur = active ? 18 : 0;
  ctx.beginPath();
  points.forEach((point, i) => {
    const t = i / (points.length - 1);
    if (t > grow) return;
    const x = point.x + sway(t);
    const y = point.y + Math.sin(time * 0.0008 + t) * 2 * t;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.lineWidth = branch.thickness * (0.4 + 0.6 * grow);
  ctx.stroke();
  if (season === "winter" && active) {
    ctx.strokeStyle = "rgba(230, 240, 255, 0.35)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
  ctx.restore();
}

function drawLeaves(
  ctx: CanvasRenderingContext2D,
  branch: TreeLayout["branches"][number],
  grow: number,
  time: number,
  season: Season,
  active: boolean,
) {
  ctx.save();
  branch.leaves.forEach((leaf, i) => {
    const t = i / branch.leaves.length;
    if (t > grow) return;
    const sway = Math.sin(time * 0.002 + i) * 3;
    ctx.save();
    ctx.translate(leaf.x + sway, leaf.y);
    ctx.rotate(leaf.rot + Math.sin(time * 0.0015 + i) * 0.08);
    ctx.fillStyle = active ? "#e2c36b" : LEAF[season];
    ctx.globalAlpha = season === "winter" ? 0.35 : 0.82;
    ctx.beginPath();
    ctx.ellipse(0, 0, 7 * leaf.s, 3.4 * leaf.s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
  ctx.restore();
}

function drawFruit(
  ctx: CanvasRenderingContext2D,
  branch: TreeLayout["branches"][number],
  grow: number,
  time: number,
  active: boolean,
  person?: Person,
) {
  branch.fruits.forEach((fruit, i) => {
    const t = 0.2 + i / branch.fruits.length;
    if (t > grow) return;
    const bounce = Math.sin(time * 0.003 + i) * 1.2;
    const x = fruit.x;
    const y = fruit.y + bounce;
    const r = fruit.r * (0.7 + 0.3 * fruit.ripeness);
    ctx.save();
    if (fruit.ripeness < 0.35) {
      ctx.fillStyle = `hsla(${(person?.hue ?? fruit.hue) + 80} 60% 72% / 0.9)`;
      ctx.beginPath();
      ctx.ellipse(x, y, r * 0.9, r * 0.45, -0.4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r);
      g.addColorStop(0, `hsl(${fruit.hue} 70% ${active ? 72 : 62}%)`);
      g.addColorStop(1, `hsl(${fruit.hue} 65% ${active ? 38 : 32}%)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.beginPath();
      ctx.ellipse(x - r * 0.3, y - r * 0.3, r * 0.28, r * 0.18, -0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  branch: TreeLayout["branches"][number],
  active: boolean,
  state: GroveState,
) {
  const person = state.people.find((item) => item.id === branch.personId);
  if (!person) return;
  ctx.save();
  ctx.font = `${active ? 700 : 500} ${active ? 14 : 12}px Outfit, sans-serif`;
  ctx.fillStyle = active ? "#f7e7c1" : "rgba(244, 239, 230, 0.78)";
  ctx.textAlign = branch.label.align;
  ctx.fillText(person.name, branch.label.x, branch.label.y);
  if (active) {
    ctx.font = "500 11px Outfit, sans-serif";
    ctx.fillStyle = "rgba(228, 184, 106, 0.9)";
    const count = memoryCount(state, person.id);
    ctx.fillText(
      `${count} ${fruitName(count, person.relationship)}`,
      branch.label.x,
      branch.label.y + 14,
    );
  }
  ctx.restore();
}

function drawYou(
  ctx: CanvasRenderingContext2D,
  trunk: TreeLayout["trunk"],
  name: string,
  grow: number,
) {
  ctx.save();
  ctx.globalAlpha = grow;
  ctx.fillStyle = "#f4efe6";
  ctx.font = "600 13px Outfit, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(name || "You", trunk.x, trunk.baseY + 22);
  ctx.font = "500 10px Outfit, sans-serif";
  ctx.fillStyle = "rgba(244,239,230,0.55)";
  ctx.fillText("the trunk", trunk.x, trunk.baseY + 36);
  ctx.restore();
}

export async function exportTreePng(canvas: HTMLCanvasElement, hd: boolean) {
  const out = document.createElement("canvas");
  const scale = hd ? 2 : 1;
  out.width = canvas.width * scale;
  out.height = canvas.height * scale;
  const ctx = out.getContext("2d");
  if (!ctx) return canvas.toDataURL("image/png");
  ctx.drawImage(canvas, 0, 0, out.width, out.height);
  return out.toDataURL("image/png");
}

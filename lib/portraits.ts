import { hashString, mulberry32 } from "./id";

const SKIN = ["#f6d0b1", "#e8b894", "#c9845a", "#8d5524", "#f3c7a1", "#d1a078"];
const HAIR = ["#1b120c", "#3a2415", "#6b3a1f", "#d8c07a", "#2c2c2c", "#4a2f1b", "#111111"];
const SHIRTS = ["#2f4f3a", "#6b2d2d", "#3d4a6b", "#7a5c2e", "#355c5c", "#4a3758"];

export function portraitDataUrl(seed: string, size = 256) {
  if (typeof document === "undefined") return undefined;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;
  paintPortrait(ctx, seed, size);
  return canvas.toDataURL("image/jpeg", 0.72);
}

export function memoryDataUrl(seed: string, hue: number, size = 320) {
  if (typeof document === "undefined") return "";
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  paintMemory(ctx, seed, hue, size);
  return canvas.toDataURL("image/jpeg", 0.7);
}

export function paintPortrait(
  ctx: CanvasRenderingContext2D,
  seed: string,
  size: number,
) {
  const rand = mulberry32(hashString(seed));
  const skin = SKIN[Math.floor(rand() * SKIN.length)];
  const hair = HAIR[Math.floor(rand() * HAIR.length)];
  const shirt = SHIRTS[Math.floor(rand() * SHIRTS.length)];
  const bgHue = Math.floor(rand() * 360);

  const g = ctx.createLinearGradient(0, 0, size, size);
  g.addColorStop(0, `hsl(${bgHue} 28% 28%)`);
  g.addColorStop(1, `hsl(${(bgHue + 40) % 360} 22% 16%)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = shirt;
  ctx.beginPath();
  ctx.ellipse(size * 0.5, size * 1.12, size * 0.42, size * 0.38, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(size * 0.5, size * 0.46, size * 0.22, size * 0.26, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.ellipse(
    size * 0.5,
    size * 0.34,
    size * (0.23 + rand() * 0.04),
    size * (0.16 + rand() * 0.08),
    0,
    Math.PI,
    Math.PI * 2,
  );
  ctx.fill();
  if (rand() > 0.45) {
    ctx.fillRect(size * 0.26, size * 0.34, size * 0.08, size * 0.22);
    ctx.fillRect(size * 0.66, size * 0.34, size * 0.08, size * 0.22);
  }

  ctx.fillStyle = "#1a120c";
  const eyeY = size * 0.46;
  ctx.beginPath();
  ctx.ellipse(size * 0.42, eyeY, size * 0.018, size * 0.022, 0, 0, Math.PI * 2);
  ctx.ellipse(size * 0.58, eyeY, size * 0.018, size * 0.022, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#a15c4a";
  ctx.lineWidth = size * 0.008;
  ctx.beginPath();
  ctx.arc(size * 0.5, size * 0.54, size * 0.06, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
}

export function paintMemory(
  ctx: CanvasRenderingContext2D,
  seed: string,
  hue: number,
  size: number,
) {
  const rand = mulberry32(hashString(seed));
  const sky = ctx.createLinearGradient(0, 0, 0, size);
  sky.addColorStop(0, `hsl(${hue} 35% ${28 + rand() * 18}%)`);
  sky.addColorStop(1, `hsl(${(hue + 30) % 360} 40% 12%)`);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 6; i += 1) {
    ctx.fillStyle = `hsla(${(hue + i * 18) % 360} 55% ${40 + rand() * 30}% / ${0.25 + rand() * 0.4})`;
    ctx.beginPath();
    ctx.ellipse(
      rand() * size,
      rand() * size,
      size * (0.08 + rand() * 0.22),
      size * (0.06 + rand() * 0.16),
      rand() * Math.PI,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  ctx.fillStyle = `hsla(${hue} 20% 90% / 0.18)`;
  ctx.fillRect(0, size * 0.72, size, size * 0.28);
}

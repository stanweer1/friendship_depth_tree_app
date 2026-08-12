export type FaceHit = {
  x: number;
  y: number;
  width: number;
  height: number;
  signature: number[];
  thumbUrl: string;
};

type NativeFaceDetector = {
  detect: (image: ImageBitmapSource) => Promise<Array<{ boundingBox: DOMRectReadOnly }>>;
};

function getNativeDetector(): NativeFaceDetector | undefined {
  const Ctor = (
    window as unknown as {
      FaceDetector?: new (opts: {
        fastMode: boolean;
        maxDetectedFaces: number;
      }) => NativeFaceDetector;
    }
  ).FaceDetector;
  if (!Ctor) return undefined;
  try {
    return new Ctor({ fastMode: true, maxDetectedFaces: 12 });
  } catch {
    return undefined;
  }
}

function isSkin(r: number, g: number, b: number) {
  const rgb = r > 95 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15;
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
  return rgb && cb > 77 && cb < 127 && cr > 133 && cr > 133 && cr < 173;
}

function signatureFrom(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const sample = 12;
  const data = ctx.getImageData(x, y, w, h).data;
  const cells = new Array<number>(sample * sample).fill(0);
  const counts = new Array<number>(sample * sample).fill(0);
  for (let py = 0; py < h; py += 1) {
    for (let px = 0; px < w; px += 1) {
      const i = (py * w + px) * 4;
      const cx = Math.min(sample - 1, Math.floor((px / w) * sample));
      const cy = Math.min(sample - 1, Math.floor((py / h) * sample));
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const idx = cy * sample + cx;
      cells[idx] += lum;
      counts[idx] += 1;
    }
  }
  return cells.map((value, i) => (counts[i] ? value / counts[i] / 255 : 0));
}

function cropThumb(
  source: HTMLCanvasElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const pad = 0.18;
  const sx = Math.max(0, x - w * pad);
  const sy = Math.max(0, y - h * pad);
  const sw = Math.min(source.width - sx, w * (1 + pad * 2));
  const sh = Math.min(source.height - sy, h * (1 + pad * 2));
  const out = document.createElement("canvas");
  out.width = 96;
  out.height = 96;
  const ctx = out.getContext("2d");
  if (!ctx) return "";
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, 96, 96);
  return out.toDataURL("image/jpeg", 0.7);
}

function detectBySkin(canvas: HTMLCanvasElement): FaceHit[] {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  const scale = Math.min(1, 140 / Math.max(canvas.width, canvas.height));
  const w = Math.max(1, Math.round(canvas.width * scale));
  const h = Math.max(1, Math.round(canvas.height * scale));
  const small = document.createElement("canvas");
  small.width = w;
  small.height = h;
  const sctx = small.getContext("2d", { willReadFrequently: true });
  if (!sctx) return [];
  sctx.drawImage(canvas, 0, 0, w, h);
  const img = sctx.getImageData(0, 0, w, h);
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i += 1) {
    const p = i * 4;
    mask[i] = isSkin(img.data[p], img.data[p + 1], img.data[p + 2]) ? 1 : 0;
  }

  const visited = new Uint8Array(w * h);
  const boxes: Array<{ x: number; y: number; w: number; h: number; n: number }> = [];
  const stack: number[] = [];

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const start = y * w + x;
      if (!mask[start] || visited[start]) continue;
      stack.length = 0;
      stack.push(start);
      visited[start] = 1;
      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;
      let n = 0;
      while (stack.length) {
        const idx = stack.pop()!;
        n += 1;
        const cx = idx % w;
        const cy = Math.floor(idx / w);
        minX = Math.min(minX, cx);
        maxX = Math.max(maxX, cx);
        minY = Math.min(minY, cy);
        maxY = Math.max(maxY, cy);
        const neighbors = [idx - 1, idx + 1, idx - w, idx + w];
        for (const next of neighbors) {
          if (next < 0 || next >= w * h || visited[next] || !mask[next]) continue;
          visited[next] = 1;
          stack.push(next);
        }
      }
      const bw = maxX - minX + 1;
      const bh = maxY - minY + 1;
      const aspect = bw / bh;
      if (n > 80 && aspect > 0.55 && aspect < 1.6 && bw > 10 && bh > 12) {
        boxes.push({ x: minX, y: minY, w: bw, h: bh, n });
      }
    }
  }

  boxes.sort((a, b) => b.n - a.n);
  const fullCtx = ctx;
  return boxes.slice(0, 8).map((box) => {
    const x = box.x / scale;
    const y = box.y / scale;
    const width = box.w / scale;
    const height = box.h / scale;
    return {
      x,
      y,
      width,
      height,
      signature: signatureFrom(fullCtx, Math.round(x), Math.round(y), Math.round(width), Math.round(height)),
      thumbUrl: cropThumb(canvas, x, y, width, height),
    };
  });
}

export async function loadImageFile(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not read photo"));
      img.src = url;
    });
    const max = 900;
    const scale = Math.min(1, max / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const thumb = document.createElement("canvas");
    const tScale = Math.min(1, 360 / Math.max(canvas.width, canvas.height));
    thumb.width = Math.max(1, Math.round(canvas.width * tScale));
    thumb.height = Math.max(1, Math.round(canvas.height * tScale));
    thumb.getContext("2d")?.drawImage(canvas, 0, 0, thumb.width, thumb.height);
    return {
      canvas,
      thumbUrl: thumb.toDataURL("image/jpeg", 0.72),
      width: image.width,
      height: image.height,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function detectFaces(canvas: HTMLCanvasElement): Promise<FaceHit[]> {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  const native = getNativeDetector();
  if (native) {
    try {
      const bitmap = await createImageBitmap(canvas);
      const hits = await native.detect(bitmap);
      bitmap.close();
      if (hits.length) {
        return hits.map((hit) => {
          const { x, y, width, height } = hit.boundingBox;
          return {
            x,
            y,
            width,
            height,
            signature: signatureFrom(ctx, x, y, width, height),
            thumbUrl: cropThumb(canvas, x, y, width, height),
          };
        });
      }
    } catch {
      // Fall through to the color-based detector.
    }
  }
  return detectBySkin(canvas);
}

export function signatureDistance(a: number[], b: number[]) {
  const n = Math.min(a.length, b.length);
  if (!n) return 1;
  let sum = 0;
  for (let i = 0; i < n; i += 1) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum / n);
}

export function clusterSignatures(items: Array<{ signature: number[] }>, threshold = 0.16) {
  const parent = items.map((_, i) => i);
  const find = (i: number): number => {
    if (parent[i] !== i) parent[i] = find(parent[i]);
    return parent[i];
  };
  const union = (a: number, b: number) => {
    parent[find(a)] = find(b);
  };
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      if (signatureDistance(items[i].signature, items[j].signature) < threshold) {
        union(i, j);
      }
    }
  }
  const groups = new Map<number, number[]>();
  items.forEach((_, i) => {
    const root = find(i);
    const list = groups.get(root) ?? [];
    list.push(i);
    groups.set(root, list);
  });
  return [...groups.values()];
}

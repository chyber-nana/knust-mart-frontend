// Free, on-device "AI" enhance: auto-levels (histogram stretch), gamma lighting correction,
// gentle contrast/saturation lift and light unsharp-mask sharpening. No paid API, no server cost.
const MAX_SIDE = 1600;

export async function enhanceImage(src: string): Promise<string> {
  const img = new Image();
  img.src = src;
  await img.decode();
  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * scale), h = Math.round(img.naturalHeight * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Your browser couldn't enhance this photo.");
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;

  // Luma histogram -> 1st/99th percentile for levels, mean for gamma.
  const hist = new Uint32Array(256);
  for (let i = 0; i < px.length; i += 4) hist[Math.round(0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2])]++;
  const total = w * h;
  let acc = 0, lo = 0, hi = 255;
  for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= total * 0.01) { lo = v; break; } }
  acc = 0;
  for (let v = 255; v >= 0; v--) { acc += hist[v]; if (acc >= total * 0.01) { hi = v; break; } }
  if (hi - lo < 40) { lo = Math.max(0, lo - 20); hi = Math.min(255, hi + 20); }
  let sum = 0;
  for (let v = 0; v < 256; v++) sum += v * hist[v];
  const mean = Math.max(1, sum / total) / 255;
  const gamma = Math.min(1.6, Math.max(0.7, Math.log(0.48) / Math.log(Math.min(0.95, Math.max(0.05, (mean - lo / 255) / Math.max(0.1, (hi - lo) / 255))))));
  const lut = new Uint8ClampedArray(256);
  for (let v = 0; v < 256; v++) {
    let n = Math.min(1, Math.max(0, (v - lo) / (hi - lo)));
    n = Math.pow(n, 1 / gamma);
    n = 0.5 + (n - 0.5) * 1.08; // mild contrast
    lut[v] = Math.round(n * 255);
  }
  for (let i = 0; i < px.length; i += 4) {
    const r = lut[px[i]], g = lut[px[i + 1]], b = lut[px[i + 2]];
    const l = 0.299 * r + 0.587 * g + 0.114 * b;
    px[i] = l + (r - l) * 1.12; px[i + 1] = l + (g - l) * 1.12; px[i + 2] = l + (b - l) * 1.12;
  }
  // Unsharp mask using a 3x3 box blur.
  const src0 = new Uint8ClampedArray(px);
  const amount = 0.6;
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const o = (y * w + x) * 4;
    for (let c = 0; c < 3; c++) {
      let blur = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) blur += src0[((y + dy) * w + x + dx) * 4 + c];
      blur /= 9;
      px[o + c] = src0[o + c] + (src0[o + c] - blur) * amount;
    }
  }
  ctx.putImageData(data, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.92);
}

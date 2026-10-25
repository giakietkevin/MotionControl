export type Settings = {
  prompt: string;
  resolution: "480p" | "720p";
  fps: 12 | 16 | 24;
  duration: number;
  strength: number;
  seed: number | null;
};

export type Stage = "upload" | "pose" | "render" | "encode";
export type Progress = { stage: Stage; pct: number };

export type GenInput = { image: File; video: File; settings: Settings };

// Browser talks to ComfyUI through the /comfy rewrite in next.config.mjs (avoids CORS).
const COMFY = "/comfy";
const WORKFLOW_URL = "/workflows/motion-control.json";

export const RESOLUTIONS = { "480p": { w: 480, h: 832 }, "720p": { w: 720, h: 1280 } } as const;

export async function comfyAvailable(): Promise<boolean> {
  try {
    const r = await fetch(`${COMFY}/system_stats`, { signal: AbortSignal.timeout(1500) });
    return r.ok;
  } catch {
    return false;
  }
}

export function frameCount(duration: number, fps: number) {
  // Wan-style models expect 4n+1 frames.
  return Math.floor((duration * fps - 1) / 4) * 4 + 1;
}

export function randomSeed() {
  return Math.floor(Math.random() * 2 ** 31);
}

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((res, rej) => {
    const id = setTimeout(res, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(id);
        rej(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });

/** Demo backend: simulates the pipeline and returns the reference video as a stand-in result. */
async function runMock(input: GenInput, onProgress: (p: Progress) => void, signal: AbortSignal): Promise<Blob> {
  const stages: [Stage, number][] = [
    ["upload", 700],
    ["pose", 1500],
    ["render", 3500],
    ["encode", 900],
  ];
  for (const [stage, ms] of stages) {
    const steps = 10;
    for (let i = 1; i <= steps; i++) {
      await sleep(ms / steps, signal);
      onProgress({ stage, pct: i / steps });
    }
  }
  return input.video;
}

async function uploadFile(file: File, signal: AbortSignal): Promise<string> {
  const fd = new FormData();
  fd.append("image", file, file.name);
  fd.append("overwrite", "true");
  const r = await fetch(`${COMFY}/upload/image`, { method: "POST", body: fd, signal });
  if (!r.ok) throw new Error(`Upload failed (${r.status})`);
  return (await r.json()).name as string;
}

/**
 * Workflow JSON is exported from ComfyUI with "Save (API Format)". Placeholders are replaced as plain strings:
 * {{IMAGE}} {{VIDEO}} {{PROMPT}} {{SEED}} {{STRENGTH}} {{WIDTH}} {{HEIGHT}} {{FRAMES}} {{FPS}}
 */
async function runComfy(input: GenInput, onProgress: (p: Progress) => void, signal: AbortSignal): Promise<Blob> {
  const { image, video, settings: s } = input;
  onProgress({ stage: "upload", pct: 0 });
  const [imgName, vidName] = await Promise.all([uploadFile(image, signal), uploadFile(video, signal)]);
  onProgress({ stage: "upload", pct: 1 });

  const tplRes = await fetch(WORKFLOW_URL, { signal });
  if (!tplRes.ok) throw new Error("Missing public/workflows/motion-control.json");
  const { w, h } = RESOLUTIONS[s.resolution];
  const values: Record<string, string | number> = {
    IMAGE: imgName,
    VIDEO: vidName,
    PROMPT: s.prompt,
    SEED: s.seed ?? randomSeed(),
    STRENGTH: s.strength,
    WIDTH: w,
    HEIGHT: h,
    FRAMES: frameCount(s.duration, s.fps),
    FPS: s.fps,
  };
  let text = await tplRes.text();
  for (const [k, v] of Object.entries(values)) {
    // A lone "{{K}}" becomes a typed JSON value (number stays a number); inside longer strings it is spliced in escaped.
    text = text
      .split(`"{{${k}}}"`)
      .join(JSON.stringify(v))
      .split(`{{${k}}}`)
      .join(JSON.stringify(String(v)).slice(1, -1));
  }
  const prompt = JSON.parse(text);

  const q = await fetch(`${COMFY}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
    signal,
  });
  if (!q.ok) throw new Error(`ComfyUI rejected workflow (${q.status}): ${await q.text()}`);
  const { prompt_id } = (await q.json()) as { prompt_id: string };

  onProgress({ stage: "pose", pct: 0 });
  const started = Date.now();
  for (;;) {
    await sleep(1500, signal).catch((e) => {
      void fetch(`${COMFY}/interrupt`, { method: "POST" }).catch(() => {});
      throw e;
    });
    const hr = await fetch(`${COMFY}/history/${prompt_id}`, { signal });
    const hist = hr.ok ? await hr.json() : {};
    const entry = hist[prompt_id];
    if (entry?.status?.status_str === "error") throw new Error("ComfyUI execution error");
    if (entry?.outputs) {
      type OutFile = { filename: string; subfolder?: string; type?: string };
      type Out = { gifs?: OutFile[]; videos?: OutFile[]; images?: OutFile[] };
      const files = Object.values(entry.outputs as Record<string, Out>)
        .flatMap((o) => [...(o.gifs ?? []), ...(o.videos ?? []), ...(o.images ?? [])])
        .filter((f) => /\.(mp4|webm|gif)$/i.test(f.filename));
      const f = files[0];
      if (!f) throw new Error("Workflow produced no video output");
      onProgress({ stage: "encode", pct: 1 });
      const qs = new URLSearchParams({ filename: f.filename, subfolder: f.subfolder ?? "", type: f.type ?? "output" });
      const vr = await fetch(`${COMFY}/view?${qs}`, { signal });
      if (!vr.ok) throw new Error("Could not fetch result video");
      return await vr.blob();
    }
    // ComfyUI only exposes coarse progress via history polling; estimate so the bar keeps moving.
    const pct = Math.min(0.95, (Date.now() - started) / 240_000);
    onProgress({ stage: pct < 0.1 ? "pose" : "render", pct });
  }
}

export async function generate(
  input: GenInput,
  mode: "mock" | "comfy",
  onProgress: (p: Progress) => void,
  signal: AbortSignal,
): Promise<Blob> {
  return mode === "comfy" ? runComfy(input, onProgress, signal) : runMock(input, onProgress, signal);
}

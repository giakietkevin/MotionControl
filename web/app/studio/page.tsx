"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AuthGate } from "@/components/AuthGate";
import { Dropzone } from "@/components/Dropzone";
import { PoseOverlay } from "@/components/PoseOverlay";
import { useI18n, type Key } from "@/lib/i18n";
import { comfyAvailable, generate, randomSeed, type Progress, type Settings, type Stage } from "@/lib/generate";
import { addItem, fileToThumb } from "@/lib/library";

const STAGES: Stage[] = ["upload", "pose", "render", "encode"];
const STAGE_KEY: Record<Stage, Key> = {
  upload: "studio.stage.upload",
  pose: "studio.stage.pose",
  render: "studio.stage.render",
  encode: "studio.stage.encode",
};

export default function StudioPage() {
  return <AuthGate>{(userId) => <Studio userId={userId} />}</AuthGate>;
}

function Studio({ userId }: { userId: string }) {
  const { t } = useI18n();
  const [image, setImage] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [s, setS] = useState<Settings>({ prompt: "", resolution: "480p", fps: 16, duration: 5, strength: 0.8, seed: null });
  const [showPose, setShowPose] = useState(false);
  const [poseFailed, setPoseFailed] = useState(false);
  const [mode, setMode] = useState<"mock" | "comfy" | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const videoEl = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    comfyAvailable().then((ok) => setMode(ok ? "comfy" : "mock"));
  }, []);

  useEffect(
    () => () => {
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    },
    [resultUrl],
  );

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((p) => ({ ...p, [k]: v }));
  const onPoseError = useCallback(() => setPoseFailed(true), []);

  const run = async () => {
    if (!image || !video || !mode) return;
    const ctl = new AbortController();
    abort.current = ctl;
    setBusy(true);
    setError("");
    setSaved(false);
    setResultUrl(null);
    setProgress({ stage: "upload", pct: 0 });
    const seed = s.seed ?? randomSeed();
    try {
      const blob = await generate({ image, video, settings: { ...s, seed } }, mode, setProgress, ctl.signal);
      setResultUrl(URL.createObjectURL(blob));
      await addItem(
        {
          id: crypto.randomUUID(),
          userId,
          createdAt: Date.now(),
          prompt: s.prompt,
          resolution: s.resolution,
          fps: s.fps,
          duration: s.duration,
          seed,
          thumb: await fileToThumb(image),
        },
        blob,
      );
      setSaved(true);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message || t("studio.failed"));
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const stageIdx = progress ? STAGES.indexOf(progress.stage) : -1;
  const total = progress ? ((stageIdx + progress.pct) / STAGES.length) * 100 : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">{t("studio.title")}</h1>
          <p className="mt-1 text-mute">{t("studio.sub")}</p>
        </div>
        {mode && (
          <p className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-300">
            <span className={`h-2 w-2 rounded-full ${mode === "comfy" ? "bg-emerald-400" : "bg-amber-400"}`} aria-hidden="true" />
            {t(mode === "comfy" ? "studio.backend.comfy" : "studio.backend.mock")}
          </p>
        )}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <section aria-labelledby="s1">
              <h2 id="s1" className="label">{t("studio.step1")}</h2>
              <Dropzone kind="image" file={image} onFile={setImage} maxMB={20} />
            </section>
            <section aria-labelledby="s2">
              <h2 id="s2" className="label">{t("studio.step2")}</h2>
              <Dropzone
                kind="video"
                file={video}
                onFile={(f) => {
                  setVideo(f);
                  setPoseFailed(false);
                }}
                maxMB={100}
                videoRef={videoEl}
                overlay={(el) => showPose && !poseFailed && <PoseOverlay video={el} onError={onPoseError} />}
              />
              <label className="mt-3 flex cursor-pointer items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={showPose}
                  onChange={(e) => setShowPose(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-cyan-400"
                />
                <span>
                  <span className="text-slate-200">{t("studio.pose")}</span>
                  <span className="block text-xs text-mute">{t("studio.pose.hint")}</span>
                </span>
              </label>
            </section>
          </div>

          <section className="card space-y-5 p-5" aria-labelledby="s3">
            <h2 id="s3" className="text-sm font-semibold text-white">{t("studio.settings")}</h2>

            <div>
              <label htmlFor="prompt" className="label">{t("studio.prompt")}</label>
              <textarea
                id="prompt"
                rows={2}
                value={s.prompt}
                onChange={(e) => set("prompt", e.target.value)}
                placeholder={t("studio.prompt.ph")}
                className="input resize-none"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <span className="label" id="res-l">{t("studio.res")}</span>
                <Segmented
                  labelledBy="res-l"
                  value={s.resolution}
                  options={["480p", "720p"]}
                  onChange={(v) => set("resolution", v as Settings["resolution"])}
                />
              </div>
              <div>
                <span className="label" id="fps-l">{t("studio.fps")}</span>
                <Segmented
                  labelledBy="fps-l"
                  value={String(s.fps)}
                  options={["12", "16", "24"]}
                  onChange={(v) => set("fps", Number(v) as Settings["fps"])}
                />
              </div>
              <div>
                <label htmlFor="dur" className="label flex justify-between">
                  {t("studio.dur")} <span className="font-mono text-slate-200">{s.duration}s</span>
                </label>
                <input id="dur" type="range" min={2} max={10} step={1} value={s.duration} onChange={(e) => set("duration", Number(e.target.value))} />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="str" className="label flex justify-between">
                  {t("studio.strength")} <span className="font-mono text-slate-200">{s.strength.toFixed(2)}</span>
                </label>
                <input id="str" type="range" min={0.2} max={1.2} step={0.05} value={s.strength} onChange={(e) => set("strength", Number(e.target.value))} />
              </div>
              <div>
                <label htmlFor="seed" className="label">{t("studio.seed")}</label>
                <div className="flex gap-2">
                  <input
                    id="seed"
                    inputMode="numeric"
                    value={s.seed ?? ""}
                    placeholder={t("studio.seed.random")}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 10);
                      set("seed", v === "" ? null : Number(v));
                    }}
                    className="input font-mono"
                  />
                  <button type="button" className="btn-ghost !px-3" onClick={() => set("seed", randomSeed())} aria-label={t("studio.seed.random")}>
                    ⟳
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start" aria-labelledby="s4">
          <div className="card p-5">
            <h2 id="s4" className="text-sm font-semibold text-white">{t("studio.result")}</h2>

            <div className="relative mt-4 aspect-[9/16] max-h-[60vh] w-full overflow-hidden rounded-xl bg-black">
              {resultUrl ? (
                <video src={resultUrl} controls autoPlay loop muted playsInline className="h-full w-full object-contain" />
              ) : busy ? (
                <div className="absolute inset-0 grid place-items-center overflow-hidden" aria-hidden="true">
                  <div className="absolute inset-x-0 h-1/3 animate-scan bg-gradient-to-b from-transparent via-cyan-400/25 to-transparent" />
                  <span className="font-mono text-4xl text-cyan-400">{Math.round(total)}%</span>
                </div>
              ) : (
                <p className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-mute">{t("studio.result.empty")}</p>
              )}
            </div>

            {busy && progress && (
              <div className="mt-4" role="status" aria-live="polite">
                <div className="h-1.5 overflow-hidden rounded-full bg-ink-600">
                  <div className="h-full bg-cyan-400 transition-all" style={{ width: `${total}%` }} />
                </div>
                <ol className="mt-3 space-y-1.5 text-sm">
                  {STAGES.map((st, i) => (
                    <li key={st} className={i < stageIdx ? "text-cyan-400" : i === stageIdx ? "text-white" : "text-mute"}>
                      {i < stageIdx ? "✓" : i === stageIdx ? "›" : "·"} {t(STAGE_KEY[st])}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {error && (
              <p role="alert" className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                {t("studio.failed")}: {error}
              </p>
            )}

            <div className="mt-4 space-y-2">
              {busy ? (
                <button type="button" className="btn-ghost w-full" onClick={() => abort.current?.abort()}>
                  {t("studio.cancel")}
                </button>
              ) : (
                <button type="button" className="btn-primary w-full" disabled={!image || !video || !mode} onClick={run}>
                  {t("studio.generate")}
                </button>
              )}
              {!image || !video ? <p className="text-center text-xs text-mute">{t("studio.need")}</p> : null}
              {resultUrl && (
                <a href={resultUrl} download="motion-control.mp4" className="btn-ghost w-full">
                  {t("studio.download")}
                </a>
              )}
              {saved && (
                <p className="text-center text-xs text-cyan-400">
                  {t("studio.saved")} · <Link href="/library" className="underline">{t("nav.library")}</Link>
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Segmented({
  value,
  options,
  onChange,
  labelledBy,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  labelledBy: string;
}) {
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className="flex rounded-xl border border-white/10 bg-ink-900 p-0.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={value === o}
          onClick={() => onChange(o)}
          className={`flex-1 rounded-[10px] py-2 text-sm font-medium transition ${value === o ? "bg-cyan-400 text-ink-950" : "text-mute hover:text-white"}`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

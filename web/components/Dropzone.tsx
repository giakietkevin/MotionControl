"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";

type Props = {
  kind: "image" | "video";
  file: File | null;
  onFile: (f: File | null) => void;
  maxMB: number;
  /** Rendered over the preview (e.g. skeleton canvas). Receives the video element when kind is video. */
  overlay?: (el: HTMLVideoElement | null) => React.ReactNode;
  videoRef?: React.RefObject<HTMLVideoElement>;
};

export function Dropzone({ kind, file, onFile, maxMB, overlay, videoRef }: Props) {
  const { t } = useI18n();
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [err, setErr] = useState("");
  const [url, setUrl] = useState<string | null>(null);
  const [vid, setVid] = useState<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!file) return setUrl(null);
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const take = (f?: File) => {
    if (!f) return;
    if (!f.type.startsWith(`${kind}/`)) return setErr(t("studio.err.type"));
    if (f.size > maxMB * 1024 * 1024) return setErr(t("studio.err.size"));
    setErr("");
    onFile(f);
  };

  if (file && url)
    return (
      <div className="card overflow-hidden">
        <div className="relative aspect-[3/4] bg-black">
          {kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="h-full w-full object-contain" />
          ) : (
            <>
              <video
                ref={(el) => {
                  setVid(el);
                  if (videoRef) (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el;
                }}
                src={url}
                controls
                loop
                muted
                playsInline
                className="h-full w-full object-contain"
              />
              {overlay?.(vid)}
            </>
          )}
        </div>
        <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
          <span className="truncate text-slate-300">{file.name}</span>
          <button type="button" className="shrink-0 text-mute transition hover:text-white" onClick={() => onFile(null)}>
            {t("studio.remove")}
          </button>
        </div>
      </div>
    );

  return (
    <div>
      <label
        htmlFor={id}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          take(e.dataTransfer.files[0]);
        }}
        className={`flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 text-center transition focus-within:ring-2 focus-within:ring-cyan-400 ${
          over ? "border-cyan-400 bg-cyan-400/5" : "border-white/15 bg-ink-800/40 hover:border-white/30"
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-9 w-9 text-cyan-400" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {kind === "image" ? (
            <path d="M4 16l4-4 4 4 3-3 5 5M4 4h16v16H4zM9 9h.01" />
          ) : (
            <path d="M3 6h13v12H3zM16 10l5-3v10l-5-3" />
          )}
        </svg>
        <span className="font-medium text-slate-200">{t(kind === "image" ? "studio.drop.image" : "studio.drop.video")}</span>
        <span className="text-xs text-mute">{t(kind === "image" ? "studio.drop.hint.image" : "studio.drop.hint.video")}</span>
        <input
          id={id}
          ref={input}
          type="file"
          accept={kind === "image" ? "image/png,image/jpeg,image/webp" : "video/mp4,video/quicktime,video/webm"}
          className="sr-only"
          onChange={(e) => {
            take(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </label>
      {err && (
        <p role="alert" className="mt-2 text-sm text-red-400">
          {err}
        </p>
      )}
    </div>
  );
}

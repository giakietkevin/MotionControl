"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AuthGate } from "@/components/AuthGate";
import { useI18n } from "@/lib/i18n";
import { getBlob, listItems, removeItem, type Item } from "@/lib/library";

export default function LibraryPage() {
  return <AuthGate>{(userId) => <Library userId={userId} />}</AuthGate>;
}

function Library({ userId }: { userId: string }) {
  const { t, lang } = useI18n();
  const [items, setItems] = useState<Item[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<{ item: Item; url: string } | null>(null);

  useEffect(() => setItems(listItems(userId)), [userId]);
  useEffect(
    () => () => {
      if (open) URL.revokeObjectURL(open.url);
    },
    [open],
  );

  const shown = useMemo(() => items.filter((i) => i.prompt.toLowerCase().includes(q.toLowerCase())), [items, q]);

  const play = async (item: Item) => {
    const blob = await getBlob(item.id);
    if (blob) setOpen({ item, url: URL.createObjectURL(blob) });
  };

  const del = async (item: Item) => {
    await removeItem(item.id);
    setItems(listItems(userId));
    if (open?.item.id === item.id) setOpen(null);
  };

  const fmt = new Intl.DateTimeFormat(lang === "vi" ? "vi-VN" : "en-US", { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">{t("lib.title")}</h1>
          <p className="mt-1 text-mute">
            {t("lib.sub")} · {items.length} {t("lib.count")}
          </p>
        </div>
        {items.length > 0 && (
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("lib.search")}
            aria-label={t("lib.search")}
            className="input max-w-xs"
          />
        )}
      </div>

      {items.length === 0 ? (
        <div className="card mt-10 grid place-items-center gap-4 py-20 text-center">
          <p className="text-mute">{t("lib.empty")}</p>
          <Link href="/studio" className="btn-primary">{t("lib.empty.cta")}</Link>
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {shown.map((i) => (
            <li key={i.id} className="card group overflow-hidden">
              <button type="button" onClick={() => play(i)} className="relative block aspect-[3/4] w-full bg-black text-left" aria-label={i.prompt || fmt.format(i.createdAt)}>
                {i.thumb && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={i.thumb} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
                )}
                <span className="absolute inset-0 grid place-items-center bg-black/30 opacity-0 transition group-hover:opacity-100">
                  <svg viewBox="0 0 24 24" className="h-12 w-12 text-white" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
                </span>
              </button>
              <div className="space-y-1 p-3 text-xs">
                <p className="truncate text-sm text-slate-200">{i.prompt || "—"}</p>
                <p className="text-mute">{fmt.format(i.createdAt)}</p>
                <p className="flex items-center justify-between text-mute">
                  <span className="font-mono">{i.resolution} · {i.fps}fps · {i.duration}s</span>
                  <button type="button" onClick={() => del(i)} className="transition hover:text-red-400">{t("lib.delete")}</button>
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[60] grid place-items-center bg-black/80 p-4"
          onClick={() => setOpen(null)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(null)}
        >
          <div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <video src={open.url} controls autoPlay loop playsInline className="max-h-[80vh] w-full rounded-xl bg-black" />
            <div className="mt-3 flex gap-2">
              <a href={open.url} download="motion-control.mp4" className="btn-primary flex-1">{t("studio.download")}</a>
              <button type="button" autoFocus className="btn-ghost" onClick={() => setOpen(null)}>✕</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

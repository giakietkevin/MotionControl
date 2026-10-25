"use client";

import Link from "next/link";
import { useI18n, type Key } from "@/lib/i18n";

/** Illustration only: the same moving skeleton drives two figures. */
function Figure({ skeleton }: { skeleton?: boolean }) {
  const dur = "1.6s";
  const sw = skeleton ? "#22d3ee" : "#f1f5f9";
  const swing = (from: number, to: number, cx: number, cy: number) => (
    <animateTransform
      attributeName="transform"
      type="rotate"
      values={`${from} ${cx} ${cy};${to} ${cx} ${cy};${from} ${cx} ${cy}`}
      dur={dur}
      repeatCount="indefinite"
    />
  );
  return (
    <svg viewBox="0 0 120 200" className="h-full w-full" fill="none" aria-hidden="true">
      {!skeleton && (
        <>
          <rect width="120" height="200" fill="url(#bg)" />
          <defs>
            <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#1e293b" />
              <stop offset="1" stopColor="#0f766e" />
            </linearGradient>
          </defs>
        </>
      )}
      <g stroke={sw} strokeWidth={skeleton ? 2.5 : 7} strokeLinecap="round">
        <circle cx="60" cy="40" r={skeleton ? 8 : 14} fill={skeleton ? "none" : "#f1f5f9"} />
        <line x1="60" y1="56" x2="60" y2="112" />
        <g>{swing(-35, 55, 60, 70)}<line x1="60" y1="70" x2="22" y2="96" /></g>
        <g>{swing(55, -35, 60, 70)}<line x1="60" y1="70" x2="98" y2="96" /></g>
        <g>{swing(18, -18, 60, 112)}<line x1="60" y1="112" x2="42" y2="166" /></g>
        <g>{swing(-18, 18, 60, 112)}<line x1="60" y1="112" x2="78" y2="166" /></g>
      </g>
      {skeleton && (
        <g fill="#fff">
          {[[60, 40], [60, 70], [60, 112]].map(([x, y]) => <circle key={y} cx={x} cy={y} r="3" />)}
        </g>
      )}
    </svg>
  );
}

function Frame({ label, children, accent }: { label: string; children: React.ReactNode; accent?: boolean }) {
  return (
    <figure className={`card overflow-hidden ${accent ? "border-cyan-400/40 shadow-[0_0_60px_-15px_rgba(34,211,238,0.5)]" : ""}`}>
      <div className="aspect-[3/5] bg-ink-900">{children}</div>
      <figcaption className={`px-4 py-3 text-center text-sm font-medium ${accent ? "text-cyan-300" : "text-slate-300"}`}>{label}</figcaption>
    </figure>
  );
}

const HOW: [Key, Key][] = [["how.1.t", "how.1.d"], ["how.2.t", "how.2.d"], ["how.3.t", "how.3.d"]];
const FEATS: [Key, Key][] = [["feat.1.t", "feat.1.d"], ["feat.2.t", "feat.2.d"], ["feat.3.t", "feat.3.d"], ["feat.4.t", "feat.4.d"]];
const FAQS: [Key, Key][] = [["faq.1.q", "faq.1.a"], ["faq.2.q", "faq.2.a"], ["faq.3.q", "faq.3.a"], ["faq.4.q", "faq.4.a"]];

export default function Home() {
  const { t } = useI18n();

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="grid-bg absolute inset-0" aria-hidden="true" />
        <div className="absolute left-1/2 top-0 h-80 w-[40rem] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[120px]" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-20 text-center sm:px-6 sm:pt-28">
          <p className="mx-auto inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 text-xs font-medium text-cyan-300">
            {t("hero.badge")}
          </p>
          <h1 className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-extrabold leading-[1.1] text-white sm:text-6xl">
            {t("hero.title1")} <span className="text-cyan-400">{t("hero.title2")}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-mute">{t("hero.sub")}</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link href="/studio" className="btn-primary !px-7 !py-3.5 text-base">{t("hero.cta")}</Link>
            <a href="#how" className="btn-ghost !px-7 !py-3.5 text-base">{t("hero.cta2")}</a>
          </div>

          <div className="mx-auto mt-16 grid max-w-3xl grid-cols-3 items-center gap-3 sm:gap-6">
            <Frame label={t("demo.image")}><div className="h-full"><Figure /></div></Frame>
            <Frame label={t("demo.motion")}><div className="h-full bg-ink-900"><Figure skeleton /></div></Frame>
            <Frame label={t("demo.result")} accent><Figure /></Frame>
          </div>
          <p className="mt-4 text-xs text-mute">{t("demo.note")}</p>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <h2 className="mx-auto max-w-xl text-balance text-center text-3xl font-bold text-white">{t("how.title")}</h2>
        <ol className="mt-12 grid gap-5 md:grid-cols-3">
          {HOW.map(([h, d], i) => (
            <li key={h} className="card p-6">
              <span className="font-mono text-sm text-cyan-400">0{i + 1}</span>
              <h3 className="mt-3 text-lg font-semibold text-white">{t(h)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mute">{t(d)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-white/[0.06] bg-ink-900/60 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold text-white">{t("feat.title")}</h2>
          <dl className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {FEATS.map(([h, d]) => (
              <div key={h}>
                <dt className="flex items-center gap-2 font-semibold text-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" aria-hidden="true" />
                  {t(h)}
                </dt>
                <dd className="mt-2 text-sm leading-relaxed text-mute">{t(d)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-bold text-white">{t("faq.title")}</h2>
        <div className="mt-10 divide-y divide-white/[0.07] rounded-2xl border border-white/[0.07]">
          {FAQS.map(([q, a]) => (
            <details key={q} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-slate-100 [&::-webkit-details-marker]:hidden">
                {t(q)}
                <span className="text-cyan-400 transition group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-mute">{t(a)}</p>
            </details>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link href="/studio" className="btn-primary !px-7 !py-3.5">{t("hero.cta")}</Link>
        </div>
      </section>
    </>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { Logo } from "./Logo";

export function Header() {
  const { t, lang, setLang } = useI18n();
  const { user, ready, logout } = useAuth();
  const path = usePathname();

  const link = (href: string, label: string) => (
    <Link
      href={href}
      aria-current={path === href ? "page" : undefined}
      className={`rounded-lg px-3 py-2 text-sm transition hover:text-white ${path === href ? "text-white" : "text-mute"}`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-ink-950/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-white">
          <Logo />
          <span className="hidden sm:inline">
            MotionControl<span className="text-cyan-400"> AI</span>
          </span>
        </Link>

        <nav className="flex items-center gap-0.5" aria-label="Main">
          {link("/studio", t("nav.studio"))}
          {link("/library", t("nav.library"))}
        </nav>

        <div className="flex items-center gap-2">
          <div role="group" aria-label="Language" className="flex rounded-lg border border-white/10 p-0.5 text-xs font-semibold">
            {(["vi", "en"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                aria-pressed={lang === l}
                className={`rounded-md px-2 py-1 uppercase transition ${lang === l ? "bg-cyan-400 text-ink-950" : "text-mute hover:text-white"}`}
              >
                {l}
              </button>
            ))}
          </div>
          {ready &&
            (user ? (
              <button type="button" onClick={logout} className="btn-ghost !px-3 !py-1.5" title={user.email}>
                <span className="max-w-[6rem] truncate">{user.name}</span>
                <span className="sr-only">{t("nav.logout")}</span>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
              </button>
            ) : (
              <Link href="/login" className="btn-primary !px-3.5 !py-1.5">
                {t("nav.login")}
              </Link>
            ))}
        </div>
      </div>
    </header>
  );
}

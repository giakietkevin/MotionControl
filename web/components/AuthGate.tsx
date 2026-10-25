"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export function AuthGate({ children }: { children: (userId: string) => React.ReactNode }) {
  const { user, ready } = useAuth();
  const { t } = useI18n();

  if (!ready) return <div className="mx-auto h-96 max-w-6xl animate-pulse px-4" aria-busy="true" />;
  if (!user)
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-white">{t("gate.title")}</h1>
        <p className="mt-2 text-mute">{t("gate.sub")}</p>
        <Link href="/login" className="btn-primary mt-6">
          {t("nav.login")}
        </Link>
      </div>
    );
  return <>{children(user.id)}</>;
}

"use client";

import { useI18n } from "@/lib/i18n";

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-white/[0.06] py-8">
      <p className="mx-auto max-w-6xl px-4 text-center text-xs text-mute sm:px-6">{t("footer.note")}</p>
    </footer>
  );
}

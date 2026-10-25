"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useI18n, type Key } from "@/lib/i18n";

export default function LoginPage() {
  const { t } = useI18n();
  const { login, register } = useAuth();
  const router = useRouter();
  const [reg, setReg] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState<Key | "">("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const r = reg ? await register(name, email, pass) : await login(email, pass);
    setBusy(false);
    if (r.ok) router.push("/studio");
    else setErr(`login.err.${r.error}` as Key);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <form onSubmit={submit} className="card space-y-4 p-6" noValidate>
        <h1 className="text-2xl font-bold text-white">{reg ? t("login.register") : t("login.title")}</h1>
        <p className="text-sm text-mute">{t("login.sub")}</p>

        {reg && (
          <div>
            <label htmlFor="name" className="label">{t("login.name")}</label>
            <input id="name" autoComplete="nickname" value={name} onChange={(e) => setName(e.target.value)} className="input" />
          </div>
        )}
        <div>
          <label htmlFor="email" className="label">{t("login.email")}</label>
          <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
        </div>
        <div>
          <label htmlFor="pass" className="label">{t("login.pass")}</label>
          <input
            id="pass"
            type="password"
            autoComplete={reg ? "new-password" : "current-password"}
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            className="input"
          />
        </div>

        {err && <p role="alert" className="text-sm text-red-400">{t(err)}</p>}

        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {reg ? t("login.submit.reg") : t("login.submit")}
        </button>
        <button
          type="button"
          className="w-full text-center text-sm text-mute transition hover:text-white"
          onClick={() => {
            setReg(!reg);
            setErr("");
          }}
        >
          {reg ? t("login.switch.login") : t("login.switch.reg")}
        </button>
      </form>
    </div>
  );
}

"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type User = { id: string; name: string; email: string };
type Stored = User & { hash: string };
type Result = { ok: true } | { ok: false; error: "wrong" | "exists" | "short" | "fields" };

const USERS = "mc.users";
const SESSION = "mc.session";

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

function readUsers(): Stored[] {
  try {
    return JSON.parse(localStorage.getItem(USERS) || "[]");
  } catch {
    return [];
  }
}

type Ctx = {
  user: User | null;
  ready: boolean;
  login: (email: string, pass: string) => Promise<Result>;
  register: (name: string, email: string, pass: string) => Promise<Result>;
  logout: () => void;
};
const AuthCtx = createContext<Ctx | null>(null);

// Local-only accounts: they separate libraries per person on a shared machine. Not a security boundary.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const id = localStorage.getItem(SESSION);
      const u = readUsers().find((x) => x.id === id);
      if (u) setUser({ id: u.id, name: u.name, email: u.email });
    } catch {}
    setReady(true);
  }, []);

  const start = (u: Stored) => {
    try {
      localStorage.setItem(SESSION, u.id);
    } catch {}
    setUser({ id: u.id, name: u.name, email: u.email });
  };

  const login = useCallback<Ctx["login"]>(async (email, pass) => {
    if (!email.trim() || !pass) return { ok: false, error: "fields" };
    const hash = await sha256(pass);
    const u = readUsers().find((x) => x.email === email.trim().toLowerCase() && x.hash === hash);
    if (!u) return { ok: false, error: "wrong" };
    start(u);
    return { ok: true };
  }, []);

  const register = useCallback<Ctx["register"]>(async (name, email, pass) => {
    const e = email.trim().toLowerCase();
    if (!name.trim() || !e || !pass) return { ok: false, error: "fields" };
    if (pass.length < 6) return { ok: false, error: "short" };
    const users = readUsers();
    if (users.some((x) => x.email === e)) return { ok: false, error: "exists" };
    const u: Stored = { id: crypto.randomUUID(), name: name.trim(), email: e, hash: await sha256(pass) };
    try {
      localStorage.setItem(USERS, JSON.stringify([...users, u]));
    } catch {}
    start(u);
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(SESSION);
    } catch {}
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, ready, login, register, logout }), [user, ready, login, register, logout]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const c = useContext(AuthCtx);
  if (!c) throw new Error("useAuth outside provider");
  return c;
}

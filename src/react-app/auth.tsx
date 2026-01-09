import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type AppUser = {
  id: string;
  email: string;
  name: string;
  picture?: string | null;
  given_name?: string;
  tech_stack?: string | null;
};

interface AuthContextValue {
  user: AppUser | null;
  isPending: boolean;
  redirectToLogin: () => Promise<void>;
  logout: () => Promise<void>;
  exchangeCodeForSessionToken: (code?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function deriveGivenName(name?: string) {
  if (!name) return undefined;
  const [first] = name.split(" ");
  return first || undefined;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isPending, setIsPending] = useState(true);

  // Load session on mount
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/users/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setUser({
            id: data.id,
            email: data.email,
            name: data.name || data.email,
            picture: data.picture || null,
            given_name: data.given_name || deriveGivenName(data.name || data.email),
            tech_stack: data.tech_stack || null,
          });
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setIsPending(false);
      }
    };

    load();
  }, []);

  const redirectToLogin = async () => {
    try {
      const res = await fetch("/api/oauth/google/redirect_url");
      if (!res.ok) return;
      const data = await res.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl as string;
      }
    } catch {
      // Ignore for now
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      setUser(null);
    }
  };

  const exchangeCodeForSessionToken = async (code?: string) => {
    if (!code) return;

    const res = await fetch("/api/auth/google/callback", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    if (res.ok) {
      const data = await res.json();
      setUser({
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        picture: data.user.picture || null,
        given_name: data.user.given_name || deriveGivenName(data.user.name),
        tech_stack: data.user.tech_stack || null,
      });
    }
  };

  const value = useMemo(
    () => ({ user, isPending, redirectToLogin, logout, exchangeCodeForSessionToken }),
    [user, isPending]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

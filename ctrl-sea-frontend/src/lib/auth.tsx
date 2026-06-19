"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { endpoints } from "@/lib/api";
import type { User } from "@/lib/types";

type AuthContextValue = {
  user: User | null;
  isReady: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setReady] = useState(false);

  useEffect(() => {
    endpoints.me()
      .then((nextUser) => setUser(nextUser))
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, []);

  const persist = (nextUser: User) => {
    setUser(nextUser);
  };

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isReady,
    login: async (email, password, remember = true) => {
      const response = await endpoints.login(email, password, remember);
      persist(response.user);
    },
    register: async (name, email, password) => {
      const response = await endpoints.register(name, email, password);
      persist(response.user);
    },
    logout: async () => {
      await endpoints.logout().catch(() => undefined);
      setUser(null);
    }
  }), [isReady, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

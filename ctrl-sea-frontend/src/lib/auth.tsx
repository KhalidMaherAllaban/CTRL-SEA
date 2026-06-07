"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { endpoints } from "@/lib/api";
import type { User } from "@/lib/types";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  isDemo: boolean;
  isReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  enterDemo: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isDemo, setDemo] = useState(false);
  const [isReady, setReady] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("ctrl-sea-token");
    const storedUser = localStorage.getItem("ctrl-sea-user");
    const storedDemo = localStorage.getItem("ctrl-sea-demo") === "true";
    if (storedToken) setToken(storedToken);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("ctrl-sea-token");
        localStorage.removeItem("ctrl-sea-user");
      }
    }
    if (storedDemo && !storedToken) setDemo(true);
    setReady(true);
  }, []);

  const persist = (accessToken: string, nextUser: User) => {
    localStorage.setItem("ctrl-sea-token", accessToken);
    localStorage.setItem("ctrl-sea-user", JSON.stringify(nextUser));
    localStorage.removeItem("ctrl-sea-demo");
    setToken(accessToken);
    setUser(nextUser);
    setDemo(false);
  };

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    isDemo,
    isReady,
    login: async (email, password) => {
      const response = await endpoints.login(email, password);
      persist(response.access_token, response.user);
    },
    register: async (name, email, password) => {
      const response = await endpoints.register(name, email, password);
      persist(response.access_token, response.user);
    },
    enterDemo: () => {
      localStorage.removeItem("ctrl-sea-token");
      localStorage.removeItem("ctrl-sea-user");
      localStorage.setItem("ctrl-sea-demo", "true");
      setToken(null);
      setUser(null);
      setDemo(true);
    },
    logout: () => {
      localStorage.removeItem("ctrl-sea-token");
      localStorage.removeItem("ctrl-sea-user");
      localStorage.removeItem("ctrl-sea-demo");
      setUser(null);
      setToken(null);
      setDemo(false);
    }
  }), [isDemo, isReady, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

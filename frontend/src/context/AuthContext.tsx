import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import type { Role, User } from "../types";

type RegisterInput = {
  name: string;
  email: string;
  password: string;
  role: Exclude<Role, "admin">;
  phone?: string;
  company?: string;
};

type AuthValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
};

const AuthContext = createContext<AuthValue | null>(null);

function persist(token: string, user: User, setUser: (user: User) => void) {
  localStorage.setItem("eventsphere_token", token);
  setUser(user);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("eventsphere_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get<{ user: User }>("/auth/me")
      .then((response) => setUser(response.data.user))
      .catch(() => localStorage.removeItem("eventsphere_token"))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      loading,
      setUser,
      async login(email, password) {
        const response = await api.post<{ token: string; user: User }>("/auth/login", { email, password });
        persist(response.data.token, response.data.user, setUser);
      },
      async register(input) {
        const response = await api.post<{ token: string; user: User }>("/auth/register", input);
        persist(response.data.token, response.data.user, setUser);
      },
      logout() {
        localStorage.removeItem("eventsphere_token");
        setUser(null);
      },
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { api } from "./api";

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("octopus_token");
    const storedUser = localStorage.getItem("octopus_user");
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser) as User);
      } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  const persist = (u: User, t: string) => {
    localStorage.setItem("octopus_token", t);
    localStorage.setItem("octopus_user", JSON.stringify(u));
    setUser(u);
    setToken(t);
  };

  const login = async (email: string, password: string) => {
    const data = await api.post<{ user: User; token: string }>("/auth/login", { email, password });
    persist(data.user, data.token);
  };

  const register = async (name: string, email: string, password: string) => {
    const data = await api.post<{ user: User; token: string }>("/auth/register", { name, email, password });
    persist(data.user, data.token);
  };

  const logout = () => {
    localStorage.removeItem("octopus_token");
    localStorage.removeItem("octopus_user");
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

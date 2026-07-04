import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User { id: number; email: string; name: string; role: string; }
interface AuthCtx {
  user: User | null; token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void; isLoading: boolean;
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx);

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem("octopus_token");
    const u = localStorage.getItem("octopus_user");
    if (t && u) { setToken(t); setUser(JSON.parse(u)); }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Demo accounts — always work without a backend
    const DEMO: Record<string, { password: string; user: User; token: string }> = {
      "admin@octopus.ai": {
        password: "octopus123",
        token: "demo_token_admin",
        user: { id: 1, email: "admin@octopus.ai", name: "Admin", role: "owner" },
      },
    };
    const demo = DEMO[email.toLowerCase()];
    if (demo && demo.password === password) {
      setToken(demo.token); setUser(demo.user);
      localStorage.setItem("octopus_token", demo.token);
      localStorage.setItem("octopus_user", JSON.stringify(demo.user));
      return true;
    }

    // Fallback: try real API if available
    try {
      const res = await fetch(`${BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      setToken(data.token); setUser(data.user);
      localStorage.setItem("octopus_token", data.token);
      localStorage.setItem("octopus_user", JSON.stringify(data.user));
      return true;
    } catch { return false; }
  };

  const logout = () => {
    setToken(null); setUser(null);
    localStorage.removeItem("octopus_token");
    localStorage.removeItem("octopus_user");
  };

  return <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

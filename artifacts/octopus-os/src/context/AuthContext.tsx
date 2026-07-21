import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { API_BASE } from "@/lib/api";

interface User { id: number | string; email: string; name: string; role: string; }
interface AuthCtx {
  user: User | null; token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void; isLoading: boolean;
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx);

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
    // Try real API first
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token); setUser(data.user);
        localStorage.setItem("octopus_token", data.token);
        localStorage.setItem("octopus_user", JSON.stringify(data.user));
        return true;
      }
    } catch (err) {
      console.error("API server call failed:", err);
    }

    return false;
  };

  const logout = () => {
    setToken(null); setUser(null);
    localStorage.removeItem("octopus_token");
    localStorage.removeItem("octopus_user");
  };

  return <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

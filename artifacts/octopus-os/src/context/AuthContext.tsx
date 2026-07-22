import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
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

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("octopus_token");
    localStorage.removeItem("octopus_user");
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener("octopus:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("octopus:unauthorized", handleUnauthorized);
  }, [logout]);

  useEffect(() => {
    const verifySession = async () => {
      const t = localStorage.getItem("octopus_token");
      const u = localStorage.getItem("octopus_user");

      if (!t || !u) {
        setIsLoading(false);
        return;
      }

      try {
        setToken(t);
        setUser(JSON.parse(u));

        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${t}` },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
            localStorage.setItem("octopus_user", JSON.stringify(data.user));
          }
        } else if (res.status === 401) {
          console.warn("Session token expired or invalid, logging out...");
          logout();
        }
      } catch (err) {
        console.error("Session verification offline/error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, [logout]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem("octopus_token", data.token);
        localStorage.setItem("octopus_user", JSON.stringify(data.user));
        return true;
      }
    } catch (err) {
      console.error("API server call failed:", err);
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

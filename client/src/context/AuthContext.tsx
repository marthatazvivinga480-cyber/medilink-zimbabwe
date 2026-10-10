import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { api } from "../services/api";
import { User } from "../types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: Record<string, unknown>) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const revision = useRef(0);
  useEffect(() => {
    const current = revision.current;
    const controller = new AbortController();
    api
      .get<{ user: User }>("/auth/me", { signal: controller.signal })
      .then((response) => {
        if (!controller.signal.aborted && current === revision.current)
          setUser(response.data.user);
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted && current === revision.current)
          setLoading(false);
      });
    return () => controller.abort();
  }, []);

  async function login(email: string, password: string) {
    const current = ++revision.current;
    setLoading(false);
    const { data } = await api.post("/auth/login", { email, password });
    if (current !== revision.current) throw new Error("Sign-in was cancelled.");
    setLoading(false);
    localStorage.setItem("medilink_token", data.token);
    setUser(data.user);
    return data.user;
  }

  async function register(payload: Record<string, unknown>) {
    const current = ++revision.current;
    setLoading(false);
    const { data } = await api.post("/auth/register", payload);
    if (current !== revision.current)
      throw new Error("Registration was cancelled.");
    setLoading(false);
    localStorage.setItem("medilink_token", data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    revision.current++;
    setLoading(false);
    localStorage.removeItem("medilink_token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

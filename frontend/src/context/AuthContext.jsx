import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("gameteca_token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    let vigente = true;
    if (!token) {
      setUser(null);
      setLoading(false);
      return () => { vigente = false; };
    }

    setLoading(true);
    api.profile(token)
      .then(({ usuario }) => {
        if (vigente) setUser(usuario);
      })
      .catch(() => {
        if (vigente) {
          localStorage.removeItem("gameteca_token");
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (vigente) setLoading(false);
      });

    return () => { vigente = false; };
  }, [token]);

  const value = useMemo(() => ({
    token,
    user,
    loading,
    async login(credentials) {
      const result = await api.login(credentials);
      localStorage.setItem("gameteca_token", result.token);
      setToken(result.token);
      setUser(result.usuario);
      return result;
    },
    async register(details) {
      const result = await api.register(details);
      localStorage.setItem("gameteca_token", result.token);
      setToken(result.token);
      setUser(result.usuario);
      return result;
    },
    logout() {
      localStorage.removeItem("gameteca_token");
      setToken(null);
      setUser(null);
    }
  }), [token, user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
}

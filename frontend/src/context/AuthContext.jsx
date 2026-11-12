import { createContext, useContext, useEffect, useState } from "react";
import client from "../api/client";
import { setAppLanguage } from "../i18n";

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = localStorage.getItem("lms_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistSession(nextToken, nextUser) {
  if (nextToken) localStorage.setItem("lms_token", nextToken);
  else localStorage.removeItem("lms_token");

  if (nextUser) localStorage.setItem("lms_user", JSON.stringify(nextUser));
  else localStorage.removeItem("lms_user");
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser());
  const [token, setToken] = useState(() => localStorage.getItem("lms_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setUser(null);
      persistSession(null, null);
      setLoading(false);
      return;
    }
    client
      .get("/auth/me")
      .then((res) => {
        const nextUser = res.data.user;
        setUser(nextUser);
        persistSession(token, nextUser);
        if (nextUser.language) setAppLanguage(nextUser.language);
      })
      .catch(() => {
        setUser(null);
        persistSession(null, null);
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  async function login(email, password) {
    const res = await client.post("/auth/login", { email, password });
    const nextUser = res.data.user;
    persistSession(res.data.token, nextUser);
    setToken(res.data.token);
    setUser(nextUser);
    if (nextUser.language) setAppLanguage(nextUser.language);
    return nextUser;
  }

  async function register(payload) {
    const res = await client.post("/auth/register", payload);
    const nextUser = res.data.user;
    persistSession(res.data.token, nextUser);
    setToken(res.data.token);
    setUser(nextUser);
    return nextUser;
  }

  function logout() {
    persistSession(null, null);
    setToken(null);
    setUser(null);
  }

  async function updateLanguage(lang) {
    setAppLanguage(lang);
    if (user) {
      try {
        await client.patch("/auth/language", { language: lang });
      } catch (e) {
        // non-fatal — UI already switched language locally
      }
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateLanguage }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

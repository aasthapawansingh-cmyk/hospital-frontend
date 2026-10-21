import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/api";

const AuthContext = createContext({ user: null, loading: true, reload: async () => {}, logout: async () => null });
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  async function reload() {
    if (!localStorage.getItem("token")) { setUser(null); setLoading(false); return; }
    setLoading(true);
    try { const response = await api.get("/auth/me"); setUser(response.data); }
    catch { localStorage.removeItem("token"); localStorage.removeItem("refreshToken"); setUser(null); }
    finally { setLoading(false); }
  }
  async function logout() {
    const token = localStorage.getItem("token");
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    setUser(null);
    setLoading(false);
    if (!token) return null;
    try {
      await api.post("/auth/logout", {}, { headers: { Authorization: `Bearer ${token}` } });
      return null;
    } catch {
      return "Your device was signed out, but the server could not revoke the refresh session. Please sign in again.";
    }
  }
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { reload(); }, []);
  return <AuthContext.Provider value={{ user, loading, reload, logout }}>{children}</AuthContext.Provider>;
}
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

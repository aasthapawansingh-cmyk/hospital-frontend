import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/api";

const AuthContext = createContext({ user: null, loading: true, logoutError: "", reload: async () => {}, logout: () => {} });
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logoutError, setLogoutError] = useState("");
  async function reload() {
    setLogoutError("");
    if (!localStorage.getItem("token")) { setUser(null); setLoading(false); return; }
    setLoading(true);
    try {
      const response = await api.get("/auth/me");
      setUser(response.data);
      return response.data;
    } catch (error) {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      setUser(null);
      throw error;
    }
    finally { setLoading(false); }
  }
  function logout() {
    const token = localStorage.getItem("token");
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    sessionStorage.removeItem("user");
    setUser(null);
    setLoading(false);
    setLogoutError("");
    if (!token) return;
    api.post("/auth/logout", {}, { headers: { Authorization: `Bearer ${token}` } }).catch((error) => {
      const message = error.response?.status === 404
        ? "You are signed out on this device, but the server does not support refresh-session revocation yet."
        : "You are signed out on this device, but the server could not revoke the refresh session.";
      setLogoutError(message);
    });
  }
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { reload().catch(() => {}); }, []);
  return <AuthContext.Provider value={{ user, loading, logoutError, reload, logout }}>{children}</AuthContext.Provider>;
}
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

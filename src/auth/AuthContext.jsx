import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/api";

const AuthContext = createContext({ user: null, loading: true, reload: async () => {} });
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
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { reload(); }, []);
  return <AuthContext.Provider value={{ user, loading, reload }}>{children}</AuthContext.Provider>;
}
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

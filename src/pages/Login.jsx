import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import "../style.css";
import { useAuth } from "../auth/AuthContext";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [workspace, setWorkspace] = useState("PATIENT");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { reload, logout, logoutError } = useAuth();

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        username,
        password,
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("refreshToken", response.data.refreshToken);
      const identity = await reload();
      if (!identity?.roles?.includes(workspace)) {
        logout();
        setError(`This account is not enabled for the ${workspace.toLowerCase()} workspace. Select the correct workspace or contact hospital administration.`);
        return;
      }
      navigate("/dashboard");
    } catch (loginError) {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      if (!loginError.response) {
        setError("Cannot reach the login server. Check that the backend is running and your API URL is correct.");
      } else if (loginError.response.status === 401 || loginError.response.status === 403) {
        setError("Invalid username or password.");
      } else if (loginError.config?.url?.endsWith("/auth/me")) {
        setError("Login succeeded, but your account details could not be loaded. Please try again.");
      } else {
        setError("The login server returned an error. Check the backend logs and database connection.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleLogin}>
        <div className="brand-mark login-mark">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20s-7-4.6-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.4-7 10-7 10z" />
            <path d="M7 11h2l1.5-2.5L13 13l1.5-2H17" />
          </svg>
        </div>

        <h1>CareSync</h1>
        <p>Choose your workspace. Access is determined by your hospital account.</p>

        <div className="login-workspaces" role="group" aria-label="Select workspace">
          {[ ["PATIENT", "Patient"], ["DOCTOR", "Doctor"], ["ADMIN", "Admin"] ].map(([role, label]) => <button key={role} type="button" className={workspace === role ? "selected" : ""} aria-pressed={workspace === role} onClick={() => setWorkspace(role)}>{label}</button>)}
        </div>

        <label htmlFor="username">Username</label>
        <input
          id="username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
        />

        {error && <div className="error">{error}</div>}
        {logoutError && <div className="error" role="alert">{logoutError}</div>}

        <button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}

export default Login;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import "../style.css";

function Login() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    try {
      const response = await api.post("/auth/login", {
        username,
        password,
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("refreshToken", response.data.refreshToken);

      navigate("/dashboard");
    } catch (err) {
      setError("Invalid username or password");
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleLogin}>
        <h1>CareSync</h1>
        <p>Sign in to continue</p>

        <label>Username</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="admin"
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="admin123"
        />

        {error && <div className="error">{error}</div>}

        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;

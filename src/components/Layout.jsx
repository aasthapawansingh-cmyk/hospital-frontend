import { Link, useNavigate } from "react-router-dom";

function Layout({ children }) {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    navigate("/login");
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <h2>Hospital</h2>

        <nav>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/patients">Patients</Link>
          <Link to="/doctors">Doctors</Link>
          <Link to="/appointments">Appointments</Link>
        </nav>

        <button onClick={handleLogout}>Logout</button>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
}

export default Layout;
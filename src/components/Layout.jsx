import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // ⬇ If your old Layout had its own logout code, paste it here instead
  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const role = user?.roles?.[0] || "PATIENT";
  const links = [
    ["/dashboard", "Dashboard"],
    ["/appointments", "Appointments"],
    ...(role === "ADMIN" ? [["/patients", "Patients"], ["/doctors", "Doctors"], ["/users", "Users"]] : []),
  ];

  return (
    <div className="app">
      <aside className="side">
        <div className="brand">
          <div className="brand-mark">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20s-7-4.6-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.4-7 10-7 10z" />
            </svg>
          </div>
          <h2>CareSync</h2>
          <small>{role.toLowerCase()} workspace</small>
        </div>

        <nav className="nav">
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} className={({ isActive }) => (isActive ? "active" : "")}>
              {label}
            </NavLink>
          ))}
        </nav>

        <button type="button" className="logout" onClick={handleLogout}>Log out</button>
      </aside>

      <main>{children}</main>
    </div>
  );
}

export default Layout;

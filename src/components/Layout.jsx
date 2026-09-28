import { NavLink, useNavigate } from "react-router-dom";

function Layout({ children }) {
  const navigate = useNavigate();

  // ⬇ If your old Layout had its own logout code, paste it here instead
  const handleLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  navigate("/login");
};

  const links = [
    ["/dashboard", "Dashboard"],
    ["/patients", "Patients"],
    ["/doctors", "Doctors"],
    ["/appointments", "Appointments"],
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
        </div>

        <nav className="nav">
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} className={({ isActive }) => (isActive ? "active" : "")}>
              {label}
            </NavLink>
          ))}
        </nav>

        <button className="logout" onClick={handleLogout}>Log out</button>
      </aside>

      <main>{children}</main>
    </div>
  );
}

export default Layout;
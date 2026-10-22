import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import Layout from "../components/Layout";
import { useAuth } from "../auth/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const role = user?.roles?.includes("ADMIN") ? "ADMIN" : user?.roles?.includes("DOCTOR") ? "DOCTOR" : "PATIENT";
  const [appointments, setAppointments] = useState([]);
  const [counts, setCounts] = useState({ patients: 0, doctors: 0 });
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const a = await api.get("/api/v1/appointment");
        setAppointments(a.data);
        if (role === "ADMIN") {
          const [p, d] = await Promise.all([api.get("/api/v1/patient"), api.get("/api/v1/doctor")]);
          setCounts({ patients: p.data.totalElements ?? p.data.length ?? 0, doctors: d.data.length ?? 0 });
        } else if (role === "PATIENT") {
          setProfile((await api.get("/api/v1/patient/me")).data);
        }
      } catch {
        setError(role === "PATIENT" ? "Could not load your profile or appointments. Ask staff to link your patient account if this is a new login." : "Could not load your dashboard. Try again.");
      } finally { setLoading(false); }
    })();
  }, [role]);

  const title = role === "ADMIN" ? "Hospital overview" : role === "DOCTOR" ? "Clinical workspace" : "Your care";
  return <Layout><section className="page">
    <header className="page-header"><div><h1>{title}</h1><p>Welcome, {user?.username}.</p></div></header>
    {error && <p className="error-message" role="alert">{error}</p>}
    {loading ? <div className="screen-state">Loading your dashboard…</div> : <>
      {role === "PATIENT" && profile && <article className="table-card patient-profile"><h2>Your profile</h2><dl>
        <div><dt>Name</dt><dd>{profile.name}</dd></div><div><dt>Age</dt><dd>{profile.age}</dd></div>
        <div><dt>Gender</dt><dd>{profile.gender}</dd></div><div><dt>Contact</dt><dd>{profile.contact}</dd></div>
        <div className="profile-address"><dt>Address</dt><dd>{profile.address || "Not provided"}</dd></div>
      </dl></article>}
      <div className="stats">
        {role === "ADMIN" && <><article className="card"><div className="stat-label">Patients</div><strong className="stat-num">{counts.patients}</strong></article><article className="card"><div className="stat-label">Doctors</div><strong className="stat-num">{counts.doctors}</strong></article></>}
        <article className="card"><div className="stat-label">{role === "PATIENT" ? "Your appointments" : role === "DOCTOR" ? "Assigned appointments" : "Appointment requests"}</div><strong className="stat-num">{appointments.length}</strong></article>
      </div>
      {role === "ADMIN" && <nav className="admin-quick-actions" aria-label="Administration shortcuts">
        <button type="button" onClick={() => navigate("/patients")}>Manage patients</button>
        <button type="button" onClick={() => navigate("/doctors")}>Manage doctors</button>
        <button type="button" onClick={() => navigate("/users")}>Create login accounts</button>
        <button type="button" onClick={() => navigate("/appointments")}>Review and schedule appointments</button>
      </nav>}
      <div className="table-card"><div className="page-header"><h2>{role === "ADMIN" ? "Recent requests" : "Recent appointments"}</h2><button type="button" onClick={() => navigate("/appointments")}>{role === "PATIENT" ? "Request appointment" : "View appointments"}</button></div>
        {appointments.length ? <ul className="appointment-list">{appointments.slice(0, 5).map(a => <li key={a.id}><div><strong>{a.patient?.name || "Your visit"}</strong><span>{a.date} · {a.time}</span></div><span className={`status status-${a.status.toLowerCase()}`}>{a.status.replace("_", " ")}</span></li>)}</ul> : <div className="empty-state">{role === "PATIENT" ? "No visits yet. Request an appointment when you are ready." : "No appointments yet."}</div>}
      </div>
    </>}</section></Layout>;
}

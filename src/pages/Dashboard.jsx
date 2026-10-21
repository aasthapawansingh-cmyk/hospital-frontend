import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import Layout from "../components/Layout";
import { useAuth } from "../auth/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const role = user?.roles?.[0] || "PATIENT";
  const [appointments, setAppointments] = useState([]);
  const [counts, setCounts] = useState({ patients: 0, doctors: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  useEffect(() => { (async () => { try {
    const a = await api.get("/api/v1/appointment"); setAppointments(a.data);
    if (role === "ADMIN") { const [p,d] = await Promise.all([api.get("/api/v1/patient"),api.get("/api/v1/doctor")]); setCounts({patients:p.data.totalElements ?? p.data.length ?? 0,doctors:d.data.length ?? 0}); }
  } catch { setError("We couldn’t load your dashboard. Try again."); } finally { setLoading(false); } })(); }, [role]);
  const title = role === "ADMIN" ? "Hospital overview" : role === "DOCTOR" ? "Clinical workspace" : "Your care";
  return <Layout><section className="page"><header className="page-header"><div><h1>{title}</h1><p>Welcome, {user?.username}.</p></div></header>
    {error && <p className="error-message" role="alert">{error}</p>}{loading ? <div className="screen-state">Loading your appointments…</div> : <>
      <div className="stats">{role === "ADMIN" && <><article className="card"><div className="stat-label">Patients</div><strong className="stat-num">{counts.patients}</strong></article><article className="card"><div className="stat-label">Doctors</div><strong className="stat-num">{counts.doctors}</strong></article></>}<article className="card"><div className="stat-label">{role === "PATIENT" ? "Your appointments" : "Appointments in your care"}</div><strong className="stat-num">{appointments.length}</strong></article></div>
      <div className="table-card"><div className="page-header"><h2>Recent appointments</h2><button onClick={()=>navigate("/appointments")}>View appointments</button></div>{appointments.length ? <ul className="appointment-list">{appointments.slice(0,5).map(a=><li key={a.id}><div><strong>{a.patient?.name || "Your visit"}</strong><span>{a.date} · {a.time}</span></div><span className={`status status-${a.status.toLowerCase()}`}>{a.status.replace("_"," ")}</span></li>)}</ul> : <div className="empty-state">No appointments yet.</div>}</div>
    </>}</section></Layout>;
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import Layout from "../components/Layout";
import HeroSlider from "../components/HeroSlider";

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    patients: 0,
    doctors: 0,
    appointments: 0,
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function fetchStats() {
      try {
        const [patientsResponse, doctorsResponse, appointmentsResponse] =
          await Promise.all([
            api.get("/api/v1/patient"),
            api.get("/api/v1/doctor"),
            api.get("/api/v1/appointment"),
          ]);

        setStats({
          patients:
            patientsResponse.data.content?.length || patientsResponse.data.length || 0,
          doctors: doctorsResponse.data.length || 0,
          appointments: appointmentsResponse.data.length || 0,
        });
      } catch (error) {
        setMessage("Could not load dashboard summary");
      }
    }

    fetchStats();
  }, []);

  return (
    <Layout>
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-sub">Hospital management overview</p>
      </div>

      {message && <p className="error-message">{message}</p>}

      <HeroSlider onNavigate={navigate} />

      <section className="stats">
        <div className="card stat-main">
          <div className="stat-label">Total patients</div>
          <div className="stat-num">{stats.patients}</div>
        </div>

        <div className={`card ${stats.doctors === 0 ? "stat-empty" : ""}`}>
          <div className="stat-label">Total doctors</div>
          <div className="stat-num">{stats.doctors}</div>
          {stats.doctors === 0 && (
            <>
              <p>No doctors yet. Add one to start booking.</p>
              <button className="btn" onClick={() => navigate("/doctors")}>
                Add doctor
              </button>
            </>
          )}
        </div>

        <div className={`card ${stats.appointments === 0 ? "stat-empty" : ""}`}>
          <div className="stat-label">Total appointments</div>
          <div className="stat-num">{stats.appointments}</div>
          {stats.appointments === 0 && (
            <>
              <p>Nothing booked yet.</p>
              <button className="btn" onClick={() => navigate("/appointments")}>
                Book appointment
              </button>
            </>
          )}
        </div>
      </section>
    </Layout>
  );
}

export default Dashboard;
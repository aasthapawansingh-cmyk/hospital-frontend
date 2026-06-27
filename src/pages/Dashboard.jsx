import { useEffect, useState } from "react";
import api from "../api/api";
import Layout from "../components/Layout";

function Dashboard() {
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
      <div className="page">
        <div className="page-header">
          <div>
            <h1>Dashboard</h1>
            <p>Hospital management overview</p>
          </div>
        </div>

        {message && <p className="message error-message">{message}</p>}

        <div className="stats-grid">
          <div className="stat-card">
            <span>Total Patients</span>
            <strong>{stats.patients}</strong>
          </div>

          <div className="stat-card">
            <span>Total Doctors</span>
            <strong>{stats.doctors}</strong>
          </div>

          <div className="stat-card">
            <span>Total Appointments</span>
            <strong>{stats.appointments}</strong>
          </div>
        </div>

        <div className="table-card">
          <h2>Quick Start</h2>
          <p>
            Use the sidebar to manage patients, doctors, and appointment
            bookings.
          </p>
        </div>
      </div>
    </Layout>
  );
}

export default Dashboard;

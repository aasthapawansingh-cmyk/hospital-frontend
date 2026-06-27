import { useEffect, useState } from "react";
import api from "../api/api";
import Layout from "../components/Layout";
import { getErrorMessage } from "../utils/errors";

function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({
    date: "",
    time: "",
    patientId: "",
    doctorId: "",
    status: "PENDING",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function fetchAppointments() {
    setLoading(true);
    try {
      const response = await api.get("/api/v1/appointment");
      setAppointments(response.data);
    } catch (error) {
      setMessage(getErrorMessage(error, "Could not load appointments"));
    } finally {
      setLoading(false);
    }
  }

  async function fetchPatientsAndDoctors() {
    try {
      const patientsResponse = await api.get("/api/v1/patient");
      const doctorsResponse = await api.get("/api/v1/doctor");

      setPatients(patientsResponse.data.content || patientsResponse.data);
      setDoctors(doctorsResponse.data);
    } catch (error) {
      setMessage(getErrorMessage(error, "Could not load patients or doctors"));
    }
  }

  useEffect(() => {
    fetchAppointments();
    fetchPatientsAndDoctors();
  }, []);

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    try {
      await api.post("/api/v1/appointment", {
        date: form.date,
        time: form.time,
        patientId: Number(form.patientId),
        doctorId: Number(form.doctorId),
        status: form.status,
      });

      setForm({
        date: "",
        time: "",
        patientId: "",
        doctorId: "",
        status: "PENDING",
      });

      setMessage("Appointment added successfully");
      fetchAppointments();
    } catch (error) {
      setMessage(
        getErrorMessage(
          error,
          "Could not add appointment. Check if this doctor is already booked."
        )
      );
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/api/v1/appointment/${id}`);
      setMessage("Appointment deleted successfully");
      fetchAppointments();
    } catch (error) {
      setMessage(getErrorMessage(error, "Could not delete appointment"));
    }
  }

  return (
    <Layout>
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Appointments</h1>
          <p>Book and manage appointments</p>
        </div>
      </div>

      <form className="form-card" onSubmit={handleSubmit}>
        <h2>Add Appointment</h2>

        <input
          name="date"
          value={form.date}
          onChange={handleChange}
          type="date"
        />

        <input
          name="time"
          value={form.time}
          onChange={handleChange}
          type="time"
        />

        <select
          name="patientId"
          value={form.patientId}
          onChange={handleChange}
        >
          <option value="">Select patient</option>
          {patients.map((patient) => (
            <option key={patient.id} value={patient.id}>
              {patient.name}
            </option>
          ))}
        </select>

        <select name="doctorId" value={form.doctorId} onChange={handleChange}>
          <option value="">Select doctor</option>
          {doctors.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>
              {doctor.name} - {doctor.specialization}
            </option>
          ))}
        </select>

        <select name="status" value={form.status} onChange={handleChange}>
          <option value="PENDING">PENDING</option>
          <option value="CONFIRMED">CONFIRMED</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>

        <button type="submit">Add Appointment</button>
      </form>

      {message && <p className="message">{message}</p>}

      <div className="table-card">
        <h2>Appointment List</h2>

        {loading && <p>Loading appointments...</p>}

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {appointments.map((appointment) => (
              <tr key={appointment.id}>
                <td>{appointment.id}</td>
                <td>{appointment.date}</td>
                <td>{appointment.time}</td>
                <td>{appointment.status}</td>
                <td>{appointment.patient?.name || "N/A"}</td>
                <td>{appointment.doctor?.name || "N/A"}</td>
                <td>
                  <button
                    className="danger-button"
                    onClick={() => handleDelete(appointment.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {appointments.length === 0 && <p>No appointments found.</p>}
      </div>
    </div>
    </Layout>
  );
}

export default Appointments;

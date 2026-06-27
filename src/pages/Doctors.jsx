import { useEffect, useState } from "react";
import api from "../api/api";
import Layout from "../components/Layout";
import { getErrorMessage } from "../utils/errors";

function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({
    name: "",
    specialization: "",
    contact: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function fetchDoctors() {
    setLoading(true);
    try {
      const response = await api.get("/api/v1/doctor");
      setDoctors(response.data);
    } catch (error) {
      setMessage(getErrorMessage(error, "Could not load doctors"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDoctors();
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
      await api.post("/api/v1/doctor", form);

      setForm({
        name: "",
        specialization: "",
        contact: "",
      });

      setMessage("Doctor added successfully");
      fetchDoctors();
    } catch (error) {
      setMessage(getErrorMessage(error, "Could not add doctor"));
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/api/v1/doctor/${id}`);
      setMessage("Doctor deleted successfully");
      fetchDoctors();
    } catch (error) {
      setMessage(getErrorMessage(error, "Could not delete doctor"));
    }
  }

  return (
    <Layout>
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Doctors</h1>
          <p>Manage doctor records</p>
        </div>
      </div>

      <form className="form-card" onSubmit={handleSubmit}>
        <h2>Add Doctor</h2>

        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Doctor name"
        />

        <input
          name="specialization"
          value={form.specialization}
          onChange={handleChange}
          placeholder="Specialization"
        />

        <input
          name="contact"
          value={form.contact}
          onChange={handleChange}
          placeholder="Contact"
        />

        <button type="submit">Add Doctor</button>
      </form>

      {message && <p className="message">{message}</p>}

      <div className="table-card">
        <h2>Doctor List</h2>

        {loading && <p>Loading doctors...</p>}

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Specialization</th>
              <th>Contact</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {doctors.map((doctor) => (
              <tr key={doctor.id}>
                <td>{doctor.id}</td>
                <td>{doctor.name}</td>
                <td>{doctor.specialization}</td>
                <td>{doctor.contact}</td>
                <td>
                  <button
                    className="danger-button"
                    onClick={() => handleDelete(doctor.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {doctors.length === 0 && <p>No doctors found.</p>}
      </div>
    </div>
    </Layout>
  );
}

export default Doctors;

import { useEffect, useState } from "react";
import api from "../api/api";
import Layout from "../components/Layout";
import { getErrorMessage } from "../utils/errors";

function Patients() {
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "",
    contact: "",
    address: "",
    accountUsername: "",
  });
  const [message, setMessage] = useState("");
  const [editingPatientId, setEditingPatientId] = useState(null);
  const [loading, setLoading] = useState(false);

  function handleEdit(patient) {
    setEditingPatientId(patient.id);

    setForm({
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      contact: patient.contact,
      address: patient.address,
      accountUsername: patient.accountUsername || "",
    });

    setMessage("");
  }

  function resetForm() {
    setForm({
      name: "",
      age: "",
      gender: "",
      contact: "",
      address: "",
      accountUsername: "",
    });
    setEditingPatientId(null);
  }

  async function fetchPatients() {
    setLoading(true);
    try {
      const response = await api.get("/api/v1/patient");
      setPatients(response.data.content || response.data);
    } catch (error) {
      setMessage(getErrorMessage(error, "Could not load patients"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPatients();
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
      if (editingPatientId) {
        await api.put(`/api/v1/patient/${editingPatientId}`, {
          ...form,
          age: Number(form.age),
          contact: form.contact.trim() || null,
          accountUsername: form.accountUsername.trim() || null,
        });

        setMessage("Patient updated successfully");
      } else {
        await api.post("/api/v1/patient", {
          ...form,
          age: Number(form.age),
          contact: form.contact.trim() || null,
          accountUsername: form.accountUsername.trim() || null,
        });

        setMessage("Patient added successfully");
      }

      resetForm();
      fetchPatients();
    } catch (error) {
      setMessage(getErrorMessage(error, "Could not save patient"));
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/api/v1/patient/${id}`);
      setMessage("Patient archived. Existing appointment history has been preserved.");
      fetchPatients();
    } catch (error) {
      setMessage(getErrorMessage(error, "Could not delete patient"));
    }
  }

  return (
    <Layout>
      <div className="page">
        <div className="page-header">
          <div>
            <h1>Patients</h1>
            <p>Manage patient records</p>
          </div>
        </div>

        <form className="form-card" onSubmit={handleSubmit}>
          <h2>{editingPatientId ? "Edit Patient" : "Add Patient"}</h2>

          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Patient name"
            required
          />

          <input
            name="age"
            value={form.age}
            onChange={handleChange}
            placeholder="Age"
            type="number"
            min="1"
            required
          />

          <input
            name="gender"
            value={form.gender}
            onChange={handleChange}
            placeholder="Gender"
            required
          />

          <input
            name="contact"
            value={form.contact}
            onChange={handleChange}
            placeholder="10 digit contact"
            inputMode="numeric"
            pattern="[0-9]{10}"
            title="Enter exactly 10 digits"
          />

          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Address"
          />
          <input name="accountUsername" value={form.accountUsername} onChange={handleChange} placeholder="Linked account username" />

          <div className="button-row">
            <button type="submit">
              {editingPatientId ? "Update Patient" : "Add Patient"}
            </button>

            {editingPatientId && (
              <button
                type="button"
                className="secondary-button"
                onClick={resetForm}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>

        {message && <p className="message">{message}</p>}

        <div className="table-card">
          <h2>Patient List</h2>

          {loading && <p>Loading patients...</p>}

          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Age</th>
                <th>Gender</th>
                <th>Contact</th>
                <th>Address</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {patients.map((patient) => (
                <tr key={patient.id}>
                  <td>{patient.id}</td>
                  <td>{patient.name}</td>
                  <td>{patient.age}</td>
                  <td>{patient.gender}</td>
                  <td>{patient.contact}</td>
                  <td>{patient.address}</td>
                  <td>
                    <div className="table-actions">
                      <button onClick={() => handleEdit(patient)}>Edit</button>
                      <button
                        className="danger-button"
                        onClick={() => handleDelete(patient.id)}
                        type="button"
                      >
                        Archive
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {patients.length === 0 && <p>No patients found.</p>}
        </div>
      </div>
    </Layout>
  );
}

export default Patients;

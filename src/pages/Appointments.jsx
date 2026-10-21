import { useCallback, useEffect, useState } from "react";
import api from "../api/api";
import Layout from "../components/Layout";
import { useAuth } from "../auth/AuthContext";

const statuses = ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED"];
const responseError = (error, fallback) => typeof error.response?.data === "string"
  ? error.response.data
  : error.response?.data?.message || fallback;

export default function Appointments() {
  const { user } = useAuth();
  const role = user?.roles?.includes("ADMIN") ? "ADMIN" : user?.roles?.includes("DOCTOR") ? "DOCTOR" : "PATIENT";
  const [items, setItems] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({ date: "", time: "", patientId: "", doctorId: "", reason: "" });
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try { setItems((await api.get("/api/v1/appointment")).data); }
    catch (e) { setError(e.response?.status === 403 ? "You do not have access to these appointments." : "Could not load appointments. Try again."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    if (role === "ADMIN") {
      setOptionsLoading(true);
      api.get("/api/v1/patient")
        .then((response) => setPatients(response.data.content || response.data))
        .catch(() => setError("Could not load patient options."))
        .finally(() => setOptionsLoading(false));
    }
  }, [load, role]);

  async function updateAvailability(nextForm) {
    if (!nextForm.date || !nextForm.time) { setDoctors([]); return; }
    setBookingLoading(true);
    try {
      const query = new URLSearchParams({ date: nextForm.date, time: nextForm.time });
      setDoctors((await api.get(`/api/v1/doctor/available?${query}`)).data);
    } catch { setError("Could not load available doctors for that time."); }
    finally { setBookingLoading(false); }
  }

  function changeDateTime(field, value) {
    const next = { ...form, [field]: value, doctorId: "" };
    setForm(next);
    setNotice("");
    updateAvailability(next);
  }

  async function create(e) {
    e.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      if (role === "PATIENT") {
        await api.post("/api/v1/appointment/request", {
          date: form.date, time: form.time, doctorId: Number(form.doctorId), reason: form.reason,
        });
        setNotice("Appointment request sent. It will appear as pending until staff confirms it.");
      } else {
        await api.post("/api/v1/appointment", {
          date: form.date, time: form.time, patientId: Number(form.patientId),
          doctorId: Number(form.doctorId), reason: form.reason, status: "PENDING",
        });
        setNotice("Appointment scheduled as a pending request.");
      }
      setForm({ date: "", time: "", patientId: "", doctorId: "", reason: "" });
      setDoctors([]);
      await load();
    } catch (e) { setError(responseError(e, "Could not save the appointment request.")); }
    finally { setSaving(false); }
  }

  async function transition(appointment, status) {
    setError(""); setNotice("");
    try {
      await api.patch(`/api/v1/appointment/${appointment.id}/status`, { status });
      setNotice(status === "CANCELLED" ? "Appointment cancelled." : `Appointment marked ${status.toLowerCase().replace("_", " ")}.`);
      await load();
    } catch (e) { setError(responseError(e, "That status change was not allowed.")); }
  }

  function actionsFor(appointment) {
    if (role === "ADMIN") return appointment.status === "PENDING"
      ? [["CONFIRMED", "Confirm"], ["CANCELLED", "Cancel"]]
      : appointment.status === "CONFIRMED" ? [["CANCELLED", "Cancel"]] : [];
    if (role === "DOCTOR") return appointment.status === "CONFIRMED"
      ? [["IN_PROGRESS", "Start visit"]]
      : appointment.status === "IN_PROGRESS" ? [["COMPLETED", "Complete visit"]] : [];
    return appointment.status === "PENDING" ? [["CANCELLED", "Cancel request"]] : [];
  }

  return <Layout><section className="page">
    <header className="page-header"><div><h1>{role === "PATIENT" ? "Your appointments" : role === "DOCTOR" ? "Assigned appointments" : "Appointment requests"}</h1><p>{role === "PATIENT" ? "Request a visit and track its progress." : role === "DOCTOR" ? "Only visits assigned to your clinician account are shown." : "Schedule, confirm, and manage appointment requests."}</p></div></header>
    {error && <p className="error-message" role="alert">{error}</p>}
    {notice && <p className="message" role="status">{notice}</p>}

    {(role === "ADMIN" || role === "PATIENT") && <form className="form-card booking-form" onSubmit={create}>
      <h2>{role === "PATIENT" ? "Request an appointment" : "Schedule an appointment"}</h2>
      {role === "ADMIN" && <select aria-label="Patient" required value={form.patientId} onChange={e => setForm({ ...form, patientId: e.target.value })} disabled={optionsLoading || !patients.length}><option value="">{optionsLoading ? "Loading patients…" : patients.length ? "Choose patient" : "No patient records available"}</option>{patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>}
      <input type="date" aria-label="Appointment date" required value={form.date} onChange={e => changeDateTime("date", e.target.value)} />
      <input type="time" aria-label="Appointment time" required value={form.time} onChange={e => changeDateTime("time", e.target.value)} />
      <select aria-label="Doctor" required value={form.doctorId} onChange={e => setForm({ ...form, doctorId: e.target.value })} disabled={bookingLoading || !form.date || !form.time}>
        <option value="">{bookingLoading ? "Checking availability…" : !form.date || !form.time ? "Choose a date and time first" : doctors.length ? "Choose available doctor" : "No doctor available at this time"}</option>
        {doctors.map(d => <option key={d.id} value={d.id}>{d.name} · {d.specialization}</option>)}
      </select>
      <textarea aria-label="Reason for appointment" placeholder="Reason for appointment" required maxLength={1000} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
      <button disabled={saving || bookingLoading}>{saving ? "Saving…" : role === "PATIENT" ? "Send request" : "Schedule as pending"}</button>
    </form>}

    <div className="table-card"><h2>{role === "ADMIN" ? "All requests and appointments" : role === "DOCTOR" ? "Your assigned visits" : "Your visit history"}</h2>
      {loading ? <div className="screen-state">Loading appointments…</div> : !items.length ? <div className="empty-state">{role === "PATIENT" ? "You have not requested an appointment yet." : "No appointments to show."}</div> :
        <div className="appointment-list">{items.map(a => <article className="appointment-card" key={a.id}>
          <div className="appointment-heading"><div><h3>{a.patient?.name || "Your appointment"}</h3><p>{a.date} at {a.time} · {a.doctor?.name || "Care team"}</p></div><span className={`status status-${a.status.toLowerCase()}`}>{a.status.replace("_", " ")}</span></div>
          <p><strong>Reason:</strong> {a.reason || "Not provided"}</p>
          {role !== "PATIENT" && a.patient && <p className="patient-detail">Patient details: {a.patient.age} years · {a.patient.gender} · {a.patient.contact}</p>}
          {a.status === "CANCELLED" ? <p className="legacy-status">This appointment was cancelled and is kept in the record.</p> : <ol className="timeline">{statuses.map((status, index) => {
            const reached = statuses.indexOf(a.status);
            const history = a.statusHistory?.find(h => h.toStatus === status);
            return <li className={reached >= index ? "done" : ""} key={status}><span>{status.replace("_", " ")}</span>{history && <small>{history.actorUsername} · {new Date(history.changedAt).toLocaleString()}</small>}</li>;
          })}</ol>}
          <div className="table-actions">{actionsFor(a).map(([status, label]) => <button type="button" className={status === "CANCELLED" ? "danger-button" : ""} key={status} onClick={() => transition(a, status)}>{label}</button>)}</div>
        </article>)}</div>}
    </div>
  </section></Layout>;
}

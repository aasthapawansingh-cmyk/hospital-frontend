import { useCallback, useEffect, useRef, useState } from "react";
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
  const [availabilityCheckedFor, setAvailabilityCheckedFor] = useState("");
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [rescheduling, setRescheduling] = useState(null);
  const [aiDrafts, setAiDrafts] = useState({});
  const availabilityRequestId = useRef(0);
  const slotKey = form.date && form.time ? `${form.date}|${form.time}` : "";

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

  async function checkAvailability() {
    if (!form.date || !form.time) return;
    const checkedKey = `${form.date}|${form.time}`;
    const requestId = ++availabilityRequestId.current;
    setDoctors([]);
    setAvailabilityCheckedFor("");
    setError("");
    setBookingLoading(true);
    try {
      const query = new URLSearchParams({ date: form.date, time: form.time });
      const response = await api.get(`/api/v1/doctor/available?${query}`);
      if (requestId === availabilityRequestId.current) {
        setDoctors(response.data);
        setAvailabilityCheckedFor(checkedKey);
      }
    } catch {
      if (requestId === availabilityRequestId.current) setError("Could not check availability. Please try again.");
    } finally {
      if (requestId === availabilityRequestId.current) setBookingLoading(false);
    }
  }

  function changeDateTime(field, value) {
    availabilityRequestId.current += 1;
    const next = { ...form, [field]: value, doctorId: "" };
    setForm(next);
    setNotice("");
    setError("");
    setDoctors([]);
    setAvailabilityCheckedFor("");
    setBookingLoading(false);
  }

  async function create(e) {
    e.preventDefault();
    if (availabilityCheckedFor !== slotKey || !doctors.some((doctor) => String(doctor.id) === form.doctorId)) {
      setError("Check availability and select a doctor available for that exact date and time.");
      return;
    }
    setSaving(true); setError(""); setNotice("");
    try {
      if (role === "PATIENT") {
        await api.post("/api/v1/appointment/request", {
          date: form.date, time: form.time, doctorId: Number(form.doctorId), reason: form.reason,
        });
        setNotice("Request submitted as Pending. A doctor or admin must confirm it before the appointment is confirmed.");
      } else {
        await api.post("/api/v1/appointment", {
          date: form.date, time: form.time, patientId: Number(form.patientId),
          doctorId: Number(form.doctorId), reason: form.reason, status: "PENDING",
        });
        setNotice("Appointment scheduled as a pending request.");
      }
      setForm({ date: "", time: "", patientId: "", doctorId: "", reason: "" });
      setDoctors([]);
      setAvailabilityCheckedFor("");
      await load();
    } catch (e) {
      setError(e.response?.status === 409
        ? "That slot was just taken by another request. Check availability again or choose another date and time."
        : responseError(e, "Could not save the appointment request."));
    }
    finally { setSaving(false); }
  }

  async function transition(appointment, status) {
    setError(""); setNotice("");
    const requiresReason = (status === "CANCELLED" && role !== "PATIENT") || (role === "ADMIN" && ["IN_PROGRESS", "COMPLETED"].includes(status));
    const reason = requiresReason ? window.prompt(status === "CANCELLED" ? "Reason for cancelling this appointment:" : "Administrative correction reason:") : "";
    if (requiresReason && !reason?.trim()) return;
    try {
      await api.patch(`/api/v1/appointment/${appointment.id}/status`, { status, reason: reason?.trim() || null });
      setNotice(status === "CANCELLED" ? "Appointment cancelled." : `Appointment marked ${status.toLowerCase().replace("_", " ")}.`);
      await load();
    } catch (e) { setError(responseError(e, "That status change was not allowed.")); }
  }

  function updateAiDraft(appointmentId, updates) {
    setAiDrafts(current => ({
      ...current,
      [appointmentId]: { ...(current[appointmentId] || { notes: "", draft: "", error: "", loading: false }), ...updates },
    }));
  }

  async function generateAiDraft(appointmentId) {
    const current = aiDrafts[appointmentId] || { notes: "" };
    if (!current.notes?.trim()) {
      updateAiDraft(appointmentId, { error: "Enter clinician notes before generating a draft." });
      return;
    }
    updateAiDraft(appointmentId, { loading: true, error: "", draft: "" });
    try {
      const response = await api.post(`/api/v1/appointment/${appointmentId}/ai-summary-draft`, {
        clinicianNotes: current.notes.trim(),
      });
      updateAiDraft(appointmentId, { draft: response.data.draft, loading: false });
    } catch (e) {
      const message = e.response?.status === 403
        ? "Only the doctor assigned to this appointment can generate its draft."
        : responseError(e, "Could not generate the AI draft. Please try again.");
      updateAiDraft(appointmentId, { error: message, loading: false });
    }
  }

  async function checkRescheduleAvailability() {
    if (!rescheduling?.date || !rescheduling?.time) return;
    setRescheduling({ ...rescheduling, checking: true, doctors: [], doctorId: "" });
    try {
      const query = new URLSearchParams({ date: rescheduling.date, time: rescheduling.time });
      const response = await api.get(`/api/v1/doctor/available?${query}`);
      setRescheduling(current => current && ({ ...current, checking: false, doctors: response.data }));
    } catch (e) { setError(responseError(e, "Could not check new slot availability.")); setRescheduling(current => current && ({ ...current, checking: false })); }
  }
  async function saveReschedule(appointmentId) {
    setSaving(true); setError(""); setNotice("");
    try {
      await api.patch(`/api/v1/appointment/${appointmentId}/schedule`, { date: rescheduling.date, time: rescheduling.time, doctorId: Number(rescheduling.doctorId), reason: rescheduling.reason });
      setNotice("Appointment rescheduled. The change was added to its audit history."); setRescheduling(null); await load();
    } catch (e) { setError(responseError(e, "Could not reschedule this appointment.")); }
    finally { setSaving(false); }
  }

  function actionsFor(appointment) {
    if (role === "ADMIN") return appointment.status === "PENDING"
      ? [["CONFIRMED", "Confirm"], ["CANCELLED", "Cancel"]]
      : appointment.status === "CONFIRMED" ? [["CANCELLED", "Cancel"], ["IN_PROGRESS", "Correct to in progress"]]
      : appointment.status === "IN_PROGRESS" ? [["COMPLETED", "Correct to completed"]] : [];
    if (role === "DOCTOR") return appointment.status === "PENDING"
      ? [["CONFIRMED", "Confirm request"], ["CANCELLED", "Reject request"]]
      : appointment.status === "CONFIRMED" ? [["IN_PROGRESS", "Start visit"]]
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
      <div className="availability-check">
        <button type="button" className="check-availability" onClick={checkAvailability} disabled={!slotKey || bookingLoading || saving}>
          {bookingLoading ? "Checking availability…" : "Check availability"}
        </button>
        {slotKey && availabilityCheckedFor === slotKey && doctors.length > 0 && <span role="status">{doctors.length} doctor{doctors.length === 1 ? "" : "s"} available for this slot.</span>}
      </div>
      {slotKey && availabilityCheckedFor === slotKey && doctors.length === 0 && <p className="availability-empty" role="status">No doctors are available at that date and time. Change the date or time and check again.</p>}
      <select aria-label="Available doctor" required value={form.doctorId} onChange={e => setForm({ ...form, doctorId: e.target.value })} disabled={bookingLoading || availabilityCheckedFor !== slotKey || !doctors.length}>
        <option value="">{availabilityCheckedFor !== slotKey ? "Check availability to choose a doctor" : doctors.length ? "Choose an available doctor" : "No available doctors"}</option>
        {doctors.map(d => <option key={d.id} value={d.id}>{d.name} · {d.specialization}</option>)}
      </select>
      <textarea aria-label="Reason for appointment" placeholder="Reason for appointment" required maxLength={1000} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
      <button type="submit" disabled={saving || bookingLoading || availabilityCheckedFor !== slotKey || !doctors.some((doctor) => String(doctor.id) === form.doctorId)}>{saving ? "Submitting…" : role === "PATIENT" ? "Send appointment request" : "Schedule as pending"}</button>
      {role === "PATIENT" && <p className="request-pending-note">Requests remain Pending until a doctor or admin confirms them.</p>}
    </form>}

    <div className="table-card"><h2>{role === "ADMIN" ? "All requests and appointments" : role === "DOCTOR" ? "Your assigned visits" : "Your visit history"}</h2>
      {loading ? <div className="screen-state">Loading appointments…</div> : !items.length ? <div className="empty-state">{role === "PATIENT" ? "You have not requested an appointment yet." : "No appointments to show."}</div> :
        <div className="appointment-list">{items.map(a => <article className="appointment-card" key={a.id}>
          <div className="appointment-heading"><div><h3>{a.patient?.name || "Your appointment"}</h3><p>{a.date} at {a.time} · {a.doctor?.name || "Care team"}</p></div><span className={`status status-${a.status.toLowerCase()}`}>{a.status.replace("_", " ")}</span></div>
          <p><strong>Reason:</strong> {a.reason || "Not provided"}</p>
          {role !== "PATIENT" && a.patient && <p className="patient-detail">Patient details: {a.patient.age} years · {a.patient.gender} · {a.patient.contact}</p>}
          {role === "DOCTOR" && <section className="ai-draft-tool" aria-label={`AI visit summary for appointment ${a.id}`}>
            <div>
              <h4>AI visit summary draft</h4>
              <p>Notes are sent to the configured AI provider. Use only de-identified notes; do not include patient names or other identifying details.</p>
            </div>
            <textarea
              aria-label="Clinician notes for AI summary"
              maxLength={5000}
              placeholder="Enter relevant clinician notes…"
              value={aiDrafts[a.id]?.notes || ""}
              onChange={e => updateAiDraft(a.id, { notes: e.target.value, error: "" })}
            />
            {aiDrafts[a.id]?.error && <p className="error-message" role="alert">{aiDrafts[a.id].error}</p>}
            <button type="button" onClick={() => generateAiDraft(a.id)} disabled={aiDrafts[a.id]?.loading || !aiDrafts[a.id]?.notes?.trim()}>
              {aiDrafts[a.id]?.loading ? "Generating draft…" : "Generate draft"}
            </button>
            {aiDrafts[a.id]?.draft && <div className="ai-draft-result" aria-live="polite">
              <strong>AI-generated draft · clinician review required</strong>
              <p>This draft has not been approved or saved to the patient record.</p>
              <div>{aiDrafts[a.id].draft}</div>
              <button type="button" className="secondary-button" onClick={() => updateAiDraft(a.id, { draft: "", error: "" })}>Discard draft</button>
            </div>}
          </section>}
          {a.status === "CANCELLED" ? <p className="legacy-status">This appointment was cancelled and is kept in the record.</p> : <ol className="timeline">{statuses.map((status, index) => {
            const reached = statuses.indexOf(a.status);
            const history = a.statusHistory?.find(h => h.toStatus === status);
            return <li className={reached >= index ? "done" : ""} key={status}><span>{status.replace("_", " ")}</span>{history && <small>{history.actorUsername} · {new Date(history.changedAt).toLocaleString()}{history.reason ? ` · ${history.reason}` : ""}</small>}</li>;
          })}</ol>}
          {!!a.scheduleHistory?.length && <div className="schedule-history"><strong>Schedule history</strong>{a.scheduleHistory.map(change => <small key={change.id}>{change.actorUsername} · {change.fromDate} {change.fromTime} → {change.toDate} {change.toTime} · {change.reason}</small>)}</div>}
          <div className="table-actions">{actionsFor(a).map(([status, label]) => <button type="button" className={status === "CANCELLED" ? "danger-button" : ""} key={status} onClick={() => transition(a, status)}>{label}</button>)}</div>
          {role === "ADMIN" && ["PENDING", "CONFIRMED"].includes(a.status) && <>
            {rescheduling?.id !== a.id ? <button type="button" onClick={() => setRescheduling({ id: a.id, date: a.date, time: a.time, doctors: [], doctorId: "", reason: "", checking: false })}>Reschedule</button> : <form className="form-card reschedule-form" onSubmit={e => { e.preventDefault(); saveReschedule(a.id); }}>
              <h4>Reschedule appointment</h4>
              <input type="date" required aria-label="New appointment date" value={rescheduling.date} onChange={e => setRescheduling({ ...rescheduling, date: e.target.value, doctors: [], doctorId: "" })} />
              <input type="time" required aria-label="New appointment time" value={rescheduling.time} onChange={e => setRescheduling({ ...rescheduling, time: e.target.value, doctors: [], doctorId: "" })} />
              <button type="button" onClick={checkRescheduleAvailability} disabled={rescheduling.checking}>{rescheduling.checking ? "Checking…" : "Check new slot"}</button>
              {rescheduling.doctors?.length === 0 && !rescheduling.checking && <p>Check availability to select an active doctor.</p>}
              {!!rescheduling.doctors?.length && <><select required aria-label="Replacement doctor" value={rescheduling.doctorId} onChange={e => setRescheduling({ ...rescheduling, doctorId: e.target.value })}><option value="">Choose available doctor</option>{rescheduling.doctors.map(d => <option key={d.id} value={d.id}>{d.name} · {d.specialization}</option>)}</select><textarea required maxLength={1000} aria-label="Reschedule reason" placeholder="Reason for rescheduling" value={rescheduling.reason} onChange={e => setRescheduling({ ...rescheduling, reason: e.target.value })} /><button type="submit" disabled={saving || !rescheduling.doctorId}>{saving ? "Saving…" : "Save new schedule"}</button></>}
              <button type="button" onClick={() => setRescheduling(null)}>Close</button>
            </form>}
          </>}
        </article>)}</div>}
    </div>
  </section></Layout>;
}

import { useEffect, useState } from "react";
import api from "../api/api";
import Layout from "../components/Layout";
import { getErrorMessage } from "../utils/errors";

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({ name: "", specialization: "", contact: "", accountUsername: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [offboard, setOffboard] = useState(null);
  const [reason, setReason] = useState("");
  const [visits, setVisits] = useState([]);
  const [resolutions, setResolutions] = useState({});
  const [saving, setSaving] = useState(false);
  const activeDoctors = doctors.filter((doctor) => doctor.active && doctor.id !== offboard?.id);

  async function fetchDoctors() {
    setLoading(true); setError("");
    try { setDoctors((await api.get("/api/v1/doctor")).data); }
    catch (e) { setError(getErrorMessage(e, "Could not load doctors.")); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDoctors();
  }, []);

  async function addDoctor(e) {
    e.preventDefault(); setError(""); setMessage("");
    try {
      await api.post("/api/v1/doctor", form);
      setForm({ name: "", specialization: "", contact: "", accountUsername: "" });
      setMessage("Doctor record added."); await fetchDoctors();
    } catch (e) { setError(getErrorMessage(e, "Could not add doctor.")); }
  }

  async function beginDeactivate(doctor) {
    setError(""); setMessage(""); setOffboard(doctor); setReason(""); setResolutions({}); setVisits([]);
    try { setVisits((await api.get(`/api/v1/doctor/${doctor.id}/offboarding-appointments`)).data); }
    catch (e) { setError(getErrorMessage(e, "Could not load future appointments. No changes have been made.")); setOffboard(null); }
  }
  async function submitDeactivate(e) {
    e.preventDefault(); if (!offboard) return;
    setSaving(true); setError(""); setMessage("");
    try {
      await api.patch(`/api/v1/doctor/${offboard.id}/deactivate`, {
        reason,
        resolutions: visits.map((visit) => ({ appointmentId: visit.id, action: resolutions[visit.id]?.action, replacementDoctorId: resolutions[visit.id]?.replacementDoctorId ? Number(resolutions[visit.id].replacementDoctorId) : null })),
      });
      setMessage(`${offboard.name} was deactivated. Appointment history was retained.`); setOffboard(null); await fetchDoctors();
    } catch (e) { setError(getErrorMessage(e, "Could not deactivate this doctor.")); }
    finally { setSaving(false); }
  }
  async function activate(doctor) {
    const activationReason = window.prompt(`Reason for reactivating ${doctor.name}:`);
    if (!activationReason?.trim()) return;
    setError(""); setMessage("");
    try { await api.patch(`/api/v1/doctor/${doctor.id}/activate`, { reason: activationReason.trim() }); setMessage(`${doctor.name} is active again.`); await fetchDoctors(); }
    catch (e) { setError(getErrorMessage(e, "Could not reactivate doctor.")); }
  }

  return <Layout><section className="page">
    <header className="page-header"><div><h1>Doctors</h1><p>Manage active staff while retaining clinical and appointment history.</p></div></header>
    {error && <p className="error-message" role="alert">{error}</p>}{message && <p className="message" role="status">{message}</p>}
    <form className="form-card" onSubmit={addDoctor}><h2>Add doctor record</h2>
      <input required aria-label="Doctor name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Doctor name" />
      <input required aria-label="Specialization" value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} placeholder="Specialization" />
      <input aria-label="Contact" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} placeholder="Contact" />
      <input aria-label="Linked account username" value={form.accountUsername} onChange={e => setForm({ ...form, accountUsername: e.target.value })} placeholder="Linked account username (optional)" />
      <button type="submit">Add doctor</button>
    </form>
    <div className="table-card"><h2>Doctor directory</h2>
      {loading ? <div className="screen-state">Loading doctors…</div> : !doctors.length ? <div className="empty-state">No doctor records yet.</div> : <div className="appointment-list">{doctors.map(doctor => <article className="appointment-card" key={doctor.id}>
        <div className="appointment-heading"><div><h3>{doctor.name}</h3><p>{doctor.specialization} · {doctor.contact || "No contact listed"}</p></div><span className={`status ${doctor.active ? "status-confirmed" : "status-cancelled"}`}>{doctor.active ? "Active" : "Inactive"}</span></div>
        <div className="table-actions">{doctor.active ? <button className="danger-button" type="button" onClick={() => beginDeactivate(doctor)}>Deactivate</button> : <button type="button" onClick={() => activate(doctor)}>Reactivate</button>}</div>
      </article>)}</div>}
    </div>
    {offboard && <div className="table-card" role="dialog" aria-modal="true" aria-labelledby="offboard-title">
      <h2 id="offboard-title">Deactivate {offboard.name}</h2><p>Future pending and confirmed appointments must be cancelled or reassigned. Past appointments remain unchanged.</p>
      <form className="form-card" onSubmit={submitDeactivate}>
        {visits.length === 0 ? <p>No future pending or confirmed appointments need resolution.</p> : visits.map(visit => <fieldset className="offboard-visit" key={visit.id}><legend>{visit.patient?.name || "Patient"} · {visit.date} at {visit.time} · {visit.status}</legend>
          <select required aria-label={`Action for appointment ${visit.id}`} value={resolutions[visit.id]?.action || ""} onChange={e => setResolutions({ ...resolutions, [visit.id]: { action: e.target.value, replacementDoctorId: "" } })}><option value="">Choose action</option><option value="CANCEL">Cancel appointment</option><option value="REASSIGN">Reassign appointment</option></select>
          {resolutions[visit.id]?.action === "REASSIGN" && <select required aria-label={`Replacement for appointment ${visit.id}`} value={resolutions[visit.id]?.replacementDoctorId || ""} onChange={e => setResolutions({ ...resolutions, [visit.id]: { ...resolutions[visit.id], replacementDoctorId: e.target.value } })}><option value="">Choose active doctor</option>{activeDoctors.map(d => <option key={d.id} value={d.id}>{d.name} · {d.specialization}</option>)}</select>}
        </fieldset>)}
        <textarea required maxLength={1000} aria-label="Reason for deactivation" placeholder="Reason for deactivation (recorded in the audit history)" value={reason} onChange={e => setReason(e.target.value)} />
        <div className="table-actions"><button type="submit" disabled={saving || visits.some(v => !resolutions[v.id]?.action || (resolutions[v.id]?.action === "REASSIGN" && !resolutions[v.id]?.replacementDoctorId))}>{saving ? "Saving…" : "Confirm deactivation"}</button><button type="button" onClick={() => setOffboard(null)} disabled={saving}>Cancel</button></div>
      </form>
    </div>}
  </section></Layout>;
}

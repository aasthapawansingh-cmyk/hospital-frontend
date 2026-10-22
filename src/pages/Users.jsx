import { useEffect, useState } from "react";
import api from "../api/api";
import Layout from "../components/Layout";

export default function Users() {
  const [users, setUsers] = useState([]);
  const blankForm = { username: "", password: "", role: "DOCTOR", name: "", specialization: "", contact: "", age: "", gender: "", address: "" };
  const [form, setForm] = useState(blankForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  async function load() { setLoading(true); try { setUsers((await api.get("/api/v1/users")).data); setError(""); } catch { setError("Could not load users."); } finally { setLoading(false); } }
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);
  async function submit(e) { e.preventDefault(); setError(""); try { await api.post("/api/v1/users", { ...form, age: form.role === "PATIENT" ? Number(form.age) : null }); setForm(blankForm); await load(); } catch (err) { setError(err.response?.data || "Could not create account."); } }
  async function remove(id) { try { await api.delete(`/api/v1/users/${id}`); await load(); } catch (err) { setError(err.response?.data || "Could not delete account."); } }
  return <Layout><section className="page"><header className="page-header"><div><h1>User access</h1><p>Create doctor and patient sign-in accounts.</p></div></header>
    <form className="form-card" onSubmit={submit}><h2>New linked account</h2><p>Each account is created together with its doctor or patient record.</p><select aria-label="Role" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}><option value="DOCTOR">Doctor</option><option value="PATIENT">Patient</option></select><input aria-label="Username" placeholder="Username" value={form.username} onChange={e=>setForm({...form,username:e.target.value})} required/><input aria-label="Temporary password" placeholder="Temporary password (8+ characters)" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required minLength={8}/><input aria-label="Name" placeholder="Full name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/>{form.role === "DOCTOR" ? <input aria-label="Specialization" placeholder="Specialization" value={form.specialization} onChange={e=>setForm({...form,specialization:e.target.value})} required/> : <><input aria-label="Age" placeholder="Age" type="number" min="0" value={form.age} onChange={e=>setForm({...form,age:e.target.value})} required/><input aria-label="Gender" placeholder="Gender" value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})} required/><input aria-label="Address" placeholder="Address" value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></>}<input aria-label="Contact" placeholder="Contact" value={form.contact} onChange={e=>setForm({...form,contact:e.target.value})}/><button>Create linked account</button></form>
    {error && <p className="error-message" role="alert">{error}</p>}<div className="table-card"><h2>Accounts</h2>{loading ? <p>Loading accounts…</p> : users.length ? <div className="responsive-table"><table><thead><tr><th>Username</th><th>Role</th><th>Actions</th></tr></thead><tbody>{users.map(u=><tr key={u.id}><td>{u.username}</td><td>{u.roles.join(", ")}</td><td>{u.roles.includes("ADMIN") ? "Protected" : <button className="danger-button" onClick={()=>remove(u.id)}>Delete</button>}</td></tr>)}</tbody></table></div> : <p>No accounts yet.</p>}</div></section></Layout>;
}

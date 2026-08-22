"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError(""); setMessage("");
    try {
      const res = await fetch("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to send reset link.");
      setMessage(data.message);
    } catch (e: any) { setError(e.message || "Unable to send reset link."); }
    finally { setLoading(false); }
  }

  return <main className="auth-wrap"><div className="auth-card" style={{maxWidth:500,margin:"70px auto"}}>
    <Link href="/login" className="muted" style={{display:"inline-flex",alignItems:"center",gap:6,fontSize:12,fontWeight:800}}><ArrowLeft size={15}/> Back to sign in</Link>
    <div className="auth-brand" style={{marginTop:24}}><span className="brand-mark">A</span> AITTS</div>
    <h1>Reset your password</h1><p className="muted">Enter your account email and we'll send you a secure reset link.</p>
    {error && <div className="error" style={{marginTop:18}}>{error}</div>}
    {message && <div className="success" style={{marginTop:18}}>{message}</div>}
    <form className="form" onSubmit={submit} style={{marginTop:24}}>
      <div><label className="label">Email address</label><div style={{position:"relative"}}><Mail size={16} style={{position:"absolute",left:13,top:13,color:"var(--muted)"}}/><input className="input" style={{paddingLeft:38}} type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required /></div></div>
      <button className="btn btn-primary" disabled={loading}>{loading ? "Sending…" : "Send reset link"}</button>
    </form>
    <p className="footer-note" style={{display:"flex",gap:6,alignItems:"center"}}><ShieldCheck size={14}/> Reset links expire after 1 hour and work once.</p>
  </div></main>;
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../services/authService.js";
import { TopBar } from "../components/Navigation.jsx";

function Register({ onToast }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "", userType: "RESIDENT" });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function updateField(event) {
    setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(form);
      onToast("Account created. You can now sign in.");
      navigate("/login", { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "We couldn't create your account.");
    } finally {
      setSubmitting(false);
    }
  }

  return <div className="screen">
    <TopBar onBell={() => onToast("No new notifications")} />
    <div className="auth-content">
      <h1>Create account</h1>
      <p>Join the verified campus marketplace.</p>
      <form className="auth-form" onSubmit={submit}>
        <label>Username<input name="username" value={form.username} onChange={updateField} required /></label>
        <label>Email<input name="email" type="email" value={form.email} onChange={updateField} required /></label>
        <label>Password<input name="password" type="password" minLength="8" value={form.password} onChange={updateField} required /></label>
        <label>Account type<select name="userType" value={form.userType} onChange={updateField}><option value="RESIDENT">Resident</option><option value="STUDENT">Student</option><option value="FACULTY">Faculty</option><option value="VENDOR">Vendor</option></select></label>
        {error && <p className="form-error">{error}</p>}
        <button className="primary-action" type="submit" disabled={submitting}>{submitting ? "Creating account..." : "Create account"}</button>
      </form>
      <p>Already registered? <Link to="/login">Sign in</Link></p>
    </div>
  </div>;
}

export default Register;

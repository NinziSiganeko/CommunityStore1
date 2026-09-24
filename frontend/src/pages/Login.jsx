import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { signIn } from "../services/authService.js";
import { TopBar } from "../components/Navigation.jsx";

function Login({ onToast }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
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
      await signIn(form.email, form.password);
      onToast("Welcome back");
      navigate(location.state?.from || "/marketplace", { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  }

  return <div className="screen">
    <TopBar onBell={() => onToast("No new notifications")} />
    <div className="auth-content">
      <h1>Welcome back</h1>
      <p>Sign in to continue to Community Store.</p>
      <form className="auth-form" onSubmit={submit}>
        <label>Email<input name="email" type="email" value={form.email} onChange={updateField} required /></label>
        <label>Password<input name="password" type="password" value={form.password} onChange={updateField} required /></label>
        {error && <p className="form-error">{error}</p>}
        <button className="primary-action" type="submit" disabled={submitting}>{submitting ? "Signing in..." : "Sign in"}</button>
      </form>
      <p>New to Community Store? <Link to="/register">Create an account</Link></p>
    </div>
  </div>;
}

export default Login;

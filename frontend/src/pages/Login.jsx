import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { signIn, isAuthenticated } from "../services/authService.js";
import { TopBar } from "../components/Navigation.jsx";

function Login({ onToast }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  function updateField(event) {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await signIn(form.email, form.password);
      onToast("Welcome back");
      navigate(location.state?.from || "/", { replace: true });
    } catch (requestError) {
      const status = requestError.response?.status;

      if (status === 401) {
        setError(requestError.response?.data?.message || "Invalid email or password.");
      } else if (status === 403) {
        setError("Access denied for this account.");
      } else if (requestError.request) {
        setError("Cannot connect to the Community Store server.");
      } else {
        setError(requestError.response?.data?.message || "Sign in failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return <div className="screen auth-screen">
    <TopBar onBell={() => onToast("No new notifications")} />
    <div className="auth-content">
      <div className="auth-icon"><i className="bi bi-person-check-fill" /></div>
      <h1>Welcome back</h1>
      <p>Sign in to continue to Community Store.</p>

      <form className="auth-form" onSubmit={submit}>
        <label>
          Email
          <input
              name="email"
              type="email"
              value={form.email}
              onChange={updateField}
              autoComplete="email"
              required
              disabled={submitting}
          />
        </label>

        <label>
          Password
          <input
              name="password"
              type="password"
              value={form.password}
              onChange={updateField}
              autoComplete="current-password"
              required
              disabled={submitting}
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button className="primary-action auth-submit" type="submit" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p>New to Community Store? <Link to="/register">Create an account</Link></p>
    </div>
  </div>;
}

export default Login;

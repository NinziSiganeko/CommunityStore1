import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAuthenticated, register } from "../services/authService.js";
import { TopBar } from "../components/Navigation.jsx";

const INITIAL_FORM = {
  username: "",
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  phoneNumber: "",
  address: "",
  userType: "RESIDENT",
};

function Register({ onToast }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
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

    if (form.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setSubmitting(true);

    try {
      await register(form);
      onToast("Account created. You can now sign in.");
      navigate("/login", { replace: true });
    } catch (requestError) {
      setError(
          requestError.response?.data?.message ||
          "We couldn't create your account. Please check the details and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return <div className="screen auth-screen">
    <TopBar onBell={() => onToast("No new notifications")} />
    <div className="auth-content auth-content-wide">
      <div className="auth-icon"><i className="bi bi-person-plus-fill" /></div>
      <h1>Create account</h1>
      <p>Join the Community Store marketplace.</p>

      <form className="auth-form" onSubmit={submit}>
        <div className="form-row">
          <label>
            Username
            <input name="username" value={form.username} onChange={updateField} minLength="3" maxLength="50" required disabled={submitting} />
          </label>
          <label>
            Account type
            <select name="userType" value={form.userType} onChange={updateField} disabled={submitting}>
              <option value="RESIDENT">Resident</option>
              <option value="STUDENT">Student</option>
              <option value="FACULTY">Faculty</option>
              <option value="VENDOR">Vendor</option>
            </select>
          </label>
        </div>

        <label>
          Email
          <input name="email" type="email" value={form.email} onChange={updateField} autoComplete="email" required disabled={submitting} />
        </label>

        <label>
          Password
          <input name="password" type="password" value={form.password} onChange={updateField} minLength="8" autoComplete="new-password" required disabled={submitting} />
        </label>

        <div className="form-row">
          <label>
            First name
            <input name="firstName" value={form.firstName} onChange={updateField} maxLength="50" disabled={submitting} />
          </label>
          <label>
            Last name
            <input name="lastName" value={form.lastName} onChange={updateField} maxLength="50" disabled={submitting} />
          </label>
        </div>

        <div className="form-row">
          <label>
            Phone number
            <input name="phoneNumber" type="tel" value={form.phoneNumber} onChange={updateField} maxLength="20" disabled={submitting} />
          </label>
          <label>
            Address
            <input name="address" value={form.address} onChange={updateField} maxLength="255" disabled={submitting} />
          </label>
        </div>

        {error && <p className="form-error">{error}</p>}

        <button className="primary-action auth-submit" type="submit" disabled={submitting}>
          {submitting ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <p>Already registered? <Link to="/login">Sign in</Link></p>
    </div>
  </div>;
}

export default Register;

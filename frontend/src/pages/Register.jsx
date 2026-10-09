import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  isAuthenticated,
  register,
} from "../services/authService.js";
import { TopBar } from "../components/Navigation.jsx";
import { useToast } from "../context/ToastContext.jsx";

const INITIAL_FORM = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  phoneNumber: "",
  address: "",
  userType: "RESIDENT",
};

function Register() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /**
   * If the user is already authenticated,
   * send them back to Home.
   */
  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  /**
   * Update form fields.
   */
  function updateField(event) {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  }

  /**
   * Handle account registration.
   */
  async function submit(event) {
    event.preventDefault();

    setError("");

    /**
     * Basic frontend password validation.
     */
    if (form.password.length < 8) {
      setError(
          "Password must contain at least 8 characters.",
      );
      return;
    }

    setSubmitting(true);

    try {
      /**
       * authService now sends this directly using
       * fetch(), following the AnimeStore approach.
       */

      await register(form);

      showToast(
          form.userType === "VENDOR"
              ? "Vendor account created — an admin will review it"
              : "Account created. You can now sign in.",
      );



      /**
       * Registration does not automatically log
       * the user in. Send them to Login.
       */
      navigate("/login", {
        replace: true,
      });
    } catch (requestError) {
      /**
       * 400 normally means the backend rejected
       * something in the registration data.
       */
      if (requestError.status === 400) {
        setError(
            requestError.data?.message ||
            "Please check your registration details.",
        );
      }

      /**
       * If the backend/security layer rejects
       * the registration request.
       */
      else if (requestError.status === 403) {
        setError(
            "Registration was rejected by the server.",
        );
      }

      /**
       * Backend cannot be reached.
       */
      else if (requestError instanceof TypeError) {
        setError(
            "Cannot connect to the Community Store server.",
        );
      }

      /**
       * General fallback.
       */
      else {
        setError(
            requestError.message ||
            "We couldn't create your account. Please try again.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
      <div className="screen auth-screen">
        <TopBar
            onBell={() => navigate("/notifications")}
        />
        <div className="auth-content auth-content-wide">
          <div className="auth-icon">
            <i className="bi bi-person-plus-fill" />
          </div>

          <h1>Create account</h1>

          <p>
            Join the Community Store marketplace.
          </p>

          <form
              className="auth-form"
              onSubmit={submit}
          >
            <div className="form-row">
              <label>
                Account type

                <select
                    name="userType"
                    value={form.userType}
                    onChange={updateField}
                    disabled={submitting}
                >
                  <option value="RESIDENT">
                    Resident
                  </option>

                  <option value="STUDENT">
                    Student
                  </option>

                  <option value="FACULTY">
                    Faculty
                  </option>

                  <option value="VENDOR">
                    Vendor
                  </option>
                </select>
                {form.userType === "VENDOR" && (
                    <small className="field-help">
                      Vendor accounts are reviewed by an admin before your
                      listings become visible to buyers.
                    </small>
                )}
              </label>
            </div>

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
                  minLength="8"
                  autoComplete="new-password"
                  required
                  disabled={submitting}
              />
            </label>

            <div className="form-row">
              <label>
                First name

                <input
                    name="firstName"
                    value={form.firstName}
                    onChange={updateField}
                    maxLength="50"
                    disabled={submitting}
                />
              </label>

              <label>
                Last name

                <input
                    name="lastName"
                    value={form.lastName}
                    onChange={updateField}
                    maxLength="50"
                    disabled={submitting}
                />
              </label>
            </div>

            <div className="form-row">
              <label>
                Phone number

                <input
                    name="phoneNumber"
                    type="tel"
                    value={form.phoneNumber}
                    onChange={updateField}
                    maxLength="20"
                    disabled={submitting}
                />
              </label>

              <label>
                Address

                <input
                    name="address"
                    value={form.address}
                    onChange={updateField}
                    maxLength="255"
                    disabled={submitting}
                />
              </label>
            </div>

            {error && (
                <p className="form-error">
                  {error}
                </p>
            )}

            <button
                className="primary-action auth-submit"
                type="submit"
                disabled={submitting}
            >
              {submitting
                  ? "Creating account..."
                  : "Create Account"}
            </button>
          </form>

          <p>
            Already registered?{" "}
            <Link to="/login">
              Sign in
            </Link>
          </p>
        </div>
      </div>
  );
}

export default Register;


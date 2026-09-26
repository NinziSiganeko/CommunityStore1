import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getCurrentUser, signOut } from "../services/authService.js";

function TopBar({ onBell }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  function readUser() {
    setUser(getCurrentUser());
  }

  useEffect(() => {
    readUser();
  }, [location.pathname]);

  function handleLogout() {
    signOut();
    setUser(null);
    navigate("/login", { replace: true });
  }

  const displayName = user?.displayName || user?.username || user?.email?.split("@")[0] || "User";
  const dashboardPath = user?.role === "ADMIN" ? "/admin" : "/profile";

  return <div className="topbar">
    <button className="topbar-brand" onClick={() => navigate("/")} aria-label="Go to home">
      <div className="topbar-logo"><i className="bi bi-house-heart-fill" /></div>
      <span className="topbar-title">Community Store</span>
    </button>

    <div className="topbar-actions">
      {user ? (
          <>
            <Link className="auth-user-link" to={dashboardPath} title="Open your profile">
              <i className="bi bi-person-circle" />
              <span>Hi, {displayName}</span>
            </Link>
            <button className="auth-logout-btn" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right" />
              <span>Logout</span>
            </button>
          </>
      ) : (
          <>
            <Link className="auth-login-btn" to="/login">Sign In</Link>
            <Link className="auth-register-btn" to="/register">Register</Link>
          </>
      )}

      <button className="topbar-bell" onClick={onBell} aria-label="Notifications">
        <i className="bi bi-bell" />
        <span className="dot" />
      </button>
    </div>
  </div>;
}

function BottomNav({ active }) {
  const navigate = useNavigate();
  const location = useLocation();
  const current = active || (location.pathname === "/marketplace" ? "market" : location.pathname.slice(1) || "home");

  return <div className="bottom-nav">
    <button className="nav-btn" onClick={() => navigate("/")}>
      <i className={`bi ${current === "home" ? "bi-house-fill" : "bi-house"}`} />
      <span className={`nav-label ${current === "home" ? "active" : ""}`}>Home</span>
    </button>
    <button className="nav-btn" onClick={() => navigate("/marketplace")}>
      <i className={`bi ${current === "market" ? "bi-grid-fill" : "bi-grid"}`} />
      <span className={`nav-label ${current === "market" ? "active" : ""}`}>Market</span>
    </button>
    <button className="nav-sell" onClick={() => navigate("/sell")}>
      <i className="bi bi-plus-circle" />
      <span className="nav-label">Sell</span>
    </button>
    <button className="nav-btn" onClick={() => navigate("/chat")}>
      <i className="bi bi-chat-dots" />
      <span className="nav-label">Chat</span>
    </button>
    <button className="nav-btn" onClick={() => navigate("/profile")}>
      <i className="bi bi-person" />
      <span className="nav-label">Profile</span>
    </button>
  </div>;
}

export { BottomNav, TopBar };

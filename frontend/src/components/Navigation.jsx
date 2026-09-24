import { useLocation, useNavigate } from "react-router-dom";

function TopBar({ onBell }) {
  const navigate = useNavigate();
  return <div className="topbar">
    <button className="topbar-brand" onClick={() => navigate("/")} aria-label="Go to home">
      <div className="topbar-logo"><i className="bi bi-house-heart-fill" /></div>
      <span className="topbar-title">Community Store</span>
    </button>
    <button className="topbar-bell" onClick={onBell} aria-label="Notifications"><i className="bi bi-bell" /><span className="dot" /></button>
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

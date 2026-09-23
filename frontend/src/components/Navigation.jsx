function TopBar({ onBell }) {
  return <div className="topbar">
    <div className="topbar-brand"><div className="topbar-logo"><i className="bi bi-house-heart-fill" /></div><span className="topbar-title">Community Store</span></div>
    <button className="topbar-bell" onClick={onBell} aria-label="Notifications"><i className="bi bi-bell" /><span className="dot" /></button>
  </div>;
}

function BottomNav({ active, onNav }) {
  const items = [
    [
        "home",
        "Home",
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75V21a.75.75 0 01-.75.75H15.75a.75.75 0 01-.75-.75v-4.5h-6V21a.75.75 0 01-.75.75H3.75A.75.75 0 013 21V9.75z" />
    ],
    [
        "market",
        "Market",
      <><rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>],
    [
        "chat",
        "Chat",
      <path strokeLinecap="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    ],
    [
        "profile",
        "Profile",
      <path strokeLinecap="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    ],
  ];
  return <div className="bottom-nav">
    <button className="nav-btn" onClick={() => onNav("home")}>
      <i className={`bi ${active === "home" ? "bi-house-fill" : "bi-house"}`} />
      <span className={`nav-label ${active === "home" ? "active" : ""}`}>Home</span>
    </button>
    <button className="nav-btn" onClick={() => onNav("market")}>
      <i className={`bi ${active === "market" ? "bi-grid-fill" : "bi-grid"}`} />
      <span className={`nav-label ${active === "market" ? "active" : ""}`}>Market</span>
    </button>
    <button className="nav-sell" onClick={() => onNav("sell")}>
      <i className="bi bi-plus-circle" />
      <span className="nav-label">Sell</span>
    </button>
    <button className="nav-btn" onClick={() => onNav("chat")}>
      <i className="bi bi-chat-dots" />
      <span className="nav-label">Chat</span>
    </button>
    <button className="nav-btn" onClick={() => onNav("profile")}>
      <i className="bi bi-person" />
      <span className="nav-label">Profile</span>
    </button>
  </div>;
}

export { BottomNav, TopBar };

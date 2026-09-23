// ─── DATA ────────────────────────────────────────────────────────────────────

const TRENDING_ITEMS = [
  {
    id: 1,
    name: "Ergon Dorm Chair",
    price: "R 4 500.00",
    rating: 4.8,
    badge: "verified",
    img: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=300&q=80",
  },
  {
    id: 2,
    name: "CS Essentials Bundle",
    price: "R 120.00",
    rating: 4.9,
    badge: "verified",
    img: "https://images.unsplash.com/photo-1481277542470-605612bd2d61?w=300&q=80",
  },
];

const ANNOUNCEMENTS = [
  {
    id: 1,
    bg: "#DBEAFE",
    tagColor: "#1D4ED8",
    tag: "BOOK SWAP · 14 Aug",
    title: "Weekend Book Swap at Main Quad",
    body: "Bring old semester's books and swap with fellow students. Refreshments provided.",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
        <path strokeLinecap="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    ),
  },
  {
    id: 2,
    bg: "#FEF9C3",
    tagColor: "#D97706",
    tag: "TRUST TEAM · 14 Aug",
    title: "Security Update: New Pickup Points",
    body: "Three new verified 24/7 safe exchange zones added near the Student Union.",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
        <path strokeLinecap="round" d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    id: 3,
    bg: "#DCFCE7",
    tagColor: "#16A34A",
    tag: "CAMPUS DELIVERY · 14 Aug",
    title: "Campus delivery now active for verified vendors.",
    body: null,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2">
        <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" />
        <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
  },
];

const CATEGORIES = [
  { label: "Textbooks", bg: "#EFF6FF", icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8">
        <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
      </svg>
  )},
  { label: "Electronics", bg: "#F5F3FF", icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="1.8">
        <rect x="9" y="9" width="6" height="6" />
        <rect x="2" y="2" width="20" height="20" rx="2" />
        <line x1="9" y1="2" x2="9" y2="9" /><line x1="15" y1="2" x2="15" y2="9" />
        <line x1="9" y1="15" x2="9" y2="22" /><line x1="15" y1="15" x2="15" y2="22" />
      </svg>
  )},
  { label: "Services", bg: "#ECFDF5", icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.8">
        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
      </svg>
  )},
  { label: "Vendors", bg: "#FFFBEB", icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.8">
        <path d="M3 9l1-6h16l1 6" />
        <path d="M3 9a2 2 0 004 0 2 2 0 004 0 2 2 0 004 0 2 2 0 004 0M5 9v12h14V9" />
      </svg>
  )},
];

const PRODUCTS = [
  { id: 1, name: "Over-Ear Studio Headphones", price: "R 185.00", rating: 4.8, badge: "verified", img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80" },
  { id: 2, name: "Ergonomic Task Chair",        price: "R 210.00", rating: 4.9, badge: "faculty",  img: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&q=80" },
  { id: 3, name: "Architecture Textbook Vol.3", price: "R 45.00",  rating: null, badge: null,      img: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=300&q=80" },
  { id: 4, name: "Commuter E-Bike",             price: "R 890.00", rating: null, badge: null,      img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=80" },
  { id: 5, name: "Compact Espresso Machine",    price: "R 1 200.00", rating: 4.5, badge: null,     img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&q=80" },
  { id: 6, name: "Aluminum Laptop Stand",       price: "R 3 500.00", rating: 4.7, badge: "graduate", img: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=300&q=80" },
];

// ─── SMALL SHARED COMPONENTS ──────────────────────────────────────────────────

function ShieldIcon({ color }) {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill={color}>
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="#F59E0B">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function Badge({ type }) {
  if (!type) return null;
  const styles = {
    verified: { color: "#15803D" },
    faculty:  { color: "#1D4ED8" },
    graduate: { color: "#7C3AED" },
  };
  const labels = { verified: "VERIFIED", faculty: "FACULTY", graduate: "GRADUATE" };
  return (
    <span className={`badge ${type}`}>
      <ShieldIcon color={styles[type].color} />
      {labels[type]}
    </span>
  );
}

function Rating({ value }) {
  if (!value) return null;
  return (
    <span className="rating">
      <StarIcon /> {value}
    </span>
  );
}

// ─── TOP BAR ──────────────────────────────────────────────────────────────────

function TopBar({ onBell }) {
  return (
    <div className="topbar">
      <div className="topbar-brand">
        <div className="topbar-logo">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
          </svg>
        </div>
        <span className="topbar-title">Community Store</span>
      </div>
      <button className="topbar-bell" onClick={onBell}>
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <span className="dot" />
      </button>
    </div>
  );
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────

function BottomNav({ active, onNav }) {
  return (
    <div className="bottom-nav">
      {/* Home */}
      <button className="nav-btn" onClick={() => onNav("home")}>
        <svg width="22" height="22" fill={active === "home" ? "#2563EB" : "none"} viewBox="0 0 24 24" stroke={active === "home" ? "#2563EB" : "#94A3B8"} strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75V21a.75.75 0 01-.75.75H15.75a.75.75 0 01-.75-.75v-4.5h-6V21a.75.75 0 01-.75.75H3.75A.75.75 0 013 21V9.75z" />
        </svg>
        <span className={`nav-label ${active === "home" ? "active" : ""}`}>Home</span>
      </button>

      {/* Market */}
      <button className="nav-btn" onClick={() => onNav("market")}>
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke={active === "market" ? "#2563EB" : "#94A3B8"} strokeWidth="1.8">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
        <span className={`nav-label ${active === "market" ? "active" : ""}`}>Market</span>
      </button>

      {/* Sell (raised) */}
      <button className="nav-sell" onClick={() => onNav("sell")}>
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="1.8">
          <circle cx="12" cy="12" r="9" />
          <path strokeLinecap="round" d="M12 8v8M8 12h8" />
        </svg>
        <span className="nav-label">Sell</span>
      </button>

      {/* Chat */}
      <button className="nav-btn" onClick={() => onNav("chat")}>
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#94A3B8" strokeWidth="1.8">
          <path strokeLinecap="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span className="nav-label">Chat</span>
      </button>

      {/* Profile */}
      <button className="nav-btn" onClick={() => onNav("profile")}>
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#94A3B8" strokeWidth="1.8">
          <path strokeLinecap="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span className="nav-label">Profile</span>
      </button>
    </div>
  );
}

// ─── HOME SCREEN ──────────────────────────────────────────────────────────────

function HomeScreen({ onNav, onToast }) {
  return (
    <div className="screen">
      <TopBar onBell={() => onToast("No new notifications")} />

      <div className="scroll-area">

        {/* Hero */}
        <div className="hero">
          <div className="hero-circle-1" />
          <div className="hero-circle-2" />
          <div className="verified-badge">
            <ShieldIcon color="white" />
            <span>VERIFIED CAMPUS</span>
          </div>
          <h2 className="hero-greeting">
            Hello, Alex <span className="role">(Student)</span>
          </h2>
          <div className="search-bar">
            <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="#94A3B8" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
            </svg>
            <span>Search textbooks, dorm gear...</span>
          </div>
        </div>

        {/* Categories */}
        <div className="categories-section">
          <div className="categories-grid">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.label}
                className="category-btn"
                style={{ background: cat.bg }}
                onClick={() => onNav("market")}
              >
                {cat.icon}
                <span className="cat-label">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Trending */}
        <div className="trending-section">
          <div className="section-header">
            <h3 className="section-title">Trending in Campus</h3>
            <button className="see-all-btn" onClick={() => onNav("market")}>SEE ALL</button>
          </div>
          <div className="trending-scroll">
            {TRENDING_ITEMS.map((item) => (
              <div key={item.id} className="trending-card">
                <div className="trending-card-img-wrap">
                  <img src={item.img} alt={item.name} />
                  <span className="badge-img-overlay">
                    <Badge type={item.badge} />
                  </span>
                </div>
                <div className="trending-card-body">
                  <p className="trending-card-name">{item.name}</p>
                  <div className="trending-card-footer">
                    <span className="price">{item.price}</span>
                    <Rating value={item.rating} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Campus Announcements */}
        <div className="announcements-section">
          <h3 className="section-title" style={{ marginBottom: 14 }}>Campus Announcements</h3>
          {ANNOUNCEMENTS.map((a) => (
            <div
              key={a.id}
              className="announcement-card"
              style={{ background: a.bg }}
            >
              <div className="announcement-icon">{a.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="announcement-tag" style={{ color: a.tagColor }}>{a.tag}</div>
                <p className="announcement-title">{a.title}</p>
                {a.body && <p className="announcement-body">{a.body}</p>}
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" style={{ flexShrink: 0 }}>
                <path strokeLinecap="round" d="M9 18l6-6-6-6" />
              </svg>
            </div>
          ))}
          <div style={{ height: 16 }} />
        </div>

      </div>

      <BottomNav active="home" onNav={onNav} />
    </div>
  );
}

// ─── MARKETPLACE SCREEN ───────────────────────────────────────────────────────

function MarketplaceScreen({ onNav, onToast }) {
  const [activeFilters, setActiveFilters] = React.useState({
    category: false,
    price: false,
    condition: false,
  });

  function toggleFilter(key) {
    setActiveFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="screen">
      <TopBar onBell={() => onToast("No new notifications")} />

      {/* Filter chips */}
      <div className="filter-bar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" style={{ flexShrink: 0 }}>
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
        {["category", "price", "condition"].map((key) => (
          <button
            key={key}
            className={`filter-chip ${activeFilters[key] ? "active" : ""}`}
            onClick={() => toggleFilter(key)}
          >
            {key.charAt(0).toUpperCase() + key.slice(1)}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" d="M6 9l6 6 6-6" />
            </svg>
          </button>
        ))}
      </div>

      {/* Product grid */}
      <div className="market-grid-wrap">
        <div className="market-grid">
          {PRODUCTS.map((item, index) => (
            <div key={item.id} className="product-card">
              <div className="product-img-wrap">
                <img src={item.img} alt={item.name} />
                {item.badge && (
                  <span className="badge-img-overlay">
                    <Badge type={item.badge} />
                  </span>
                )}
                <button
                  className="wishlist-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToast("Added to wishlist ❤️");
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
                  </svg>
                </button>
              </div>

              <div className="product-body">
                <p className="product-name">{item.name}</p>
                <div className="product-footer">
                  <span className="price">{item.price}</span>
                  <Rating value={item.rating} />
                </div>

                {/* Show "List an Item" CTA on last card */}
                {index === PRODUCTS.length - 1 && (
                  <button
                    className="list-item-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToast("List an Item — coming in Sprint 3 🛒");
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                    </svg>
                    LIST AN ITEM
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div style={{ height: 16 }} />
      </div>

      <BottomNav active="market" onNav={onNav} />
    </div>
  );
}

// ─── TOAST ────────────────────────────────────────────────────────────────────

function Toast({ message }) {
  return <div className="toast">{message}</div>;
}

// ─── TAB SWITCHER ─────────────────────────────────────────────────────────────

function TabSwitcher({ active, onSwitch }) {
  return (
    <div className="tab-switcher">
      <button
        className={`tab-btn ${active === "home" ? "active" : ""}`}
        onClick={() => onSwitch("home")}
      >
        🏠 Home
      </button>
      <button
        className={`tab-btn ${active === "market" ? "active" : ""}`}
        onClick={() => onSwitch("market")}
      >
        🛍 Marketplace
      </button>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

function App() {
  const [screen, setScreen] = React.useState("home");
  const [toast, setToast] = React.useState(null);
  const toastTimer = React.useRef(null);

  function showToast(msg) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }

  function handleNav(id) {
    if (id === "home" || id === "market") {
      setScreen(id);
    } else if (id === "sell") {
      showToast("List an Item — coming in Sprint 3 🛒");
    } else if (id === "chat") {
      showToast("Chat — coming in Sprint 4 💬");
    } else if (id === "profile") {
      showToast("Profile — assigned to another team member 👤");
    }
  }

  const isHome = screen === "home";

  return (
    <>
      {/* Phone Shell */}
      <div className="phone-shell">

        {/* Status Bar */}
        <div className={`status-bar ${isHome ? "dark" : "light"}`}>
          <span className="status-time">9:41</span>
          <div className="status-notch" />
          <span className="status-icons">●●● 100%</span>
        </div>

        {/* Toast */}
        {toast && <Toast message={toast} key={toast + Date.now()} />}

        {/* Screens */}
        <div className="screen-wrapper">
          {screen === "home" && (
            <HomeScreen onNav={handleNav} onToast={showToast} />
          )}
          {screen === "market" && (
            <MarketplaceScreen onNav={handleNav} onToast={showToast} />
          )}
        </div>

      </div>

      {/* Tab switcher below the phone */}
      <TabSwitcher active={screen} onSwitch={setScreen} />
    </>
  );
}

// ─── RENDER ───────────────────────────────────────────────────────────────────

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
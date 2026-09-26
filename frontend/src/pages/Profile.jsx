import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Bell,
  Check,
  Clock,
  User,
  CreditCard,
  Lock,
  LogOut,
  Plus,
} from "lucide-react";
import BottomNav from "../components/BottomNav";

export default function Profile() {
  const navigate = useNavigate();
  const [vendorMode, setVendorMode] = useState(false);
  const [activeTab, setActiveTab] = useState("listings");

  const user = {
    name: "Alex Rivera",
    role: "Graduate Student",
    rating: 4.9,
    reviews: 124,
    spent: "R 1,240.50",
    earned: "R 856.00",
    yearsActive: 3,
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
  };

  const listings = [
    {
      id: 1,
      title: "Ergonomic Office Chair",
      price: "R 4,500.00",
      status: "ACTIVE",
      image:
        "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=400&h=400&fit=crop",
    },
    {
      id: 2,
      title: "Wireless Keyboard",
      price: "R 900.00",
      status: "ACTIVE",
      image:
        "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=400&fit=crop",
    },
  ];

  return (
    <div className="cs-page">
      <header className="cs-header">
        <button className="icon-btn" aria-label="Search">
          <Search size={22} />
        </button>
        <h1 className="title">Community Store</h1>
        <button className="icon-btn" aria-label="Notifications">
          <Bell size={22} />
        </button>
      </header>

      <section className="profile-hero">
        <div className="avatar-wrapper">
          <img className="avatar" src={user.avatar} alt={user.name} />
          <span className="verified-badge">
            <Check size={12} strokeWidth={3} />
          </span>
        </div>
        <h2 className="profile-name">{user.name}</h2>
        <p className="profile-role">{user.role}</p>
        <div className="rating">
          <span className="star">★</span>
          <strong>{user.rating}</strong>
          <span style={{ color: "var(--text-muted)" }}>
            ({user.reviews} reviews)
          </span>
        </div>
      </section>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Spent</div>
          <div className="stat-value">{user.spent}</div>
        </div>
        <div className="stat-card earned">
          <div className="stat-label">Earned</div>
          <div className="stat-value">{user.earned}</div>
        </div>
      </div>

      <div className="vendor-mode">
        <div className="vendor-mode-left">
          <div className="vendor-icon">🏪</div>
          <div className="vendor-text">
            <h4>Vendor Mode</h4>
            <p>Manage your shop and listings</p>
          </div>
        </div>
        <button
          className={`toggle ${vendorMode ? "on" : ""}`}
          onClick={() => setVendorMode(!vendorMode)}
          role="switch"
          aria-checked={vendorMode}
        />
      </div>

      <div className="badges-row">
        <span className="badge">
          <span className="dot" />
          Verified Student
        </span>
        <span className="badge">
          <Clock size={12} /> {user.yearsActive} Years Active
        </span>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === "listings" ? "active" : ""}`}
          onClick={() => setActiveTab("listings")}
        >
          Listings (4)
        </button>
        <button
          className={`tab ${activeTab === "purchases" ? "active" : ""}`}
          onClick={() => setActiveTab("purchases")}
        >
          Purchases
        </button>
        <button
          className={`tab ${activeTab === "settings" ? "active" : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          Settings
        </button>
      </div>

      {activeTab === "listings" && (
        <section className="listings-section">
          <div className="listings-grid">
            {listings.map((item) => (
              <article key={item.id} className="product-card">
                <div className="img-wrap">
                  <img src={item.image} alt={item.title} />
                  <span className="status-tag">{item.status}</span>
                </div>
                <div className="info">
                  <h3 className="card-title">{item.title}</h3>
                  <p className="price">{item.price}</p>
                </div>
              </article>
            ))}
          </div>

          <button className="btn-primary">
            <Plus size={18} />
            Create New Listing
          </button>
        </section>
      )}

      <section className="account-section">
        <p className="section-label">Account Settings</p>
        <div className="settings-list">
          <button
              className="settings-item"
            onClick={() => navigate("/personal-information")}
            >
            <span className="left">
              <User size={18} />
              Personal Information
            </span>
            <span className="chevron">›</span>
          </button>
          <button className="settings-item"
                  onClick={() => navigate("/payment-methods")}
          >
            <span className="left">
              <CreditCard size={18} />
              Payment Methods
            </span>
            <span className="chevron">›</span>
          </button>
          <button className="settings-item">
            <span className="left">
              <Lock size={18} />
              Security & Privacy
            </span>
            <span className="chevron">›</span>
          </button>
        </div>

        <button className="sign-out">
          <LogOut size={16} /> Sign Out
        </button>
      </section>

      <BottomNav />
    </div>
  );
}

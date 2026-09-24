import { ANNOUNCEMENTS, CATEGORIES, TRENDING_ITEMS } from "../utils/data.jsx";
import { Badge, Rating, ShieldIcon } from "../components/Icons.jsx";
import { BottomNav, TopBar } from "../components/Navigation.jsx";
import { useNavigate } from "react-router-dom";

function Home({ onToast }) {
  const navigate = useNavigate();
  return <div className="screen">
    <TopBar onBell={() => onToast("No new notifications")} />
    <div className="scroll-area">
      <div className="hero">
        <div className="hero-circle-1" />
        <div className="hero-circle-2" />
        <div className="verified-badge">
          <ShieldIcon color="white" />
          <span>VERIFIED CAMPUS</span>
        </div><h2 className="hero-greeting">Hello, Alex <span className="role">(Student)</span>
      </h2><div className="search-bar">
        <i className="bi bi-search" />
        <span>Search textbooks, dorm gear...</span>
      </div>
      </div>
      <div className="categories-section">
        <div className="categories-grid">{CATEGORIES.map((cat) =>
            <button key={cat.label} className="category-btn" style={{ background: cat.bg }} onClick={() => navigate("/marketplace")}>{cat.icon}
              <span className="cat-label">{cat.label}</span>
            </button>)}</div>
      </div>
      <div className="trending-section">
        <div className="section-header">
          <h3 className="section-title">Trending in Campus</h3>
          <button className="see-all-btn" onClick={() => navigate("/marketplace")}>SEE ALL</button>
        </div>
        <div className="trending-scroll">{TRENDING_ITEMS.map((item) =>
            <div key={item.id} className="trending-card">
              <div className="trending-card-img-wrap">
                <img src={item.img} alt={item.name} />
                <span className="badge-img-overlay">
                  <Badge type={item.badge} /></span>
              </div>
              <div className="trending-card-body">
                <p className="trending-card-name">{item.name}</p>
                <div className="trending-card-footer">
                  <span className="price">{item.price}</span>
                  <Rating value={item.rating} />
                </div>
              </div>
            </div>)}
        </div>
      </div>
      <div className="announcements-section">
        <h3 className="section-title" style={{ marginBottom: 14 }}>Campus Announcements</h3>{ANNOUNCEMENTS.map((a) =>
          <div key={a.id} className="announcement-card" style={{ background: a.bg }}>
            <div className="announcement-icon">{a.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="announcement-tag" style={{ color: a.tagColor }}>{a.tag}</div>
              <p className="announcement-title">{a.title}
              </p>{a.body && <p className="announcement-body">{a.body}</p>}
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" style={{ flexShrink: 0 }}>
              <path strokeLinecap="round" d="M9 18l6-6-6-6" /></svg>
          </div>)}<div style={{ height: 16 }} />
      </div>
    </div>
    <BottomNav active="home" />
  </div>;
}

export default Home;

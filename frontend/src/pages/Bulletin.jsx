import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { BottomNav, TopBar } from "../components/Navigation.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { getCurrentUser } from "../services/authService.js";
import { SAFE_EXCHANGE_ZONES } from "../utils/format.js";

const INITIAL_POSTS = [
  {
    id: 1,
    category: "BOOK SWAP",
    tagColor: "#1D4ED8",
    bg: "#EFF6FF",
    title: "Weekend Book Swap at Main Quad",
    body: "Bring your last semester textbooks and swap directly with fellow students or pay cash on the spot. Hosted at the Student Union 24/7 Safe Zone.",
    author: "Student Representative Council",
    date: "14 Oct · 10:00 – 15:00",
  },
  {
    id: 2,
    category: "TRUST & SAFETY",
    tagColor: "#D97706",
    bg: "#FEF9C3",
    title: "Safe Campus Exchange Zones & Peer Payment Guide",
    body: "Buying from a student or resident? Use our 24/7 CCTV Safe Exchange Zones for Cash-on-Meetup handovers so nobody has to share private bank details online, or choose Community Store Safe-Pay Escrow at checkout.",
    author: "Campus Trust & Safety Team",
    date: "Active 24/7",
  },
  {
    id: 3,
    category: "VERIFIED VENDORS",
    tagColor: "#16A34A",
    bg: "#DCFCE7",
    title: "Instant Business Checkout for Verified Campus Vendors",
    body: "Verified local vendors now accept Card, Instant EFT (PayFast) and SnapScan QR directly on Community Store with automatic business account settlement.",
    author: "Campus Traders Association",
    date: "Updated this week",
  },
  {
    id: 4,
    category: "SUSTAINABILITY",
    tagColor: "#7C3AED",
    bg: "#F5F3FF",
    title: "Second-Hand Dorm & Electronics Drive",
    body: "Graduating students can list kettles, desk lamps and chargers for incoming first-years. Zero listing fees for verified campus accounts.",
    author: "Green Campus Initiative",
    date: "Ongoing",
  },
];

function Bulletin() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const user = getCurrentUser();

  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [filter, setFilter] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("COMMUNITY");
  const [body, setBody] = useState("");

  const filtered = posts.filter(
    (p) => filter === "ALL" || p.category === filter,
  );

  function handlePost(event) {
    event.preventDefault();
    if (!title.trim() || !body.trim()) {
      showToast("Please add a title and description");
      return;
    }

    const newPost = {
      id: Date.now(),
      category,
      tagColor: "#2563EB",
      bg: "#F8FAFC",
      title: title.trim(),
      body: body.trim(),
      author:
        user?.displayName ||
        [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
        "Community Member",
      date: "Just now",
    };

    setPosts((prev) => [newPost, ...prev]);
    setTitle("");
    setBody("");
    setShowForm(false);
    showToast("Announcement published to Community Bulletin");
  }

  return (
    <div className="screen">
      <TopBar onBell={() => navigate("/notifications")} />

      <div className="scroll-area route-content">
        <div className="page-header">
          <div>
            <h1>Community Bulletin</h1>
            <p>Campus events, book swaps, safe exchange zones & announcements</p>
          </div>

          {user && (
            <button
              type="button"
              className="primary-action small"
              onClick={() => setShowForm((prev) => !prev)}
            >
              <i className={`bi ${showForm ? "bi-x-lg" : "bi-megaphone"}`} />{" "}
              {showForm ? "Cancel" : "Post notice"}
            </button>
          )}
        </div>

        {showForm && (
          <form className="section-card" onSubmit={handlePost}>
            <h2 className="section-title">Post a community notice</h2>
            <div className="form-row">
              <label>
                Category
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="BOOK SWAP">Book Swap</option>
                  <option value="TRUST & SAFETY">Trust & Safety</option>
                  <option value="VERIFIED VENDORS">Vendor Promo</option>
                  <option value="SUSTAINABILITY">Sustainability</option>
                  <option value="COMMUNITY">General Community</option>
                </select>
              </label>

              <label>
                Headline
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Engineering Calculator Swap at Quad"
                  maxLength={100}
                />
              </label>
            </div>

            <label>
              Details
              <textarea
                className="text-area"
                rows="3"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Share the time, safe campus meetup point, and details..."
                maxLength={500}
              />
            </label>

            <button type="submit" className="primary-action small">
              Publish to Bulletin
            </button>
          </form>
        )}

        <div className="filter-options" style={{ marginBottom: 12 }}>
          {[
            "ALL",
            "BOOK SWAP",
            "TRUST & SAFETY",
            "VERIFIED VENDORS",
            "SUSTAINABILITY",
          ].map((tag) => (
            <button
              type="button"
              key={tag}
              className={`filter-pill ${filter === tag ? "active" : ""}`}
              onClick={() => setFilter(tag)}
            >
              {tag === "ALL" ? "All updates" : tag}
            </button>
          ))}
        </div>

        <div className="order-list">
          {filtered.map((post) => (
            <article
              key={post.id}
              className="section-card"
              style={{ borderLeft: `4px solid ${post.tagColor}` }}
            >
              <div className="order-card-head">
                <span
                  className="announcement-tag"
                  style={{ color: post.tagColor }}
                >
                  {post.category} · {post.date}
                </span>
                <small style={{ color: "#64748B" }}>{post.author}</small>
              </div>
              <h2 className="section-title" style={{ marginTop: 6 }}>
                {post.title}
              </h2>
              <p className="section-hint" style={{ marginBottom: 10 }}>
                {post.body}
              </p>
              <div className="order-actions">
                <button
                  type="button"
                  className="ghost-btn small"
                  onClick={() => navigate("/chat")}
                >
                  <i className="bi bi-chat-dots" /> Discuss in Community Lounge
                </button>
                <button
                  type="button"
                  className="ghost-btn small"
                  onClick={() => navigate("/marketplace")}
                >
                  <i className="bi bi-shop" /> Browse listings
                </button>
              </div>
            </article>
          ))}
        </div>

        <section className="section-card">
          <h2 className="section-title">
            <i className="bi bi-shield-check" style={{ color: "#16A34A", marginRight: 6 }} />
            Verified Campus Safe Exchange Zones
          </h2>
          <p className="section-hint">
            Recommended meetup points for Cash-on-Meetup & student handovers:
          </p>
          <div className="safe-zone-grid">
            {SAFE_EXCHANGE_ZONES.map((zone) => (
              <div key={zone.id} className="safe-zone-chip">
                <div>
                  <strong>
                    <i className="bi bi-geo-alt-fill" /> {zone.label}
                  </strong>
                  <small>
                    {zone.address} · {zone.tag}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <BottomNav />
    </div>
  );
}

export default Bulletin;

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ANNOUNCEMENTS,
  CATEGORIES,
} from "../utils/data.jsx";

import { ShieldIcon } from "../components/Icons.jsx";
import { BottomNav, TopBar } from "../components/Navigation.jsx";
import ProductCard from "../components/ProductCard.jsx";
import { Banner, Loader } from "../components/Feedback.jsx";

import {
  getCurrentUser,
  isPendingVendor,
} from "../services/authService.js";
import { getProducts } from "../services/productService.js";
import { normalize } from "../utils/format.js";

function Home() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchDraft, setSearchDraft] = useState("");

  useEffect(() => {
    let active = true;

    getProducts()
        .then((items) => {
          if (active) {
            setProducts(items);
          }
        })
        .catch(() => {
          if (active) {
            setProducts([]);
          }
        })
        .finally(() => {
          if (active) {
            setLoading(false);
          }
        });

    return () => {
      active = false;
    };
  }, []);

  const greetingName =
      user?.displayName ||
      user?.email?.split("@")[0] ||
      "there";

  const roleLabel = user?.role
      ? `(${user.role})`
      : "";
  const trending = useMemo(
      () =>
          [...products]
              .sort((a, b) => Number(b.id || 0) - Number(a.id || 0))
              .slice(0, 6),
      [products],
  );

  /**
   * Category tiles show a live count of matching listings.
   */
  const categoryCounts = useMemo(() => {
    const counts = {};

    CATEGORIES.forEach((category) => {
      const key = normalize(category.label);

      counts[key] = products.filter((product) => {
        if (key === "vendors") {
          return normalize(product.sellerUserType) === "vendor";
        }

        return normalize(product.category) === key;
      }).length;
    });

    return counts;
  }, [products]);

  function openCategory(category) {
    navigate(
        `/marketplace?category=${encodeURIComponent(category)}`,
    );
  }

  function submitSearch(event) {
    event.preventDefault();

    const query = searchDraft.trim();

    navigate(
        query
            ? `/marketplace?q=${encodeURIComponent(query)}`
            : "/marketplace",
    );
  }

  return (
      <div className="screen">
        <TopBar onBell={() => navigate("/notifications")} />

        <div className="scroll-area">
          <div className="hero">
            <div className="hero-circle-1" />
            <div className="hero-circle-2" />

            <div className="verified-badge">
              <ShieldIcon color="white" />
              <span>
              VERIFIED COMMUNITY
            </span>
            </div>

            <h2 className="hero-greeting">
              Hello, {greetingName}{" "}
              <span className="role">
              {roleLabel}
            </span>
            </h2>

            <form
                className="search-bar"
                onSubmit={submitSearch}
                role="search"
            >
              <i className="bi bi-search" />

              <input
                  className="search-input"
                  type="search"
                  value={searchDraft}
                  onChange={(event) => setSearchDraft(event.target.value)}
                  placeholder="Search textbooks, electronics, clothing..."
                  aria-label="Search the marketplace"
              />

              <button
                  type="submit"
                  className="search-go"
                  aria-label="Search"
              >
                Search
              </button>
            </form>
          </div>

          {isPendingVendor(user) && (
              <div className="home-banner-wrap">
                <Banner
                    tone="warning"
                    icon="bi-hourglass-split"
                    title="Vendor account awaiting verification"
                >
                  Your listings stay hidden from buyers until an admin
                  verifies your account. You can still browse and manage
                  your profile.
                </Banner>
              </div>
          )}

          <div className="categories-section">
            <div className="categories-grid">
              {CATEGORIES.map((cat) => (
                  <button
                      type="button"
                      key={cat.label}
                      className="category-btn"
                      style={{
                        background: cat.bg,
                      }}
                      onClick={() =>
                          openCategory(
                              cat.label,
                          )
                      }
                  >
                    {cat.icon}

                    <span className="cat-label">
                  {cat.label}
                </span>
                    <span className="cat-count">
                      {categoryCounts[normalize(cat.label)] ?? 0}
                    </span>
                  </button>
              ))}
            </div>
          </div>

          <div className="trending-section">
            <div className="section-header">
              <h3 className="section-title">
                Trending in Community
              </h3>

              <button
                  type="button"
                  className="see-all-btn"
                  onClick={() =>
                      navigate("/marketplace")
                  }
              >
                SEE ALL
              </button>
            </div>

            {loading && <Loader label="Loading listings..." />}

            {!loading && trending.length === 0 && (
                <p className="section-empty">
                  No listings yet — be the first to sell something.
                </p>
            )}

            {!loading && trending.length > 0 && (
                <div className="trending-scroll">
                  {trending.map((item) => (
                      <ProductCard
                          key={item.id}
                          product={item}
                          showWishlist={false}
                          showAddToCart={false}
                      />
                  ))}
                </div>
            )}
          </div>

          <div className="announcements-section">
            <h3
                className="section-title"
                style={{
                  marginBottom: 14,
                }}
            >
              Community Announcements
            </h3>

            {ANNOUNCEMENTS.map(
                (announcement) => (
                    <button
                        type="button"
                        key={announcement.id}
                        className="announcement-card"
                        style={{
                          background:
                          announcement.bg,
                          width: "100%",
                          textAlign: "left",
                          border: 0,
                        }}
                        onClick={() => navigate("/bulletin")}
                    >
                      <div className="announcement-icon">
                        {
                          announcement.icon
                        }
                      </div>

                      <div
                          style={{
                            flex: 1,
                            minWidth: 0,
                          }}
                      >
                        <div
                            className="announcement-tag"
                            style={{
                              color:
                              announcement.tagColor,
                            }}
                        >
                          {
                            announcement.tag
                          }
                        </div>

                        <p className="announcement-title">
                          {
                            announcement.title
                          }
                        </p>

                        {announcement.body && (
                            <p className="announcement-body">
                              {
                                announcement.body
                              }
                            </p>
                        )}
                      </div>

                      <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#94A3B8"
                          strokeWidth="2"
                          style={{
                            flexShrink: 0,
                          }}
                      >
                        <path
                            strokeLinecap="round"
                            d="M9 18l6-6-6-6"
                        />
                      </svg>
                    </button>
                ),
            )}

            <div
                style={{
                  height: 16,
                }}
            />
          </div>
        </div>

        <BottomNav active="home" />
      </div>
  );
}

export default Home;

import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import { useCart } from "../context/CartContext.jsx";
import {
  getCurrentUser,
  isPendingVendor,
  signOut,
} from "../services/authService.js";
import useWishlist from "../hooks/useWishlist.js";

/**
 * Top navigation bar.
 */
function TopBar({ onBell }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { itemCount } = useCart();
  const wishlist = useWishlist();

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
    navigate("/login", {
      replace: true,
    });
  }

  const displayName =
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "User";

  const dashboardPath =
    user?.role === "ADMIN"
      ? "/admin"
      : "/profile";

  return (
    <div className="topbar">
      <button
        className="topbar-brand"
        onClick={() => navigate("/")}
        aria-label="Go to home"
      >
        <div className="topbar-logo">
          <i className="bi bi-house-heart-fill" />
        </div>

        <span className="topbar-title">
          Community Store
        </span>
      </button>

      <div className="topbar-actions">
        {user ? (
          <Link
            className="auth-user-link"
            to={dashboardPath}
            title="Open your profile"
          >
            <i className="bi bi-person-circle" />

            <span>
              Hi, {displayName}
            </span>

            {isPendingVendor(user) && (
              <i
                className="bi bi-hourglass-split pending-icon"
                title="Awaiting vendor verification"
              />
            )}
          </Link>
        ) : (
          <>
            <Link
              className="auth-login-btn"
              to="/login"
            >
              Sign In
            </Link>

            <Link
              className="auth-register-btn"
              to="/register"
            >
              Register
            </Link>
          </>
        )}

        <button
          type="button"
          className="topbar-icon-btn"
          onClick={() => navigate("/chat")}
          aria-label="Marketplace Chat"
          title="Marketplace Chat"
        >
          <i className="bi bi-chat-dots" />
        </button>

        <button
          type="button"
          className="topbar-icon-btn"
          onClick={() => navigate("/wishlist")}
          aria-label="Wishlist"
          title="Wishlist"
        >
          <i className="bi bi-heart" />

          {wishlist.count > 0 && (
            <span className="icon-count">{wishlist.count}</span>
          )}
        </button>

        <button
          type="button"
          className="topbar-icon-btn"
          onClick={() => navigate("/cart")}
          aria-label="Cart"
          title="Cart"
        >
          <i className="bi bi-bag" />

          {itemCount > 0 && (
            <span className="icon-count">{itemCount}</span>
          )}
        </button>

        {user && (
          <button
            type="button"
            className="auth-logout-btn"
            onClick={handleLogout}
          >
            <i className="bi bi-box-arrow-right" />

            <span>
              Logout
            </span>
          </button>
        )}

        <button
          type="button"
          className="topbar-bell"
          onClick={onBell}
          aria-label="Notifications"
        >
          <i className="bi bi-bell" />

          <span className="dot" />
        </button>
      </div>
    </div>
  );
}

/**
 * Bottom navigation.
 */
function BottomNav({ active }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { itemCount } = useCart();

  const current =
    active ||
    (location.pathname === "/marketplace"
      ? "market"
      : location.pathname.slice(1) || "home");

  function isOn(path) {
    return location.pathname === path;
  }

  return (
    <div className="bottom-nav">
      <button
        type="button"
        className="nav-btn"
        onClick={() => navigate("/")}
      >
        <i
          className={`bi ${
            current === "home"
              ? "bi-house-fill"
              : "bi-house"
          }`}
        />

        <span
          className={`nav-label ${
            current === "home"
              ? "active"
              : ""
          }`}
        >
          Home
        </span>
      </button>

      <button
        type="button"
        className="nav-btn"
        onClick={() => navigate("/marketplace")}
      >
        <i
          className={`bi ${
            current === "market"
              ? "bi-grid-fill"
              : "bi-grid"
          }`}
        />

        <span
          className={`nav-label ${
            current === "market"
              ? "active"
              : ""
          }`}
        >
          Market
        </span>
      </button>

      <button
        type="button"
        className="nav-sell"
        onClick={() => navigate("/sell")}
      >
        <i className="bi bi-plus-circle" />

        <span className="nav-label">
          Sell
        </span>
      </button>

      <button
        type="button"
        className="nav-btn"
        onClick={() => navigate("/chat")}
      >
        <i
          className={`bi ${
            isOn("/chat")
              ? "bi-chat-dots-fill"
              : "bi-chat-dots"
          }`}
        />

        <span
          className={`nav-label ${
            isOn("/chat") ? "active" : ""
          }`}
        >
          Chat
        </span>
      </button>

      <button
        type="button"
        className="nav-btn"
        onClick={() => navigate("/cart")}
      >
        <span className="nav-icon-wrap">
          <i
            className={`bi ${
              isOn("/cart")
                ? "bi-bag-fill"
                : "bi-bag"
            }`}
          />

          {itemCount > 0 && (
            <span className="icon-count">{itemCount}</span>
          )}
        </span>

        <span
          className={`nav-label ${
            isOn("/cart") ? "active" : ""
          }`}
        >
          Cart
        </span>
      </button>

      <button
        type="button"
        className="nav-btn"
        onClick={() => navigate("/profile")}
      >
        <i
          className={`bi ${
            current === "profile"
              ? "bi-person-fill"
              : "bi-person"
          }`}
        />

        <span
          className={`nav-label ${
            current === "profile"
              ? "active"
              : ""
          }`}
        >
          Profile
        </span>
      </button>
    </div>
  );
}

export {
  BottomNav,
  TopBar,
};

import { Home, Store, MessageCircle, User, Plus } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function BottomNav() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="cs-bottom-nav">
      <Link to="/" className={isActive("/") ? "active" : ""}>
        <span className="nav-icon-wrap">
          <Home size={22} />
        </span>
        Home
      </Link>

      <Link
        to="/product"
        className={isActive("/product") ? "active" : ""}
      >
        <span className="nav-icon-wrap">
          <Store size={22} />
        </span>
        Market
      </Link>

      <Link to="/sell" className="sell-btn" aria-label="Sell">
        <Plus size={24} />
      </Link>

      <Link to="/chat" className={isActive("/chat") ? "active" : ""}>
        <span className="nav-icon-wrap">
          <MessageCircle size={22} />
        </span>
        Chat
      </Link>

      <Link to="/profile" className={isActive("/profile") ? "active" : ""}>
        <span className="nav-icon-wrap">
          <User size={22} />
        </span>
        Profile
      </Link>
    </nav>
  );
}

import { Link } from "react-router-dom";
import BottomNav from "../components/BottomNav";

export default function Home() {
  return (
      <div className="cs-page">
        <header className="cs-header">
          <div style={{ width: 34 }} />
          <h1 className="title">Community Store</h1>
          <div style={{ width: 34 }} />
        </header>

        <div className="home-placeholder">
          <h1>🛒 Community Store</h1>
          <p>
            Mobile-first marketplace for students, faculty & local vendors.
          </p>

          <div className="links">
            <Link to="/profile">Go to Profile Page</Link>
            <Link to="/product" className="secondary">
              Go to Product Details
            </Link>
          </div>
        </div>

        <BottomNav />
      </div>
  );
}

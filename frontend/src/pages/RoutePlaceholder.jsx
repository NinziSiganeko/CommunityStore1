import { useNavigate } from "react-router-dom";
import { BottomNav, TopBar } from "../components/Navigation.jsx";

function RoutePlaceholder({ title }) {
  const navigate = useNavigate();
  return <div className="screen">
    <TopBar onBell={() => navigate("/notifications")} />
    <div className="route-state">
      <i className="bi bi-stars" />
      <h1>{title}</h1>
      <p>This route is ready for the next Phase 2 feature.</p>
      <button className="primary-action" onClick={() => navigate("/marketplace")}>Browse marketplace</button>
    </div>
    <BottomNav />
  </div>;
}

export default RoutePlaceholder;

import { useNavigate } from "react-router-dom";

import { BottomNav, TopBar } from "../components/Navigation.jsx";
import { StateMessage } from "../components/Feedback.jsx";

/**
 * Standing page for the features that are still to come
 * (notifications, chat and the bulletin board).
 */
function RoutePlaceholder({ title }) {
  const navigate = useNavigate();

  return (
      <div className="screen">
        <TopBar onBell={() => navigate("/notifications")} />

        <div className="scroll-area route-content">
          <StateMessage
              icon="bi-stars"
              title={title}
              message="This part of Community Store is planned for a later phase."
              actionLabel="Browse marketplace"
              onAction={() => navigate("/marketplace")}
          />
        </div>

        <BottomNav />
      </div>
  );
}

export default RoutePlaceholder;

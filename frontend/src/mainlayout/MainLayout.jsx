
import { Outlet } from "react-router-dom";

import { ToastHost } from "../components/Feedback.jsx";

function MainLayout() {
  return (
      <main className="site-shell">
        <div className="screen-wrapper">
          <ToastHost />
          <Outlet />
        </div>
      </main>
  );
}

export default MainLayout;

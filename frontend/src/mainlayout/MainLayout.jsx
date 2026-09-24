import { Toast } from "../components/Feedback.jsx";
import { Outlet } from "react-router-dom";

function MainLayout({ toast }) {
  return <main className="site-shell">
    <div className="screen-wrapper">
      {toast && <Toast message={toast} key={toast + Date.now()} />}
      <Outlet />
    </div>
  </main>;
}

export default MainLayout;

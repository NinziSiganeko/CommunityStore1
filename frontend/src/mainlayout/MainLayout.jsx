import AppRoutes from "../routes/AppRoutes.jsx";
import { Toast } from "../components/Feedback.jsx";

function MainLayout({ screen, toast, onNav, onToast }) {
  return <main className="site-shell">
    <div className="screen-wrapper">
      {toast && <Toast message={toast} key={toast + Date.now()} />}
      <AppRoutes screen={screen} onNav={onNav} onToast={onToast} />
    </div>
  </main>;
}

export default MainLayout;

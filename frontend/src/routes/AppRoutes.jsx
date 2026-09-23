import Home from "../pages/Home.jsx";
import Marketplace from "../pages/Marketplace.jsx";

function AppRoutes({ screen, onNav, onToast }) {
  if (screen === "home") return <Home onNav={onNav} onToast={onToast} />;
  if (screen === "market") return <Marketplace onNav={onNav} onToast={onToast} />;
  return null;
}

export default AppRoutes;

import { useRef, useState } from "react";
import MainLayout from "./mainlayout/MainLayout.jsx";

function App() {
  const [screen, setScreen] = useState("home");
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  function showToast(message) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }

  function handleNav(id) {
    if (id === "home" || id === "market") setScreen(id);
    else if (id === "sell") showToast("List an Item — coming in Sprint 3 🛒");
    else if (id === "chat") showToast("Chat — coming in Sprint 4 💬");
    else if (id === "profile") showToast("Profile — assigned to another team member 👤");
  }

  return <MainLayout screen={screen} toast={toast} onNav={handleNav} onToast={showToast} />;
}

export default App;

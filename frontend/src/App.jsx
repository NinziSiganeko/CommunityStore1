import { useRef, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes.jsx";

function App() {
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  function showToast(message) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }

  return <BrowserRouter>
    <AppRoutes toast={toast} onToast={showToast} />
  </BrowserRouter>;
}

export default App;

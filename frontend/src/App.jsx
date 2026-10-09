import { BrowserRouter } from "react-router-dom";

import AppRoutes from "./routes/AppRoutes.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";

function App() {
    return (
        <BrowserRouter>
            <ToastProvider>
                <CartProvider>
                    <AppRoutes />
                </CartProvider>
            </ToastProvider>
        </BrowserRouter>
    );
}

export default App;
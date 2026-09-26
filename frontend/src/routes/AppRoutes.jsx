import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Home from "../pages/Home.jsx";
import Marketplace from "../pages/Marketplace.jsx";
import ProductDetails from "../pages/ProductDetails.jsx";
import Login from "../pages/Login.jsx";
import Register from "../pages/Register.jsx";
import Sell from "../pages/Sell.jsx";
import RoutePlaceholder from "../pages/RoutePlaceholder.jsx";
import MainLayout from "../mainlayout/MainLayout.jsx";
import { isAuthenticated } from "../services/authService.js";

function RequireAuth({ children }) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

function AuthOnly({ children }) {
  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppRoutes({ toast, onToast }) {
  return <Routes>
    <Route element={<MainLayout toast={toast} />}>
      <Route path="/" element={<Home onToast={onToast} />} />
      <Route path="/marketplace" element={<Marketplace onToast={onToast} />} />
      <Route path="/product/:id" element={<ProductDetails onToast={onToast} />} />

      <Route
          path="/login"
          element={
            <AuthOnly>
              <Login onToast={onToast} />
            </AuthOnly>
          }
      />
      <Route
          path="/register"
          element={
            <AuthOnly>
              <Register onToast={onToast} />
            </AuthOnly>
          }
      />

      <Route
          path="/sell"
          element={
            <RequireAuth>
              <Sell onToast={onToast} />
            </RequireAuth>
          }
      />

      {[
        ["cart", "Cart"],
        ["checkout", "Checkout"],
        ["orders", "Orders"],
        ["profile", "Profile"],
        ["notifications", "Notifications"],
        ["chat", "Chat & Community"],
        ["bulletin", "Bulletin"],
        ["wishlist", "Wishlist"],
        ["my-listings", "My Listings"],
        ["admin", "Admin Dashboard"],
      ].map(([path, title]) => (
          <Route key={path} path={`/${path}`} element={<RoutePlaceholder title={title} />} />
      ))}
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}

export default AppRoutes;

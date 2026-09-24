import Home from "../pages/Home.jsx";
import Marketplace from "../pages/Marketplace.jsx";
import ProductDetails from "../pages/ProductDetails.jsx";
import RoutePlaceholder from "../pages/RoutePlaceholder.jsx";
import MainLayout from "../mainlayout/MainLayout.jsx";
import { Navigate, Route, Routes } from "react-router-dom";

function AppRoutes({ toast, onToast }) {
  return <Routes>
    <Route element={<MainLayout toast={toast} />}>
      <Route path="/" element={<Home onToast={onToast} />} />
      <Route path="/marketplace" element={<Marketplace onToast={onToast} />} />
      <Route path="/product/:id" element={<ProductDetails onToast={onToast} />} />
      {[
        ["cart", "Cart"],
        ["checkout", "Checkout"],
        ["orders", "Orders"],
        ["sell", "Sell Item"],
        ["profile", "Profile"],
        ["notifications", "Notifications"],
        ["chat", "Chat & Community"],
        ["bulletin", "Bulletin"],
        ["login", "Login"],
        ["register", "Register"],
        ["wishlist", "Wishlist"],
        ["my-listings", "My Listings"],
        ["admin", "Admin Dashboard"],
      ].map(([path, title]) => <Route key={path} path={`/${path}`} element={<RoutePlaceholder title={title} />} />)}
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}

export default AppRoutes;

import {
    Navigate,
    Route,
    Routes,
    useLocation,
} from "react-router-dom";

import Home from "../pages/Home.jsx";
import Marketplace from "../pages/Marketplace.jsx";
import ProductDetails from "../pages/ProductDetails.jsx";
import Login from "../pages/Login.jsx";
import Register from "../pages/Register.jsx";
import Sell from "../pages/Sell.jsx";
import Profile from "../pages/Profile.jsx";
import Cart from "../pages/Cart.jsx";
import Checkout from "../pages/Checkout.jsx";
import Orders from "../pages/Orders.jsx";
import OrderDetails from "../pages/OrderDetails.jsx";
import MyListings from "../pages/MyListings.jsx";
import Wishlist from "../pages/Wishlist.jsx";
import SellerOrders from "../pages/SellerOrders.jsx";
import AdminDashboard from "../pages/AdminDashboard.jsx";
import RoutePlaceholder from "../pages/RoutePlaceholder.jsx";
import MainLayout from "../mainlayout/MainLayout.jsx";

import {
    isAuthenticated,
} from "../services/authService.js";

function RequireAuth({ children }) {
    const location = useLocation();

    if (!isAuthenticated()) {
        return (
            <Navigate
                to="/login"
                replace
                state={{
                    from: location.pathname,
                }}
            />
        );
    }

    return children;
}

function AuthOnly({ children }) {
    if (isAuthenticated()) {
        return (
            <Navigate
                to="/"
                replace
            />
        );
    }

    return children;
}

/*
 * Features that intentionally stay placeholders until their
 * phase lands: chat, the bulletin board and notifications.
 */
const PLACEHOLDER_ROUTES = [
    ["notifications", "Notifications"],
    ["chat", "Chat & Community"],
    ["bulletin", "Bulletin"],
];

function AppRoutes() {
    return (
        <Routes>
            <Route element={<MainLayout />}>
                <Route
                    path="/"
                    element={<Home />}
                />

                <Route
                    path="/marketplace"
                    element={<Marketplace />}
                />

                <Route
                    path="/product/:id"
                    element={<ProductDetails />}
                />

                <Route
                    path="/cart"
                    element={<Cart />}
                />

                <Route
                    path="/wishlist"
                    element={<Wishlist />}
                />

                <Route
                    path="/login"
                    element={
                        <AuthOnly>
                            <Login />
                        </AuthOnly>
                    }
                />

                <Route
                    path="/register"
                    element={
                        <AuthOnly>
                            <Register />
                        </AuthOnly>
                    }
                />

                <Route
                    path="/sell"
                    element={
                        <RequireAuth>
                            <Sell />
                        </RequireAuth>
                    }
                />
                <Route
                    path="/profile"
                    element={
                        <RequireAuth>
                            <Profile />
                        </RequireAuth>
                    }
                />

                <Route
                    path="/checkout"
                    element={
                        <RequireAuth>
                            <Checkout />
                        </RequireAuth>
                    }
                />

                <Route
                    path="/orders"
                    element={
                        <RequireAuth>
                            <Orders />
                        </RequireAuth>
                    }
                />

                <Route
                    path="/orders/:orderId"
                    element={
                        <RequireAuth>
                            <OrderDetails />
                        </RequireAuth>
                    }
                />

                <Route
                    path="/my-listings"
                    element={
                        <RequireAuth>
                            <MyListings />
                        </RequireAuth>
                    }
                />
                <Route
                    path="/seller-orders"
                    element={
                        <RequireAuth>
                            <SellerOrders />
                        </RequireAuth>
                    }
                />

                <Route
                    path="/admin"
                    element={
                        <RequireAuth>
                            <AdminDashboard />
                        </RequireAuth>
                    }
                />

                {PLACEHOLDER_ROUTES.map(
                    ([path, title]) => (
                        <Route
                            key={path}
                            path={`/${path}`}
                            element={
                                <RoutePlaceholder
                                    title={title}
                                />
                            }
                        />
                    ),
                )}
            </Route>

            <Route
                path="*"
                element={
                    <Navigate
                        to="/"
                        replace
                    />
                }
            />
        </Routes>
    );
}

export default AppRoutes;
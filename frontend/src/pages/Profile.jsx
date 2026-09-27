import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav, TopBar } from "../components/Navigation.jsx";
import {
    getCurrentUser,
    isAuthenticated,
} from "../services/authService.js";
import apiClient from "../services/apiClient.js";
import { getAllProducts } from "../services/productService.js";

function formatCurrency(value) {
    return new Intl.NumberFormat("en-ZA", {
        style: "currency",
        currency: "ZAR",
        minimumFractionDigits: 2,
    })
        .format(Number(value || 0))
        .replace(/\u00a0/g, " ");
}

function formatDate(value) {
    if (!value) {
        return "Date unavailable";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return date.toLocaleDateString("en-ZA", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function Profile({ onToast }) {
    const navigate = useNavigate();
    const user = getCurrentUser();

    const [listings, setListings] = useState([]);
    const [orders, setOrders] = useState([]);

    const [loadingListings, setLoadingListings] = useState(true);
    const [loadingOrders, setLoadingOrders] = useState(true);

    useEffect(() => {
        if (!isAuthenticated()) {
            navigate("/login", {
                replace: true,
                state: { from: "/profile" },
            });

            return;
        }

        if (!user?.userId) {
            navigate("/login", {
                replace: true,
            });

            return;
        }

        let active = true;

        async function loadProfileData() {
            const [productsResult, ordersResult] =
                await Promise.allSettled([
                    getAllProducts(),
                    apiClient.get(`/orders/buyer/${user.userId}`),
                ]);

            if (!active) {
                return;
            }

            if (productsResult.status === "fulfilled") {
                const myListings =
                    productsResult.value.filter(
                        (product) =>
                            String(product.sellerUserId) ===
                            String(user.userId),
                    );

                setListings(myListings);
            }

            setLoadingListings(false);

            if (ordersResult.status === "fulfilled") {
                const data = ordersResult.value.data;

                setOrders(
                    Array.isArray(data) ? data : [],
                );
            }

            setLoadingOrders(false);
        }

        loadProfileData();

        return () => {
            active = false;
        };
    }, [navigate, user?.userId]);

    const displayName =
        user?.displayName ||
        user?.email?.split("@")[0] ||
        "User";

    return (
        <div className="screen">
            <TopBar
                onBell={() => onToast("No new notifications")}
            />

            <div className="scroll-area route-content">
                {/* Profile heading */}
                <div
                    style={{
                        background: "#ffffff",
                        borderRadius: 16,
                        padding: 20,
                        marginBottom: 16,
                        border: "1px solid #F1F5F9",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 14,
                        }}
                    >
                        <div
                            style={{
                                width: 56,
                                height: 56,
                                borderRadius: "50%",
                                background: "#DBEAFE",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#2563EB",
                                fontSize: 26,
                                flexShrink: 0,
                            }}
                        >
                            <i className="bi bi-person-fill" />
                        </div>

                        <div style={{ minWidth: 0 }}>
                            <h1
                                style={{
                                    margin: 0,
                                    color: "#0F172A",
                                    fontSize: 22,
                                }}
                            >
                                {displayName}
                            </h1>

                            <p
                                style={{
                                    margin: "5px 0 0",
                                    color: "#64748B",
                                    fontSize: 14,
                                    wordBreak: "break-word",
                                }}
                            >
                                {user?.email || "No email available"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* My Listings */}
                <section
                    style={{
                        background: "#ffffff",
                        borderRadius: 16,
                        padding: 16,
                        marginBottom: 16,
                        border: "1px solid #F1F5F9",
                    }}
                >
                    <div
                        className="section-header"
                        style={{
                            padding: "0 0 12px",
                        }}
                    >
                        <h2 className="section-title">
                            My Listings
                        </h2>

                        <button
                            className="see-all-btn"
                            onClick={() =>
                                navigate("/marketplace")
                            }
                        >
                            MARKETPLACE
                        </button>
                    </div>

                    {loadingListings ? (
                        <p style={{ color: "#64748B" }}>
                            Loading your listings...
                        </p>
                    ) : listings.length === 0 ? (
                        <div
                            style={{
                                textAlign: "center",
                                padding: "20px 8px",
                                color: "#64748B",
                            }}
                        >
                            <i
                                className="bi bi-shop"
                                style={{
                                    fontSize: 28,
                                    color: "#94A3B8",
                                }}
                            />

                            <p style={{ margin: "8px 0" }}>
                                You have no listings yet.
                            </p>

                            <button
                                className="primary-action"
                                onClick={() => navigate("/sell")}
                            >
                                List an Item
                            </button>
                        </div>
                    ) : (
                        <div className="market-grid">
                            {listings.map((product) => (
                                <div
                                    key={product.id}
                                    className="product-card"
                                    onClick={() =>
                                        navigate(
                                            `/product/${product.id}`,
                                        )
                                    }
                                >
                                    <div className="product-img-wrap">
                                        <img
                                            src={product.img}
                                            alt={product.name}
                                        />
                                    </div>

                                    <div className="product-body">
                                        <p className="product-name">
                                            {product.name}
                                        </p>

                                        <div className="product-footer">
                      <span className="price">
                        {product.price}
                      </span>

                                            <span
                                                style={{
                                                    fontSize: 10,
                                                    color:
                                                        product.stock > 0
                                                            ? "#15803D"
                                                            : "#B91C1C",
                                                    fontWeight: 600,
                                                }}
                                            >
                        {product.stock > 0
                            ? `${product.stock} left`
                            : "Sold out"}
                      </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* My Purchases */}
                <section
                    style={{
                        background: "#ffffff",
                        borderRadius: 16,
                        padding: 16,
                        border: "1px solid #F1F5F9",
                    }}
                >
                    <div className="section-header" style={{ padding: "0 0 12px" }}>
                        <h2 className="section-title">
                            My Purchases
                        </h2>
                    </div>

                    {loadingOrders ? (
                        <p style={{ color: "#64748B" }}>
                            Loading your purchases...
                        </p>
                    ) : orders.length === 0 ? (
                        <div
                            style={{
                                textAlign: "center",
                                padding: "20px 8px",
                                color: "#64748B",
                            }}
                        >
                            <i
                                className="bi bi-bag"
                                style={{
                                    fontSize: 28,
                                    color: "#94A3B8",
                                }}
                            />

                            <p style={{ margin: "8px 0 0" }}>
                                You haven't bought anything yet.
                            </p>
                        </div>
                    ) : (
                        <div
                            style={{
                                display: "grid",
                                gap: 10,
                            }}
                        >
                            {orders.map((order) => {
                                const itemNames =
                                    order.orderItems
                                        ?.map(
                                            (item) =>
                                                item.product?.name,
                                        )
                                        .filter(Boolean)
                                        .join(", ") ||
                                    "Order items";

                                return (
                                    <button
                                        key={order.orderId}
                                        onClick={() =>
                                            navigate(
                                                `/orders`,
                                            )
                                        }
                                        style={{
                                            border: "1px solid #E2E8F0",
                                            background: "#F8FAFC",
                                            borderRadius: 12,
                                            padding: 14,
                                            textAlign: "left",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent:
                                                    "space-between",
                                                gap: 12,
                                            }}
                                        >
                                            <strong
                                                style={{
                                                    color: "#0F172A",
                                                    fontSize: 13,
                                                }}
                                            >
                                                {order.orderNumber ||
                                                    `Order #${order.orderId}`}
                                            </strong>

                                            <strong
                                                style={{
                                                    color: "#2563EB",
                                                    fontSize: 13,
                                                }}
                                            >
                                                {formatCurrency(
                                                    order.totalAmount,
                                                )}
                                            </strong>
                                        </div>

                                        <p
                                            style={{
                                                margin: "6px 0",
                                                color: "#475569",
                                                fontSize: 12,
                                            }}
                                        >
                                            {itemNames}
                                        </p>

                                        <span
                                            style={{
                                                color: "#94A3B8",
                                                fontSize: 11,
                                            }}
                                        >
                      {formatDate(
                          order.orderDate,
                      )}
                    </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </section>

                <div style={{ height: 16 }} />
            </div>

            <BottomNav active="profile" />
        </div>
    );
}

export default Profile;
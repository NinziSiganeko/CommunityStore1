import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { BottomNav, TopBar } from "../components/Navigation.jsx";
import { Loader, StateMessage } from "../components/Feedback.jsx";

import { getCurrentUser } from "../services/authService.js";
import { getErrorMessage } from "../services/apiClient.js";
import { getOrdersForBuyer } from "../services/orderService.js";
import {
    formatDate,
    paymentMethodLabel,
} from "../utils/format.js";

function Orders() {
    const navigate = useNavigate();
    const user = getCurrentUser();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadOrders = useCallback(async () => {
        if (!user?.userId) {
            setLoading(false);
            setError("Please sign in again to see your orders.");
            return;
        }

        setLoading(true);

        try {
            const data = await getOrdersForBuyer(user.userId);

            setOrders(data);
            setError(null);
        } catch (requestError) {
            setError(
                getErrorMessage(
                    requestError,
                    "We couldn't load your orders. Please try again.",
                ),
            );
        } finally {
            setLoading(false);
        }
    }, [user?.userId]);

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    const spend = orders.reduce(
        (total, order) => total + Number(order.totalAmount || 0),
        0,
    );

    return (
        <div className="screen">
            <TopBar onBell={() => navigate("/notifications")} />

            <div className="scroll-area route-content">
                <div className="page-header">
                    <div>
                        <h1>My orders</h1>

                        <p>
                            {orders.length} order{orders.length === 1 ? "" : "s"}
                            {orders.length > 0
                                ? ` · ${new Intl.NumberFormat("en-ZA", {
                                    style: "currency",
                                    currency: "ZAR",
                                })
                                    .format(spend)
                                    .replace(/\u00a0/g, " ")} in total`
                                : ""}
                        </p>
                    </div>

                    <button
                        type="button"
                        className="ghost-btn"
                        onClick={loadOrders}
                        disabled={loading}
                    >
                        <i className="bi bi-arrow-clockwise" />
                        Refresh
                    </button>
                </div>

                {loading && <Loader label="Loading your orders..." />}

                {!loading && error && (
                    <StateMessage
                        tone="error"
                        icon="bi-wifi-off"
                        title="Orders unavailable"
                        message={error}
                        actionLabel="Try again"
                        onAction={loadOrders}
                    />
                )}

                {!loading && !error && orders.length === 0 && (
                    <StateMessage
                        icon="bi-receipt"
                        title="No orders yet"
                        message="Once you check out, your purchases appear here with the seller details."
                        actionLabel="Browse marketplace"
                        onAction={() => navigate("/marketplace")}
                    />
                )}

                {!loading && !error && orders.length > 0 && (
                    <div className="order-list">
                        {orders.map((order) => (
                            <button
                                type="button"
                                key={order.orderId}
                                className="order-card"
                                onClick={() => navigate(`/orders/${order.orderId}`)}
                            >
                                <div className="order-card-head">
                                    <div>
                                        <strong>{order.orderNumber}</strong>
                                        <span>{formatDate(order.orderDate)}</span>
                                    </div>

                                    <span className="status-pill ok">Confirmed</span>
                                </div>

                                <div className="order-thumbs">
                                    {order.items.slice(0, 4).map((item) => (
                                        <img
                                            key={item.orderItemId ?? item.productId}
                                            src={item.img}
                                            alt={item.name}
                                        />
                                    ))}

                                    {order.items.length > 4 && (
                                        <span className="order-thumb-more">
                        +{order.items.length - 4}
                      </span>
                                    )}
                                </div>

                                <p className="order-card-items">
                                    {order.items
                                        .map((item) => `${item.quantity} × ${item.name}`)
                                        .join(", ")}
                                </p>

                                <div className="order-card-foot">
                        <span>
                          {paymentMethodLabel(order.paymentMethod)}
                        </span>

                                    <strong>{order.totalAmountFormatted}</strong>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    );
}

export default Orders;
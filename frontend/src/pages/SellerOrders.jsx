import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { BottomNav, TopBar } from "../components/Navigation.jsx";
import { Loader, StateMessage } from "../components/Feedback.jsx";

import { getCurrentUser } from "../services/authService.js";
import { getErrorMessage } from "../services/apiClient.js";
import {
    getOrdersForSeller,
    respondToSellerOrder,
} from "../services/orderService.js";

import {
    formatDateTime,
    paymentMethodLabel,
} from "../utils/format.js";

import { useToast } from "../context/ToastContext.jsx";

function SellerOrders() {
    const navigate = useNavigate();
    const user = getCurrentUser();
    const { showToast } = useToast();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processingId, setProcessingId] = useState(null);

    const loadOrders = useCallback(async () => {
        if (!user?.userId) {
            setLoading(false);
            setError("Please sign in again to view your seller orders.");
            return;
        }

        setLoading(true);

        try {
            const data = await getOrdersForSeller(user.userId);
            setOrders(data);
            setError(null);
        } catch (requestError) {
            setError(
                getErrorMessage(
                    requestError,
                    "We couldn't load your seller orders.",
                ),
            );
        } finally {
            setLoading(false);
        }
    }, [user?.userId]);

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    async function handleDecision(order, decision) {
        const action = decision === "ACCEPT" ? "accept" : "reject";

        const confirmed = window.confirm(
            `Are you sure you want to ${action} ${order.orderNumber}?`,
        );

        if (!confirmed) {
            return;
        }

        setProcessingId(order.orderId);

        try {
            const updatedOrder = await respondToSellerOrder(
                order.orderId,
                user.userId,
                decision,
            );

            setOrders((previous) =>
                previous.map((existing) =>
                    existing.orderId === updatedOrder.orderId
                        ? updatedOrder
                        : existing,
                ),
            );

            showToast(
                decision === "ACCEPT"
                    ? "Order accepted. Stock has been reserved."
                    : "Order request rejected.",
            );

            // Reload to keep the seller's order list in sync with the API.
            await loadOrders();
        } catch (requestError) {
            showToast(
                getErrorMessage(
                    requestError,
                    `We couldn't ${action} this order.`,
                ),
            );
        } finally {
            setProcessingId(null);
        }
    }

    function statusLabel(status) {
        switch (status) {
            case "PENDING_SELLER_CONFIRMATION":
                return "Awaiting your response";
            case "CONFIRMED":
                return "Accepted";
            case "REJECTED":
                return "Rejected";
            case "CANCELLED":
                return "Cancelled";
            default:
                return status || "Unknown";
        }
    }

    function statusTone(status) {
        if (status === "PENDING_SELLER_CONFIRMATION") {
            return "warn";
        }

        if (status === "REJECTED" || status === "CANCELLED") {
            return "danger";
        }

        return "ok";
    }

    return (
        <div className="screen">
            <TopBar onBell={() => navigate("/notifications")} />

            <div className="scroll-area route-content">
                <div className="page-header">
                    <div>
                        <h1>Seller orders</h1>
                        <p>
                            Review requests, confirm stock and arrange payment
                            or collection with buyers.
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

                {loading && <Loader label="Loading seller orders..." />}

                {!loading && error && (
                    <StateMessage
                        tone="error"
                        icon="bi-wifi-off"
                        title="Seller orders unavailable"
                        message={error}
                        actionLabel="Try again"
                        onAction={loadOrders}
                    />
                )}

                {!loading && !error && orders.length === 0 && (
                    <StateMessage
                        icon="bi-inbox"
                        title="No order requests yet"
                        message="When a buyer requests one of your listings, the request will appear here."
                        actionLabel="View my listings"
                        onAction={() => navigate("/my-listings")}
                    />
                )}

                {!loading && !error && orders.length > 0 && (
                    <div className="order-list">
                        {orders.map((order) => {
                            const isPending =
                                order.status === "PENDING_SELLER_CONFIRMATION";

                            const isProcessing =
                                processingId === order.orderId;

                            return (
                                <section
                                    key={order.orderId}
                                    className="section-card"
                                >
                                    <div className="order-card-head">
                                        <div>
                                            <strong>{order.orderNumber}</strong>
                                            <span>
                                                {formatDateTime(order.orderDate)}
                                            </span>
                                        </div>

                                        <span
                                            className={`status-pill ${statusTone(
                                                order.status,
                                            )}`}
                                        >
                                            {statusLabel(order.status)}
                                        </span>
                                    </div>

                                    <div className="detail-grid">
                                        <div>
                                            <span>Buyer</span>
                                            <strong>
                                                {order.buyerName || "Buyer"}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Buyer email</span>
                                            <strong>
                                                {order.buyerEmail || "Not provided"}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Payment preference</span>
                                            <strong>
                                                {paymentMethodLabel(
                                                    order.paymentMethod,
                                                )}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Collection / handover details</span>
                                            <strong>
                                                {order.shippingAddress ||
                                                    "Arrange with the buyer"}
                                            </strong>
                                        </div>
                                    </div>

                                    <h2 className="section-title">
                                        Requested items
                                    </h2>

                                    <div className="order-item-list">
                                        {order.items.map((item) => (
                                            <div
                                                key={
                                                    item.orderItemId ??
                                                    item.productId
                                                }
                                                className="order-item"
                                            >
                                                {item.img && (
                                                    <img
                                                        src={item.img}
                                                        alt={item.name}
                                                    />
                                                )}

                                                <div className="order-item-body">
                                                    <strong>{item.name}</strong>
                                                    <p className="cart-row-meta">
                                                        {item.quantity} ×{" "}
                                                        {item.unitPriceFormatted}
                                                    </p>
                                                </div>

                                                <strong className="order-item-subtotal">
                                                    {item.subtotalFormatted}
                                                </strong>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="summary-row total">
                                        <span>Order total</span>
                                        <strong>
                                            {order.totalAmountFormatted}
                                        </strong>
                                    </div>

                                    {order.buyerEmail && (
                                        <p>
                                            <a
                                                className="inline-link"
                                                href={`mailto:${order.buyerEmail}?subject=${encodeURIComponent(
                                                    `Community Store order ${order.orderNumber}`,
                                                )}`}
                                            >
                                                <i className="bi bi-envelope" />
                                                Email buyer to arrange details
                                            </a>
                                        </p>
                                    )}

                                    {isPending ? (
                                        <div className="order-actions">
                                            <button
                                                type="button"
                                                className="primary-action"
                                                disabled={isProcessing}
                                                onClick={() =>
                                                    handleDecision(
                                                        order,
                                                        "ACCEPT",
                                                    )
                                                }
                                            >
                                                {isProcessing
                                                    ? "Processing..."
                                                    : "Accept order"}
                                            </button>

                                            <button
                                                type="button"
                                                className="ghost-btn danger"
                                                disabled={isProcessing}
                                                onClick={() =>
                                                    handleDecision(
                                                        order,
                                                        "REJECT",
                                                    )
                                                }
                                            >
                                                Reject request
                                            </button>
                                        </div>
                                    ) : (
                                        <p className="summary-note">
                                            This request has already been
                                            processed. Its status is{" "}
                                            {statusLabel(order.status).toLowerCase()}.
                                        </p>
                                    )}
                                </section>
                            );
                        })}
                    </div>
                )}
            </div>

            <BottomNav active="profile" />
        </div>
    );
}

export default SellerOrders;
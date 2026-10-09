import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { BottomNav, TopBar } from "../components/Navigation.jsx";
import { Loader } from "../components/Feedback.jsx";

import { getCurrentUser } from "../services/authService.js";
import { getMessagesForUser } from "../services/chatService.js";
import { getOrdersForBuyer } from "../services/orderService.js";
import { formatDateTime, paymentMethodLabel } from "../utils/format.js";

function Notifications() {
    const navigate = useNavigate();
    const user = getCurrentUser();

    const [orders, setOrders] = useState([]);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;

        if (!user?.userId) {
            setLoading(false);
            return undefined;
        }

        Promise.allSettled([
            getOrdersForBuyer(user.userId),
            getMessagesForUser(user.userId),
        ]).then(([ordersRes, msgRes]) => {
            if (!active) {
                return;
            }

            if (ordersRes.status === "fulfilled") {
                setOrders(ordersRes.value);
            }
            if (msgRes.status === "fulfilled") {
                setMessages(msgRes.value);
            }
            setLoading(false);
        });

        return () => {
            active = false;
        };
    }, [user?.userId]);

    const incomingMessages = messages
        .filter(
            (m) =>
                Number(m.recipientId) === Number(user?.userId) &&
                Number(m.senderId) !== Number(user?.userId),
        )
        .slice(-5)
        .reverse();

    return (
        <div className="screen">
            <TopBar onBell={() => navigate("/notifications")} />

            <div className="scroll-area route-content">
                <div className="page-header">
                    <div>
                        <h1>Notifications</h1>
                        <p>Order updates, payment alerts & seller messages</p>
                    </div>

                    <button
                        type="button"
                        className="ghost-btn small"
                        onClick={() => navigate("/chat")}
                    >
                        <i className="bi bi-chat-dots" /> Open Chat
                    </button>
                </div>

                {loading && <Loader label="Checking alerts..." />}

                {!loading && (
                    <div className="order-list">
                        {incomingMessages.map((msg) => (
                            <button
                                type="button"
                                key={`msg-${msg.messageId}`}
                                className="order-card"
                                onClick={() =>
                                    navigate(
                                        `/chat?sellerId=${msg.senderId}&sellerName=${encodeURIComponent(
                                            msg.senderName,
                                        )}`,
                                    )
                                }
                            >
                                <div className="order-card-head">
                                    <div>
                                        <strong>
                                            <i
                                                className="bi bi-chat-dots-fill"
                                                style={{ color: "#2563EB", marginRight: 6 }}
                                            />
                                            Message from {msg.senderName} ({msg.senderRole})
                                        </strong>
                                        <span>{formatDateTime(msg.sentAt)}</span>
                                    </div>
                                    <span
                                        className={`status-pill ${msg.readByRecipient ? "ok" : "warn"}`}
                                    >
                    {msg.readByRecipient ? "Read" : "New"}
                  </span>
                                </div>
                                <p className="order-card-items">{msg.content}</p>
                            </button>
                        ))}

                        {orders.map((order) => {
                            const isCash =
                                String(order.paymentMethod || "").toUpperCase() === "CASH";
                            return (
                                <button
                                    type="button"
                                    key={`ord-${order.orderId}`}
                                    className="order-card"
                                    onClick={() => navigate(`/orders/${order.orderId}`)}
                                >
                                    <div className="order-card-head">
                                        <div>
                                            <strong>
                                                <i
                                                    className={`bi ${
                                                        isCash ? "bi-cash-coin" : "bi-shield-check"
                                                    }`}
                                                    style={{ color: "#16A34A", marginRight: 6 }}
                                                />
                                                {order.orderNumber} ·{" "}
                                                {paymentMethodLabel(order.paymentMethod)}
                                            </strong>
                                            <span>{formatDateTime(order.orderDate)}</span>
                                        </div>
                                        <span className={`status-pill ${isCash ? "warn" : "ok"}`}>
                      {isCash ? "Cash on Meetup" : "Paid"}
                    </span>
                                    </div>
                                    <p className="order-card-items">
                                        {isCash
                                            ? `Bring ${order.totalAmountFormatted} in cash to "${order.shippingAddress}". Tap to view or message seller.`
                                            : `Payment of ${order.totalAmountFormatted} recorded. Tap to view receipt or confirm collection.`}
                                    </p>
                                </button>
                            );
                        })}

                        <button
                            type="button"
                            className="order-card"
                            onClick={() => navigate("/bulletin")}
                        >
                            <div className="order-card-head">
                                <div>
                                    <strong>
                                        <i
                                            className="bi bi-geo-alt-fill"
                                            style={{ color: "#D97706", marginRight: 6 }}
                                        />
                                        Campus Safety Tip: 24/7 Safe Exchange Zones
                                    </strong>
                                    <span>Campus Trust & Safety</span>
                                </div>
                                <span className="status-pill ok">Active</span>
                            </div>
                            <p className="order-card-items">
                                Meet student sellers at the Student Union 24/7 Safe Zone or Main
                                Library Desk when paying Cash on Meetup.
                            </p>
                        </button>
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    );
}

export default Notifications;
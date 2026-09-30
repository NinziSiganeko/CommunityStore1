import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { BottomNav, TopBar } from "../components/Navigation.jsx";
import { Banner, StateMessage } from "../components/Feedback.jsx";

import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

import { getCurrentUser } from "../services/authService.js";
import { getErrorMessage } from "../services/apiClient.js";
import {
    createOrder,
    createPaymentForOrder,
} from "../services/orderService.js";
import { getProductById } from "../services/productService.js";
import { getUserById } from "../services/userService.js";

import {
    PAYMENT_METHODS,
    formatCurrency,
} from "../utils/format.js";

const MIN_ADDRESS_LENGTH = 10;
const MAX_ADDRESS_LENGTH = 200;

function Checkout() {
    const navigate = useNavigate();
    const { items, subtotal, itemCount, clearCart } = useCart();
    const { showToast } = useToast();

    const user = getCurrentUser();

    const [address, setAddress] = useState(user?.address || "");
    const [paymentMethod, setPaymentMethod] = useState("CREDIT_CARD");
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [addressTouched, setAddressTouched] = useState(false);

    /* Pre-fill the delivery address from the profile when available. */
    useEffect(() => {
        if (!user?.userId) {
            return;
        }

        let active = true;

        getUserById(user.userId)
            .then((profile) => {
                if (active && profile.address) {
                    setAddress((current) => current || profile.address);
                }
            })
            .catch(() => {
                // The stored session details are good enough here.
            });

        return () => {
            active = false;
        };
    }, [user?.userId]);

    const addressIsValid = useMemo(() => {
        const trimmed = address.trim();

        return (
            trimmed.length >= MIN_ADDRESS_LENGTH &&
            trimmed.length <= MAX_ADDRESS_LENGTH
        );
    }, [address]);

    const hasUnavailable = items.some(
        (item) => item.unavailable || item.stock < 1,
    );

    async function placeOrder() {
        setError(null);
        setAddressTouched(true);

        if (items.length === 0) {
            setError("Your cart is empty.");
            return;
        }

        if (!addressIsValid) {
            setError(
                `Please give a delivery or pickup address between ${MIN_ADDRESS_LENGTH} and ${MAX_ADDRESS_LENGTH} characters.`,
            );
            return;
        }

        if (!user?.userId) {
            navigate("/login", {
                state: { from: "/checkout" },
            });

            return;
        }

        setSubmitting(true);

        try {
            /*
             * Prices and stock come from the API again, never from the
             * possibly stale cart, so the totals sent to the backend are
             * the ones the server will validate.
             */
            const fresh = await Promise.allSettled(
                items.map((item) => getProductById(item.productId)),
            );

            const orderItems = [];
            const problems = [];

            fresh.forEach((result, index) => {
                const cartItem = items[index];

                if (result.status === "rejected") {
                    problems.push(`${cartItem.name} is no longer available.`);
                    return;
                }

                const product = result.value;

                if (!product.isPubliclyListed) {
                    problems.push(
                        `${product.name} is sold by a vendor that is not verified yet.`,
                    );
                    return;
                }

                if (product.stock < cartItem.quantity) {
                    problems.push(
                        product.stock < 1
                            ? `${product.name} is sold out.`
                            : `Only ${product.stock} × ${product.name} left.`,
                    );
                    return;
                }

                orderItems.push({
                    productId: product.id,
                    quantity: cartItem.quantity,
                    unitPrice: product.priceValue,
                });
            });

            if (problems.length > 0) {
                setError(
                    `Please review your cart: ${problems.join(" ")}`,
                );

                setSubmitting(false);
                return;
            }

            const orderTotal = orderItems.reduce(
                (total, item) => total + item.unitPrice * item.quantity,
                0,
            );

            const order = await createOrder({
                buyer: user,
                items: orderItems,
                paymentMethod,
                shippingAddress: address.trim(),
            });

            /*
             * The order exists at this point. A failed payment record
             * must not lose it, so failures are only reported.
             */
            let paymentWarning = false;

            try {
                await createPaymentForOrder({
                    orderId: order.orderId,
                    buyerId: user.userId,
                    amount: order.totalAmount || orderTotal,
                    method: paymentMethod,
                });
            } catch {
                paymentWarning = true;
            }

            clearCart();

            showToast(
                paymentWarning
                    ? "Order placed — we couldn't store the payment reference"
                    : "Order placed successfully",
            );

            navigate(`/orders/${order.orderId}`, {
                replace: true,
                state: {
                    justPlaced: true,
                    paymentWarning,
                },
            });
        } catch (requestError) {
            const status = requestError?.response?.status;

            setError(
                status === 409
                    ? getErrorMessage(
                        requestError,
                        "One of your items sold out before the order was placed.",
                    )
                    : getErrorMessage(
                        requestError,
                        "We couldn't place your order. Please try again.",
                    ),
            );
        } finally {
            setSubmitting(false);
        }
    }

    if (items.length === 0) {
        return (
            <div className="screen">
                <TopBar onBell={() => navigate("/notifications")} />

                <div className="scroll-area route-content">
                    <StateMessage
                        icon="bi-bag-x"
                        title="Nothing to check out"
                        message="Your cart is empty, so there is nothing to pay for yet."
                        actionLabel="Browse marketplace"
                        onAction={() => navigate("/marketplace")}
                    />
                </div>

                <BottomNav />
            </div>
        );
    }

    return (
        <div className="screen">
            <TopBar onBell={() => navigate("/notifications")} />

            <div className="scroll-area route-content checkout-content">
                <div className="page-header">
                    <div>
                        <h1>Checkout</h1>
                        <p>
                            {itemCount} item{itemCount === 1 ? "" : "s"} ·{" "}
                            {formatCurrency(subtotal)}
                        </p>
                    </div>

                    <button
                        type="button"
                        className="ghost-btn"
                        onClick={() => navigate("/cart")}
                    >
                        <i className="bi bi-pencil" />
                        Edit cart
                    </button>
                </div>

                {hasUnavailable && (
                    <Banner tone="warning" icon="bi-exclamation-triangle">
                        Some items are no longer available.{" "}
                        <button
                            type="button"
                            className="inline-link"
                            onClick={() => navigate("/cart")}
                        >
                            Review your cart
                        </button>{" "}
                        before continuing.
                    </Banner>
                )}

                <section className="section-card">
                    <h2 className="section-title">Collection / delivery address</h2>

                    <p className="section-hint">
                        This is shared with the seller so you can agree on a safe
                        exchange point or campus delivery.
                    </p>

                    <textarea
                        className={`text-area ${addressTouched && !addressIsValid ? "invalid" : ""}`}
                        rows="3"
                        maxLength={MAX_ADDRESS_LENGTH}
                        value={address}
                        onChange={(event) => setAddress(event.target.value)}
                        onBlur={() => setAddressTouched(true)}
                        placeholder="e.g. 12 Campus Road, Residence Block B, Room 214"
                    />

                    <p className="field-help">
                        {address.trim().length}/{MAX_ADDRESS_LENGTH} characters
                    </p>
                </section>

                <section className="section-card">
                    <h2 className="section-title">Payment method</h2>

                    <div className="payment-grid">
                        {PAYMENT_METHODS.map((method) => (
                            <button
                                type="button"
                                key={method.value}
                                className={`payment-option ${
                                    paymentMethod === method.value ? "selected" : ""
                                }`}
                                onClick={() => setPaymentMethod(method.value)}
                            >
                                <i
                                    className={`bi ${
                                        paymentMethod === method.value
                                            ? "bi-record-circle"
                                            : "bi-circle"
                                    }`}
                                />

                                <span>
                  <strong>{method.label}</strong>
                  <small>{method.hint}</small>
                </span>
                            </button>
                        ))}
                    </div>

                    <p className="section-hint">
                        Payments are recorded against the order. Real card processing
                        is part of the security-hardening phase.
                    </p>
                </section>

                <section className="section-card">
                    <h2 className="section-title">Order summary</h2>

                    <div className="summary-list">
                        {items.map((item) => (
                            <div key={item.productId} className="summary-line">
                    <span className="summary-line-name">
                      {item.quantity} × {item.name}
                    </span>

                                <span>
                  {formatCurrency(item.price * item.quantity)}
                </span>
                            </div>
                        ))}
                    </div>

                    <div className="summary-row total">
                        <span>Total</span>
                        <strong>{formatCurrency(subtotal)}</strong>
                    </div>

                    <p className="summary-note">
                        The backend recalculates the total from the current listing
                        prices when the order is created.
                    </p>
                </section>

                {error && (
                    <Banner tone="error" icon="bi-exclamation-octagon" title="Checkout paused">
                        {error}
                    </Banner>
                )}

                <button
                    type="button"
                    className="primary-action full"
                    onClick={placeOrder}
                    disabled={submitting || hasUnavailable}
                >
                    {submitting
                        ? "Placing your order..."
                        : `Place order · ${formatCurrency(subtotal)}`}
                </button>

                <button
                    type="button"
                    className="ghost-btn full"
                    onClick={() => navigate("/cart")}
                    disabled={submitting}
                >
                    Back to cart
                </button>
            </div>

            <BottomNav />
        </div>
    );
}

export default Checkout;
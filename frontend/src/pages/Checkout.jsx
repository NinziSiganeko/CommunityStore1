import { useState } from "react";
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

import {
    PAYMENT_METHODS,
    formatCurrency,
} from "../utils/format.js";

const MIN_DETAILS_LENGTH = 10;
const MAX_DETAILS_LENGTH = 200;

function Checkout() {
    const navigate = useNavigate();

    const {
        items,
        subtotal,
        itemCount,
        removeItem,
    } = useCart();

    const { showToast } = useToast();
    const user = getCurrentUser();

    const [handoverDetails, setHandoverDetails] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("CASH");
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [detailsTouched, setDetailsTouched] = useState(false);

    const handoverDetailsValid =
        handoverDetails.trim().length >= MIN_DETAILS_LENGTH &&
        handoverDetails.trim().length <= MAX_DETAILS_LENGTH;

    const hasUnavailable = items.some(
        (item) => item.unavailable || item.stock < 1,
    );

    async function placeOrder() {
        setError(null);
        setDetailsTouched(true);

        if (items.length === 0) {
            setError("Your cart is empty.");
            return;
        }

        if (!handoverDetailsValid) {
            setError(
                `Please describe the collection/delivery plan using ${MIN_DETAILS_LENGTH}–${MAX_DETAILS_LENGTH} characters.`,
            );
            return;
        }

        if (!user?.userId) {
            navigate("/login", {
                state: { from: "/checkout" },
            });
            return;
        }

        if (hasUnavailable) {
            setError(
                "Please remove unavailable items from the cart before continuing.",
            );
            return;
        }

        setSubmitting(true);

        try {
            /*
             * Refresh each product before checkout.
             * Never rely on stale cart prices or stock.
             */
            const freshResults = await Promise.allSettled(
                items.map((item) =>
                    getProductById(item.productId),
                ),
            );

            const problems = [];
            const sellerGroups = new Map();

            freshResults.forEach((result, index) => {
                const cartItem = items[index];

                if (result.status === "rejected") {
                    problems.push(
                        `${cartItem.name} is no longer available.`,
                    );
                    return;
                }

                const product = result.value;

                if (!product.isPubliclyListed) {
                    problems.push(
                        `${product.name} belongs to a vendor that has not been verified.`,
                    );
                    return;
                }

                if (product.stock < cartItem.quantity) {
                    problems.push(
                        product.stock < 1
                            ? `${product.name} is sold out.`
                            : `Only ${product.stock} × ${product.name} remain.`,
                    );
                    return;
                }

                if (!product.sellerUserId) {
                    problems.push(
                        `${product.name} has no valid seller account.`,
                    );
                    return;
                }

                /*
                 * Each seller receives a separate order. This avoids
                 * combining different sellers' payments into one order.
                 */
                const sellerKey = String(product.sellerUserId);

                if (!sellerGroups.has(sellerKey)) {
                    sellerGroups.set(sellerKey, {
                        sellerId: product.sellerUserId,
                        sellerName: product.seller || "Seller",
                        items: [],
                    });
                }

                sellerGroups.get(sellerKey).items.push({
                    productId: product.id,
                    quantity: cartItem.quantity,
                    unitPrice: product.priceValue,
                    cartProductId: cartItem.productId,
                    productName: product.name,
                });
            });

            if (problems.length > 0) {
                setError(
                    `Please review your cart: ${problems.join(" ")}`,
                );
                return;
            }

            const placedOrders = [];
            const failedSellers = [];
            let paymentWarning = false;

            /*
             * Process seller orders independently.
             * One failed seller order does not hide successfully
             * created orders or remove failed items from the cart.
             */
            for (const group of sellerGroups.values()) {
                try {
                    const order = await createOrder({
                        buyer: user,
                        items: group.items.map((item) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                        })),
                        paymentMethod,
                        shippingAddress: handoverDetails.trim(),
                    });

                    placedOrders.push({
                        order,
                        group,
                    });

                    /*
                     * This records a pending payment arrangement.
                     * It is not proof that Cash or EFT was received.
                     */
                    try {
                        await createPaymentForOrder({
                            orderId: order.orderId,
                            buyerId: user.userId,
                            amount: order.totalAmount,
                            method: paymentMethod,
                            status: "PENDING",
                        });
                    } catch {
                        paymentWarning = true;
                    }
                } catch {
                    failedSellers.push(group.sellerName);
                }
            }

            if (placedOrders.length === 0) {
                setError(
                    "No order could be placed. Your cart has been kept so you can try again.",
                );
                return;
            }

            /*
             * Remove only items belonging to orders that were
             * successfully created.
             */
            const successfullyOrderedIds = new Set();

            placedOrders.forEach(({ group }) => {
                group.items.forEach((item) => {
                    successfullyOrderedIds.add(
                        String(item.cartProductId),
                    );
                });
            });

            successfullyOrderedIds.forEach((productId) => {
                removeItem(productId);
            });

            if (failedSellers.length > 0) {
                showToast(
                    "Some orders could not be placed. Those items remain in your cart.",
                );
            } else if (paymentWarning) {
                showToast(
                    "Orders created. Some pending payment references could not be saved.",
                );
            } else {
                showToast(
                    "Order request sent. Payment remains pending until arranged with the seller.",
                );
            }

            /*
             * Open an individual order when there is one.
             * With several sellers, show the order list.
             */
            if (
                placedOrders.length === 1 &&
                failedSellers.length === 0
            ) {
                navigate(
                    `/orders/${placedOrders[0].order.orderId}`,
                    {
                        replace: true,
                        state: {
                            justPlaced: true,
                            paymentWarning,
                        },
                    },
                );
            } else {
                navigate("/orders", {
                    replace: true,
                });
            }
        } catch (requestError) {
            setError(
                getErrorMessage(
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
                <TopBar
                    onBell={() => navigate("/notifications")}
                />

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
            <TopBar
                onBell={() => navigate("/notifications")}
            />

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
                    <Banner
                        tone="warning"
                        icon="bi-exclamation-triangle"
                    >
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
                    <h2 className="section-title">
                        Collection / delivery plan
                    </h2>

                    <p className="section-hint">
                        Describe a safe collection point or delivery
                        arrangement. Avoid entering your full home
                        address unless it is genuinely necessary.
                    </p>

                    <textarea
                        className={`text-area ${
                            detailsTouched && !handoverDetailsValid
                                ? "invalid"
                                : ""
                        }`}
                        rows="3"
                        maxLength={MAX_DETAILS_LENGTH}
                        value={handoverDetails}
                        onChange={(event) =>
                            setHandoverDetails(event.target.value)
                        }
                        onBlur={() => setDetailsTouched(true)}
                        placeholder="e.g. I can meet at the CPUT main entrance after 14:00."
                    />

                    <p className="field-help">
                        {handoverDetails.trim().length}/
                        {MAX_DETAILS_LENGTH} characters
                    </p>
                </section>

                <section className="section-card">
                    <h2 className="section-title">
                        Payment method
                    </h2>

                    <p className="section-hint">
                        Community Store does not collect or store your
                        card details. Choose how you and the seller
                        will arrange payment.
                    </p>

                    <div className="payment-grid">
                        {PAYMENT_METHODS.map((method) => (
                            <button
                                type="button"
                                key={method.value}
                                className={`payment-option ${
                                    paymentMethod === method.value
                                        ? "selected"
                                        : ""
                                }`}
                                onClick={() =>
                                    setPaymentMethod(method.value)
                                }
                                disabled={submitting}
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

                    {paymentMethod === "CASH" ? (
                        <Banner
                            tone="info"
                            icon="bi-people"
                            title="Cash payment"
                        >
                            Agree on a safe public meetup. Inspect
                            the item before paying, and do not mark
                            the payment as completed until the cash
                            has actually changed hands.
                        </Banner>
                    ) : (
                        <Banner
                            tone="info"
                            icon="bi-bank"
                            title="EFT payment"
                        >
                            Confirm the order with the seller before
                            transferring money. Do not share banking
                            details in a public listing or send money
                            merely because an order was created.
                        </Banner>
                    )}

                    <p className="section-hint">
                        Online card payments are not enabled yet.
                        They require a configured payment gateway
                        and verified payment confirmation.
                    </p>
                </section>

                <section className="section-card">
                    <h2 className="section-title">
                        Order summary
                    </h2>

                    <div className="summary-list">
                        {items.map((item) => (
                            <div
                                key={item.productId}
                                className="summary-line"
                            >
                                <span className="summary-line-name">
                                    {item.quantity} × {item.name}
                                </span>

                                <span>
                                    {formatCurrency(
                                        item.price * item.quantity,
                                    )}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="summary-row total">
                        <span>Total</span>
                        <strong>
                            {formatCurrency(subtotal)}
                        </strong>
                    </div>

                    <p className="summary-note">
                        Each seller gets a separate order. The backend
                        rechecks prices and stock before saving it.
                    </p>
                </section>

                {error && (
                    <Banner
                        tone="error"
                        icon="bi-exclamation-octagon"
                        title="Checkout paused"
                    >
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
                        ? "Submitting order..."
                        : `Submit order · ${formatCurrency(subtotal)}`}
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
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { BottomNav, TopBar } from "../components/Navigation.jsx";
import {
    Banner,
    ConfirmButton,
    Loader,
    StateMessage,
} from "../components/Feedback.jsx";

import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

import { isAuthenticated } from "../services/authService.js";
import { getProductById } from "../services/productService.js";
import { conditionLabel, formatCurrency } from "../utils/format.js";

function Cart() {
    const navigate = useNavigate();
    const {
        items,
        itemCount,
        subtotal,
        clearCart,
        removeItem,
        replaceItem,
        setQuantity,
    } = useCart();
    const { showToast } = useToast();

    const [checking, setChecking] = useState(items.length > 0);
    const [notices, setNotices] = useState([]);

    /*
     * Validation is keyed on which products are in the cart, not on
     * every quantity tweak, so refreshing prices cannot start a loop.
     */
    const itemsRef = useRef(items);
    itemsRef.current = items;

    const itemKey = items
        .map((item) => String(item.productId))
        .join("|");

    /*
     * Prices and stock are re-checked when the cart opens (and whenever
     * the line-up changes): another buyer may have taken the last item
     * while it sat here.
     */
    useEffect(() => {
        const currentItems = itemsRef.current;

        if (currentItems.length === 0) {
            setChecking(false);
            setNotices([]);
            return undefined;
        }

        let active = true;

        setChecking(true);

        Promise.allSettled(
            currentItems.map((item) => getProductById(item.productId)),
        ).then((results) => {
            if (!active) {
                return;
            }

            const freshNotices = [];

            results.forEach((result, index) => {
                const item = currentItems[index];

                if (result.status === "rejected") {
                    replaceItem(item.productId, {
                        stock: 0,
                        unavailable: true,
                    });

                    freshNotices.push(
                        `${item.name} is no longer available and was left out.`,
                    );

                    return;
                }

                const product = result.value;

                const changes = {
                    name: product.name,
                    price: product.priceValue,
                    img: product.img,
                    stock: product.stock,
                    unavailable: product.stock < 1,
                };

                if (product.stock < 1) {
                    freshNotices.push(`${product.name} is sold out.`);
                } else if (product.stock < item.quantity) {
                    changes.quantity = product.stock;

                    freshNotices.push(
                        `Only ${product.stock} × ${product.name} left — quantity adjusted.`,
                    );
                }

                replaceItem(item.productId, changes);
            });

            setNotices(freshNotices);
            setChecking(false);
        });

        return () => {
            active = false;
        };
    }, [itemKey, replaceItem]);

    const hasUnavailable = items.some(
        (item) => item.unavailable || item.stock < 1,
    );

    function goToCheckout() {
        if (!isAuthenticated()) {
            showToast("Please sign in to check out");

            navigate("/login", {
                state: { from: "/checkout" },
            });

            return;
        }

        navigate("/checkout");
    }

    return (
        <div className="screen">
            <TopBar onBell={() => navigate("/notifications")} />

            <div className="scroll-area route-content">
                <div className="page-header">
                    <div>
                        <h1>Your cart</h1>

                        <p>
                            {itemCount === 0
                                ? "Nothing here yet"
                                : `${itemCount} item${itemCount === 1 ? "" : "s"} ready for checkout`}
                        </p>
                    </div>

                    {items.length > 0 && (
                        <ConfirmButton
                            label="Clear"
                            confirmLabel="Confirm clear"
                            icon="bi-trash3"
                            onConfirm={() => {
                                clearCart();
                                showToast("Cart cleared");
                            }}
                        />
                    )}
                </div>

                {notices.length > 0 && (
                    <Banner tone="warning" icon="bi-exclamation-triangle">
                        <ul className="banner-list">
                            {notices.map((notice) => (
                                <li key={notice}>{notice}</li>
                            ))}
                        </ul>
                    </Banner>
                )}

                {checking && <Loader label="Checking availability..." />}

                {!checking && items.length === 0 && (
                    <StateMessage
                        icon="bi-bag"
                        title="Your cart is empty"
                        message="Add a textbook, gadget or service from the marketplace to get started."
                        actionLabel="Browse marketplace"
                        onAction={() => navigate("/marketplace")}
                    />
                )}

                {!checking && items.length > 0 && (
                    <>
                        <div className="cart-list">
                            {items.map((item) => {
                                const unavailable = item.unavailable || item.stock < 1;

                                return (
                                    <div
                                        key={item.productId}
                                        className={`cart-row ${unavailable ? "unavailable" : ""}`}
                                    >
                                        <img
                                            className="cart-thumb"
                                            src={item.img}
                                            alt={item.name}
                                            onClick={() => navigate(`/product/${item.productId}`)}
                                        />

                                        <div className="cart-row-body">
                                            <button
                                                type="button"
                                                className="cart-row-name"
                                                onClick={() => navigate(`/product/${item.productId}`)}
                                            >
                                                {item.name}
                                            </button>

                                            <p className="cart-row-meta">
                                                {item.category || "Uncategorised"}
                                                {" · "}
                                                {conditionLabel(item.condition)}
                                                {item.seller ? ` · ${item.seller}` : ""}
                                            </p>

                                            <p className="cart-row-price">
                                                {formatCurrency(item.price)} each
                                            </p>

                                            {unavailable ? (
                                                <span className="status-pill warn">
                          No longer available
                        </span>
                                            ) : (
                                                <div className="cart-row-controls">
                                                    <div
                                                        className="qty-stepper small"
                                                        role="group"
                                                        aria-label={`Quantity for ${item.name}`}
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setQuantity(item.productId, item.quantity - 1)
                                                            }
                                                            disabled={item.quantity <= 1}
                                                            aria-label="Decrease quantity"
                                                        >
                                                            <i className="bi bi-dash-lg" />
                                                        </button>

                                                        <span>{item.quantity}</span>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setQuantity(item.productId, item.quantity + 1)
                                                            }
                                                            disabled={item.quantity >= item.stock}
                                                            aria-label="Increase quantity"
                                                        >
                                                            <i className="bi bi-plus-lg" />
                                                        </button>
                                                    </div>

                                                    <span className="cart-line-total">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            className="cart-remove"
                                            onClick={() => {
                                                removeItem(item.productId);
                                                showToast(`${item.name} removed`);
                                            }}
                                            aria-label={`Remove ${item.name}`}
                                        >
                                            <i className="bi bi-x-lg" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="summary-card">
                            <div className="summary-row">
                                <span>Items</span>
                                <strong>{itemCount}</strong>
                            </div>

                            <div className="summary-row total">
                                <span>Order total</span>
                                <strong>{formatCurrency(subtotal)}</strong>
                            </div>

                            <p className="summary-note">
                                Delivery or pickup is arranged directly with each seller
                                after checkout.
                            </p>

                            {hasUnavailable && (
                                <p className="summary-warning">
                                    Remove unavailable items to continue.
                                </p>
                            )}

                            <button
                                type="button"
                                className="primary-action full"
                                onClick={goToCheckout}
                                disabled={hasUnavailable}
                            >
                                Proceed to checkout
                            </button>

                            <button
                                type="button"
                                className="ghost-btn full"
                                onClick={() => navigate("/marketplace")}
                            >
                                Continue shopping
                            </button>
                        </div>
                    </>
                )}
            </div>

            <BottomNav />
        </div>
    );
}

export default Cart;
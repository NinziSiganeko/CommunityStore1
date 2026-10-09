import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { BottomNav, TopBar } from "../components/Navigation.jsx";
import {
  Banner,
  ConfirmButton,
  Loader,
  StateMessage,
} from "../components/Feedback.jsx";

import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

import { getCurrentUser } from "../services/authService.js";
import { getErrorMessage } from "../services/apiClient.js";
import {
  cancelOrder,
  confirmOrderPayment,
  fetchProductById,
  getOrderById,
  getPaymentForOrder,
} from "../services/orderService.js";
import { mapProduct } from "../services/productService.js";

import {
  PAYMENT_METHODS,
  formatDateTime,
  paymentMethodLabel,
  payoutTypeLabel,
} from "../utils/format.js";

function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addItem } = useCart();
  const { showToast } = useToast();

  const user = getCurrentUser();
  const justPlaced = Boolean(location.state?.justPlaced);

  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState(false);
  const [showSwitchMethod, setShowSwitchMethod] = useState(false);
  const [switchMethod, setSwitchMethod] = useState("EFT");
  const [switchNote, setSwitchNote] = useState("");

  useEffect(() => {
    let active = true;

    setLoading(true);

    Promise.all([getOrderById(orderId), getPaymentForOrder(orderId)])
      .then(([orderData, paymentData]) => {
        if (!active) {
          return;
        }

        setOrder(orderData);
        setPayment(paymentData);
        setError(null);
      })
      .catch((requestError) => {
        if (!active) {
          return;
        }

        setError(
          getErrorMessage(
            requestError,
            "We couldn't load this order.",
          ),
        );
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [orderId]);

  function openChatForItem(item) {
    const first = item || order?.items?.[0];
    const params = new URLSearchParams();

    if (first?.sellerUserId) {
      params.set("sellerId", String(first.sellerUserId));
    }
    if (first?.sellerName) {
      params.set("sellerName", first.sellerName);
    }
    if (first?.sellerUserType) {
      params.set("sellerRole", first.sellerUserType);
    }
    if (first?.productId) {
      params.set("productId", String(first.productId));
    }
    if (order?.orderId) {
      params.set("orderId", String(order.orderId));
    }
    if (order?.orderNumber) {
      params.set("orderNumber", order.orderNumber);
    }

    navigate(`/chat?${params.toString()}`);
  }

  async function handleConfirmCashHandover() {
    setUpdatingPayment(true);
    try {
      const updated = await confirmOrderPayment(order.orderId, {
        method: payment?.method || order.paymentMethod || "CASH",
        paymentDetails:
          payment?.paymentDetails ||
          `Cash paid in person at ${order.shippingAddress}`,
        payoutType: "DIRECT_ON_MEETUP",
        handoverConfirmed: true,
      });
      setPayment(updated);
      showToast("Cash handover & collection confirmed!");
    } catch (requestError) {
      showToast(
        getErrorMessage(
          requestError,
          "We couldn't update the payment status.",
        ),
      );
    } finally {
      setUpdatingPayment(false);
    }
  }

  async function handleReleaseEscrow() {
    setUpdatingPayment(true);
    try {
      const updated = await confirmOrderPayment(order.orderId, {
        method: payment?.method || order.paymentMethod,
        paymentDetails: payment?.paymentDetails,
        payoutType: payment?.payoutType,
        handoverConfirmed: true,
      });
      setPayment(updated);
      showToast("Item collection confirmed — payout released to seller!");
    } catch (requestError) {
      showToast(
        getErrorMessage(
          requestError,
          "We couldn't confirm collection right now.",
        ),
      );
    } finally {
      setUpdatingPayment(false);
    }
  }

  async function handleSwitchAndCompletePayment() {
    setUpdatingPayment(true);
    try {
      const detailText =
        switchNote.trim() ||
        `${paymentMethodLabel(switchMethod)} · Agreed with seller for Order ${order.orderNumber}`;

      const updated = await confirmOrderPayment(order.orderId, {
        method: switchMethod,
        paymentDetails: detailText,
        payoutType:
          switchMethod === "CASH"
            ? "DIRECT_ON_MEETUP"
            : "ESCROW_PEER_PROTECTION",
        handoverConfirmed: switchMethod !== "CASH",
      });

      setPayment(updated);
      setOrder((prev) =>
        prev ? { ...prev, paymentMethod: switchMethod } : prev,
      );
      setShowSwitchMethod(false);
      showToast(`Payment completed via ${paymentMethodLabel(switchMethod)}`);
    } catch (requestError) {
      showToast(
        getErrorMessage(
          requestError,
          "We couldn't update the payment method.",
        ),
      );
    } finally {
      setUpdatingPayment(false);
    }
  }

  async function buyAgain() {
    const productIds = order.items
      .map((item) => item.productId)
      .filter(Boolean);

    if (productIds.length === 0) {
      showToast("These listings are no longer available");
      return;
    }

    const results = await Promise.allSettled(
      productIds.map((productId) => fetchProductById(productId)),
    );

    let added = 0;
    let skipped = 0;

    results.forEach((result) => {
      if (result.status === "rejected") {
        skipped += 1;
        return;
      }

      const product = mapProduct(result.value);

      if (!product.isPubliclyListed || product.stock < 1) {
        skipped += 1;
        return;
      }

      addItem(product, 1);
      added += 1;
    });

    if (added === 0) {
      showToast("Nothing could be added — these listings are unavailable");
      return;
    }

    showToast(
      skipped > 0
        ? `${added} item${added === 1 ? "" : "s"} added, ${skipped} unavailable`
        : "Items added back to your cart",
    );

    navigate("/cart");
  }

  async function handleCancel() {
    setCancelling(true);

    try {
      await cancelOrder(order.orderId);
      showToast("Order cancelled and stock returned");
      navigate("/orders", { replace: true });
    } catch (requestError) {
      showToast(
        getErrorMessage(requestError, "We couldn't cancel this order."),
      );
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="screen">
        <TopBar onBell={() => navigate("/notifications")} />

        <div className="scroll-area route-content">
          <Loader label="Loading order..." />
        </div>

        <BottomNav />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="screen">
        <TopBar onBell={() => navigate("/notifications")} />

        <div className="scroll-area route-content">
          <StateMessage
            tone="error"
            icon="bi-receipt"
            title="Order unavailable"
            message={error || "This order could not be found."}
            actionLabel="Back to orders"
            onAction={() => navigate("/orders")}
          />
        </div>

        <BottomNav />
      </div>
    );
  }

  const isBuyer =
    !user?.userId || String(order.buyerId) === String(user.userId);

  const effectiveMethod = String(
    payment?.method || order.paymentMethod || "EFT",
  ).toUpperCase();
  const isCashOrder = effectiveMethod === "CASH";
  const isPaymentCompleted = payment
    ? payment.status === "COMPLETED"
    : !isCashOrder;
  const isHandoverConfirmed = Boolean(payment?.handoverConfirmed);

  return (
    <div className="screen">
      <TopBar onBell={() => navigate("/notifications")} />

      <div className="scroll-area route-content">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate("/orders")}
        >
          <i className="bi bi-arrow-left" /> All orders
        </button>

        {justPlaced && (
          <Banner
            tone="success"
            icon="bi-check-circle"
            title={
              isCashOrder
                ? "Order reserved — Pay Cash on Meetup"
                : "Order & Payment Confirmed"
            }
          >
            {isCashOrder
              ? "Your item is reserved! Message the seller in Chat to confirm your campus Safe Zone meetup and bring cash on collection."
              : "Your payment has been recorded. Coordinate collection with the seller using Chat below."}

            {location.state?.paymentWarning && (
              <span className="banner-subnote">
                The payment reference could not be stored — mention this order
                number when you meet.
              </span>
            )}
          </Banner>
        )}

        {!isBuyer && (
          <Banner
            tone="warning"
            icon="bi-shield-exclamation"
            title="Different account"
          >
            This order belongs to another account. You are viewing it in
            read-only mode.
          </Banner>
        )}

        <div className="page-header">
          <div>
            <h1>{order.orderNumber}</h1>
            <p>{formatDateTime(order.orderDate)}</p>
          </div>

          <span
            className={`status-pill ${
              isPaymentCompleted && isHandoverConfirmed
                ? "ok"
                : isPaymentCompleted
                  ? "ok"
                  : "warn"
            }`}
          >
            {isPaymentCompleted && isHandoverConfirmed
              ? "Completed & Settled"
              : isPaymentCompleted
                ? "Paid · Ready to Collect"
                : "Cash Due on Meetup"}
          </span>
        </div>

        {/* ── Order & Payment Lifecycle Progress ── */}
        <section className="section-card">
          <h2 className="section-title">Order & payment progress</h2>
          <div className="order-stepper">
            <div className="order-step done">
              <div className="order-step-dot">
                <i className="bi bi-check-lg" />
              </div>
              <div>
                <strong>1. Order Reserved</strong>
                <small>Stock locked for you</small>
              </div>
            </div>

            <div
              className={`order-step ${
                isPaymentCompleted ? "done" : "current"
              }`}
            >
              <div className="order-step-dot">
                <i
                  className={`bi ${
                    isPaymentCompleted ? "bi-check-lg" : "bi-cash-coin"
                  }`}
                />
              </div>
              <div>
                <strong>
                  2.{" "}
                  {isPaymentCompleted
                    ? "Payment Recorded"
                    : "Pay Cash at Meetup"}
                </strong>
                <small>{paymentMethodLabel(effectiveMethod)}</small>
              </div>
            </div>

            <div
              className={`order-step ${
                isHandoverConfirmed
                  ? "done"
                  : isPaymentCompleted
                    ? "current"
                    : ""
              }`}
            >
              <div className="order-step-dot">
                <i
                  className={`bi ${
                    isHandoverConfirmed ? "bi-check-lg" : "bi-geo-alt"
                  }`}
                />
              </div>
              <div>
                <strong>
                  3.{" "}
                  {isHandoverConfirmed
                    ? "Collected & Settled"
                    : "Campus Handover"}
                </strong>
                <small>
                  {isHandoverConfirmed
                    ? "Seller payout complete"
                    : "Meet at Safe Zone & confirm"}
                </small>
              </div>
            </div>
          </div>
        </section>

        {/* ── Payment & Seller Settlement Details ── */}
        <section className="section-card">
          <div className="section-header" style={{ padding: 0 }}>
            <h2 className="section-title">Payment & seller settlement</h2>
            <span
              className={`status-pill ${isPaymentCompleted ? "ok" : "warn"}`}
            >
              {isPaymentCompleted ? "PAID" : "PENDING ON MEETUP"}
            </span>
          </div>

          <div className="detail-grid" style={{ marginTop: 10 }}>
            <div>
              <span>Payment method</span>
              <strong>{paymentMethodLabel(effectiveMethod)}</strong>
            </div>

            <div>
              <span>Amount</span>
              <strong>{order.totalAmountFormatted}</strong>
            </div>

            <div>
              <span>Reference</span>
              <strong>
                {payment?.transactionReference || `REF-${order.orderNumber}`}
              </strong>
            </div>

            <div>
              <span>Seller payout routing</span>
              <strong>
                {payoutTypeLabel(
                  payment?.payoutType,
                  order.items[0]?.sellerUserType,
                )}
              </strong>
            </div>
          </div>

          {payment?.paymentDetails && (
            <div className="payment-receipt-note">
              <i className="bi bi-shield-check" />
              <span>{payment.paymentDetails}</span>
            </div>
          )}

          {/* Post-checkout actions for pending cash or unconfirmed escrow */}
          {isBuyer && !isPaymentCompleted && (
            <div className="post-payment-actions">
              <p className="summary-note">
                Meeting the seller now? Once you inspect the item and hand over
                cash, mark the payment complete below — or switch to online
                payment if you agreed in Chat.
              </p>

              <div className="order-actions">
                <button
                  type="button"
                  className="primary-action small"
                  onClick={handleConfirmCashHandover}
                  disabled={updatingPayment}
                >
                  <i className="bi bi-check2-circle" />{" "}
                  {updatingPayment
                    ? "Updating..."
                    : "Confirm Cash Paid & Collected"}
                </button>

                <button
                  type="button"
                  className="secondary-action small"
                  onClick={() => setShowSwitchMethod((prev) => !prev)}
                  disabled={updatingPayment}
                >
                  <i className="bi bi-credit-card" />{" "}
                  {showSwitchMethod
                    ? "Hide payment options"
                    : "Pay online instead (EFT / Card / QR)"}
                </button>
              </div>

              {showSwitchMethod && (
                <div className="switch-payment-box">
                  <strong>
                    Complete payment with an agreed online method
                  </strong>
                  <div className="form-row">
                    <label>
                      Payment method
                      <select
                        value={switchMethod}
                        onChange={(e) => setSwitchMethod(e.target.value)}
                      >
                        {PAYMENT_METHODS.filter((m) => m.value !== "CASH").map(
                          (m) => (
                            <option key={m.value} value={m.value}>
                              {m.label}
                            </option>
                          ),
                        )}
                      </select>
                    </label>

                    <label>
                      Reference / Card or Bank note
                      <input
                        type="text"
                        value={switchNote}
                        onChange={(e) => setSwitchNote(e.target.value)}
                        placeholder="e.g. Capitec EFT Ref #9841 or Visa •••• 4242"
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    className="primary-action small"
                    onClick={handleSwitchAndCompletePayment}
                    disabled={updatingPayment}
                  >
                    <i className="bi bi-lock-fill" /> Complete{" "}
                    {paymentMethodLabel(switchMethod)} Payment
                  </button>
                </div>
              )}
            </div>
          )}

          {isBuyer && isPaymentCompleted && !isHandoverConfirmed && (
            <div className="post-payment-actions">
              <p className="summary-note">
                Have you collected your item from the seller? Confirming
                collection releases the Safe-Pay Escrow funds to the seller.
              </p>

              <button
                type="button"
                className="primary-action small"
                onClick={handleReleaseEscrow}
                disabled={updatingPayment}
              >
                <i className="bi bi-box2-heart" />{" "}
                {updatingPayment
                  ? "Confirming..."
                  : "Confirm Item Collected & Release Seller Payout"}
              </button>
            </div>
          )}
        </section>

        {/* ── Items & Direct Seller Chat ── */}
        <section className="section-card">
          <h2 className="section-title">Items & seller contact</h2>

          <div className="order-item-list">
            {order.items.map((item) => (
              <div
                key={item.orderItemId ?? item.productId}
                className="order-item"
              >
                <img src={item.img} alt={item.name} />

                <div className="order-item-body">
                  <button
                    type="button"
                    className="cart-row-name"
                    onClick={() => navigate(`/product/${item.productId}`)}
                  >
                    {item.name}
                  </button>

                  <p className="cart-row-meta">
                    {item.quantity} × {item.unitPriceFormatted}
                    {item.sellerName ? ` · ${item.sellerName}` : ""}
                    {item.sellerUserType ? ` (${item.sellerUserType})` : ""}
                  </p>

                  <div className="order-item-contact-row">
                    <button
                      type="button"
                      className="inline-link"
                      onClick={() => openChatForItem(item)}
                    >
                      <i className="bi bi-chat-dots-fill" /> Chat with seller
                      about payment / meetup
                    </button>

                    {item.sellerEmail && (
                      <a
                        className="inline-link muted"
                        href={`mailto:${item.sellerEmail}?subject=${encodeURIComponent(
                          `Order ${order.orderNumber}`,
                        )}`}
                      >
                        <i className="bi bi-envelope" /> Email
                      </a>
                    )}
                  </div>
                </div>

                <strong className="order-item-subtotal">
                  {item.subtotalFormatted}
                </strong>
              </div>
            ))}
          </div>

          <div className="summary-row total">
            <span>Order total</span>
            <strong>{order.totalAmountFormatted}</strong>
          </div>
        </section>

        {/* ── Handover details & Order Actions ── */}
        <section className="section-card">
          <h2 className="section-title">Meetup & handover location</h2>

          <div className="detail-grid">
            <div>
              <span>Agreed location / address</span>
              <strong>{order.shippingAddress || "Not provided"}</strong>
            </div>

            <div>
              <span>Buyer</span>
              <strong>{order.buyerName || user?.displayName || "You"}</strong>
            </div>
          </div>

          <p className="summary-note">
            Use Marketplace Chat to coordinate exact meetup times at a campus
            Safe Exchange Zone. Cancelling an uncollected order returns the
            items to the seller&apos;s stock.
          </p>

          <div className="order-actions">
            <button
              type="button"
              className="primary-action small"
              onClick={() => openChatForItem(order.items[0])}
            >
              <i className="bi bi-chat-dots" /> Open Seller Chat
            </button>

            <button
              type="button"
              className="secondary-action small"
              onClick={buyAgain}
            >
              <i className="bi bi-arrow-repeat" />
              Buy again
            </button>

            {!isHandoverConfirmed && (
              <ConfirmButton
                label="Cancel order"
                confirmLabel="Confirm cancel"
                icon="bi-x-circle"
                className="ghost-btn danger"
                disabled={cancelling}
                onConfirm={handleCancel}
              />
            )}
          </div>
        </section>

        <button
          type="button"
          className="ghost-btn full"
          onClick={() => navigate("/marketplace")}
        >
          Continue shopping
        </button>
      </div>

      <BottomNav />
    </div>
  );
}

export default OrderDetails;

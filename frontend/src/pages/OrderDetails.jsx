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
  fetchProductById,
  getOrderById,
} from "../services/orderService.js";
import { mapProduct } from "../services/productService.js";

import {
  formatDateTime,
  paymentMethodLabel,
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let active = true;

    setLoading(true);

    getOrderById(orderId)
        .then((data) => {
          if (!active) {
            return;
          }

          setOrder(data);
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

  /**
   * Puts the order's items back in the cart.
   *
   * Listings are re-read from the API first, so a sold-out or
   * removed item is skipped instead of added at a stale price.
   */
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
              <Banner tone="success" icon="bi-check-circle" title="Order placed">
                Thanks! Your order is confirmed. Arrange collection with the
                seller using the contact details below.

                {location.state?.paymentWarning && (
                    <span className="banner-subnote">
                The payment reference could not be stored — mention this order
                number when you pay.
              </span>
                )}
              </Banner>
          )}

          {!isBuyer && (
              <Banner tone="warning" icon="bi-shield-exclamation" title="Different account">
                This order belongs to another account. You are viewing it in
                read-only mode.
              </Banner>
          )}

          <div className="page-header">
            <div>
              <h1>{order.orderNumber}</h1>
              <p>{formatDateTime(order.orderDate)}</p>
            </div>

            <span className="status-pill ok">Confirmed</span>
          </div>

          <section className="section-card">
            <h2 className="section-title">Items</h2>

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
                      </p>

                      {item.sellerEmail && (
                          <a
                              className="inline-link"
                              href={`mailto:${item.sellerEmail}?subject=${encodeURIComponent(
                                  `Order ${order.orderNumber}`,
                              )}`}
                          >
                            <i className="bi bi-envelope" /> Contact seller
                          </a>
                      )}
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

          <section className="section-card">
            <h2 className="section-title">Handover details</h2>

            <div className="detail-grid">
              <div>
                <span>Address</span>
                <strong>{order.shippingAddress || "Not provided"}</strong>
              </div>

              <div>
                <span>Payment method</span>
                <strong>{paymentMethodLabel(order.paymentMethod)}</strong>
              </div>

              <div>
                <span>Buyer</span>
                <strong>{order.buyerName || user?.displayName || "You"}</strong>
              </div>
            </div>

            <p className="summary-note">
              Orders stay open until you collect. Cancelling an order returns
              the items to the seller's stock.
            </p>

            <div className="order-actions">
              <button
                  type="button"
                  className="secondary-action"
                  onClick={buyAgain}
              >
                <i className="bi bi-arrow-repeat" />
                Buy again
              </button>

              <ConfirmButton
                  label="Cancel order"
                  confirmLabel="Confirm cancel"
                  icon="bi-x-circle"
                  className="ghost-btn danger"
                  disabled={cancelling}
                  onConfirm={handleCancel}
              />
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

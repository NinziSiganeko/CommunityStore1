import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Badge } from "../components/Icons.jsx";
import { BottomNav, TopBar } from "../components/Navigation.jsx";
import { Banner, Loader, StateMessage } from "../components/Feedback.jsx";

import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import useWishlist from "../hooks/useWishlist.js";

import { getCurrentUser } from "../services/authService.js";
import { getProductById } from "../services/productService.js";
import { conditionLabel } from "../utils/format.js";

const QUICK_CHAT_PROMPTS = [
  "Hi! Is this item still available?",
  "Can we arrange a safe campus meetup?",
  "Would you prefer cash or EFT?",
];

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { showToast } = useToast();
  const wishlist = useWishlist();

  const user = getCurrentUser();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    setLoading(true);

    getProductById(id)
        .then((item) => {
          if (!active) {
            return;
          }

          setProduct(item);
          setQuantity(1);
          setError(null);
        })
        .catch((requestError) => {
          if (!active) {
            return;
          }

          setError(
              requestError.response?.status === 404
                  ? "This listing could not be found."
                  : "We couldn't load this product. Please try again.",
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
  }, [id]);

  if (loading) {
    return (
        <div className="screen">
          <TopBar onBell={() => navigate("/notifications")} />

          <div className="scroll-area route-content">
            <Loader label="Loading product..." />
          </div>

          <BottomNav />
        </div>
    );
  }

  if (error || !product) {
    return (
        <div className="screen">
          <TopBar onBell={() => navigate("/notifications")} />

          <div className="scroll-area route-content">
            <StateMessage
                tone="error"
                icon="bi-box"
                title="Listing unavailable"
                message={error || "This listing could not be found."}
                actionLabel="Back to marketplace"
                onAction={() => navigate("/marketplace")}
            />
          </div>

          <BottomNav />
        </div>
    );
  }

  const isOwner =
      user?.userId && String(user.userId) === String(product.sellerUserId);

  const isVendorSeller = product.sellerUserType === "VENDOR";
  const awaitingVerification =
      isVendorSeller && product.sellerVerified === false;

  const purchasable = product.stock > 0 && !awaitingVerification;
  const wished = wishlist.has(product.id);

  function changeQuantity(delta) {
    setQuantity((current) => {
      const next = current + delta;

      if (next < 1) {
        return 1;
      }

      if (product.stock > 0 && next > product.stock) {
        return product.stock;
      }

      return next;
    });
  }

  function addToCart(redirectToCheckout = false, preferredMethod = null) {
    addItem(product, quantity);
    showToast(`${quantity} × ${product.name} added to cart`);

    if (redirectToCheckout) {
      navigate(
          preferredMethod
              ? `/checkout?method=${encodeURIComponent(preferredMethod)}`
              : "/checkout",
      );
    }
  }

  function toggleWishlist() {
    const saved = wishlist.toggle(product);
    showToast(saved ? "Saved to wishlist" : "Removed from wishlist");
  }

  function openChatWithSeller(initialPrompt = "") {
    const params = new URLSearchParams();

    if (product.sellerUserId) {
      params.set("sellerId", String(product.sellerUserId));
    }
    if (product.seller) {
      params.set("sellerName", product.seller);
    }
    if (product.sellerUserType) {
      params.set("sellerRole", product.sellerUserType);
    }
    if (product.id) {
      params.set("productId", String(product.id));
    }
    if (initialPrompt) {
      params.set("prompt", initialPrompt);
    }

    navigate(`/chat?${params.toString()}`);
  }

  return (
      <div className="screen">
        <TopBar onBell={() => navigate("/notifications")} />

        <div className="scroll-area route-content">
          <button
              type="button"
              className="back-button"
              onClick={() => navigate(-1)}
          >
            <i className="bi bi-arrow-left" /> Back
          </button>

          <div className="product-detail-image-wrap">
            <img
                className="product-detail-image"
                src={product.img}
                alt={product.name}
            />

            {product.badge && <Badge type={product.badge} />}

            <button
                type="button"
                className={`wishlist-btn large ${wished ? "active" : ""}`}
                onClick={toggleWishlist}
                aria-label={wished ? "Remove from wishlist" : "Save to wishlist"}
            >
              <i className={wished ? "bi bi-heart-fill" : "bi bi-heart"} />
            </button>
          </div>

          <div className="product-detail-body">
            <h1>{product.name}</h1>

            <div className="product-detail-meta">
              <strong>{product.price}</strong>

              <span className={`status-pill ${purchasable ? "ok" : "warn"}`}>
              {product.stock > 0
                  ? `${product.stock} available`
                  : "Out of stock"}
            </span>
            </div>

            <div className="product-detail-info">
              <div>
                <span>Category</span>
                <strong>{product.category || "Uncategorised"}</strong>
              </div>

              <div>
                <span>Condition</span>
                <strong>{conditionLabel(product.condition)}</strong>
              </div>

              <div>
                <span>Seller</span>
                <strong>
                  {product.seller || "Community seller"}
                  {isVendorSeller && product.sellerVerified && (
                      <i
                          className="bi bi-patch-check-fill verified-icon"
                          title="Verified vendor"
                      />
                  )}
                </strong>
              </div>

              <div>
                <span>Seller type & payment</span>
                <strong>
                  {isVendorSeller
                      ? "Verified Business Vendor · Cash or EFT by arrangement"
                      : `Peer Seller (${product.sellerUserType || "STUDENT"}) · Cash or EFT by arrangement`}
                </strong>
              </div>
            </div>

            {/* Payment Options Callout Card */}
            <div className="product-payment-callout">
              <div className="product-payment-callout-head">
                <i
                    className={`bi ${
                        isVendorSeller ? "bi-shop-window" : "bi-shield-check"
                    }`}
                />
                <div>
                  <strong>
                    Payment arranged with the seller
                  </strong>
                  <p>
                    Arrange cash at a safe meetup or EFT directly with the seller. The app records
                    the agreed method but does not process or verify payments.
                  </p>
                </div>
              </div>
            </div>

            {awaitingVerification && (
                <Banner
                    tone="warning"
                    icon="bi-hourglass-split"
                    title="Vendor awaiting verification"
                >
                  This listing belongs to a vendor account that an admin has not
                  verified yet. Buying is disabled until then.
                </Banner>
            )}

            {isOwner && (
                <Banner tone="info" icon="bi-person-badge">
                  This is your own listing. Manage price and stock from{" "}
                  <button
                      type="button"
                      className="inline-link"
                      onClick={() => navigate("/my-listings")}
                  >
                    My Listings
                  </button>
                  .
                </Banner>
            )}

            {!isOwner && (
                <>
                  <div className="purchase-controls">
                    <div
                        className="qty-stepper"
                        role="group"
                        aria-label="Quantity"
                    >
                      <button
                          type="button"
                          onClick={() => changeQuantity(-1)}
                          disabled={quantity <= 1}
                          aria-label="Decrease quantity"
                      >
                        <i className="bi bi-dash-lg" />
                      </button>

                      <span>{quantity}</span>

                      <button
                          type="button"
                          onClick={() => changeQuantity(1)}
                          disabled={product.stock > 0 && quantity >= product.stock}
                          aria-label="Increase quantity"
                      >
                        <i className="bi bi-plus-lg" />
                      </button>
                    </div>

                    <button
                        type="button"
                        className="primary-action"
                        disabled={!purchasable}
                        onClick={() => addToCart(false)}
                    >
                      <i className="bi bi-bag-plus" />
                      {purchasable ? "Add to cart" : "Unavailable"}
                    </button>
                  </div>

                  <div className="product-buy-split">
                    <button
                        type="button"
                        className="secondary-action full"
                        disabled={!purchasable}
                        onClick={() =>
                            addToCart(true, "CASH")
                        }
                    >
                      <i
                          className={`bi ${
                              isVendorSeller ? "bi-credit-card" : "bi-cash-coin"
                          }`}
                      />
                      {isVendorSeller
                          ? "Buy now (Online Business Pay)"
                          : "Buy with Cash on Meetup"}
                    </button>

                    <button
                        type="button"
                        className="ghost-btn full"
                        onClick={() => openChatWithSeller("")}
                    >
                      <i className="bi bi-chat-dots-fill" /> Message seller in Chat
                    </button>
                  </div>

                  {/* Facebook Marketplace-style quick chat box */}
                  <div className="marketplace-chat-starter">
                    <div className="marketplace-chat-starter-title">
                      <i className="bi bi-messenger" /> Ask{" "}
                      <strong>{product.seller || "the seller"}</strong> about
                      payment or campus meetup
                    </div>

                    <div className="quick-prompt-chips">
                      {QUICK_CHAT_PROMPTS.map((promptText) => (
                          <button
                              type="button"
                              key={promptText}
                              className="quick-prompt-chip"
                              onClick={() => openChatWithSeller(promptText)}
                          >
                            {promptText}
                          </button>
                      ))}
                    </div>
                  </div>
                </>
            )}
          </div>
        </div>

        <BottomNav />
      </div>
  );
}

export default ProductDetails;
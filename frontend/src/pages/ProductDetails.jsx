import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Badge } from "../components/Icons.jsx";
import { BottomNav, TopBar } from "../components/Navigation.jsx";
import { Banner, Loader, StateMessage } from "../components/Feedback.jsx";

import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import useWishlist from "../hooks/useWishlist.jsx";

import { getCurrentUser } from "../services/authService.js";
import { getProductById } from "../services/productService.js";
import { conditionLabel } from "../utils/format.js";

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

  const awaitingVerification =
      product.sellerUserType === "VENDOR" && product.sellerVerified === false;

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

  function addToCart(redirectToCheckout = false) {
    addItem(product, quantity);
    showToast(`${quantity} × ${product.name} added to cart`);

    if (redirectToCheckout) {
      navigate("/checkout");
    }
  }

  function toggleWishlist() {
    const saved = wishlist.toggle(product);
    showToast(saved ? "Saved to wishlist" : "Removed from wishlist");
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
                  {product.sellerUserType === "VENDOR" &&
                      product.sellerVerified && (
                          <i
                              className="bi bi-patch-check-fill verified-icon"
                              title="Verified vendor"
                          />
                      )}
                </strong>
              </div>

              <div>
                <span>Availability</span>
                <strong className={product.stock > 0 ? "in-stock" : "out-of-stock"}>
                  {product.stock > 0
                      ? `${product.stock} in stock`
                      : "Out of stock"}
                </strong>
              </div>
            </div>

            {awaitingVerification && (
                <Banner
                    tone="warning"
                    icon="bi-hourglass-split"
                    title="Vendor awaiting verification"
                >
                  This listing belongs to a vendor account that an admin has
                  not verified yet. Buying is disabled until then.
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

            <p>
              Arrange a safe exchange point or campus delivery with the seller
              after checkout. Community Store keeps the order record so both
              sides can see what was agreed.
            </p>

            {!isOwner && (
                <div className="purchase-controls">
                  <div className="qty-stepper" role="group" aria-label="Quantity">
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
            )}

            {!isOwner && (
                <button
                    type="button"
                    className="secondary-action full"
                    disabled={!purchasable}
                    onClick={() => addToCart(true)}
                >
                  Buy now
                </button>
            )}

            {product.sellerEmail && (
                <a
                    className="seller-contact"
                    href={`mailto:${product.sellerEmail}?subject=${encodeURIComponent(
                        `Question about "${product.name}" on Community Store`,
                    )}`}
                >
                  <i className="bi bi-envelope" />
                  Ask the seller a question
                </a>
            )}
          </div>
        </div>

        <BottomNav />
      </div>
  );
}

export default ProductDetails;
import { useNavigate } from "react-router-dom";

import { Rating } from "./Icons.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import useWishlist from "../hooks/useWishlist.jsx";

/**
 * Marketplace product tile.
 *
 * Shared by the marketplace, home page, wishlist and profile so a
 * listing looks and behaves the same everywhere.
 */
function ProductCard({
                         product,
                         onOpen,
                         badge = null,
                         showWishlist = true,
                         showAddToCart = true,
                         footer = null,
                         stockLabel = false,
                     }) {
    const navigate = useNavigate();
    const { addItem } = useCart();
    const { showToast } = useToast();
    const wishlist = useWishlist();

    const wished = wishlist.has(product.id);
    const inStock = product.stock > 0;

    function open() {
        if (onOpen) {
            onOpen(product);
            return;
        }

        navigate(`/product/${product.id}`);
    }

    function handleKeyDown(event) {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            open();
        }
    }

    function handleWishlist(event) {
        event.stopPropagation();

        const saved = wishlist.toggle(product);

        showToast(saved ? "Saved to wishlist" : "Removed from wishlist");
    }

    function handleAddToCart(event) {
        event.stopPropagation();

        addItem(product, 1);
        showToast(`${product.name} added to cart`);
    }

    return (
        <div
            className="product-card"
            role="link"
            tabIndex={0}
            onClick={open}
            onKeyDown={handleKeyDown}
        >
            <div className="product-img-wrap">
                <img src={product.img} alt={product.name} loading="lazy" />

                {badge && <span className="badge-img-overlay">{badge}</span>}

                {showWishlist && (
                    <button
                        type="button"
                        className={`wishlist-btn ${wished ? "active" : ""}`}
                        onClick={handleWishlist}
                        aria-label={wished ? "Remove from wishlist" : "Save to wishlist"}
                        title={wished ? "Remove from wishlist" : "Save to wishlist"}
                    >
                        <i className={wished ? "bi bi-heart-fill" : "bi bi-heart"} />
                    </button>
                )}
            </div>

            <div className="product-body">
                <p className="product-name">{product.name}</p>

                <div className="product-footer">
                    <span className="price">{product.price}</span>

                    {product.rating ? (
                        <Rating value={product.rating} />
                    ) : (
                        <span className={`stock-hint ${inStock ? "" : "out"}`}>
              {inStock
                  ? stockLabel
                      ? `${product.stock} left`
                      : "Available"
                  : "Sold out"}
            </span>
                    )}
                </div>

                {showAddToCart && (
                    <button
                        type="button"
                        className="product-add-btn"
                        onClick={handleAddToCart}
                        disabled={!inStock}
                    >
                        <i className="bi bi-bag-plus" />
                        {inStock ? "Add to cart" : "Out of stock"}
                    </button>
                )}

                {footer}
            </div>
        </div>
    );
}

export default ProductCard;
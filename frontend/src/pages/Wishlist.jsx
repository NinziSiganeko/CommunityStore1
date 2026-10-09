import { useNavigate } from "react-router-dom";

import { BottomNav, TopBar } from "../components/Navigation.jsx";
import ProductCard from "../components/ProductCard.jsx";
import { ConfirmButton, StateMessage } from "../components/Feedback.jsx";

import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import useWishlist from "../hooks/useWishlist.js";

function Wishlist() {
    const navigate = useNavigate();
    const { addItem } = useCart();
    const { showToast } = useToast();
    const wishlist = useWishlist();

    const available = wishlist.items.filter((item) => item.stock > 0);

    function addAllToCart() {
        available.forEach((item) => addItem(item, 1));

        showToast(
            available.length === 1
                ? "1 item added to cart"
                : `${available.length} items added to cart`,
        );
    }

    return (
        <div className="screen">
            <TopBar onBell={() => navigate("/notifications")} />

            <div className="scroll-area route-content">
                <div className="page-header">
                    <div>
                        <h1>Wishlist</h1>

                        <p>
                            {wishlist.count} saved item{wishlist.count === 1 ? "" : "s"}
                        </p>
                    </div>

                    {wishlist.count > 0 && (
                        <ConfirmButton
                            label="Clear all"
                            confirmLabel="Confirm clear"
                            icon="bi-trash3"
                            onConfirm={() => {
                                wishlist.items.forEach((item) => wishlist.remove(item.id));
                                showToast("Wishlist cleared");
                            }}
                        />
                    )}
                </div>

                {wishlist.count === 0 && (
                    <StateMessage
                        icon="bi-heart"
                        title="Nothing saved yet"
                        message="Tap the heart on any listing to keep an eye on it here."
                        actionLabel="Browse marketplace"
                        onAction={() => navigate("/marketplace")}
                    />
                )}

                {wishlist.count > 0 && (
                    <>
                        {available.length > 0 && (
                            <button
                                type="button"
                                className="secondary-action full"
                                onClick={addAllToCart}
                            >
                                <i className="bi bi-bag-plus" />
                                Add {available.length} available item
                                {available.length === 1 ? "" : "s"} to cart
                            </button>
                        )}

                        <div className="market-grid">
                            {wishlist.items.map((item) => (
                                <ProductCard
                                    key={item.id}
                                    product={item}
                                    stockLabel
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            <BottomNav />
        </div>
    );
}

export default Wishlist;
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { BottomNav, TopBar } from "../components/Navigation.jsx";
import {
    Banner,
    ConfirmButton,
    Loader,
    StateMessage,
} from "../components/Feedback.jsx";

import { useToast } from "../context/ToastContext.jsx";

import { getCurrentUser } from "../services/authService.js";
import { getErrorMessage } from "../services/apiClient.js";
import {
    deleteProduct,
    getAllProducts,
    updateProduct,
} from "../services/productService.js";

import {
    PRODUCT_CONDITIONS,
    conditionLabel,
    formatCurrency,
} from "../utils/format.js";

/**
 * Seller view of their own listings.
 *
 * Price, stock and condition can be edited inline; the backend
 * keeps the seller, image and category untouched.
 */
function MyListings() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const user = getCurrentUser();

    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [draft, setDraft] = useState({
        price: "",
        stock: "",
        condition: "",
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let active = true;

        if (!user?.userId) {
            setLoading(false);
            setError("Please sign in again to manage your listings.");
            return undefined;
        }

        getAllProducts()
            .then((products) => {
                if (!active) {
                    return;
                }

                setListings(
                    products.filter(
                        (product) =>
                            String(product.sellerUserId) === String(user.userId),
                    ),
                );

                setError(null);
            })
            .catch((requestError) => {
                if (active) {
                    setError(
                        getErrorMessage(
                            requestError,
                            "We couldn't load your listings.",
                        ),
                    );
                }
            })
            .finally(() => {
                if (active) {
                    setLoading(false);
                }
            });

        return () => {
            active = false;
        };
    }, [user?.userId]);

    function startEditing(product) {
        setEditingId(product.id);
        setDraft({
            price: String(product.priceValue),
            stock: String(product.stock),
            condition: product.condition || "",
        });
    }

    function cancelEditing() {
        setEditingId(null);
        setDraft({ price: "", stock: "", condition: "" });
    }

    async function saveChanges(product) {
        const price = Number(draft.price);
        const stock = Number(draft.stock);

        if (!Number.isFinite(price) || price <= 0) {
            showToast("Price must be greater than R0.00");
            return;
        }

        if (!Number.isInteger(stock) || stock < 0) {
            showToast("Stock must be a whole number of 0 or more");
            return;
        }

        setSaving(true);

        try {
            const updated = await updateProduct(product.id, {
                name: product.name,
                price,
                stock,
                condition: draft.condition || null,
            });

            setListings((previous) =>
                previous.map((item) => (item.id === updated.id ? updated : item)),
            );

            showToast("Listing updated");
            cancelEditing();
        } catch (requestError) {
            showToast(
                getErrorMessage(requestError, "We couldn't update this listing."),
            );
        } finally {
            setSaving(false);
        }
    }

    async function removeListing(product) {
        try {
            await deleteProduct(product.id);

            setListings((previous) =>
                previous.filter((item) => item.id !== product.id),
            );

            showToast("Listing deleted");
        } catch (requestError) {
            showToast(
                getErrorMessage(requestError, "We couldn't delete this listing."),
            );
        }
    }

    const liveCount = listings.filter((product) => product.stock > 0).length;

    return (
        <div className="screen">
            <TopBar onBell={() => navigate("/notifications")} />

            <div className="scroll-area route-content">
                <div className="page-header">
                    <div>
                        <h1>My listings</h1>

                        <p>
                            {listings.length} listing{listings.length === 1 ? "" : "s"} ·{" "}
                            {liveCount} live
                        </p>
                    </div>

                    <button
                        type="button"
                        className="primary-action small"
                        onClick={() => navigate("/sell")}
                    >
                        <i className="bi bi-plus-lg" />
                        New listing
                    </button>
                </div>

                {user?.role === "VENDOR" && !user?.verified && (
                    <Banner
                        tone="warning"
                        icon="bi-hourglass-split"
                        title="Awaiting vendor verification"
                    >
                        Buyers cannot see these listings until an admin verifies your
                        account. You can still prepare them now.
                    </Banner>
                )}

                {loading && <Loader label="Loading your listings..." />}

                {!loading && error && (
                    <StateMessage
                        tone="error"
                        icon="bi-wifi-off"
                        title="Listings unavailable"
                        message={error}
                        actionLabel="Try again"
                        onAction={() => window.location.reload()}
                    />
                )}

                {!loading && !error && listings.length === 0 && (
                    <StateMessage
                        icon="bi-shop"
                        title="You have no listings yet"
                        message="List a textbook, gadget or service and it will show up in the marketplace."
                        actionLabel="List an item"
                        onAction={() => navigate("/sell")}
                    />
                )}

                {!loading && !error && listings.length > 0 && (
                    <div className="listing-list">
                        {listings.map((product) => {
                            const isEditing = editingId === product.id;

                            return (
                                <div key={product.id} className="listing-card">
                                    <img src={product.img} alt={product.name} />

                                    <div className="listing-body">
                                        <button
                                            type="button"
                                            className="cart-row-name"
                                            onClick={() => navigate(`/product/${product.id}`)}
                                        >
                                            {product.name}
                                        </button>

                                        <p className="cart-row-meta">
                                            {product.category || "Uncategorised"}
                                            {" · "}
                                            {conditionLabel(product.condition)}
                                        </p>

                                        <div className="listing-status">
                            <span
                                className={`status-pill ${
                                    product.stock > 0 ? "ok" : "warn"
                                }`}
                            >
                              {product.stock > 0
                                  ? `${product.stock} in stock`
                                  : "Sold out"}
                            </span>

                                            <strong>{formatCurrency(product.priceValue)}</strong>
                                        </div>

                                        {isEditing ? (
                                            <div className="listing-edit">
                                                <label>
                                                    Price (ZAR)
                                                    <input
                                                        type="number"
                                                        min="0.01"
                                                        step="0.01"
                                                        value={draft.price}
                                                        onChange={(event) =>
                                                            setDraft((previous) => ({
                                                                ...previous,
                                                                price: event.target.value,
                                                            }))
                                                        }
                                                        disabled={saving}
                                                    />
                                                </label>

                                                <label>
                                                    Stock
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="1"
                                                        value={draft.stock}
                                                        onChange={(event) =>
                                                            setDraft((previous) => ({
                                                                ...previous,
                                                                stock: event.target.value,
                                                            }))
                                                        }
                                                        disabled={saving}
                                                    />
                                                </label>

                                                <label>
                                                    Condition
                                                    <select
                                                        value={draft.condition}
                                                        onChange={(event) =>
                                                            setDraft((previous) => ({
                                                                ...previous,
                                                                condition: event.target.value,
                                                            }))
                                                        }
                                                        disabled={saving}
                                                    >
                                                        <option value="">Not specified</option>

                                                        {PRODUCT_CONDITIONS.map((condition) => (
                                                            <option
                                                                key={condition.value}
                                                                value={condition.value}
                                                            >
                                                                {condition.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </label>

                                                <div className="listing-edit-actions">
                                                    <button
                                                        type="button"
                                                        className="ghost-btn"
                                                        onClick={cancelEditing}
                                                        disabled={saving}
                                                    >
                                                        Cancel
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="primary-action small"
                                                        onClick={() => saveChanges(product)}
                                                        disabled={saving}
                                                    >
                                                        {saving ? "Saving..." : "Save"}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="listing-actions">
                                                <button
                                                    type="button"
                                                    className="ghost-btn"
                                                    onClick={() => startEditing(product)}
                                                >
                                                    <i className="bi bi-pencil" />
                                                    Edit price & stock
                                                </button>

                                                <ConfirmButton
                                                    label="Delete"
                                                    confirmLabel="Confirm delete"
                                                    icon="bi-trash3"
                                                    onConfirm={() => removeListing(product)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <BottomNav active="profile" />
        </div>
    );
}

export default MyListings;
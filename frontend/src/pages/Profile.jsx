import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { BottomNav, TopBar } from "../components/Navigation.jsx";
import ProductCard from "../components/ProductCard.jsx";
import {
    Banner,
    Loader,
    StateMessage,
} from "../components/Feedback.jsx";

import { useToast } from "../context/ToastContext.jsx";
import useWishlist from "../hooks/useWishlist.js";

import {
    getCurrentUser,
    isAuthenticated,
    isPendingVendor,
    updateStoredUser,
} from "../services/authService.js";
import { getErrorMessage } from "../services/apiClient.js";
import { getOrdersForBuyer } from "../services/orderService.js";
import { getAllProducts } from "../services/productService.js";
import { getUserById, updateProfile } from "../services/userService.js";

import {
    formatCurrency,
    formatDate,
    initials,
} from "../utils/format.js";

const EMPTY_FORM = {
    firstName: "",
    lastName: "",
    phoneNumber: "",
    address: "",
};

function Profile() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const wishlist = useWishlist();

    const [user, setUser] = useState(() => getCurrentUser());
    const [listings, setListings] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [formError, setFormError] = useState(null);

    useEffect(() => {
        if (!isAuthenticated()) {
            navigate("/login", {
                replace: true,
                state: { from: "/profile" },
            });

            return undefined;
        }

        const current = getCurrentUser();

        if (!current?.userId) {
            navigate("/login", { replace: true });
            return undefined;
        }

        let active = true;

        setUser(current);
        setForm({
            firstName: current.firstName || "",
            lastName: current.lastName || "",
            phoneNumber: current.phoneNumber || "",
            address: current.address || "",
        });

        async function loadProfileData() {
            const [profileResult, productsResult, ordersResult] =
                await Promise.allSettled([
                    getUserById(current.userId),
                    getAllProducts(),
                    getOrdersForBuyer(current.userId),
                ]);

            if (!active) {
                return;
            }

            if (profileResult.status === "fulfilled") {
                const profile = profileResult.value;

                const nextUser = updateStoredUser({
                    firstName: profile.firstName,
                    lastName: profile.lastName,
                    phoneNumber: profile.phoneNumber,
                    address: profile.address,
                    role: profile.userType,
                    verified: profile.verified,
                    accountStatus: profile.accountStatus,
                });

                if (nextUser) {
                    setUser(nextUser);
                }

                setForm({
                    firstName: profile.firstName || "",
                    lastName: profile.lastName || "",
                    phoneNumber: profile.phoneNumber || "",
                    address: profile.address || "",
                });
            } else {
                setError(
                    getErrorMessage(
                        profileResult.reason,
                        "We couldn't refresh your profile details.",
                    ),
                );
            }

            if (productsResult.status === "fulfilled") {
                setListings(
                    productsResult.value.filter(
                        (product) =>
                            String(product.sellerUserId) === String(current.userId),
                    ),
                );
            }

            if (ordersResult.status === "fulfilled") {
                setOrders(ordersResult.value);
            }

            setLoading(false);
        }

        loadProfileData();

        return () => {
            active = false;
        };
    }, [navigate]);

    const displayName =
        user?.displayName ||
        user?.email?.split("@")[0] ||
        "User";

    const spend = useMemo(
        () =>
            orders.reduce(
                (total, order) => total + Number(order.totalAmount || 0),
                0,
            ),
        [orders],
    );

    function updateField(event) {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    }

    async function saveProfile() {
        setFormError(null);

        if (!user?.userId) {
            return;
        }

        setSaving(true);

        try {
            const updated = await updateProfile(user.userId, {
                firstName: form.firstName,
                lastName: form.lastName,
                phoneNumber: form.phoneNumber,
                address: form.address,
            });

            const nextUser = updateStoredUser({
                firstName: updated.firstName,
                lastName: updated.lastName,
                phoneNumber: updated.phoneNumber,
                address: updated.address,
            });

            if (nextUser) {
                setUser(nextUser);
            }

            setEditing(false);
            showToast("Profile updated");
        } catch (requestError) {
            setFormError(
                getErrorMessage(requestError, "We couldn't save your profile."),
            );
        } finally {
            setSaving(false);
        }
    }

    const quickLinks = [
        { label: "My orders", icon: "bi-receipt", path: "/orders" },
        { label: "My listings", icon: "bi-shop", path: "/my-listings" },
        { label: "Seller orders", icon: "bi-box-seam", path: "/seller-orders" },
        { label: "Wishlist", icon: "bi-heart", path: "/wishlist" },
        { label: "Cart", icon: "bi-bag", path: "/cart" },
        { label: "Chat & Community", icon: "bi-chat-dots", path: "/chat" },
        { label: "Bulletin", icon: "bi-megaphone", path: "/bulletin" },
    ];

    if (user?.role === "ADMIN") {
        quickLinks.unshift({
            label: "Admin dashboard",
            icon: "bi-shield-check",
            path: "/admin",
        });
    }

    return (
        <div className="screen">
            <TopBar onBell={() => navigate("/notifications")} />

            <div className="scroll-area route-content">
                <div className="profile-card">
                    <div className="profile-avatar">
                        {initials(displayName)}
                    </div>

                    <div className="profile-identity">
                        <h1>{displayName}</h1>
                        <p>{user?.email || "No email available"}</p>

                        <div className="chip-row">
                            <span className="chip">{user?.role || "RESIDENT"}</span>

                            {isPendingVendor(user) ? (
                                <span className="chip warning">Pending verification</span>
                            ) : user?.verified ? (
                                <span className="chip success">
                  <i className="bi bi-patch-check-fill" /> Verified
                </span>
                            ) : (
                                <span className="chip">Not verified</span>
                            )}
                        </div>
                    </div>

                    <button
                        type="button"
                        className="ghost-btn"
                        onClick={() => {
                            setEditing((current) => !current);
                            setFormError(null);
                        }}
                    >
                        <i className={editing ? "bi bi-x-lg" : "bi bi-pencil"} />
                        {editing ? "Cancel" : "Edit"}
                    </button>
                </div>

                {isPendingVendor(user) && (
                    <Banner
                        tone="warning"
                        icon="bi-hourglass-split"
                        title="Vendor verification pending"
                    >
                        An admin still has to verify your account. Until then your
                        listings stay hidden from buyers.
                    </Banner>
                )}

                {error && (
                    <Banner tone="warning" icon="bi-exclamation-triangle">
                        {error}
                    </Banner>
                )}

                {editing && (
                    <section className="section-card">
                        <h2 className="section-title">Contact details</h2>

                        <div className="form-row">
                            <label>
                                First name
                                <input
                                    name="firstName"
                                    value={form.firstName}
                                    onChange={updateField}
                                    maxLength="50"
                                    disabled={saving}
                                />
                            </label>

                            <label>
                                Last name
                                <input
                                    name="lastName"
                                    value={form.lastName}
                                    onChange={updateField}
                                    maxLength="50"
                                    disabled={saving}
                                />
                            </label>
                        </div>

                        <label>
                            Phone number
                            <input
                                name="phoneNumber"
                                type="tel"
                                value={form.phoneNumber}
                                onChange={updateField}
                                maxLength="20"
                                placeholder="e.g. 082 123 4567"
                                disabled={saving}
                            />
                        </label>

                        <label>
                            Address
                            <input
                                name="address"
                                value={form.address}
                                onChange={updateField}
                                maxLength="255"
                                placeholder="Used to pre-fill checkout"
                                disabled={saving}
                            />
                        </label>

                        {formError && <p className="form-error">{formError}</p>}

                        <button
                            type="button"
                            className="primary-action full"
                            onClick={saveProfile}
                            disabled={saving}
                        >
                            {saving ? "Saving..." : "Save changes"}
                        </button>
                    </section>
                )}

                {!editing && (user?.phoneNumber || user?.address) && (
                    <section className="section-card">
                        <h2 className="section-title">Contact details</h2>

                        <div className="detail-grid">
                            <div>
                                <span>Phone</span>
                                <strong>{user.phoneNumber || "Not provided"}</strong>
                            </div>

                            <div>
                                <span>Address</span>
                                <strong>{user.address || "Not provided"}</strong>
                            </div>
                        </div>
                    </section>
                )}

                <div className="stat-grid">
                    <button
                        type="button"
                        className="stat-card clickable"
                        onClick={() => navigate("/my-listings")}
                    >
                        <span>Listings</span>
                        <strong>{listings.length}</strong>
                    </button>

                    <button
                        type="button"
                        className="stat-card clickable"
                        onClick={() => navigate("/orders")}
                    >
                        <span>Purchases</span>
                        <strong>{orders.length}</strong>
                    </button>

                    <button
                        type="button"
                        className="stat-card clickable"
                        onClick={() => navigate("/wishlist")}
                    >
                        <span>Wishlist</span>
                        <strong>{wishlist.count}</strong>
                    </button>

                    <div className="stat-card">
                        <span>Spent</span>
                        <strong>{formatCurrency(spend)}</strong>
                    </div>
                </div>

                <section className="section-card">
                    <h2 className="section-title">Quick links</h2>

                    <div className="link-grid">
                        {quickLinks.map((link) => (
                            <button
                                type="button"
                                key={link.path}
                                className="link-tile"
                                onClick={() => navigate(link.path)}
                            >
                                <i className={`bi ${link.icon}`} />
                                {link.label}
                            </button>
                        ))}
                    </div>
                </section>

                <section className="section-card">
                    <div className="section-header" style={{ padding: "0 0 12px" }}>
                        <h2 className="section-title">My listings</h2>

                        <button
                            type="button"
                            className="see-all-btn"
                            onClick={() => navigate("/my-listings")}
                        >
                            MANAGE
                        </button>
                    </div>

                    {loading ? (
                        <Loader label="Loading your listings..." />
                    ) : listings.length === 0 ? (
                        <StateMessage
                            icon="bi-shop"
                            title="No listings yet"
                            message="List an item and it will show up in the marketplace."
                            actionLabel="List an item"
                            onAction={() => navigate("/sell")}
                        />
                    ) : (
                        <div className="market-grid">
                            {listings.slice(0, 4).map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    stockLabel
                                    showAddToCart={false}
                                />
                            ))}
                        </div>
                    )}
                </section>

                <section className="section-card">
                    <div className="section-header" style={{ padding: "0 0 12px" }}>
                        <h2 className="section-title">My purchases</h2>

                        <button
                            type="button"
                            className="see-all-btn"
                            onClick={() => navigate("/orders")}
                        >
                            VIEW ALL
                        </button>
                    </div>

                    {loading ? (
                        <Loader label="Loading your purchases..." />
                    ) : orders.length === 0 ? (
                        <StateMessage
                            icon="bi-bag"
                            title="No purchases yet"
                            message="Your completed checkouts will be listed here."
                            actionLabel="Browse marketplace"
                            onAction={() => navigate("/marketplace")}
                        />
                    ) : (
                        <div className="order-list compact">
                            {orders.slice(0, 3).map((order) => (
                                <button
                                    type="button"
                                    key={order.orderId}
                                    className="order-card"
                                    onClick={() => navigate(`/orders/${order.orderId}`)}
                                >
                                    <div className="order-card-head">
                                        <div>
                                            <strong>{order.orderNumber}</strong>
                                            <span>{formatDate(order.orderDate)}</span>
                                        </div>

                                        <strong>{order.totalAmountFormatted}</strong>
                                    </div>

                                    <p className="order-card-items">
                                        {order.items
                                            .map((item) => `${item.quantity} × ${item.name}`)
                                            .join(", ")}
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}
                </section>

                <div style={{ height: 16 }} />
            </div>

            <BottomNav active="profile" />
        </div>
    );
}

export default Profile;

import { useCallback, useEffect, useMemo, useState } from "react";
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
    getPendingVendors,
    getUsers,
    updateUserStatus,
    verifyVendor,
} from "../services/userService.js";

const TABS = [
    { id: "pending", label: "Verification queue" },
    { id: "vendors", label: "Vendors" },
    { id: "users", label: "All users" },
];

function StatusPill({ user }) {
    if (user.userType === "VENDOR" && user.needsVerification) {
        return <span className="status-pill warn">Pending verification</span>;
    }

    if (user.accountStatus === "SUSPENDED") {
        return <span className="status-pill danger">Suspended</span>;
    }

    if (user.accountStatus === "DEACTIVATED") {
        return <span className="status-pill danger">Deactivated</span>;
    }

    return <span className="status-pill ok">{user.verified ? "Verified" : "Active"}</span>;
}

/**
 * Admin dashboard.
 *
 * Verification is the gate that lets a vendor's listings become
 * visible to buyers, so this screen is what unblocks the vendor
 * side of the marketplace.
 */
function AdminDashboard() {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const user = getCurrentUser();
    const isAdmin = user?.role === "ADMIN";

    const [users, setUsers] = useState([]);
    const [pending, setPending] = useState([]);
    const [tab, setTab] = useState("pending");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [busyId, setBusyId] = useState(null);

    const loadDashboard = useCallback(async () => {
        if (!isAdmin) {
            setLoading(false);
            return;
        }

        setLoading(true);

        try {
            const [allUsers, pendingVendors] = await Promise.all([
                getUsers(),
                getPendingVendors(),
            ]);

            setUsers(allUsers);
            setPending(pendingVendors);
            setError(null);
        } catch (requestError) {
            setError(
                getErrorMessage(
                    requestError,
                    "We couldn't load the admin dashboard.",
                ),
            );
        } finally {
            setLoading(false);
        }
    }, [isAdmin]);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    const vendors = useMemo(
        () => users.filter((item) => item.userType === "VENDOR"),
        [users],
    );

    const stats = useMemo(
        () => ({
            total: users.length,
            pending: pending.length,
            verifiedVendors: vendors.filter((item) => item.verified).length,
            suspended: users.filter(
                (item) => item.accountStatus === "SUSPENDED",
            ).length,
        }),
        [users, vendors, pending],
    );

    async function handleVerify(target) {
        setBusyId(target.userId);

        try {
            await verifyVendor(target.userId);
            showToast(`${target.displayName} is now a verified vendor`);
            await loadDashboard();
        } catch (requestError) {
            showToast(
                getErrorMessage(requestError, "We couldn't verify this vendor."),
            );
        } finally {
            setBusyId(null);
        }
    }

    async function handleStatus(target, status) {
        setBusyId(target.userId);

        try {
            await updateUserStatus(target.userId, status);
            showToast(`${target.displayName} is now ${status.toLowerCase()}`);
            await loadDashboard();
        } catch (requestError) {
            showToast(
                getErrorMessage(requestError, "We couldn't update this account."),
            );
        } finally {
            setBusyId(null);
        }
    }

    if (!isAdmin) {
        return (
            <div className="screen">
                <TopBar onBell={() => navigate("/notifications")} />

                <div className="scroll-area route-content">
                    <StateMessage
                        tone="error"
                        icon="bi-shield-lock"
                        title="Admins only"
                        message="This dashboard is limited to administrator accounts."
                        actionLabel="Back to home"
                        onAction={() => navigate("/")}
                    />
                </div>

                <BottomNav active="profile" />
            </div>
        );
    }

    const rows =
        tab === "pending"
            ? pending
            : tab === "vendors"
                ? vendors
                : users;

    return (
        <div className="screen">
            <TopBar onBell={() => navigate("/notifications")} />

            <div className="scroll-area route-content">
                <div className="page-header">
                    <div>
                        <h1>Admin dashboard</h1>
                        <p>Vendor verification and account status</p>
                    </div>

                    <button
                        type="button"
                        className="ghost-btn"
                        onClick={loadDashboard}
                        disabled={loading}
                    >
                        <i className="bi bi-arrow-clockwise" />
                        Refresh
                    </button>
                </div>

                <div className="stat-grid">
                    <div className="stat-card">
                        <span>Users</span>
                        <strong>{stats.total}</strong>
                    </div>

                    <div className="stat-card attention">
                        <span>Awaiting verification</span>
                        <strong>{stats.pending}</strong>
                    </div>

                    <div className="stat-card">
                        <span>Verified vendors</span>
                        <strong>{stats.verifiedVendors}</strong>
                    </div>

                    <div className="stat-card">
                        <span>Suspended</span>
                        <strong>{stats.suspended}</strong>
                    </div>
                </div>

                <div className="tab-row">
                    {TABS.map((item) => (
                        <button
                            type="button"
                            key={item.id}
                            className={`tab-btn ${tab === item.id ? "active" : ""}`}
                            onClick={() => setTab(item.id)}
                        >
                            {item.label}

                            {item.id === "pending" && pending.length > 0 && (
                                <span className="tab-count">{pending.length}</span>
                            )}
                        </button>
                    ))}
                </div>

                {tab === "pending" && pending.length > 0 && (
                    <Banner tone="info" icon="bi-patch-check">
                        Verifying a vendor lets their listings appear in the
                        marketplace and marks them as a trusted seller.
                    </Banner>
                )}

                {loading && <Loader label="Loading accounts..." />}

                {!loading && error && (
                    <StateMessage
                        tone="error"
                        icon="bi-wifi-off"
                        title="Dashboard unavailable"
                        message={error}
                        actionLabel="Try again"
                        onAction={loadDashboard}
                    />
                )}

                {!loading && !error && rows.length === 0 && (
                    <StateMessage
                        icon={tab === "pending" ? "bi-check2-circle" : "bi-people"}
                        title={
                            tab === "pending"
                                ? "No vendors are waiting"
                                : "Nothing to show here"
                        }
                        message={
                            tab === "pending"
                                ? "Every vendor account has been reviewed."
                                : "No accounts match this view yet."
                        }
                    />
                )}

                {!loading && !error && rows.length > 0 && (
                    <div className="admin-list">
                        {rows.map((item) => (
                            <div key={item.userId} className="admin-card">
                                <div className="admin-card-head">
                                    <div>
                                        <strong>{item.displayName}</strong>
                                        <span>{item.email}</span>
                                    </div>

                                    <StatusPill user={item} />
                                </div>

                                <div className="admin-meta">
                        <span>
                          <i className="bi bi-person-badge" /> {item.userType}
                        </span>

                                    {item.phoneNumber && (
                                        <span>
                              <i className="bi bi-telephone" /> {item.phoneNumber}
                            </span>
                                    )}

                                    {item.address && (
                                        <span>
                              <i className="bi bi-geo-alt" /> {item.address}
                            </span>
                                    )}
                                </div>

                                <div className="admin-actions">
                                    {item.userType === "VENDOR" && !item.verified && (
                                        <button
                                            type="button"
                                            className="primary-action small"
                                            onClick={() => handleVerify(item)}
                                            disabled={busyId === item.userId}
                                        >
                                            <i className="bi bi-patch-check" />
                                            {busyId === item.userId
                                                ? "Verifying..."
                                                : "Verify vendor"}
                                        </button>
                                    )}

                                    {item.accountStatus === "ACTIVE" ? (
                                        <ConfirmButton
                                            label="Suspend"
                                            confirmLabel="Confirm suspend"
                                            icon="bi-slash-circle"
                                            disabled={busyId === item.userId}
                                            onConfirm={() => handleStatus(item, "SUSPENDED")}
                                        />
                                    ) : (
                                        <button
                                            type="button"
                                            className="ghost-btn"
                                            onClick={() => handleStatus(item, "ACTIVE")}
                                            disabled={busyId === item.userId}
                                        >
                                            <i className="bi bi-check2-circle" />
                                            Reactivate
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <BottomNav active="profile" />
        </div>
    );
}

export default AdminDashboard;
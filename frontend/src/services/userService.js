import apiClient from "./apiClient.js";

function mapUser(user) {
    const firstName = user?.firstName || "";
    const lastName = user?.lastName || "";
    const userType = user?.userType || user?.role || "RESIDENT";

    return {
        userId: user?.userId,
        email: user?.email || "",
        firstName,
        lastName,
        displayName:
            [firstName, lastName].filter(Boolean).join(" ") ||
            user?.email?.split("@")[0] ||
            "User",
        phoneNumber: user?.phoneNumber || "",
        address: user?.address || "",
        userType,
        verified: Boolean(user?.verified),
        accountStatus: user?.accountStatus || "ACTIVE",
        isVendor: userType === "VENDOR",
        isAdmin: userType === "ADMIN",
        needsVerification:
            userType === "VENDOR" &&
            (!user?.verified || user?.accountStatus === "PENDING_VERIFICATION"),
    };
}

async function getUsers() {
    const response = await apiClient.get("/users");

    return (Array.isArray(response.data) ? response.data : []).map(mapUser);
}

/**
 * Vendor accounts waiting for review.
 *
 * Falls back to filtering the full user list when the backend is
 * older than the /users/vendors/pending endpoint.
 */
async function getPendingVendors() {
    try {
        const response = await apiClient.get("/users/vendors/pending");

        return (Array.isArray(response.data) ? response.data : []).map(mapUser);
    } catch (requestError) {
        if (requestError?.response?.status === 404) {
            const users = await getUsers();

            return users.filter((user) => user.needsVerification);
        }

        throw requestError;
    }
}

async function getUserById(userId) {
    const response = await apiClient.get(`/users/${userId}`);

    return mapUser(response.data);
}

async function updateProfile(userId, profile) {
    const response = await apiClient.put(`/users/${userId}/profile`, {
        firstName: profile.firstName ?? null,
        lastName: profile.lastName ?? null,
        phoneNumber: profile.phoneNumber ?? null,
        address: profile.address ?? null,
    });

    return mapUser(response.data);
}

async function verifyVendor(userId) {
    const response = await apiClient.put(`/users/${userId}/verify-vendor`);

    return mapUser(response.data);
}

async function updateUserStatus(userId, status) {
    const response = await apiClient.put(`/users/${userId}/status`, null, {
        params: { status },
    });

    return mapUser(response.data);
}

export {
    getPendingVendors,
    getUserById,
    getUsers,
    mapUser,
    updateProfile,
    updateUserStatus,
    verifyVendor,
};
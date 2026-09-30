import { API_BASE_URL } from "./apiClient.js";

const USER_KEY = "communityStoreUser";

/**
 * Shapes the sign-in response into the object that is stored in
 * localStorage and reused across the app.
 */
function toSessionUser(session) {
  const firstName = session.firstName || "";
  const lastName = session.lastName || "";

  const displayName =
      [firstName, lastName].filter(Boolean).join(" ") ||
      session.email?.split("@")[0] ||
      "User";

  return {
    userId: session.userId,
    email: session.email,
    firstName,
    lastName,
    displayName,
    phoneNumber: session.phoneNumber || "",
    address: session.address || "",
    role: session.role || "RESIDENT",
    verified: Boolean(session.verified),
    accountStatus: session.accountStatus || "ACTIVE",
  };
}

/**
 * Register a new Community Store user.
 */
async function register(user) {
  const response = await fetch(
      `${API_BASE_URL}/users/register`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email: user.email.trim(),
          password: user.password,
          firstName: user.firstName?.trim() || "",
          lastName: user.lastName?.trim() || "",
          phoneNumber: user.phoneNumber?.trim() || "",
          address: user.address?.trim() || "",
          userType: user.userType || "RESIDENT",
        }),
      },
  );

  let data = null;

  try {
    data = await response.json();
  } catch {
    // Backend response was not JSON.
  }

  if (!response.ok) {
    const error = new Error(
        data?.message ||
        data?.error ||
        `Request failed with status ${response.status}`,
    );

    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
}

/**
 * Sign in using email and password.
 *
 * Vendors waiting for verification may sign in; they simply cannot
 * publish listings until an admin verifies the account.
 */
async function signIn(email, password) {
  const response = await fetch(
      `${API_BASE_URL}/users/signin`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      },
  );

  let session = null;

  try {
    session = await response.json();
  } catch {
    // Backend response was not JSON.
  }

  if (!response.ok) {
    const error = new Error(
        session?.message ||
        session?.error ||
        `Request failed with status ${response.status}`,
    );

    error.status = response.status;
    error.data = session;

    throw error;
  }

  saveUser(toSessionUser(session));

  return session;
}

/**
 * Persist a session object.
 */
function saveUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

/**
 * Get the logged-in user.
 */
function getCurrentUser() {
  const storedUser = localStorage.getItem(USER_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

/**
 * Merge changes into the stored session.
 *
 * Used after a profile update so the top bar and profile screen
 * show the new name without another sign-in.
 */
function updateStoredUser(changes) {
  const current = getCurrentUser();

  if (!current) {
    return null;
  }

  const next = {
    ...current,
    ...changes,
  };

  next.displayName =
      [next.firstName, next.lastName].filter(Boolean).join(" ") ||
      next.email?.split("@")[0] ||
      "User";

  return saveUser(next);
}

/**
 * Sign out.
 */
function signOut() {
  localStorage.removeItem(USER_KEY);
}

/**
 * Check whether a user is logged in.
 */
function isAuthenticated() {
  return Boolean(getCurrentUser());
}

/**
 * True when the account is a vendor that still needs admin
 * verification. Those accounts can browse but not sell.
 */
function isPendingVendor(user) {
  return Boolean(
      user &&
      user.role === "VENDOR" &&
      (user.accountStatus === "PENDING_VERIFICATION" || !user.verified),
  );
}

/**
 * True when the account is allowed to publish listings.
 */
function canSell(user) {
  if (!user) {
    return false;
  }

  return !isPendingVendor(user) && user.accountStatus !== "SUSPENDED";
}

export {
  canSell,
  getCurrentUser,
  isAuthenticated,
  isPendingVendor,
  register,
  saveUser,
  signIn,
  signOut,
  updateStoredUser,
};

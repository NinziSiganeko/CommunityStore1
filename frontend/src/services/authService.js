import { API_BASE_URL } from "./apiClient.js";

const USER_KEY = "communityStoreUser";

/**
 * Register a new Community Store user.
 *
 * This intentionally uses fetch() directly, matching
 * the working authentication approach used in AnimeStore.
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
 * This also uses direct fetch(), matching AnimeStore.
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

  const firstName = session.firstName || "";
  const lastName = session.lastName || "";

  const displayName =
      [firstName, lastName].filter(Boolean).join(" ") ||
      session.email?.split("@")[0] ||
      "User";

  localStorage.setItem(
      USER_KEY,
      JSON.stringify({
        userId: session.userId,
        email: session.email,
        role: session.role,
        firstName,
        lastName,
        displayName,
        verified: Boolean(session.verified),
      }),
  );

  return session;
}

/**
 * Get the logged-in user.
 */
function getCurrentUser() {
  const storedUser =
      localStorage.getItem(USER_KEY);

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

export {
  getCurrentUser,
  isAuthenticated,
  register,
  signIn,
  signOut,
};

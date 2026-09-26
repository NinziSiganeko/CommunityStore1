
const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080";

const TOKEN_KEY = "communityStoreToken";
const USER_KEY = "communityStoreUser";

/**
 * Sends a request directly to the Community Store backend.
 *
 * We intentionally use fetch() here instead of apiClient.js.
 * This follows the same authentication approach used in AnimeStore.
 */
async function request(url, options = {}) {
  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    // Some responses may not contain JSON.
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
 * Register a new Community Store user.
 *
 * Username is intentionally not included because
 * the user's email is now their login identifier.
 */
async function register(user) {
  return request("/users/register", {
    method: "POST",
    body: JSON.stringify({
      email: user.email.trim(),
      password: user.password,
      firstName: user.firstName?.trim() || "",
      lastName: user.lastName?.trim() || "",
      phoneNumber: user.phoneNumber?.trim() || "",
      address: user.address?.trim() || "",
      userType: user.userType || "RESIDENT",
    }),
  });
}

/**
 * Sign in using email and password.
 *
 * This uses direct fetch(), just like the working
 * AnimeStore authentication implementation.
 */
async function signIn(email, password) {
  const session = await request("/users/signin", {
    method: "POST",
    body: JSON.stringify({
      email: email.trim(),
      password,
    }),
  });

  const firstName = session.firstName || "";
  const lastName = session.lastName || "";

  const displayName =
    [firstName, lastName].filter(Boolean).join(" ") ||
    session.email?.split("@")[0] ||
    "User";

  /**
   * Store the JWT token for authenticated API requests.
   */
  localStorage.setItem(TOKEN_KEY, session.token);

  /**
   * Store only the user information that the frontend needs.
   *
   * Username is deliberately removed.
   */
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
 * Get the currently signed-in user from localStorage.
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
 * Sign the current user out.
 */
function signOut() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Check whether a JWT token currently exists.
 */
function isAuthenticated() {
  return Boolean(localStorage.getItem(TOKEN_KEY));
}

export {
  getCurrentUser,
  isAuthenticated,
  register,
  signIn,
  signOut,
};


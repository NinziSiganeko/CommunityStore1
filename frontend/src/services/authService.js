import apiClient from "./apiClient.js";

const TOKEN_KEY = "communityStoreToken";
const USER_KEY = "communityStoreUser";

async function register(user) {
  const response = await apiClient.post("/users/register", user);
  return response.data;
}

async function signIn(email, password) {
  const response = await apiClient.post("/users/signin", {
    email: email.trim(),
    password,
  });

  const session = response.data;
  const firstName = session.firstName || "";
  const lastName = session.lastName || "";
  const displayName =
      [firstName, lastName].filter(Boolean).join(" ") ||
      session.username ||
      session.email?.split("@")[0] ||
      "User";

  localStorage.setItem(TOKEN_KEY, session.token);
  localStorage.setItem(
      USER_KEY,
      JSON.stringify({
        userId: session.userId,
        username: session.username || "",
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

function getCurrentUser() {
  const storedUser = localStorage.getItem(USER_KEY);
  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser);
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

function signOut() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function isAuthenticated() {
  return Boolean(localStorage.getItem(TOKEN_KEY));
}

export { getCurrentUser, isAuthenticated, register, signIn, signOut };

import apiClient from "./apiClient.js";

const TOKEN_KEY = "communityStoreToken";
const USER_KEY = "communityStoreUser";

async function register(user) {
  const response = await apiClient.post("/users/register", user);
  return response.data;
}

async function signIn(email, password) {
  const response = await apiClient.post("/users/signin", { email, password });
  const session = response.data;
  localStorage.setItem(TOKEN_KEY, session.token);
  localStorage.setItem(USER_KEY, JSON.stringify({
    userId: session.userId,
    email: session.email,
    role: session.role,
  }));
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

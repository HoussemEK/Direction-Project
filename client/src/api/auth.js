import { api } from "./client";

const TOKEN_KEY = "direction_access_token";
const REFRESH_TOKEN_KEY = "direction_refresh_token";

export function getStoredTokens() {
  return {
    accessToken: localStorage.getItem(TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
  };
}

export function setStoredTokens(accessToken, refreshToken) {
  if (accessToken) {
    localStorage.setItem(TOKEN_KEY, accessToken);
  }
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function clearStoredTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function setAuthHeader(token) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}

export async function register(email, password, name) {
  const { data } = await api.post("/user/register", { email, password, name });
  setStoredTokens(data.accessToken, data.refreshToken);
  setAuthHeader(data.accessToken);
  return data;
}

export async function login(email, password) {
  const { data } = await api.post("/user/login", { email, password });
  setStoredTokens(data.accessToken, data.refreshToken);
  setAuthHeader(data.accessToken);
  return data;
}

export async function logout() {
  try {
    await api.post("/user/logout");
  } catch (err) {
    console.error("Logout error:", err);
  } finally {
    clearStoredTokens();
    setAuthHeader(null);
  }
}

export async function refreshTokens() {
  const { refreshToken } = getStoredTokens();
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const { data } = await api.post("/user/refresh", { refreshToken });
  setStoredTokens(data.accessToken, data.refreshToken);
  setAuthHeader(data.accessToken);
  return data;
}

export async function getCurrentUser() {
  const { data } = await api.get("/user/me");
  return data.user;
}

export async function updateCurrentUser(updates) {
  const { data } = await api.patch("/user/me", updates);
  return data.user;
}

export function initializeAuth() {
  const { accessToken } = getStoredTokens();
  if (accessToken) {
    setAuthHeader(accessToken);
    return true;
  }
  return false;
}

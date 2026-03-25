// frontend/src/services/api.js
const BASE_URL = "http://127.0.0.1:8000/api";

export const getAccessToken  = () => localStorage.getItem("access_token");
export const getRefreshToken = () => localStorage.getItem("refresh_token");
export const getUser         = () => JSON.parse(localStorage.getItem("user") || "null");

export const clearAuth = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  localStorage.removeItem("eis-permissions");
  window.location.href = "/login";
};

async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) { clearAuth(); return null; }
  const res = await fetch(`${BASE_URL}/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) { clearAuth(); return null; }
  const data = await res.json();
  localStorage.setItem("access_token", data.access);
  return data.access;
}

export async function apiFetch(path, options = {}) {
  let token = getAccessToken();
  const isFormData = options.body instanceof FormData;
  const makeRequest = (t) => fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      // Don't set Content-Type for FormData — browser sets multipart/form-data with boundary
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      "Authorization": `Bearer ${t}`,
      ...options.headers,
    },
  });
  let res = await makeRequest(token);
  if (res.status === 401) {
    token = await refreshAccessToken();
    if (!token) return null;
    res = await makeRequest(token);
  }
  return res;
}

export const authAPI = {
  login: (username, password) =>
    fetch(`${BASE_URL}/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    }),
  logout: (refresh) =>
    apiFetch("/auth/logout/", { method: "POST", body: JSON.stringify({ refresh }) }),
  me: () => apiFetch("/auth/me/"),
  changePassword: (data) =>
    apiFetch("/auth/change-password/", { method: "POST", body: JSON.stringify(data) }),
};

export const usersAPI = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/auth/users/${q ? "?" + q : ""}`);
  },
  get:    (id)       => apiFetch(`/auth/users/${id}/`),
  create: (data)     => apiFetch("/auth/users/", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => apiFetch(`/auth/users/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  deactivate: (id)   => apiFetch(`/auth/users/${id}/`, { method: "DELETE" }),
};

export const auditAPI = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/auth/audit-logs/${q ? "?" + q : ""}`);
  },
};

export default apiFetch;
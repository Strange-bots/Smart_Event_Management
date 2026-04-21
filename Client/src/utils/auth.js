export const CURRENT_USER_STORAGE_KEY = "smart_event_user";

const getApiBaseUrl = () => import.meta.env.VITE_API_URL ?? "";

export function getDashboardPath(role) {
  switch (role) {
    case "admin":
      return "/admin/admindashboard";
    case "organizer":
      return "/organizer/organizerdashboard";
    case "user":
    default:
      return "/user/dashboard";
  }
}

export function getCurrentUser() {
  const storedUser = window.localStorage.getItem(CURRENT_USER_STORAGE_KEY);
  return storedUser ? JSON.parse(storedUser) : null;
}

export function setCurrentUser(user) {
  window.localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(user));
}

export function clearCurrentUser() {
  window.localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
}

export async function authorizeDashboardAccess(role) {
  const currentUser = getCurrentUser();

  if (!currentUser?.token || !role) {
    return { authorized: false, user: null };
  }

  const response = await fetch(`${getApiBaseUrl()}/api/auth/authorize-dashboard`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${currentUser.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      role,
    }),
  });

  const data = await response.json().catch(() => ({}));

  return {
    authorized: response.ok && data?.authorized === true,
    user: data?.user ? { ...data.user, token: currentUser.token } : currentUser,
    status: response.status,
    message: data?.message,
  };
}

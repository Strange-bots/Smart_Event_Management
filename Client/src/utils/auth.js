export const CURRENT_USER_STORAGE_KEY = "smart_event_user";

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

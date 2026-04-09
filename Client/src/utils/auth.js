export const CURRENT_USER_STORAGE_KEY = "smart_event_user";
export const REGISTERED_USERS_STORAGE_KEY = "smart_event_registered_users";

export const demoUsers = [
  {
    name: "Demo User",
    email: "user@demo.com",
    password: "Demo@123",
    role: "user",
  },
  {
    name: "Demo Organizer",
    email: "organizer@demo.com",
    password: "Demo@123",
    role: "organizer",
  },
  {
    name: "Demo Admin",
    email: "admin@demo.com",
    password: "Demo@123",
    role: "admin",
  },
];

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

export function getRegisteredUsers() {
  const storedUsers = window.localStorage.getItem(REGISTERED_USERS_STORAGE_KEY);
  return storedUsers ? JSON.parse(storedUsers) : [];
}

export function saveRegisteredUsers(users) {
  window.localStorage.setItem(
    REGISTERED_USERS_STORAGE_KEY,
    JSON.stringify(users),
  );
}

export function findUserByCredentials(email, password) {
  const normalizedEmail = email.trim().toLowerCase();
  const demoUser = demoUsers.find(
    (user) =>
      user.email.toLowerCase() === normalizedEmail && user.password === password,
  );

  if (demoUser) {
    return demoUser;
  }

  const registeredUser = getRegisteredUsers().find(
    (user) =>
      user.email.toLowerCase() === normalizedEmail && user.password === password,
  );

  return registeredUser ?? null;
}

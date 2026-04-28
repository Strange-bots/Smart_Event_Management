import { getCurrentUser } from "../utils/auth";

const getApiBaseUrl = () => import.meta.env.VITE_API_URL ?? "";

const getAuthHeaders = () => {
  const currentUser = getCurrentUser();

  if (!currentUser?.token) {
    throw new Error("Authentication is required");
  }

  return {
    Authorization: `Bearer ${currentUser.token}`,
    "Content-Type": "application/json",
  };
};

const parseJsonResponse = async (response, fallbackMessage) => {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || fallbackMessage);
  }

  return data;
};

export async function fetchOrganizerNotifications() {
  const response = await fetch(`${getApiBaseUrl()}/api/organizer/notifications`, {
    headers: getAuthHeaders(),
  });
  const data = await parseJsonResponse(
    response,
    "Failed to fetch organizer notifications"
  );

  return data?.notifications ?? [];
}

export async function fetchMyNotifications() {
  const response = await fetch(`${getApiBaseUrl()}/api/notifications`, {
    headers: getAuthHeaders(),
  });
  const data = await parseJsonResponse(
    response,
    "Failed to fetch notifications"
  );

  return data?.notifications ?? [];
}

export async function markOrganizerNotificationRead(notificationId) {
  const response = await fetch(
    `${getApiBaseUrl()}/api/organizer/notifications/${notificationId}/read`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
    }
  );
  const data = await parseJsonResponse(
    response,
    "Failed to mark organizer notification as read"
  );

  return data?.notification ?? null;
}

export async function markAllOrganizerNotificationsRead() {
  const response = await fetch(
    `${getApiBaseUrl()}/api/organizer/notifications/read-all`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
    }
  );
  const data = await parseJsonResponse(
    response,
    "Failed to mark all organizer notifications as read"
  );

  return {
    updatedCount: data?.updatedCount ?? 0,
  };
}

export async function markMyNotificationRead(notificationId) {
  const response = await fetch(
    `${getApiBaseUrl()}/api/notifications/${notificationId}/read`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
    }
  );
  const data = await parseJsonResponse(
    response,
    "Failed to mark notification as read"
  );

  return data?.notification ?? null;
}

export async function markAllMyNotificationsRead() {
  const response = await fetch(
    `${getApiBaseUrl()}/api/notifications/read-all`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
    }
  );
  const data = await parseJsonResponse(
    response,
    "Failed to mark all notifications as read"
  );

  return {
    updatedCount: data?.updatedCount ?? 0,
  };
}

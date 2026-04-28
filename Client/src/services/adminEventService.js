import { getCurrentUser } from "../utils/auth";

const getApiBaseUrl = () => import.meta.env.VITE_API_URL ?? "";

const getAuthHeaders = () => {
  const currentUser = getCurrentUser();

  if (!currentUser?.token) {
    throw new Error("Authentication is required");
  }

  return {
    Authorization: `Bearer ${currentUser.token}`,
  };
};

const parseJsonResponse = async (response, fallbackMessage) => {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || fallbackMessage);
  }

  return data;
};

export async function fetchAdminEvents() {
  const response = await fetch(`${getApiBaseUrl()}/api/admin/events`, {
    headers: getAuthHeaders(),
  });
  const data = await parseJsonResponse(response, "Failed to fetch admin events");

  return data?.events ?? [];
}

export async function approveAdminEvent(eventId) {
  const response = await fetch(`${getApiBaseUrl()}/api/admin/events/${eventId}/approve`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });
  const data = await parseJsonResponse(response, "Failed to approve event");

  return data?.event ?? null;
}

export async function rejectAdminEvent(eventId) {
  const response = await fetch(`${getApiBaseUrl()}/api/admin/events/${eventId}/reject`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });
  const data = await parseJsonResponse(response, "Failed to reject event");

  return data?.event ?? null;
}

export async function deleteAdminEvent(eventId) {
  const response = await fetch(`${getApiBaseUrl()}/api/admin/events/${eventId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  await parseJsonResponse(response, "Failed to delete event");
}

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
    "x-user-email": currentUser.email,
  };
};

const parseJsonResponse = async (response, fallbackMessage) => {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || fallbackMessage);
  }

  return data;
};

export async function fetchAdminGalleryImages() {
  const response = await fetch(`${getApiBaseUrl()}/api/admin/gallery`, {
    headers: getAuthHeaders(),
  });
  const data = await parseJsonResponse(response, "Failed to fetch gallery images");

  return data?.images ?? [];
}

export async function uploadAdminGalleryImage(eventId, imageData) {
  const response = await fetch(`${getApiBaseUrl()}/api/admin/events/${eventId}/image`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ imageData }),
  });
  const data = await parseJsonResponse(response, "Failed to upload gallery image");

  return data?.event ?? null;
}

export async function deleteAdminGalleryImage(eventId) {
  const response = await fetch(`${getApiBaseUrl()}/api/admin/events/${eventId}/image`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  await parseJsonResponse(response, "Failed to delete gallery image");
}

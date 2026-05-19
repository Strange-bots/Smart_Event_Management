import { getCurrentUser } from "@/utils/auth";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

const getSettingsHeaders = () => {
  const currentUser = getCurrentUser();

  if (!currentUser?.token) {
    throw new Error("Admin session not found. Please log in again.");
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

export async function fetchAdminSettings() {
  const response = await fetch(`${API_BASE_URL}/api/admin/settings`, {
    headers: getSettingsHeaders(),
  });
  const data = await parseJsonResponse(response, "Failed to load admin settings");

  return data?.settings ?? {};
}

export async function saveAdminSettings(settings) {
  const response = await fetch(`${API_BASE_URL}/api/admin/settings`, {
    method: "PUT",
    headers: getSettingsHeaders(),
    body: JSON.stringify(settings),
  });
  const data = await parseJsonResponse(response, "Failed to save admin settings");

  return data?.settings ?? settings;
}

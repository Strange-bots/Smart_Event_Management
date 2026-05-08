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
    const error = new Error(data?.message || fallbackMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export async function fetchAdminUsers() {
  const response = await fetch(`${getApiBaseUrl()}/api/registrations/users`, {
    headers: getAuthHeaders(),
  });
  const data = await parseJsonResponse(response, "Failed to fetch users");

  return data?.users ?? [];
}

export async function createAdminUser(payload) {
  const response = await fetch(`${getApiBaseUrl()}/api/admin/users`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await parseJsonResponse(response, "Failed to create user");

  return data?.user ?? null;
}

export async function updateAdminUser(email, payload) {
  const response = await fetch(
    `${getApiBaseUrl()}/api/registrations/users/${encodeURIComponent(email)}`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    }
  );
  const data = await parseJsonResponse(response, "Failed to update user");

  return data?.user ?? null;
}

export async function deleteAdminUser(email) {
  const response = await fetch(
    `${getApiBaseUrl()}/api/registrations/users/${encodeURIComponent(email)}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    }
  );

  await parseJsonResponse(response, "Failed to delete user");
}

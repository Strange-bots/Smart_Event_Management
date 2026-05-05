import { getCurrentUser } from "../utils/auth";

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "";

const getAuthHeaders = () => {
  const currentUser = getCurrentUser();

  if (!currentUser?.token) {
    throw new Error("You need to sign in to manage payment preferences.");
  }

  return {
    Authorization: `Bearer ${currentUser.token}`,
    "Content-Type": "application/json",
  };
};

export async function fetchMyPaymentPreference() {
  const response = await fetch(`${apiBaseUrl}/api/payment-preferences/me`, {
    headers: getAuthHeaders(),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }

    throw new Error(data.message || "Unable to load payment preferences.");
  }

  return data.paymentPreference ?? null;
}

export async function saveMyPaymentPreference(payload) {
  const response = await fetch(`${apiBaseUrl}/api/payment-preferences/me`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Unable to save payment preferences.");
  }

  return data.paymentPreference ?? null;
}

export async function deleteMyPaymentPreference() {
  const response = await fetch(`${apiBaseUrl}/api/payment-preferences/me`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Unable to delete payment preferences.");
  }
}

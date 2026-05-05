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

export async function createStripeCheckoutSession(eventId) {
  const response = await fetch(`${getApiBaseUrl()}/api/events/${eventId}/stripe-checkout-session`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  const data = await parseJsonResponse(
    response,
    `Unable to create Stripe checkout session with status ${response.status}`,
  );

  return data;
}

export async function confirmStripeCheckoutSession(sessionId) {
  const response = await fetch(`${getApiBaseUrl()}/api/payments/stripe/confirm-session`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ sessionId }),
  });
  const data = await parseJsonResponse(
    response,
    `Unable to confirm Stripe payment with status ${response.status}`,
  );

  return data;
}

export async function fetchMyPayments() {
  const response = await fetch(`${getApiBaseUrl()}/api/payments/me`, {
    headers: getAuthHeaders(),
  });
  const data = await parseJsonResponse(
    response,
    `Payments request failed with status ${response.status}`,
  );

  return data?.receipts ?? [];
}

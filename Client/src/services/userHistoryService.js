import { getCurrentUser } from "../utils/auth";

const getApiBaseUrl = () => import.meta.env.VITE_API_URL ?? "";

const parseJsonResponse = async (response, fallbackMessage) => {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || fallbackMessage);
  }

  return data;
};

export async function fetchUserHistory({ riskLevel } = {}) {
  const currentUser = getCurrentUser();

  if (!currentUser?.token) {
    throw new Error("Authentication is required");
  }

  const params = new URLSearchParams();

  if (riskLevel && riskLevel !== "all") {
    params.set("riskLevel", riskLevel);
  }

  const queryString = params.toString();
  const response = await fetch(
    `${getApiBaseUrl()}/api/user-history${queryString ? `?${queryString}` : ""}`,
    {
      headers: {
        Authorization: `Bearer ${currentUser.token}`,
      },
    }
  );
  const data = await parseJsonResponse(
    response,
    "Failed to fetch user history"
  );

  return data?.users ?? [];
}

export async function reportUserHistory({
  userEmail,
  riskLevel,
  eventPhase,
  eventId,
  eventTitle,
  reason,
}) {
  const currentUser = getCurrentUser();

  if (!currentUser?.token) {
    throw new Error("Authentication is required");
  }

  const response = await fetch(`${getApiBaseUrl()}/api/user-history/reports`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${currentUser.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userEmail,
      riskLevel,
      eventPhase,
      eventId,
      eventTitle,
      reason,
    }),
  });
  const data = await parseJsonResponse(
    response,
    "Failed to create user history report"
  );

  return data;
}

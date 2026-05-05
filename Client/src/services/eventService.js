import { getCurrentUser } from "../utils/auth";

const getApiBaseUrl = () => import.meta.env.VITE_API_URL ?? "";

const parseJsonResponse = async (response, fallbackMessage) => {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || fallbackMessage);
  }

  return data;
};

export async function fetchEvents({ category, search } = {}) {
  const params = new URLSearchParams();

  if (category) {
    params.set("category", category);
  }

  if (search?.trim()) {
    params.set("search", search.trim());
  }

  const queryString = params.toString();
  const url = `${getApiBaseUrl()}/api/events${queryString ? `?${queryString}` : ""}`;
  const response = await fetch(url);
  const data = await parseJsonResponse(
    response,
    `Events request failed with status ${response.status}`
  );

  return data?.events ?? [];
}

export async function fetchRecommendedUserEvents(limit = 3) {
  const currentUser = getCurrentUser();
  const params = new URLSearchParams();

  if (limit) {
    params.set("limit", String(limit));
  }

  const response = await fetch(
    `${getApiBaseUrl()}/api/events/recommendations${params.toString() ? `?${params.toString()}` : ""}`,
    {
      headers: currentUser?.token
        ? {
            Authorization: `Bearer ${currentUser.token}`,
          }
        : undefined,
    }
  );
  const data = await parseJsonResponse(
    response,
    `Recommended events request failed with status ${response.status}`
  );

  return {
    recommendations: data?.recommendations ?? [],
    source: data?.source ?? "fallback",
    reason: data?.reason ?? null,
    modelResult: data?.modelResult ?? null,
  };
}

export async function fetchEventById(eventId) {
  const events = await fetchEvents();

  return events.find((event) => String(event.id) === String(eventId)) ?? null;
}

export async function registerForEvent(eventId) {
  const currentUser = getCurrentUser();

  if (!currentUser?.token) {
    throw new Error("Please sign in as a user before registering for events.");
  }

  const response = await fetch(
    `${getApiBaseUrl()}/api/events/${eventId}/registrations`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${currentUser.token}`,
        "Content-Type": "application/json",
      },
    }
  );
  const data = await parseJsonResponse(
    response,
    `Event registration failed with status ${response.status}`
  );

  return data;
}

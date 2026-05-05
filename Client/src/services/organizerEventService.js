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

export async function fetchOrganizerEvents() {
  const response = await fetch(`${getApiBaseUrl()}/api/organizer/events`, {
    headers: getAuthHeaders(),
  });
  const data = await parseJsonResponse(response, "Failed to fetch organizer events");

  return data?.events ?? [];
}

export async function createOrganizerEvent(eventPayload) {
  const response = await fetch(`${getApiBaseUrl()}/api/organizer/events`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(eventPayload),
  });
  const data = await parseJsonResponse(response, "Failed to create event");

  return data?.event;
}

export async function generateOrganizerEventDescription(payload) {
  const response = await fetch(`${getApiBaseUrl()}/api/organizer/events/ai/description`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await parseJsonResponse(response, "Failed to generate event description");

  return {
    description: data?.description ?? "",
    source: data?.source ?? "fallback",
    reason: data?.reason ?? null,
    modelResult: data?.modelResult ?? null,
  };
}

export async function suggestOrganizerEventTags(payload) {
  const response = await fetch(`${getApiBaseUrl()}/api/organizer/events/ai/tags`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await parseJsonResponse(response, "Failed to suggest event tags");

  return {
    tags: data?.tags ?? [],
    source: data?.source ?? "fallback",
    reason: data?.reason ?? null,
    modelResult: data?.modelResult ?? null,
  };
}

export async function suggestOrganizerEventTimes(payload) {
  const response = await fetch(`${getApiBaseUrl()}/api/organizer/events/ai/time-suggestions`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await parseJsonResponse(response, "Failed to suggest event times");

  return {
    suggestions: data?.suggestions ?? [],
    source: data?.source ?? "fallback",
    reason: data?.reason ?? null,
    modelResult: data?.modelResult ?? null,
  };
}

export async function updateOrganizerEvent(eventId, eventPayload) {
  const response = await fetch(`${getApiBaseUrl()}/api/organizer/events/${eventId}`, {
    method: "PUT",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(eventPayload),
  });
  const data = await parseJsonResponse(response, "Failed to update event");

  return data?.event;
}

export async function duplicateOrganizerEvent(eventId) {
  const response = await fetch(
    `${getApiBaseUrl()}/api/organizer/events/${eventId}/duplicate`,
    {
      method: "POST",
      headers: getAuthHeaders(),
    },
  );
  const data = await parseJsonResponse(response, "Failed to duplicate event");

  return data?.event;
}

export async function deleteOrganizerEvent(eventId) {
  const response = await fetch(`${getApiBaseUrl()}/api/organizer/events/${eventId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  await parseJsonResponse(response, "Failed to delete event");
}

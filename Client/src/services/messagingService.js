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

export async function fetchAdminMessageLogs() {
  const response = await fetch(`${getApiBaseUrl()}/api/admin/messages`, {
    headers: getAuthHeaders(),
  });
  const data = await parseJsonResponse(response, "Failed to fetch admin messages");

  return data?.emailLogs ?? [];
}

export async function sendAdminMessage(payload) {
  const response = await fetch(`${getApiBaseUrl()}/api/admin/messages`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await parseJsonResponse(response, "Failed to send admin message");

  return {
    log: data?.log ?? null,
    recipientCount: data?.recipientCount ?? 0,
  };
}

export async function fetchAdminMailTemplates(payload) {
  const response = await fetch(`${getApiBaseUrl()}/api/admin/messages/ai-templates`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await parseJsonResponse(response, "Failed to fetch admin mail templates");

  return {
    templates: data?.templates ?? [],
    source: data?.source ?? "fallback",
    reason: data?.reason ?? null,
    modelResult: data?.modelResult ?? null,
  };
}

export async function fetchOrganizerMessageLogs() {
  const response = await fetch(`${getApiBaseUrl()}/api/organizer/messages`, {
    headers: getAuthHeaders(),
  });
  const data = await parseJsonResponse(response, "Failed to fetch organizer messages");

  return data?.emailLogs ?? [];
}

export async function sendOrganizerMessage(payload) {
  const response = await fetch(`${getApiBaseUrl()}/api/organizer/messages`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await parseJsonResponse(response, "Failed to send organizer message");

  return {
    log: data?.log ?? null,
    recipientCount: data?.recipientCount ?? 0,
  };
}

export async function fetchOrganizerMailTemplates(payload) {
  const response = await fetch(`${getApiBaseUrl()}/api/organizer/messages/ai-templates`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await parseJsonResponse(response, "Failed to fetch organizer mail templates");

  return {
    templates: data?.templates ?? [],
    source: data?.source ?? "fallback",
    reason: data?.reason ?? null,
    modelResult: data?.modelResult ?? null,
  };
}

export async function fetchInboxMessages() {
  const response = await fetch(`${getApiBaseUrl()}/api/messages/inbox`, {
    headers: getAuthHeaders(),
  });
  const data = await parseJsonResponse(response, "Failed to fetch inbox messages");

  return data?.messages ?? [];
}

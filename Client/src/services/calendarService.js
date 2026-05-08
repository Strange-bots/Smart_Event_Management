import { getCurrentUser } from "../utils/auth";

const getApiBaseUrl = () => import.meta.env.VITE_API_URL ?? "";

export async function fetchRoleScopedCalendarEvents() {
  const currentUser = getCurrentUser();

  if (!currentUser?.token) {
    throw new Error("Please sign in to view calendar events.");
  }

  const response = await fetch(`${getApiBaseUrl()}/api/calendar/events`, {
    headers: {
      Authorization: `Bearer ${currentUser.token}`,
    },
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || "Failed to load calendar events");
  }

  return {
    events: data?.events ?? [],
    summary: data?.summary ?? {
      ongoing: 0,
      coming: 0,
      gone: 0,
      total: 0,
    },
    groupedEvents: data?.groupedEvents ?? {
      ongoing: [],
      coming: [],
      gone: [],
    },
  };
}

import { getCurrentUser } from "../utils/auth";

const getApiBaseUrl = () => import.meta.env.VITE_API_URL ?? "";

export async function fetchAdminDashboardOverview() {
  const currentUser = getCurrentUser();

  if (!currentUser?.token) {
    throw new Error("Admin session not found. Please log in again.");
  }

  const response = await fetch(`${getApiBaseUrl()}/api/admin/dashboard/overview`, {
    headers: {
      Authorization: `Bearer ${currentUser.token}`,
      "Content-Type": "application/json",
      "x-user-email": currentUser.email,
    },
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || "Failed to load admin dashboard overview");
  }

  return {
    stats: data?.stats ?? null,
    eventsByMonth: data?.eventsByMonth ?? [],
    venueDistribution: data?.venueDistribution ?? [],
    calendarEvents: data?.calendarEvents ?? [],
    calendarSummary: data?.calendarSummary ?? {
      ongoing: 0,
      coming: 0,
      gone: 0,
      total: 0,
    },
  };
}

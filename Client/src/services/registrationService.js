import { getCurrentUser } from "../utils/auth";

const getApiBaseUrl = () => import.meta.env.VITE_API_URL ?? "";

export async function fetchOrganizerRegistrations() {
  const currentUser = getCurrentUser();

  if (!currentUser?.token) {
    throw new Error("Authentication is required");
  }

  const response = await fetch(`${getApiBaseUrl()}/api/organizer/registrations`, {
    headers: {
      Authorization: `Bearer ${currentUser.token}`,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || "Failed to fetch registrations");
  }

  return {
    registrations: data?.registrations ?? [],
  };
}

export async function exportOrganizerRegistrations({
  search,
  eventName,
  paymentStatus,
  riskLevel,
}) {
  const currentUser = getCurrentUser();

  if (!currentUser?.token) {
    throw new Error("Authentication is required");
  }

  const params = new URLSearchParams();

  if (search?.trim()) {
    params.set("search", search.trim());
  }

  if (eventName && eventName !== "All Events") {
    params.set("eventName", eventName);
  }

  if (paymentStatus && paymentStatus !== "all") {
    params.set("paymentStatus", paymentStatus);
  }

  if (riskLevel && riskLevel !== "all") {
    params.set("riskLevel", riskLevel);
  }

  const queryString = params.toString();
  const response = await fetch(
    `${getApiBaseUrl()}/api/organizer/registrations/export${queryString ? `?${queryString}` : ""}`,
    {
      headers: {
        Authorization: `Bearer ${currentUser.token}`,
      },
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.message || "Failed to export registrations");
  }

  const blob = await response.blob();
  const contentDisposition = response.headers.get("content-disposition") || "";
  const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);

  return {
    blob,
    fileName: fileNameMatch?.[1] || "organizer-registrations.xls",
  };
}

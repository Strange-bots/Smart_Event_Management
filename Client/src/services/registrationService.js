const getApiBaseUrl = () => import.meta.env.VITE_API_URL ?? "";

export async function exportOrganizerRegistrations({
  organizerEmail,
  search,
  eventName,
  paymentStatus,
  riskLevel,
}) {
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
        "x-user-email": organizerEmail,
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

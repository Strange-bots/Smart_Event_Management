import { getCurrentUser } from "../utils/auth";

const getApiBaseUrl = () => import.meta.env.VITE_API_URL ?? "";

export async function fetchOrganizerFeedback() {
  const currentUser = getCurrentUser();

  if (!currentUser?.token) {
    throw new Error("Authentication is required");
  }

  const response = await fetch(`${getApiBaseUrl()}/api/organizer/feedback`, {
    headers: {
      Authorization: `Bearer ${currentUser.token}`,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || "Failed to fetch organizer feedback");
  }

  return {
    feedback: data?.feedback ?? [],
    analytics: data?.analytics ?? {
      averageRating: 0,
      totalReviews: 0,
      positiveReviews: 0,
      reviewsByEvent: [],
    },
  };
}

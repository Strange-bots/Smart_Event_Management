import { getCurrentUser } from "../utils/auth";

const getApiBaseUrl = () => import.meta.env.VITE_API_URL ?? "";

export async function fetchHeroImage() {
  const response = await fetch(`${getApiBaseUrl()}/api/hero-image`);

  if (!response.ok) {
    throw new Error(`Hero image request failed with status ${response.status}`);
  }

  const data = await response.json();

  return data?.imageUrl ?? "";
}

export async function fetchEventStats() {
  const response = await fetch(`${getApiBaseUrl()}/api/events/stats`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Event stats request failed with status ${response.status}`);
  }

  const result = await response.json();

  return result?.success ? result.data : null;
}

export async function fetchNextEvent() {
  const response = await fetch(`${getApiBaseUrl()}/api/events/next`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Next event request failed with status ${response.status}`);
  }

  const data = await response.json();

  return data?.event ?? null;
}

export async function fetchFeaturedEvents() {
  const response = await fetch(`${getApiBaseUrl()}/api/events/featured`);

  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    throw new Error(
      `Featured events request failed with status ${response.status}`
    );
  }

  const data = await response.json();

  return data?.featuredEvents ?? [];
}

export async function fetchRecommendedEvents() {
  const currentUser = getCurrentUser();
  const response = await fetch(`${getApiBaseUrl()}/api/events/recommendations`, {
    headers: currentUser?.token
      ? {
          Authorization: `Bearer ${currentUser.token}`,
        }
      : undefined,
  });

  if (!response.ok) {
    throw new Error(
      `Recommendations request failed with status ${response.status}`
    );
  }

  const data = await response.json();

  return {
    recommendations: data?.recommendations ?? [],
    source: data?.source ?? "fallback",
  };
}

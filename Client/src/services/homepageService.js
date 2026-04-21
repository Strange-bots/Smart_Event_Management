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

  if (!response.ok) {
    throw new Error(`Next event request failed with status ${response.status}`);
  }

  const data = await response.json();

  return data?.event ?? null;
}

export async function fetchRecommendedEvents() {
  const response = await fetch(`${getApiBaseUrl()}/api/events/recommendations`);

  if (!response.ok) {
    throw new Error(
      `Recommendations request failed with status ${response.status}`
    );
  }

  const data = await response.json();

  return data?.recommendations ?? [];
}

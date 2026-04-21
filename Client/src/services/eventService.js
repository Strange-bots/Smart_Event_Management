const getApiBaseUrl = () => import.meta.env.VITE_API_URL ?? "";

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

  if (!response.ok) {
    throw new Error(`Events request failed with status ${response.status}`);
  }

  const data = await response.json();

  return data?.events ?? [];
}

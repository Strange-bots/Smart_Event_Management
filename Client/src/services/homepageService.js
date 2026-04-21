const getApiBaseUrl = () => import.meta.env.VITE_API_URL ?? "";

export async function fetchHeroImage() {
  const response = await fetch(`${getApiBaseUrl()}/api/hero-image`);

  if (!response.ok) {
    throw new Error(`Hero image request failed with status ${response.status}`);
  }

  const data = await response.json();

  return data?.imageUrl ?? "";
}

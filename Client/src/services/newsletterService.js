const getApiBaseUrl = () => import.meta.env.VITE_API_URL ?? "";

export async function subscribeToNewsletter(email) {
  const response = await fetch(`${getApiBaseUrl()}/api/newsletter/subscribe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || "Failed to subscribe");
  }

  return data;
}

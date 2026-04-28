const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

export async function fetchPublicBrandingSettings() {
  const response = await fetch(`${API_BASE_URL}/api/settings/public`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || "Failed to load public branding settings");
  }

  return data?.branding ?? {};
}

export async function fetchPublicAppearanceSettings() {
  const branding = await fetchPublicBrandingSettings();
  return branding?.appearance ?? {};
}

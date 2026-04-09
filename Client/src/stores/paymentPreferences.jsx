// Payment preferences stored in cookies/localStorage

const STORAGE_KEY = "smart_events_payment_prefs";

export const getPaymentPreferences = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error reading payment preferences:", error);
  }
  return null;
};

export const savePaymentPreferences = (prefs) => {
  try {
    if (prefs.rememberPreference) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
      document.cookie = `payment_prefs_saved=true; max-age=${60 * 60 * 24 * 365}; path=/; SameSite=Strict`;
    }
  } catch (error) {
    console.error("Error saving payment preferences:", error);
  }
};

export const clearPaymentPreferences = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    document.cookie = "payment_prefs_saved=; max-age=0; path=/";
  } catch (error) {
    console.error("Error clearing payment preferences:", error);
  }
};

export const hasPaymentPreferences = () => {
  return document.cookie.includes("payment_prefs_saved=true");
};

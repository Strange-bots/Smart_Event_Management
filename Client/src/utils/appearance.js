const DEFAULT_APPEARANCE = {
  themeMode: "light",
  darkMode: false,
  primaryColor: "#1F4E79",
  accentColor: "#F36F21",
};

const hexToRgb = (hex) => {
  const normalized = String(hex || "").trim().replace("#", "");

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return null;
  }

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
};

const rgbToHex = ({ r, g, b }) =>
  `#${[r, g, b]
    .map((value) => Math.max(0, Math.min(255, value)).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;

const mixWithWhite = (hex, ratio = 0.2) => {
  const rgb = hexToRgb(hex);

  if (!rgb) {
    return hex;
  }

  return rgbToHex({
    r: Math.round(rgb.r + (255 - rgb.r) * ratio),
    g: Math.round(rgb.g + (255 - rgb.g) * ratio),
    b: Math.round(rgb.b + (255 - rgb.b) * ratio),
  });
};

export const getSystemTheme = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

export const resolveThemeMode = (themeMode = "light") =>
  themeMode === "system" ? getSystemTheme() : themeMode;

export const applyAppearanceSettings = (appearance = {}) => {
  const merged = { ...DEFAULT_APPEARANCE, ...appearance };
  const resolvedTheme = resolveThemeMode(merged.themeMode);
  const isDark = resolvedTheme === "dark";
  const root = document.documentElement;

  // Theme class
  if (isDark) {
    root.classList.add("dark");
    root.classList.remove("light");
  } else {
    root.classList.add("light");
    root.classList.remove("dark");
  }

  // Secondary/accent color → button colors across the entire site
  root.style.setProperty("--color-primary", merged.accentColor);
  root.style.setProperty("--color-primary-hover", mixWithWhite(merged.accentColor, 0.12));
  root.style.setProperty("--color-primary-foreground", "#FFFFFF");
  root.style.setProperty("--color-brand-orange", merged.accentColor);
  root.style.setProperty("--color-brand-orange-hover", mixWithWhite(merged.accentColor, 0.16));

  // Persist to localStorage so settings survive page refresh
  localStorage.setItem("sem-theme", merged.themeMode);
  localStorage.setItem("sem-brand-color", merged.primaryColor);
  localStorage.setItem("sem-secondary-color", merged.accentColor);

  // Sidebar/navbar gradient — computed separately per theme so dark mode looks appropriate
  const headerRgb = hexToRgb(merged.primaryColor);

  if (isDark) {
    // Dark mode: use a deep dark sidebar derived from the brand color tint
    root.style.setProperty("--color-header",
      headerRgb ? rgbToHex({ r: Math.round(headerRgb.r * 0.32), g: Math.round(headerRgb.g * 0.32), b: Math.round(headerRgb.b * 0.32) }) : "#0D1F33"
    );
    root.style.setProperty("--color-header-mid", "#0C1724");
    root.style.setProperty("--color-header-end", "#08131F");
    // Top navbar uses card color in dark mode
    root.style.setProperty("--color-nav-bg", "#102131");
    root.style.setProperty("--color-nav-border", "#1E3348");
    // Full dark palette
    root.style.setProperty("--color-body", "#E5EEF8");
    root.style.setProperty("--color-foreground", "#E5EEF8");
    root.style.setProperty("--color-subtext", "#94A8C0");
    root.style.setProperty("--color-muted-foreground", "#94A8C0");
    root.style.setProperty("--color-background", "#09121D");
    root.style.setProperty("--color-input", "#1E3348");
    root.style.setProperty("--color-card", "#102131");
    root.style.setProperty("--color-card-foreground", "#E5EEF8");
    root.style.setProperty("--color-section", "#0C1724");
    root.style.setProperty("--color-secondary", "#162637");
    root.style.setProperty("--color-secondary-foreground", "#E5EEF8");
    root.style.setProperty("--color-accent", "#162637");
    root.style.setProperty("--color-accent-foreground", "#E5EEF8");
    root.style.setProperty("--color-footer", "#08131F");
  } else {
    // Light mode: sidebar uses full brand color gradient
    root.style.setProperty("--color-header", merged.primaryColor);
    if (headerRgb) {
      root.style.setProperty("--color-header-mid", rgbToHex({
        r: Math.round(headerRgb.r * 0.73),
        g: Math.round(headerRgb.g * 0.73),
        b: Math.round(headerRgb.b * 0.73),
      }));
      root.style.setProperty("--color-header-end", rgbToHex({
        r: Math.round(headerRgb.r * 0.48),
        g: Math.round(headerRgb.g * 0.48),
        b: Math.round(headerRgb.b * 0.48),
      }));
    }
    // Top navbar — white in light mode
    root.style.setProperty("--color-nav-bg", "#FFFFFF");
    root.style.setProperty("--color-nav-border", "#D9E2EC");
    // Full light palette
    root.style.setProperty("--color-body", "#0F1E33");
    root.style.setProperty("--color-foreground", "#0F1E33");
    root.style.setProperty("--color-subtext", "#6B7C93");
    root.style.setProperty("--color-muted-foreground", "#6B7C93");
    root.style.setProperty("--color-background", "#F5F7FA");
    root.style.setProperty("--color-input", "#D9E2EC");
    root.style.setProperty("--color-card", "#FFFFFF");
    root.style.setProperty("--color-card-foreground", "#0F1E33");
    root.style.setProperty("--color-section", "#F5F7FA");
    root.style.setProperty("--color-secondary", "#F5F7FA");
    root.style.setProperty("--color-secondary-foreground", "#0F1E33");
    root.style.setProperty("--color-accent", "#F5F7FA");
    root.style.setProperty("--color-accent-foreground", "#0F1E33");
    root.style.setProperty("--color-footer", "#0F1E33");
  }
};

export const getDefaultAppearance = () => ({ ...DEFAULT_APPEARANCE });

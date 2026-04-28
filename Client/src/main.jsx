import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/authcontext1.jsx'

// Restore appearance settings before React renders to avoid flash
const _savedTheme = localStorage.getItem("sem-theme");
const _savedBrand = localStorage.getItem("sem-brand-color");
const _savedSecondary = localStorage.getItem("sem-secondary-color");
const _isDark = _savedTheme === "dark" || (_savedTheme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

if (_isDark) {
  document.documentElement.classList.add("dark");
  document.documentElement.classList.remove("light");
  // Dark sidebar: tinted dark version of brand color
  if (_savedBrand) {
    const _hex = _savedBrand.replace("#", "");
    if (/^[0-9a-fA-F]{6}$/.test(_hex)) {
      const _r = Math.round(parseInt(_hex.slice(0, 2), 16) * 0.32).toString(16).padStart(2, "0");
      const _g = Math.round(parseInt(_hex.slice(2, 4), 16) * 0.32).toString(16).padStart(2, "0");
      const _b = Math.round(parseInt(_hex.slice(4, 6), 16) * 0.32).toString(16).padStart(2, "0");
      document.documentElement.style.setProperty("--color-header", `#${_r}${_g}${_b}`);
    }
  }
  document.documentElement.style.setProperty("--color-header-mid", "#0C1724");
  document.documentElement.style.setProperty("--color-header-end", "#08131F");
  document.documentElement.style.setProperty("--color-nav-bg", "#102131");
  document.documentElement.style.setProperty("--color-nav-border", "#1E3348");
  document.documentElement.style.setProperty("--color-background", "#09121D");
  document.documentElement.style.setProperty("--color-card", "#102131");
  document.documentElement.style.setProperty("--color-foreground", "#E5EEF8");
  document.documentElement.style.setProperty("--color-muted-foreground", "#94A8C0");
} else if (_savedTheme) {
  document.documentElement.classList.add("light");
  document.documentElement.classList.remove("dark");
  // Light sidebar: full brand color
  if (_savedBrand) {
    document.documentElement.style.setProperty("--color-header", _savedBrand);
  }
  document.documentElement.style.setProperty("--color-nav-bg", "#FFFFFF");
  document.documentElement.style.setProperty("--color-nav-border", "#D9E2EC");
}

if (_savedSecondary) {
  document.documentElement.style.setProperty("--color-primary", _savedSecondary);
  document.documentElement.style.setProperty("--color-brand-orange", _savedSecondary);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)

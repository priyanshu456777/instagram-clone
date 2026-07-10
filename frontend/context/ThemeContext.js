import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(undefined);

const STORAGE_KEY = "instaclone-theme";

export function ThemeProvider({ children }) {
  // Default to "dark" on the server / first render so markup always matches
  // what the inline script in _document.js already applied to <html> before
  // hydration — this avoids any hydration mismatch warnings.
  const [theme, setTheme] = useState("dark");
  const [mounted, setMounted] = useState(false);

  // On mount, read the value the inline script already set on <html> (it
  // ran before React hydrated) so React state matches the DOM instantly.
  useEffect(() => {
    const isLight = document.documentElement.classList.contains("light");
    setTheme(isLight ? "light" : "dark");
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
    } else {
      root.classList.remove("light");
    }
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      // localStorage may be unavailable (private browsing, etc.) — theme
      // still works for the current session, just won't persist.
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (ctx === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
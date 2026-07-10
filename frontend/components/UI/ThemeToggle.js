import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export default function ThemeToggle({ size = 20, className = "" }) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
      title={isLight ? "Switch to dark mode" : "Switch to light mode"}
      className={`theme-toggle-btn rounded-xl text-gray-300 hover:text-white hover:bg-white/[0.05] ${className}`}
    >
      {isLight ? <Moon size={size} strokeWidth={2} /> : <Sun size={size} strokeWidth={2} />}
    </button>
  );
}
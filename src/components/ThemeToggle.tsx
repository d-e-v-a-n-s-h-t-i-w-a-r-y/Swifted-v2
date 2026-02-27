import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="flex items-center gap-3 w-full py-3.5 px-4 rounded-xl font-medium text-foreground bg-secondary/50 border border-border transition-all hover:bg-secondary text-sm"
    >
      {theme === "dark" ? (
        <>
          <Sun size={18} className="text-warning" />
          <span>Switch to Light Mode</span>
        </>
      ) : (
        <>
          <Moon size={18} className="text-info" />
          <span>Switch to Dark Mode</span>
        </>
      )}
    </button>
  );
}

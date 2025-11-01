"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/providers/theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme, isReady } = useTheme();
  const icon = !isReady ? <Moon className="h-4 w-4" /> : theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />;

  return (
    <Button
      type="button"
      size="icon"
      aria-label="Toggle dark mode"
      onClick={toggleTheme}
      disabled={!isReady}
    >
      {icon}
    </Button>
  );
}

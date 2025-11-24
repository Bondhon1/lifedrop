"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/providers/theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme, isReady } = useTheme();
  const icon = !isReady ? <Moon className="h-5 w-5" /> : theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-12 w-12"
      aria-label="Toggle dark mode"
      onClick={toggleTheme}
      disabled={!isReady}
    >
      {icon}
    </Button>
  );
}

"use client";

import * as React from "react";
import { Moon, Sun, Laptop, Check } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeSwitcher() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    // Legacy migration: convert legacy 'clay' storage to 'light'
    if (theme === "clay") {
      setTheme("light");
    }
  }, [theme, setTheme]);

  // Determine active selection
  const currentTheme = mounted ? (theme || "system") : "system";
  const activeResolved = mounted ? (resolvedTheme || "light") : "light";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full transition-all duration-300 hover:bg-primary/10 text-foreground cursor-pointer"
          title={`Theme: ${currentTheme === "system" ? `System (${activeResolved})` : currentTheme}`}
          aria-label={`Toggle theme: current theme is ${currentTheme}`}
        >
          {mounted && activeResolved === "dark" ? (
            <Moon className="h-[1.15rem] w-[1.15rem] text-[#C59B4B] transition-transform rotate-0 scale-100" />
          ) : (
            <Sun className="h-[1.15rem] w-[1.15rem] text-[#8B3A32] dark:text-[#C59B4B] transition-transform rotate-0 scale-100" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 p-2 rounded-2xl shadow-2xl border border-border bg-card/95 backdrop-blur-md z-[9999]">
        <DropdownMenuLabel className="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
          <span>Theme &amp; Appearance</span>
          {mounted && (
            <span className="text-[10px] font-normal capitalize px-1.5 py-0.5 rounded-full bg-secondary text-foreground">
              {currentTheme === "system" ? `Auto (${activeResolved})` : currentTheme}
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/60" />

        {/* Light Theme */}
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all hover:bg-secondary focus:bg-secondary"
        >
          <div className="flex items-center gap-3">
            <span className="h-6 w-6 rounded-full bg-[#F8F5EF] border border-[#E5DDD1] shadow-xs flex items-center justify-center text-xs text-[#8B3A32]">
              <Sun className="h-3.5 w-3.5 text-[#8B3A32]" />
            </span>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-foreground">Light</span>
              <span className="text-[10px] text-muted-foreground">Warm ivory &amp; terracotta</span>
            </div>
          </div>
          {(currentTheme === "light" || (currentTheme === "clay")) && (
            <Check className="h-4 w-4 text-primary font-bold" />
          )}
        </DropdownMenuItem>

        {/* Dark Theme */}
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all hover:bg-secondary focus:bg-secondary"
        >
          <div className="flex items-center gap-3">
            <span className="h-6 w-6 rounded-full bg-[#14100E] border border-[#C59B4B]/40 shadow-xs flex items-center justify-center text-xs text-[#C59B4B]">
              <Moon className="h-3.5 w-3.5 text-[#C59B4B]" />
            </span>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-foreground">Dark</span>
              <span className="text-[10px] text-muted-foreground">Obsidian &amp; antique gold</span>
            </div>
          </div>
          {currentTheme === "dark" && (
            <Check className="h-4 w-4 text-primary font-bold" />
          )}
        </DropdownMenuItem>

        {/* System Theme */}
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all hover:bg-secondary focus:bg-secondary"
        >
          <div className="flex items-center gap-3">
            <span className="h-6 w-6 rounded-full bg-secondary border border-border shadow-xs flex items-center justify-center text-xs text-foreground">
              <Laptop className="h-3.5 w-3.5 text-foreground" />
            </span>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-foreground">System</span>
              <span className="text-[10px] text-muted-foreground">Sync with device settings</span>
            </div>
          </div>
          {currentTheme === "system" && (
            <Check className="h-4 w-4 text-primary font-bold" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

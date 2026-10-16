"use client";

import * as React from "react";
import { Moon, Sun, Palette, Check, Sparkles } from "lucide-react";
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
  }, []);

  const currentTheme = mounted ? (theme || "clay") : "clay";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full transition-all duration-300 hover:bg-primary/10 text-foreground"
          title="Change theme"
        >
          {mounted && currentTheme === "dark" ? (
            <Moon className="h-[1.15rem] w-[1.15rem] text-amber-400 transition-all rotate-0 scale-100" />
          ) : mounted && currentTheme === "light" ? (
            <Sun className="h-[1.15rem] w-[1.15rem] text-amber-600 transition-all rotate-0 scale-100" />
          ) : (
            <Palette className="h-[1.15rem] w-[1.15rem] text-primary transition-all rotate-0 scale-100" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-2xl border border-border bg-card/95 backdrop-blur-md">
        <DropdownMenuLabel className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Theme & Aesthetic
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/50" />

        {/* Clay Theme (Signature) */}
        <DropdownMenuItem
          onClick={() => setTheme("clay")}
          className="flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all hover:bg-secondary focus:bg-secondary"
        >
          <div className="flex items-center gap-3">
            <span className="h-5 w-5 rounded-full bg-[#823816] border border-[#d57e15]/40 shadow-sm flex items-center justify-center text-[10px] text-amber-100">
              🏺
            </span>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                Clay
                <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-primary/15 text-primary">
                  Signature
                </span>
              </span>
              <span className="text-[10px] text-muted-foreground">Warm terracotta & mitti</span>
            </div>
          </div>
          {currentTheme === "clay" && (
            <Check className="h-4 w-4 text-primary font-bold" />
          )}
        </DropdownMenuItem>

        {/* Dark Theme */}
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all hover:bg-secondary focus:bg-secondary"
        >
          <div className="flex items-center gap-3">
            <span className="h-5 w-5 rounded-full bg-[#1b1513] border border-amber-600/40 shadow-sm flex items-center justify-center text-[10px] text-amber-400">
              <Moon className="h-3 w-3" />
            </span>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-foreground">Dark</span>
              <span className="text-[10px] text-muted-foreground">Obsidian night palette</span>
            </div>
          </div>
          {currentTheme === "dark" && (
            <Check className="h-4 w-4 text-primary font-bold" />
          )}
        </DropdownMenuItem>

        {/* Light Theme */}
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all hover:bg-secondary focus:bg-secondary"
        >
          <div className="flex items-center gap-3">
            <span className="h-5 w-5 rounded-full bg-[#ffffff] border border-stone-300 shadow-sm flex items-center justify-center text-[10px] text-amber-500">
              <Sun className="h-3 w-3" />
            </span>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-foreground">Light</span>
              <span className="text-[10px] text-muted-foreground">Crisp modern daylight</span>
            </div>
          </div>
          {currentTheme === "light" && (
            <Check className="h-4 w-4 text-primary font-bold" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

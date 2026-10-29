'use client';
import { UserButton } from "@clerk/nextjs";

export function UserNav() {
  return (
    <div className="flex items-center">
      <UserButton 
        appearance={{
          elements: {
            userButtonAvatarBox: 'h-9 w-9',
            userButtonPopoverCard: 'shadow-2xl border border-border/80 rounded-2xl p-1 bg-[#FAF7F2] dark:bg-[#1C1815] text-foreground z-[9999] backdrop-blur-none',
            userButtonPopoverFooter: 'hidden',
            footerAction: 'hidden',
            footer: 'hidden',
          }
        }}
      />
    </div>
  );
}

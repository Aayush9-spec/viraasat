'use client';
import { UserButton } from "@clerk/nextjs";

export function UserNav() {
  return (
    <div className="flex items-center">
      <UserButton 
        afterSignOutUrl="/" 
        appearance={{
          elements: {
            userButtonAvatarBox: 'h-9 w-9'
          }
        }}
      />
    </div>
  );
}

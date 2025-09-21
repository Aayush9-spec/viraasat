import { UserNav } from "@/components/user-nav"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { DashboardNav } from "./dashboard-nav"
import { ViraasatLogo } from "./viraasat-logo"
import Link from 'next/link';

interface DashboardHeaderProps {
    title: string;
}

export function DashboardHeader({ title }: DashboardHeaderProps) {
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col">
            <nav className="grid gap-2 text-lg font-medium">
              <Link href="#" className="flex items-center gap-2 text-lg font-semibold mb-4">
                <ViraasatLogo />
              </Link>
              <DashboardNav />
            </nav>
        </SheetContent>
      </Sheet>
      <div className="w-full flex-1">
        <h1 className="text-xl font-semibold">{title}</h1>
      </div>
      <UserNav />
    </header>
  )
}

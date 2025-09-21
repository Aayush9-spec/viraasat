import { UserNav } from "@/components/user-nav"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu, Package2 } from "lucide-react"
import { DashboardNav } from "./dashboard-nav"
import Link from "next/link"
import { ViraasatLogo } from "./viraasat-logo"

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
            <ViraasatLogo />
            <DashboardNav />
        </SheetContent>
      </Sheet>
      <div className="w-full flex-1">
        <h1 className="text-xl font-semibold">{title}</h1>
      </div>
      <UserNav />
    </header>
  )
}

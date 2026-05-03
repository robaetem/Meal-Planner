import Link from "next/link";
import { signOutCurrentUser } from "../actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CalendarDaysIcon,
  CookingPotIcon,
  LogOutIcon,
  SettingsIcon,
  ShoppingBasketIcon,
  SnowflakeIcon,
} from "lucide-react";

type AppShellProps = {
  active: "kalender" | "maaltijden" | "diepvries" | "boodschappen" | "instellingen";
  userName?: string | null;
  children: React.ReactNode;
};

const navItems = [
  { href: "/", label: "Kalender", key: "kalender", icon: CalendarDaysIcon },
  { href: "/maaltijden", label: "Maaltijden", key: "maaltijden", icon: CookingPotIcon },
  { href: "/diepvries", label: "Diepvries", key: "diepvries", icon: SnowflakeIcon },
  { href: "/boodschappen", label: "Boodschappen", key: "boodschappen", icon: ShoppingBasketIcon },
  { href: "/instellingen", label: "Instellingen", key: "instellingen", icon: SettingsIcon },
] as const;

export function AppShell({ active, userName, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 isolate border-b bg-background/95">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center">
          <Link className="text-sm font-semibold" href="/">
            Meal Planner
          </Link>
          <nav className="flex flex-1 gap-1 overflow-x-auto" aria-label="Hoofdnavigatie">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  aria-current={active === item.key ? "page" : undefined}
                  className={cn(
                    buttonVariants({
                      variant: active === item.key ? "secondary" : "ghost",
                      size: "sm",
                    }),
                    "shrink-0",
                  )}
                  href={item.href}
                  key={item.key}
                >
                  <Icon data-icon="inline-start" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center justify-between gap-2 lg:justify-end">
            <span className="truncate text-sm text-muted-foreground">
              {userName ?? "Aangemeld"}
            </span>
            <form action={signOutCurrentUser}>
              <Button size="sm" type="submit" variant="outline">
                <LogOutIcon data-icon="inline-start" />
                Afmelden
              </Button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}

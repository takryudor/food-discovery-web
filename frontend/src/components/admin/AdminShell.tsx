"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ClipboardList,
  Home,
  LayoutDashboard,
  LogOut,
  MapPin,
  Users,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";
import { useLanguage } from "@/components/providers/LanguageContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";

const navItems = [
  { href: "/admin", icon: LayoutDashboard, labelKey: "adminDashboard", exact: true },
  { href: "/admin/contributions", icon: ClipboardList, labelKey: "adminContributions" },
  { href: "/admin/places", icon: MapPin, labelKey: "adminPlaces" },
  { href: "/admin/users", icon: Users, labelKey: "adminUsers" },
] as const;

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="hidden w-64 shrink-0 border-r border-border bg-card/40 p-4 md:flex md:flex-col">
          <div className="mb-8 px-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              FoOdyssey
            </p>
            <h1 className="text-xl font-semibold">{t("adminPanel")}</h1>
          </div>

          <nav className="flex flex-1 flex-col gap-1">
            {navItems.map(({ href, icon: Icon, labelKey, ...rest }) => {
              const exact = "exact" in rest && rest.exact;
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {t(labelKey)}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto flex flex-col gap-2 border-t border-border pt-4">
            <Button variant="outline" className="justify-start" onClick={() => router.push("/")}>
              <Home className="size-4" />
              {t("adminBackToApp")}
            </Button>
            <Button
              variant="ghost"
              className="justify-start text-destructive hover:text-destructive"
              onClick={() => void logout().then(() => router.push("/"))}
            >
              <LogOut className="size-4" />
              {t("logout")}
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
            <h1 className="text-lg font-semibold">{t("adminPanel")}</h1>
            <Button variant="outline" size="sm" onClick={() => router.push("/")}>
              {t("adminBackToApp")}
            </Button>
          </header>

          <nav className="flex gap-2 overflow-x-auto border-b border-border px-4 py-2 md:hidden">
            {navItems.map(({ href, labelKey, ...rest }) => {
              const exact = "exact" in rest && rest.exact;
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "whitespace-nowrap rounded-full px-3 py-1.5 text-sm",
                    active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  {t(labelKey)}
                </Link>
              );
            })}
          </nav>

          <main className="flex-1 p-4 md:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, MapPin, Users } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageContext";
import { getAdminStats } from "@/lib/api/admin";
import type { AdminStatsResponse } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboardPage() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getAdminStats()
      .then(setStats)
      .catch(() => setError(t("adminLoadError")));
  }, [t]);

  const cards = [
    {
      title: t("adminPendingContributions"),
      value: stats?.pending_contributions ?? "—",
      href: "/admin/contributions?status=PENDING",
      icon: ClipboardList,
    },
    {
      title: t("adminTotalPlaces"),
      value: stats?.total_places ?? "—",
      href: "/admin/places",
      icon: MapPin,
    },
    {
      title: t("adminTotalUsers"),
      value: stats?.total_users ?? "—",
      href: "/admin/users",
      icon: Users,
    },
    {
      title: t("adminTotalContributions"),
      value: stats?.total_contributions ?? "—",
      href: "/admin/contributions",
      icon: ClipboardList,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">{t("adminDashboard")}</h2>
        <p className="text-sm text-muted-foreground">{t("adminPanel")}</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ title, value, href, icon: Icon }) => (
          <Link key={title} href={href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {title}
                </CardTitle>
                <Icon className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

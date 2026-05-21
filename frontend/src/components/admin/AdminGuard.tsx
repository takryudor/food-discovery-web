"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";
import { useLanguage } from "@/components/providers/LanguageContext";
import { getCurrentUser } from "@/lib/api/users";
import { Button } from "@/components/ui/button";
import AdminShell from "./AdminShell";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [checkingRole, setCheckingRole] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      setCheckingRole(false);
      setIsAdmin(false);
      return;
    }

    if (user?.role === "admin") {
      setIsAdmin(true);
      setCheckingRole(false);
      return;
    }

    void getCurrentUser()
      .then((profile) => {
        setIsAdmin(profile.role === "admin");
      })
      .catch(() => {
        setIsAdmin(false);
      })
      .finally(() => {
        setCheckingRole(false);
      });
  }, [isAuthenticated, isLoading, user?.role]);

  if (isLoading || checkingRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        {t("loading")}
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <p className="text-lg text-muted-foreground">{t("adminLoginRequired")}</p>
        <Button onClick={() => router.push("/")}>{t("backHome")}</Button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <p className="text-lg text-muted-foreground">{t("adminAccessDenied")}</p>
        <Button onClick={() => router.push("/")}>{t("backHome")}</Button>
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}

"use client";

import AdminGuard from "@/components/admin/AdminGuard";
import AdminDashboardPage from "@/app/admin/_components/AdminDashboardPage";

export default function AdminRoutePage() {
  return (
    <AdminGuard>
      <AdminDashboardPage />
    </AdminGuard>
  );
}

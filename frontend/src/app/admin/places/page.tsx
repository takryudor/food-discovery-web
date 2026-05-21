"use client";

import AdminGuard from "@/components/admin/AdminGuard";
import UsersPage from "@/app/admin/_components/UsersPage";

export default function AdminUsersRoutePage() {
  return (
    <AdminGuard>
      <UsersPage />
    </AdminGuard>
  );
}

"use client";

import { Suspense } from "react";
import AdminGuard from "@/components/admin/AdminGuard";
import ContributionsPage from "@/app/admin/_components/ContributionsPage";

export default function AdminContributionsRoutePage() {
  return (
    <AdminGuard>
      <Suspense fallback={null}>
        <ContributionsPage />
      </Suspense>
    </AdminGuard>
  );
}

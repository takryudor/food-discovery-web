"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/components/providers/LanguageContext";
import {
  approveContribution,
  listAdminContributions,
  rejectContribution,
} from "@/lib/api/admin";
import type { AdminContribution } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "APPROVED") return "default";
  if (status === "REJECTED") return "destructive";
  return "secondary";
}

export default function ContributionsPage() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<AdminContribution[]>([]);
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status")?.toUpperCase() || "ALL",
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listAdminContributions({
        status: statusFilter === "ALL" ? undefined : statusFilter,
        limit: 100,
      });
      setItems(response.items);
    } catch {
      setError(t("adminLoadError"));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleApprove = async (id: number) => {
    setActionId(id);
    try {
      await approveContribution(id);
      await load();
    } catch {
      setError(t("adminLoadError"));
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id: number) => {
    setActionId(id);
    try {
      await rejectContribution(id);
      await load();
    } catch {
      setError(t("adminLoadError"));
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold">{t("adminContributions")}</h2>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={t("adminStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("adminAllStatuses")}</SelectItem>
            <SelectItem value="PENDING">PENDING</SelectItem>
            <SelectItem value="APPROVED">APPROVED</SelectItem>
            <SelectItem value="REJECTED">REJECTED</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="overflow-hidden rounded-2xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("restaurant")}</TableHead>
              <TableHead>{t("address")}</TableHead>
              <TableHead>{t("adminContributor")}</TableHead>
              <TableHead>{t("adminStatus")}</TableHead>
              <TableHead className="text-right">{t("adminActions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  {t("loading")}
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  {t("adminNoData")}
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      {item.description && (
                        <p className="max-w-xs truncate text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{item.address || "—"}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{item.user_display_name || "—"}</p>
                      <p className="text-xs text-muted-foreground">{item.user_email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {item.status === "PENDING" ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          disabled={actionId === item.id}
                          onClick={() => void handleApprove(item.id)}
                        >
                          {t("adminApprove")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionId === item.id}
                          onClick={() => void handleReject(item.id)}
                        >
                          {t("adminReject")}
                        </Button>
                      </div>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

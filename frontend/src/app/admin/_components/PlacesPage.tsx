"use client";

import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/components/providers/LanguageContext";
import { deleteAdminPlace, listAdminPlaces, updateAdminPlace } from "@/lib/api/admin";
import type { AdminPlace } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function PlacesPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState<AdminPlace[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminPlace | null>(null);
  const [form, setForm] = useState<Partial<AdminPlace>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listAdminPlaces({
        search: search.trim() || undefined,
        limit: 100,
      });
      setItems(response.items);
    } catch {
      setError(t("adminLoadError"));
    } finally {
      setLoading(false);
    }
  }, [search, t]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 300);
    return () => clearTimeout(timer);
  }, [load]);

  const openEdit = (place: AdminPlace) => {
    setEditing(place);
    setForm({ ...place });
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await updateAdminPlace(editing.id, {
        name: form.name,
        description: form.description,
        address: form.address,
        phone: form.phone,
        open_hours: form.open_hours,
        price_range: form.price_range,
        rating: form.rating,
      });
      setEditing(null);
      await load();
    } catch {
      setError(t("adminLoadError"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (placeId: number) => {
    if (!window.confirm(t("adminConfirmDelete"))) return;
    try {
      await deleteAdminPlace(placeId);
      await load();
    } catch {
      setError(t("adminLoadError"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold">{t("adminPlaces")}</h2>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("adminSearch")}
          className="max-w-sm"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="overflow-hidden rounded-2xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("restaurant")}</TableHead>
              <TableHead>{t("address")}</TableHead>
              <TableHead>{t("phone")}</TableHead>
              <TableHead className="text-right">{t("adminActions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  {t("loading")}
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  {t("adminNoData")}
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="max-w-xs truncate">{item.address || "—"}</TableCell>
                  <TableCell>{item.phone || "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(item)}>
                        {t("adminEdit")}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => void handleDelete(item.id)}
                      >
                        {t("adminDelete")}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("adminEdit")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={form.name ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder={t("restaurant")}
            />
            <Input
              value={form.address ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
              placeholder={t("address")}
            />
            <Input
              value={form.phone ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder={t("phone")}
            />
            <Input
              value={form.open_hours ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, open_hours: e.target.value }))}
              placeholder={t("openingHours")}
            />
            <Input
              value={form.price_range ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, price_range: e.target.value }))}
              placeholder={t("price")}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              {t("cancel")}
            </Button>
            <Button disabled={saving} onClick={() => void handleSave()}>
              {t("adminSave")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import {
  AdminContribution,
  AdminPlace,
  AdminPlaceUpdate,
  AdminStatsResponse,
  AdminUser,
  ContributionReviewResponse,
  PaginatedResponse,
  UserMeResponse,
  UserRole,
} from "@/lib/types";
import { apiFetch } from "@/lib/api/client";

export async function getAdminStats(): Promise<AdminStatsResponse> {
  return apiFetch<AdminStatsResponse>({ path: "/admin/stats" });
}

export async function listAdminContributions(params?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<PaginatedResponse<AdminContribution>> {
  return apiFetch<PaginatedResponse<AdminContribution>>({
    path: "/admin/contributions",
    query: params,
  });
}

export async function approveContribution(
  contributionId: number,
): Promise<ContributionReviewResponse> {
  return apiFetch<ContributionReviewResponse>({
    path: `/admin/contributions/${contributionId}/approve`,
    method: "POST",
  });
}

export async function rejectContribution(
  contributionId: number,
  reason?: string,
): Promise<ContributionReviewResponse> {
  return apiFetch<ContributionReviewResponse>({
    path: `/admin/contributions/${contributionId}/reject`,
    method: "POST",
    body: reason ? { reason } : {},
  });
}

export async function listAdminPlaces(params?: {
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<PaginatedResponse<AdminPlace>> {
  return apiFetch<PaginatedResponse<AdminPlace>>({
    path: "/admin/places",
    query: params,
  });
}

export async function updateAdminPlace(
  placeId: number,
  body: AdminPlaceUpdate,
): Promise<AdminPlace> {
  return apiFetch<AdminPlace>({
    path: `/admin/places/${placeId}`,
    method: "PATCH",
    body,
  });
}

export async function deleteAdminPlace(placeId: number): Promise<void> {
  return apiFetch<void>({
    path: `/admin/places/${placeId}`,
    method: "DELETE",
  });
}

export async function listAdminUsers(params?: {
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<PaginatedResponse<AdminUser>> {
  return apiFetch<PaginatedResponse<AdminUser>>({
    path: "/admin/users",
    query: params,
  });
}

export async function updateAdminUser(
  userId: number,
  body: { role: UserRole; display_name?: string | null },
): Promise<AdminUser> {
  return apiFetch<AdminUser>({
    path: `/admin/users/${userId}`,
    method: "PATCH",
    body,
  });
}

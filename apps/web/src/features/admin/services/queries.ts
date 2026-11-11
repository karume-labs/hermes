"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/features/shared/api/index";
import { queryKeys } from "@/features/shared/keys/index";

export const useCareMetrics = () =>
  useQuery({
    queryKey: queryKeys.metrics,
    queryFn: async () => {
      const response = await api.metrics.get();
      if (response.error) throw response.error;
      return response.data;
    },
    refetchInterval: 60_000,
  });

export const useRecentNotifications = () =>
  useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: async () => {
      const response = await api.notifications.get();
      if (response.error) throw response.error;
      return response.data;
    },
    refetchInterval: 30_000,
  });

export const useNotificationStats = () =>
  useQuery({
    queryKey: queryKeys.notifications.stats,
    queryFn: async () => {
      const response = await api.notifications.stats.get();
      if (response.error) throw response.error;
      return response.data;
    },
    refetchInterval: 30_000,
  });

export const useWebhookLogs = () =>
  useQuery({
    queryKey: queryKeys.webhooks,
    queryFn: async () => {
      const response = await api.webhooks.logs.get();
      if (response.error) throw response.error;
      return response.data;
    },
    refetchInterval: 30_000,
  });

export const useClinics = (enabled = true) =>
  useQuery({
    queryKey: queryKeys.clinics,
    enabled,
    queryFn: async () => {
      const response = await api.clinics.get();
      if (response.error) throw response.error;
      return response.data;
    },
    staleTime: 5 * 60_000,
  });

export const useAdminClinics = () =>
  useQuery({
    queryKey: queryKeys.admin.clinics,
    queryFn: async () => {
      const response = await api.admin.clinics.get();
      if (response.error) throw response.error;
      return response.data;
    },
  });

export const useAdminAudit = () =>
  useQuery({
    queryKey: queryKeys.admin.audit,
    queryFn: async () => {
      const response = await api.admin.audit.get();
      if (response.error) throw response.error;
      return response.data;
    },
    refetchInterval: 30_000,
  });

export const useStaffUsers = () =>
  useQuery({
    queryKey: queryKeys.staff.users,
    queryFn: async () => {
      const response = await api.staff.users.get();
      if (response.error) throw response.error;
      return response.data;
    },
  });

export const useStaffInvites = () =>
  useQuery({
    queryKey: queryKeys.staff.invites,
    queryFn: async () => {
      const response = await api.staff.invites.get();
      if (response.error) throw response.error;
      return response.data;
    },
  });

export const useRoutingRules = () =>
  useQuery({
    queryKey: queryKeys.routingRules,
    queryFn: async () => {
      const response = await api["routing-rules"].get();
      if (response.error) throw response.error;
      return response.data;
    },
    refetchInterval: 60_000,
  });

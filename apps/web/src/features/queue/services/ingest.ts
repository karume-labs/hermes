"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/features/shared/api/index";
import { queryKeys } from "@/features/shared/keys/index";

const labPayload = {
  patientId: "patient-3-clinic-1",
  clinicId: "clinic-1",
  facilityId: "riverbend-lab",
  markerCode: "ldl",
  markerValue: 195,
  unit: "mg/dL",
  takenAt: new Date().toISOString(),
};

export const useIngestLabResult = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.webhooks.lab.post(labPayload);
      if (res.error) throw res.error;
      return res.data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.cases.all }),
  });
};

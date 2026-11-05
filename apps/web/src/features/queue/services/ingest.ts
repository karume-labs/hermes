"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/features/shared/api/index";
import { queryKeys } from "@/features/shared/keys/index";

const demoPayload = {
  patientId: "patient-demo",
  clinicId: "clinic-1",
  facilityId: "facility-1",
  markerCode: "ldl",
  markerValue: 195,
  unit: "mg/dL",
  takenAt: new Date().toISOString(),
};

export const useIngestDemo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.webhooks.lab.post(demoPayload);
      if (res.error) throw res.error;
      return res.data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.cases.all }),
  });
};

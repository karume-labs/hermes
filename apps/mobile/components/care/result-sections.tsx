import type { PatientCase } from "@hermes/types";
import { useRouter } from "expo-router";
import type * as React from "react";
import { ResultRow } from "@/components/care/result-row";
import { ListSection } from "@/components/ui/list";

export const ResultSections = ({
  open,
  closed,
}: {
  open: PatientCase[];
  closed: PatientCase[];
}): React.ReactNode => {
  const router = useRouter();
  const openCase = (caseId: string): void => {
    router.push({ pathname: "/care-action", params: { caseId } });
  };

  return (
    <>
      {open.length === 0 ? null : (
        <ListSection
          title="Needs attention"
          footer="Tap a result to see what it means and choose a next step."
        >
          {open.map((item, index) => (
            <ResultRow
              key={item.careCase.id}
              item={item}
              first={index === 0}
              onPress={() => openCase(item.careCase.id)}
            />
          ))}
        </ListSection>
      )}

      {closed.length === 0 ? null : (
        <ListSection title="Past results">
          {closed.map((item, index) => (
            <ResultRow
              key={item.careCase.id}
              item={item}
              first={index === 0}
              onPress={() => openCase(item.careCase.id)}
            />
          ))}
        </ListSection>
      )}
    </>
  );
};

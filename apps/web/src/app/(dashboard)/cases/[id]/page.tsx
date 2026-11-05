import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CaseDetailView } from "@/features/cases/components/case-detail-view";

export const metadata: Metadata = {
  title: "Case file · Hermes Care",
  description: "Consult, message and document closure for a single case.",
};

const CasePage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<ReactNode> => {
  const { id } = await params;
  return <CaseDetailView caseId={id} />;
};

export default CasePage;

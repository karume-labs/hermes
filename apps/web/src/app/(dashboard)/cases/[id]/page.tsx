// The dashboard renders behind a client session gate, so its pages cannot
// produce an instant static shell; opt them out of Next's validation.
export const instant = false;

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CaseDetailView } from "@/features/cases/components/case-detail-view";

export const metadata: Metadata = {
  title: "Case file",
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

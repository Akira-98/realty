import { notFound } from "next/navigation";

import { BuildingDetailView } from "../../../_components/detail/BuildingDetailView";
import { DetailPanelShell } from "../../../_components/detail/DetailPanelShell";
import { InquiryForm } from "../../../_components/inquiries/InquiryForm";
import { fetchBuildingDetail } from "../../../_lib/building-detail";

export const revalidate = 60;

export default async function InterceptedBuildingDetailPage({ params }) {
  const { id } = await params;
  const building = await fetchBuildingDetail(id);

  if (!building) {
    notFound();
  }

  return (
    <DetailPanelShell action={<InquiryForm building={building} buttonLabel="문의하기" />}>
      <BuildingDetailView building={building} panel />
    </DetailPanelShell>
  );
}

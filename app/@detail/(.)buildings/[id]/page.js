import { notFound } from "next/navigation";

import { BuildingDetailView } from "../../../_components/detail/BuildingDetailView";
import { DetailPanelShell } from "../../../_components/detail/DetailPanelShell";
import { InquiryForm } from "../../../_components/inquiries/InquiryForm";
import { fetchBuildingDetail } from "../../../_lib/building-detail";
import { buildingDetailPath } from "../../../_lib/building-url";

export const revalidate = 60;

function DetailPanelActions({ building }) {
  const detailPath = buildingDetailPath(building);

  return (
    <div className="detailPanelActions">
      <a className="detailPanelDetailLink" href={detailPath}>
        상세보기
      </a>
      <InquiryForm building={building} buttonLabel="문의하기" />
    </div>
  );
}

export default async function InterceptedBuildingDetailPage({ params }) {
  const { id } = await params;
  const building = await fetchBuildingDetail(id);

  if (!building) {
    notFound();
  }

  return (
    <DetailPanelShell
      action={<DetailPanelActions building={building} />}
      copyHref={buildingDetailPath(building)}
    >
      <BuildingDetailView building={building} panel />
    </DetailPanelShell>
  );
}

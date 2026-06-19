"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { buildSummary } from "../_lib/buildings";

export function BuildingCard({ building, active }) {
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();
  const href = `/buildings/${building.id}${currentSearch ? `?${currentSearch}` : ""}`;

  return (
    <Link
      className={active ? "buildingCard active" : "buildingCard"}
      href={href}
    >
      <div className="photoSlot" aria-label="건물 사진 자리" />
      <div className="buildingInfo">
        <div className="buildingTopline">
          <strong>{building.building_name}</strong>
        </div>
        <p>{building.address}</p>
        <p className="summary">{buildSummary(building)}</p>
      </div>
    </Link>
  );
}

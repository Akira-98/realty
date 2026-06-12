import Link from "next/link";

import { buildSummary, formatDistance } from "../_lib/buildings";

export function BuildingCard({ building, active }) {
  return (
    <Link
      className={active ? "buildingCard active" : "buildingCard"}
      href={`/buildings/${building.id}`}
    >
      <div className="photoSlot" aria-label="건물 사진 자리" />
      <div className="buildingInfo">
        <div className="buildingTopline">
          <strong>{building.building_name}</strong>
          <span>{formatDistance(Number(building.distance_m))}</span>
        </div>
        <p>{building.address}</p>
        <p className="summary">{buildSummary(building)}</p>
      </div>
    </Link>
  );
}

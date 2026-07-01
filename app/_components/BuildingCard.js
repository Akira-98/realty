"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { buildingDetailPath } from "../_lib/building-url";
import { buildSummary } from "../_lib/buildings";

export function BuildingCard({ building, active, priorityImage = false }) {
  const searchParams = useSearchParams();
  const cardRef = useRef(null);
  const [shouldRenderImage, setShouldRenderImage] = useState(priorityImage);
  const renderImage = priorityImage || shouldRenderImage;
  const currentSearch = searchParams.toString();
  const detailPath = buildingDetailPath(building);
  const href = `${detailPath}${currentSearch ? `?${currentSearch}` : ""}`;

  useEffect(() => {
    if (renderImage || !building.thumbnail_url) {
      return undefined;
    }

    const element = cardRef.current;
    if (!element) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldRenderImage(true);
          observer.disconnect();
        }
      },
      {
        root: null,
        rootMargin: "360px 0px",
        threshold: 0.01,
      },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [building.thumbnail_url, renderImage]);

  return (
    <Link
      ref={cardRef}
      className={active ? "buildingCard active" : "buildingCard"}
      href={href}
      replace
    >
      <div className={building.thumbnail_url ? "photoSlot hasPhoto" : "photoSlot"}>
        {building.thumbnail_url && renderImage ? (
          <img
            src={building.thumbnail_url}
            alt={`${building.building_name} 사진`}
            loading={priorityImage ? "eager" : "lazy"}
            fetchPriority={priorityImage ? "high" : "auto"}
            decoding="async"
          />
        ) : building.thumbnail_url ? (
          <span aria-hidden="true" />
        ) : (
          <span aria-label="건물 사진 없음" />
        )}
      </div>
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

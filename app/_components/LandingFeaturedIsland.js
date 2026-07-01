"use client";

import { useState } from "react";

import {
  FEATURED_BUILDINGS,
  featuredBuildingDetailPath,
} from "../_lib/landing-content";

export function LandingFeaturedIsland() {
  const [activeFeaturedIndex, setActiveFeaturedIndex] = useState(0);
  const featuredBuilding = FEATURED_BUILDINGS[activeFeaturedIndex];

  function showPreviousFeaturedBuilding() {
    setActiveFeaturedIndex((index) =>
      index === 0 ? FEATURED_BUILDINGS.length - 1 : index - 1,
    );
  }

  function showNextFeaturedBuilding() {
    setActiveFeaturedIndex((index) =>
      index === FEATURED_BUILDINGS.length - 1 ? 0 : index + 1,
    );
  }

  return (
    <div className="heroFeature">
      <div className="heroTags">
        {featuredBuilding.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      <strong className="heroFeatureTitle">{featuredBuilding.name}</strong>
      <a
        className="heroDetailLink"
        href={featuredBuildingDetailPath(featuredBuilding)}
      >
        자세히 보기
      </a>
      <div className="featuredControls" aria-label="대표매물 이동">
        <button
          type="button"
          aria-label="이전 대표매물"
          onClick={showPreviousFeaturedBuilding}
        >
          &lt;
        </button>
        <button
          type="button"
          aria-label="다음 대표매물"
          onClick={showNextFeaturedBuilding}
        >
          &gt;
        </button>
      </div>
    </div>
  );
}

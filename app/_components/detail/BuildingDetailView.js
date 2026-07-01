"use client";

import { useState } from "react";

import { DetailMap } from "./DetailMap";
import { DetailPriceGrid } from "./DetailPriceGrid";
import { BuildingImageGallery } from "./BuildingImageGallery";
import { SiteFooter } from "../SiteFooter";
import { InquiryForm } from "../inquiries/InquiryForm";
import {
  field,
  getBuildingDetailModel,
} from "../../_lib/building-detail";

function normalizeAddress(value) {
  return String(value || "").trim();
}

const detailIcons = {
  area: (
    <>
      <path d="M4 6h16v12H4z" />
      <path d="M8 6v12M16 6v12M4 10h16M4 14h16" />
    </>
  ),
  building: (
    <>
      <path d="M6 20V5l8-2v17" />
      <path d="M14 8h4v12" />
      <path d="M9 8h1M9 12h1M9 16h1M17 12h1M17 16h1" />
    </>
  ),
  calendar: (
    <>
      <path d="M7 3v4M17 3v4M4 9h16" />
      <rect x="4" y="5" width="16" height="15" rx="2" />
    </>
  ),
  coin: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M9 10.5c.6-1 1.6-1.5 3-1.5 1.8 0 3 1 3 2.4 0 1.6-1.2 2.6-3 2.6-1.4 0-2.4-.5-3-1.5" />
    </>
  ),
  elevator: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M12 7v10M9 10l3-3 3 3M9 14l3 3 3-3" />
    </>
  ),
  height: (
    <>
      <path d="M12 4v16M8 8l4-4 4 4M8 16l4 4 4-4" />
      <path d="M5 4h3M5 20h3M16 4h3M16 20h3" />
    </>
  ),
  parking: (
    <>
      <path d="M7 20V4h6.2a4.3 4.3 0 0 1 0 8.6H7" />
      <path d="M7 12.6h6" />
    </>
  ),
  pin: (
    <>
      <path d="M19 10c0 5.2-7 11-7 11s-7-5.8-7-11a7 7 0 0 1 14 0Z" />
      <circle cx="12" cy="10" r="2.4" />
    </>
  ),
  tag: (
    <>
      <path d="M20 12.5 12.5 20 4 11.5V4h7.5L20 12.5Z" />
      <circle cx="8.5" cy="8.5" r="1.2" />
    </>
  ),
  train: (
    <>
      <rect x="6" y="3" width="12" height="14" rx="3" />
      <path d="M9 21l3-4 3 4M8 8h8M9 13h.01M15 13h.01" />
    </>
  ),
  wind: (
    <>
      <path d="M4 8h10a3 3 0 1 0-3-3" />
      <path d="M4 12h15" />
      <path d="M4 16h10a3 3 0 1 1-3 3" />
    </>
  ),
};

function DetailIcon({ name }) {
  const icon = detailIcons[name];

  if (!icon) {
    return null;
  }

  return (
    <span className="detailItemIcon" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        {icon}
      </svg>
    </span>
  );
}

export function DetailItem({
  action,
  description,
  icon,
  label,
  marks = [],
  value,
}) {
  return (
    <div className={icon ? "detailItem hasIcon" : "detailItem"}>
      <DetailIcon name={icon} />
      <div className="detailItemContent">
        <span className="detailItemLabel">{label}</span>
        <div className="detailItemValueRow">
          <strong>{field(value)}</strong>
          {action}
        </div>
        {description && <span className="detailItemDescription">{description}</span>}
        {marks.length > 0 && (
          <div className="detailReferenceMarks">
            {marks.map((mark) => (
              <span key={mark}>※ {mark}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function InfoSection({ title, items, children }) {
  return (
    <section className="detailSection">
      <h2>{title}</h2>
      {items?.length > 0 && (
        <div className="detailInfoGrid">
          {items.map((item) => (
            <DetailItem
              key={item.label || item.value}
              action={item.action}
              description={item.description}
              icon={item.icon}
              label={item.label}
              marks={item.marks}
              value={item.value}
            />
          ))}
        </div>
      )}
      {children}
    </section>
  );
}

export function BuildingDetailView({ building, panel = false }) {
  const [addressMode, setAddressMode] = useState("road");
  const {
    basicItems,
    facilityItems,
    heroMeta,
    registerClassification,
    title,
    transportItems,
  } = getBuildingDetailModel(building);
  const roadAddress = normalizeAddress(building.address);
  const lotAddress = normalizeAddress(building.plat_address);
  const canToggleAddress = Boolean(
    roadAddress && lotAddress && roadAddress !== lotAddress,
  );
  const displayedAddress =
    addressMode === "lot" && lotAddress ? lotAddress : roadAddress || lotAddress;
  const addressToggleLabel = addressMode === "lot" ? "도로명" : "지번";
  const addressToggleButton = canToggleAddress ? (
    <button
      type="button"
      className="detailAddressToggle"
      onClick={() => setAddressMode((currentMode) =>
        currentMode === "lot" ? "road" : "lot"
      )}
    >
      {addressToggleLabel}
    </button>
  ) : null;
  const transportItemsForView = transportItems.map((item) =>
    item.label === "주소"
      ? { ...item, value: displayedAddress, action: addressToggleButton }
      : item,
  );

  return (
    <>
      <section className="detailHeroCard">
        <BuildingImageGallery images={building.images} title={title} />
        <div className="detailHeroInfo">
          {registerClassification && (
            <span className="detailRegisterClassification">
              {registerClassification}
            </span>
          )}
          <h1>{title}</h1>
          <div className="detailHeroAddress">
            <p>{field(displayedAddress)}</p>
            {addressToggleButton}
          </div>
          {heroMeta.length > 0 && (
            <p className="detailHeroMeta">{heroMeta.join(" · ")}</p>
          )}
          <DetailPriceGrid
            deposit={building.deposit_num}
            rent={building.rent_num}
            maintenance={building.maintenance_num}
          />
          {!panel && (
            <div className="detailActions">
              <a className="detailPrimaryAction">전화 문의</a>
              <InquiryForm building={building} />
            </div>
          )}
        </div>
      </section>

      <div className="detailSectionsGrid">
        <InfoSection title="기본 정보" items={basicItems} />
        <InfoSection title="교통 및 주차" items={transportItemsForView} />
        <InfoSection title="시설 정보" items={facilityItems} />
        {!panel && (
          <InfoSection title="위치 정보">
            <div className="detailAddress">
              <div className="detailAddressLine">
                <strong>{field(displayedAddress)}</strong>
                {addressToggleButton}
              </div>
            </div>
            <DetailMap lat={building.lat} lng={building.lng} label={title} />
          </InfoSection>
        )}
      </div>
      {panel && <SiteFooter />}
    </>
  );
}

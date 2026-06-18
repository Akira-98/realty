import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteFooter } from "../../_components/SiteFooter";
import { DetailMap } from "../../_components/detail/DetailMap";
import { InquiryForm } from "../../_components/inquiries/InquiryForm";
import { businessDistrictLabel } from "../../_lib/search-filters";
import { formatBuildingAge, formatNumber, formatWithUnit } from "../../_lib/formatters";
import { requiredEnv } from "../../../lib/http";

export const revalidate = 60;

const BUILDING_SELECT = [
  "id",
  "building_name",
  "address",
  "subway",
  "building_use",
  "building_scale",
  "business_district",
  "scale",
  "gross_floor_area",
  "approval_date",
  "approval_date_parsed",
  "deposit_num",
  "rent_num",
  "maintenance_num",
  "parking_fee",
  "elevator",
  "parking",
  "hvac",
  "ceiling_height",
  "lat",
  "lng",
  "is_public",
].join(",");

function field(value, fallback = "-") {
  return value || fallback;
}

function withSquareMeterUnit(value) {
  return formatWithUnit(value, "m²", /(㎡|m2|m²|제곱미터)/i);
}

function joinValues(...values) {
  return values.filter(Boolean).join(" ");
}

function formatPriceNumber(value) {
  if (value === null || value === undefined || value === "") {
    return "별도문의";
  }

  return `${formatNumber(value)}원 / 3.3㎡`;
}

function formatApprovalDate(value) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

async function fetchBuilding(id) {
  const supabaseUrl = requiredEnv("SUPABASE_URL").replace(/\/$/, "");
  const supabaseKey = requiredEnv("SUPABASE_ANON_KEY");
  const params = new URLSearchParams();
  params.set("select", BUILDING_SELECT);
  params.set("id", `eq.${id}`);
  params.set("is_public", "eq.true");
  params.set("limit", "1");

  const response = await fetch(`${supabaseUrl}/rest/v1/buildings?${params}`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error("Supabase building detail failed.");
  }

  const buildings = await response.json();
  return buildings[0] ?? null;
}

function DetailItem({ label, value }) {
  return (
    <div className="detailItem">
      <span>{label}</span>
      <strong>{field(value)}</strong>
    </div>
  );
}

function PriceItem({ label, unitPrice }) {
  return (
    <div className="detailItem">
      <span>{label}</span>
      <strong>{field(unitPrice)}</strong>
    </div>
  );
}

function InfoSection({ title, items, children }) {
  return (
    <section className="detailSection">
      <h2>{title}</h2>
      {items?.length > 0 && (
        <div className="detailInfoGrid">
          {items.map((item) => (
            <DetailItem key={item.label || item.value} label={item.label} value={item.value} />
          ))}
        </div>
      )}
      {children}
    </section>
  );
}

export default async function BuildingDetailPage({ params }) {
  const { id } = await params;
  const building = await fetchBuilding(id);

  if (!building) {
    notFound();
  }

  const title = field(building.building_name, "이름 없는 빌딩");
  const buildingScale = joinValues(building.building_scale, building.scale);
  const businessDistrict = businessDistrictLabel(building.business_district);
  const basicItems = [
    { label: "규모", value: buildingScale },
    { label: "용도", value: building.building_use },
    businessDistrict && {
      label: "권역",
      value: businessDistrict,
    },
    { label: "사용승인일", value: formatApprovalDate(building.approval_date) },
    { label: "준공연차", value: formatBuildingAge(building.approval_date_parsed) },
    { label: "연면적", value: withSquareMeterUnit(building.gross_floor_area) },
  ].filter(Boolean);
  const facilityItems = [
    { label: "천정고", value: building.ceiling_height },
    { label: "냉난방방식", value: building.hvac },
    { label: "엘리베이터", value: building.elevator },
  ];
  const transportItems = [
    { label: "지하철", value: building.subway },
    { label: "주소", value: building.address },
    { label: "주차", value: building.parking },
    { label: "주차비", value: building.parking_fee },
  ];

  return (
    <main className="detailPage">
      <header className="detailHeader">
        <Link href="/" className="detailBrand">
          REALTY FIND
        </Link>
        <nav aria-label="상세 메뉴">
          <Link href="/">검색</Link>
          <a>임대</a>
          <a>문의</a>
        </nav>
      </header>

      <div className="detailContainer">
        <section className="detailHeroCard">
          <div className="detailPhoto">
            <div>
              <strong>사진 준비 중</strong>
              <span>{title}</span>
            </div>
          </div>
          <div className="detailHeroInfo">
            <h1>{title}</h1>
            <p>{field(building.address)}</p>
            <div className="detailHeroStats">
              <DetailItem label="규모" value={buildingScale} />
            </div>
            <div className="detailPriceGrid">
              <PriceItem label="보증금" unitPrice={formatPriceNumber(building.deposit_num)} />
              <PriceItem label="월 임대료" unitPrice={formatPriceNumber(building.rent_num)} />
              <PriceItem label="관리비" unitPrice={formatPriceNumber(building.maintenance_num)} />
            </div>
            <div className="detailActions">
              <a className="detailPrimaryAction">전화 문의</a>
              <InquiryForm building={building} />
            </div>
          </div>
        </section>

        <div className="detailSectionsGrid">
          <InfoSection title="기본 정보" items={basicItems} />
          <InfoSection title="시설 정보" items={facilityItems} />
          <InfoSection title="교통 및 주차" items={transportItems} />
          <InfoSection title="위치 정보">
            <div className="detailAddress">
              <strong>{field(building.address)}</strong>
            </div>
            <DetailMap lat={building.lat} lng={building.lng} label={title} />
          </InfoSection>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}

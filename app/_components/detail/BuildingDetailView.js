import { DetailMap } from "./DetailMap";
import { SiteFooter } from "../SiteFooter";
import { InquiryForm } from "../inquiries/InquiryForm";
import {
  field,
  formatPriceNumber,
  getBuildingDetailModel,
} from "../../_lib/building-detail";

export function DetailItem({ label, value }) {
  return (
    <div className="detailItem">
      <span>{label}</span>
      <strong>{field(value)}</strong>
    </div>
  );
}

export function PriceItem({ label, unitPrice }) {
  return (
    <div className="detailItem">
      <span>{label}</span>
      <strong>{field(unitPrice)}</strong>
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
            <DetailItem key={item.label || item.value} label={item.label} value={item.value} />
          ))}
        </div>
      )}
      {children}
    </section>
  );
}

export function BuildingDetailView({ building, panel = false }) {
  const {
    basicItems,
    buildingScale,
    facilityItems,
    title,
    transportItems,
  } = getBuildingDetailModel(building);

  return (
    <>
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
        <InfoSection title="시설 정보" items={facilityItems} />
        <InfoSection title="교통 및 주차" items={transportItems} />
        {!panel && (
          <InfoSection title="위치 정보">
            <div className="detailAddress">
              <strong>{field(building.address)}</strong>
            </div>
            <DetailMap lat={building.lat} lng={building.lng} label={title} />
          </InfoSection>
        )}
      </div>
      {panel && <SiteFooter />}
    </>
  );
}

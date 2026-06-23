"use client";

import { useState } from "react";

import { formatNumber } from "../../_lib/formatters";

const PYEONG_TO_SQUARE_METERS = 3.3058;

const priceUnits = {
  pyeong: {
    label: "3.3㎡",
    suffix: "3.3㎡",
    convert(value) {
      return value;
    },
  },
  squareMeter: {
    label: "㎡",
    suffix: "㎡",
    convert(value) {
      return Number(value) / PYEONG_TO_SQUARE_METERS;
    },
  },
};

function formatPriceNumber(value, unit) {
  if (value === null || value === undefined || value === "") {
    return "별도문의";
  }

  const number = Number(value);
  if (!Number.isFinite(number)) {
    return String(value).trim() || "별도문의";
  }

  const convertedValue = Math.round(unit.convert(number));
  return `${formatNumber(convertedValue)}원 / ${unit.suffix}`;
}

function PriceItem({ label, unitPrice }) {
  return (
    <div className="detailItem">
      <span className="detailItemLabel">{label}</span>
      <strong>{unitPrice || "별도문의"}</strong>
    </div>
  );
}

export function DetailPriceGrid({ deposit, rent, maintenance }) {
  const [unitKey, setUnitKey] = useState("pyeong");
  const activeUnit = priceUnits[unitKey];
  const nextUnitKey = unitKey === "pyeong" ? "squareMeter" : "pyeong";
  const nextUnit = priceUnits[nextUnitKey];

  return (
    <div className="detailPriceBlock">
      <button
        type="button"
        className="detailUnitIconButton"
        aria-label={`가격 단위를 ${nextUnit.label} 기준으로 전환`}
        title={`${nextUnit.label} 기준으로 전환`}
        onClick={() => setUnitKey(nextUnitKey)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M20 11a8 8 0 0 0-14.7-4" />
          <path d="M5 3v4h4" />
          <path d="M4 13a8 8 0 0 0 14.7 4" />
          <path d="M19 21v-4h-4" />
        </svg>
      </button>
      <div className="detailPriceGrid">
        <PriceItem label="보증금" unitPrice={formatPriceNumber(deposit, activeUnit)} />
        <PriceItem label="월 임대료" unitPrice={formatPriceNumber(rent, activeUnit)} />
        <PriceItem label="관리비" unitPrice={formatPriceNumber(maintenance, activeUnit)} />
      </div>
    </div>
  );
}

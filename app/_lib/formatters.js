export function formatNumber(value, options = {}) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return String(value ?? "").trim();
  }

  return new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 2,
    ...options,
  }).format(number);
}

export function formatWithUnit(value, unit, unitPattern) {
  if (!value) {
    return "";
  }

  const text = String(value).trim();
  if (!text) {
    return "";
  }

  return unitPattern.test(text) ? text : `${formatNumber(text)}${unit}`;
}

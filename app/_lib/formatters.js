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

export function formatBuildingAge(value, options = {}) {
  const year = Number(value);
  if (!Number.isInteger(year)) {
    return "";
  }

  const currentYear = options.currentYear ?? new Date().getFullYear();
  const age = currentYear - year;
  if (age < 0) {
    return "준공 예정";
  }

  const ageText = `${formatNumber(age)}년`;
  return options.withPrefix ? `준공 ${ageText}` : ageText;
}

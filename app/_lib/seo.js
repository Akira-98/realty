export const SITE_NAME = "REALTY FIND";

export const DEFAULT_SEO_DESCRIPTION =
  "서울 주요 업무권역의 오피스 빌딩, 사무실 임대 조건, 보증금, 임대료, 관리비, 위치 정보를 확인하세요.";

export function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "http://localhost:3000"
  ).replace(/\/+$/, "");
}

export function absoluteUrl(path = "/") {
  const baseUrl = siteUrl();
  return new URL(path, `${baseUrl}/`).toString();
}

export function buildBuildingSeoDescription(building) {
  const parts = [
    building?.building_name && `${building.building_name} 오피스 임대 정보`,
    building?.address,
    building?.building_scale && `규모 ${building.building_scale}`,
    building?.subway && `지하철 ${building.subway}`,
  ].filter(Boolean);

  return `${parts.join(" · ")}. 보증금, 임대료, 관리비, 주차, 위치 정보를 REALTY FIND에서 확인하세요.`;
}

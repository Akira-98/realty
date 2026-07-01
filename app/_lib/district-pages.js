export const DISTRICT_PAGES = [
  {
    code: "GBD",
    slug: "강남-사무실임대",
    keyword: "강남 사무실임대",
    label: "강남권역",
    name: "강남 · 서초 · 송파",
    image: "/images/gbd.jpg",
    description:
      "강남권역의 오피스 빌딩과 사무실 임대 조건을 지도와 목록으로 확인하세요.",
    center: { label: "강남권역", lat: 37.4979, lng: 127.0276, level: 6 },
  },
  {
    code: "YBD",
    slug: "여의도-사무실임대",
    keyword: "여의도 사무실임대",
    label: "여의도권역",
    name: "여의도 · 영등포",
    image: "/images/ybd.jpg",
    description:
      "여의도권역의 오피스 빌딩과 사무실 임대 조건을 지도와 목록으로 확인하세요.",
    center: { label: "여의도권역", lat: 37.5263, lng: 126.9259, level: 6 },
  },
  {
    code: "CBD",
    slug: "도심-사무실임대",
    keyword: "도심 사무실임대",
    label: "도심권역",
    name: "종로 · 중구",
    image: "/images/cbd.jpg",
    description:
      "도심권역의 오피스 빌딩과 사무실 임대 조건을 지도와 목록으로 확인하세요.",
    center: { label: "도심권역", lat: 37.5663, lng: 126.9782, level: 6 },
  },
  {
    code: "BBD",
    slug: "분당-사무실임대",
    keyword: "분당 사무실임대",
    label: "분당권역",
    name: "분당",
    image: "/images/bbd.png",
    description:
      "분당권역의 오피스 빌딩과 사무실 임대 조건을 지도와 목록으로 확인하세요.",
    center: { label: "분당권역", lat: 37.3827, lng: 127.1189, level: 6 },
  },
];

export function districtPagePath(district) {
  return `/${district.slug}`;
}

export function districtMapPath(district) {
  const params = new URLSearchParams({
    q: district.code,
    label: district.label,
    lat: String(district.center.lat),
    lng: String(district.center.lng),
    level: String(district.center.level),
    source: "default",
    mode: "bounds",
    businessDistrict: district.code,
  });
  return `/?${params}`;
}

export function districtBySlug(slug) {
  return DISTRICT_PAGES.find((district) => district.slug === slug) ?? null;
}

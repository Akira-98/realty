import { buildingDetailPath } from "./building-url";
import { DISTRICT_PAGES, districtPagePath } from "./district-pages";

export const GANGNAM_MAP_URL =
  "/?q=%EA%B0%95%EB%82%A8&label=%EA%B0%95%EB%82%A8&lat=37.4979&lng=127.0276&level=6&source=default&mode=bounds";

export const DISTRICT_LINKS = DISTRICT_PAGES.map((district) => ({
  ...district,
  href: districtPagePath(district),
}));

export const FEATURED_BUILDINGS = [
  {
    id: 253,
    name: "디지털큐브",
    image: "/images/featured/digital-cube.png",
    tags: ["#대표매물", "#오피스빌딩", "#업무시설"],
  },
  {
    id: 3066,
    name: "덕승빌딩",
    image: "/images/featured/deokseung-building.jpg",
    tags: ["#추천오피스", "#빌딩임대", "#업무시설"],
  },
  {
    id: 57,
    name: "한덕빌딩",
    image: "/images/featured/handeok-building.jpg",
    tags: ["#대표매물", "#오피스", "#빌딩정보"],
  },
  {
    id: 3813,
    name: "서울파이낸스센터 SFC",
    image: "/images/featured/seoul-finance-center.png",
    tags: ["#CBD", "#프라임오피스", "#대표매물"],
  },
  {
    id: 2094,
    name: "FKI타워(구.전경련회관)",
    image: "/images/featured/fki-tower.png",
    tags: ["#YBD", "#프라임오피스", "#대표매물"],
  },
];

export const SERVICE_ITEMS = [
  {
    title: "사무실 이전 컨설팅",
    description: "인원 계획, 예산, 출퇴근 동선, 입주 시점을 기준으로 후보지를 좁힙니다.",
  },
  {
    title: "오피스 임대차 중개",
    description: "권역별 공실과 조건을 비교하고 임대인 협의까지 한 흐름으로 진행합니다.",
  },
  {
    title: "빌딩 데이터 탐색",
    description: "지도와 필터로 규모, 연차, 위치, 임대료 정보를 빠르게 확인합니다.",
  },
];

export const PROCESS_STEPS = [
  "요구 조건 정리",
  "후보 빌딩 선별",
  "투어 및 조건 협의",
  "계약·입주 일정 관리",
];

export function featuredBuildingDetailPath(building) {
  return buildingDetailPath({
    id: building.id,
    building_name: building.name,
  });
}

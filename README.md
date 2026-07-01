# realt-search

오피스 빌딩을 지도와 리스트로 검색하고, 상세 정보를 확인하는 Next.js 앱입니다.

## 실행

```bash
npm install
npm run dev
```

빌드 확인:

```bash
npm run build
```

현재 `npm run lint`는 Next.js 16 환경의 `next lint` 문제로 정상 동작하지 않습니다. 기본 검증은 `npm run build`로 합니다.

## 환경 변수

`.env.example`을 참고해 `.env`를 만듭니다.

필요한 주요 값:

```text
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY
KAKAO_REST_API_KEY
ADMIN_EMAIL
GOOGLE_APPS_SCRIPT_INQUIRY_URL
SITE_URL
```

## 데이터 조회 구조

복잡한 지도/검색 로직은 Supabase RPC를 사용합니다.

- `search_buildings_summary`: 지도 마커/클러스터용
- `search_buildings_list`: 클러스터 선택 후 리스트 카드용
- `search_location_suggestions`: 위치 검색 자동완성용

단순 조회는 REST select를 사용합니다.

- 상세 페이지/상세 패널
- 선택한 마커의 건물 조회
- 관리자, 이미지, 문의, sitemap

필드를 추가할 때는 화면 용도에 맞는 곳에만 추가합니다.

- 리스트 카드 필드: `app/_lib/building-selects.js`
- 상세 필드: `app/_lib/building-selects.js`
- 표시/포맷 로직: `app/_lib/building-display.js`

## 주요 파일

- `app/_lib/building-selects.js`: 리스트/상세/sitemap select 필드
- `app/_lib/building-display.js`: 층수, 주소, 용도 등 표시 포맷
- `app/_lib/building-detail.js`: 상세 데이터 fetch와 상세 화면 모델
- `app/_components/detail/BuildingDetailView.js`: 상세 페이지/패널 공용 UI
- `app/_components/detail/DetailAddressToggle.js`: 도로명/지번 주소 전환
- `app/api/buildings/_bounds-query.js`: 지도 bounds API 공통 로직

## Supabase

`supabase/schema.sql`은 원격 Supabase DB의 스키마 스냅샷입니다. 실제 데이터 건수나 row 값은 포함하지 않습니다.

원격 DB에서 스키마를 바꾼 뒤에는 로컬 스키마를 다시 갱신합니다.

```bash
supabase db dump --schema public > supabase/schema.sql
```

`supabase/imports/`는 Dashboard에서 실행하는 import/update SQL을 보관합니다.

`data/` 폴더는 로컬 CSV 작업용이며 Git에 올리지 않습니다.



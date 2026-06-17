import { BuildingCard } from "./BuildingCard";

function hasListingDetails(building) {
  return Boolean(
    building?.address ||
      building?.building_scale ||
      building?.gross_floor_area ||
      building?.rental_area_pyeong ||
      building?.deposit_total ||
      building?.rent_total,
  );
}

function isActiveBuilding(building, selectedId) {
  return (
    building?.id !== null &&
    building?.id !== undefined &&
    selectedId !== null &&
    selectedId !== undefined &&
    String(building.id) === String(selectedId)
  );
}

export function ResultsPanel({
  center,
  displayedBuildings,
  selectedId,
  selectedBuilding,
  resultCount,
  listLoading,
  error,
  onLoadMore,
}) {
  const selectedFallback =
    selectedBuilding && !listLoading && hasListingDetails(selectedBuilding)
      ? selectedBuilding
      : null;
  const buildingsToRender =
    displayedBuildings.length > 0 || !selectedFallback
      ? displayedBuildings
      : [selectedFallback];

  function handleScroll(event) {
    const element = event.currentTarget;
    const distanceFromBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight;
    if (distanceFromBottom < 220) {
      onLoadMore?.();
    }
  }

  return (
    <aside className="resultsPanel" onScroll={handleScroll}>
      <div className="panelHeader">
        <div>
          <span>{center.label}</span>
          <h2>
            빌딩목록{resultCount === null ? "" : ` ${resultCount}`}
          </h2>
        </div>
      </div>
      {error && <p className="errorText">{error}</p>}
      <div className="buildingList">
        {buildingsToRender.map((building) => (
          <BuildingCard
            key={building.id}
            building={building}
            active={isActiveBuilding(building, selectedId)}
          />
        ))}
        {buildingsToRender.length === 0 && resultCount === 0 && !listLoading && (
          <div className="emptyState">
            <strong>현재 지도 영역에 매물이 없습니다.</strong>
            <span>지도를 이동하거나 더 넓게 축소해 주세요.</span>
          </div>
        )}
        {listLoading && (
          <div className="listLoading">
            <span>매물 목록을 불러오는 중입니다.</span>
          </div>
        )}
      </div>
    </aside>
  );
}

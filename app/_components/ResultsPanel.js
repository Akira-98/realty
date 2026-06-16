import { BuildingCard } from "./BuildingCard";

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
        {displayedBuildings.map((building) => (
          <BuildingCard
            key={building.id}
            building={building}
            active={building.id === selectedId}
          />
        ))}
        {displayedBuildings.length === 0 && resultCount === 0 && !listLoading && (
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
      {selectedBuilding && (
        <div className="selectedBar">
          <strong>{selectedBuilding.building_name}</strong>
          {selectedBuilding.address && <span>{selectedBuilding.address}</span>}
        </div>
      )}
    </aside>
  );
}

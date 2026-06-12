import { BuildingCard } from "./BuildingCard";

export function ResultsPanel({
  center,
  displayedBuildings,
  selectedId,
  selectedBuilding,
  error,
}) {
  return (
    <aside className="resultsPanel">
      <div className="panelHeader">
        <div>
          <span>{center.label}</span>
          <h2>빌딩목록 {displayedBuildings.length}</h2>
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
        {displayedBuildings.length === 0 && (
          <div className="emptyState">
            <strong>현재 지도 영역에 매물이 없습니다.</strong>
            <span>지도를 이동하거나 더 넓게 축소해 주세요.</span>
          </div>
        )}
      </div>
      {selectedBuilding && (
        <div className="selectedBar">
          <strong>{selectedBuilding.building_name}</strong>
          <span>{selectedBuilding.address}</span>
        </div>
      )}
    </aside>
  );
}

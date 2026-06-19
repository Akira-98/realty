import { BuildingCard } from "./BuildingCard";

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
  displayedBuildings,
  selectedId,
  resultCount,
  listLoading,
  error,
  onLoadMore,
  onClose,
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
          <h2>
            빌딩목록{resultCount === null ? "" : ` ${resultCount}`}
          </h2>
        </div>
        <button
          type="button"
          className="panelCloseButton"
          aria-label="목록 패널 닫기"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      {error && <p className="errorText">{error}</p>}
      <div className="buildingList">
        {displayedBuildings.map((building) => (
          <BuildingCard
            key={building.id}
            building={building}
            active={isActiveBuilding(building, selectedId)}
          />
        ))}
        {displayedBuildings.length === 0 && resultCount === 0 && !listLoading && (
          <div className="emptyState">
            <strong>현재 지도 영역에 매물이 없습니다.</strong>
            <span>지도를 이동하거나 더 넓게 축소해 주세요.</span>
          </div>
        )}
        {listLoading && (
          <div className="listLoading" aria-label="매물 목록을 불러오는 중입니다.">
            <span className="loadingDots" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}

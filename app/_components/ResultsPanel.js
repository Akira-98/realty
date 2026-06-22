import { useEffect, useRef, useState } from "react";

import { BuildingCard } from "./BuildingCard";

const MOBILE_QUERY = "(max-width: 760px)";
const HEADER_HEIGHT = 64;
const SHEET_MIN_HEIGHT = 76;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getSheetSnapPoints() {
  if (typeof window === "undefined") {
    return {
      collapsed: SHEET_MIN_HEIGHT,
      half: 360,
      expanded: 640,
    };
  }

  const availableHeight = Math.max(SHEET_MIN_HEIGHT, window.innerHeight - HEADER_HEIGHT);
  return {
    collapsed: SHEET_MIN_HEIGHT,
    half: clamp(Math.round(window.innerHeight * 0.46), 260, availableHeight),
    expanded: availableHeight,
  };
}

function closestSnapState(height, snapPoints) {
  return Object.entries(snapPoints).reduce((closest, [state, snapHeight]) => {
    const distance = Math.abs(height - snapHeight);
    return distance < closest.distance ? { state, distance } : closest;
  }, { state: "half", distance: Infinity }).state;
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
  displayedBuildings,
  selectedId,
  resultCount,
  listLoading,
  error,
  onLoadMore,
  onClose,
}) {
  const dragRef = useRef(null);
  const [sheetState, setSheetState] = useState("half");
  const [sheetHeight, setSheetHeight] = useState(() => getSheetSnapPoints().half);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    function handleResize() {
      const nextSnapPoints = getSheetSnapPoints();
      setSheetHeight(nextSnapPoints[sheetState]);
    }

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [sheetState]);

  function handleScroll(event) {
    const element = event.currentTarget;
    const distanceFromBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight;
    if (distanceFromBottom < 220) {
      onLoadMore?.();
    }
  }

  function handleDragStart(event) {
    if (!window.matchMedia(MOBILE_QUERY).matches || event.target.closest("button, a")) {
      return;
    }

    const nextSnapPoints = getSheetSnapPoints();
    dragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startHeight: sheetHeight,
      currentHeight: sheetHeight,
      snapPoints: nextSnapPoints,
    };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleDragMove(event) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const nextHeight = clamp(
      drag.startHeight + drag.startY - event.clientY,
      drag.snapPoints.collapsed,
      drag.snapPoints.expanded,
    );
    drag.currentHeight = nextHeight;
    setSheetHeight(nextHeight);
  }

  function handleDragEnd(event) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const nextState = closestSnapState(drag.currentHeight, drag.snapPoints);
    setSheetState(nextState);
    setSheetHeight(drag.snapPoints[nextState]);
    setDragging(false);
    dragRef.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <aside
      className={dragging ? "resultsPanel dragging" : "resultsPanel"}
      data-sheet-state={sheetState}
      style={{ "--sheet-height": `${sheetHeight}px` }}
      onScroll={handleScroll}
    >
      <div
        className="panelHeader"
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragEnd}
      >
        <span className="panelDragHandle" aria-hidden="true" />
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
      <div className="buildingList" onScroll={handleScroll}>
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

"use client";

import { useEffect, useRef, useState } from "react";

import { useKakaoMap } from "../_hooks/useKakaoMap";
import { groupBuildingsForMarkers } from "../_lib/buildings";
import { MapFilters } from "./MapFilters";

function mapBoundsToPayload(bounds) {
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();
  return {
    swLat: sw.getLat(),
    swLng: sw.getLng(),
    neLat: ne.getLat(),
    neLng: ne.getLng(),
  };
}

export function MapView({
  center,
  buildings,
  filters,
  selectedId,
  onSelect,
  onFiltersApply,
  onFiltersReset,
  onBoundsChange,
  onMapMove,
  onViewportChange,
  boundsRefreshKey,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const overlaysRef = useRef([]);
  const idleListenerRef = useRef(null);
  const dragStartListenerRef = useRef(null);
  const zoomChangeListenerRef = useRef(null);
  const debounceRef = useRef(null);
  const lastCenterKeyRef = useRef("");
  const hasUserMovedMapRef = useRef(false);
  const isApplyingSavedViewRef = useRef(false);
  const onBoundsChangeRef = useRef(onBoundsChange);
  const onMapMoveRef = useRef(onMapMove);
  const onViewportChangeRef = useRef(onViewportChange);
  const [markerRenderKey, setMarkerRenderKey] = useState(0);
  const { ready, error } = useKakaoMap();

  useEffect(() => {
    onBoundsChangeRef.current = onBoundsChange;
  }, [onBoundsChange]);

  useEffect(() => {
    onMapMoveRef.current = onMapMove;
  }, [onMapMove]);

  useEffect(() => {
    onViewportChangeRef.current = onViewportChange;
  }, [onViewportChange]);

  useEffect(() => {
    if (!ready || !center || !containerRef.current) {
      return;
    }

    const { kakao } = window;
    const centerPosition = new kakao.maps.LatLng(center.lat, center.lng);
    const centerKey = `${center.lat},${center.lng},${center.level || ""}`;

    if (!mapRef.current) {
      mapRef.current = new kakao.maps.Map(containerRef.current, {
        center: centerPosition,
        level: center.level || 4,
      });
      idleListenerRef.current = kakao.maps.event.addListener(mapRef.current, "idle", () => {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = window.setTimeout(() => {
          setMarkerRenderKey((key) => key + 1);
          onBoundsChangeRef.current(mapBoundsToPayload(mapRef.current.getBounds()));
          if (hasUserMovedMapRef.current) {
            const currentCenter = mapRef.current.getCenter();
            onViewportChangeRef.current?.({
              lat: currentCenter.getLat(),
              lng: currentCenter.getLng(),
              level: mapRef.current.getLevel(),
            });
            hasUserMovedMapRef.current = false;
          }
        }, 250);
      });
      dragStartListenerRef.current = kakao.maps.event.addListener(
        mapRef.current,
        "dragstart",
        () => {
          if (isApplyingSavedViewRef.current) {
            return;
          }
          hasUserMovedMapRef.current = true;
          onMapMoveRef.current?.();
        },
      );
      zoomChangeListenerRef.current = kakao.maps.event.addListener(
        mapRef.current,
        "zoom_changed",
        () => {
          if (isApplyingSavedViewRef.current) {
            return;
          }
          hasUserMovedMapRef.current = true;
          onMapMoveRef.current?.();
        },
      );
    } else if (lastCenterKeyRef.current !== centerKey) {
      isApplyingSavedViewRef.current = true;
      mapRef.current.setCenter(centerPosition);
      if (center.level && mapRef.current.getLevel() !== center.level) {
        mapRef.current.setLevel(center.level);
      }
      window.setTimeout(() => {
        isApplyingSavedViewRef.current = false;
      }, 0);
    }
    lastCenterKeyRef.current = centerKey;

    overlaysRef.current.forEach((overlay) => overlay.setMap(null));
    overlaysRef.current = [];

    const mapBounds = mapBoundsToPayload(mapRef.current.getBounds());
    const viewportWidth = containerRef.current.clientWidth;
    const viewportHeight = containerRef.current.clientHeight;

    groupBuildingsForMarkers(buildings, {
      bounds: mapBounds,
      viewportWidth,
      viewportHeight,
    }).forEach((group) => {
      const firstBuilding = group.buildings[0];
      const position = new kakao.maps.LatLng(group.lat, group.lng);
      const markerContent = document.createElement("button");
      markerContent.type = "button";
      markerContent.className = group.buildings.some((building) => building.id === selectedId)
        ? "mapBuildingMarker active"
        : "mapBuildingMarker";
      if (group.buildings.length === 1) {
        markerContent.classList.add("single");
        markerContent.setAttribute("aria-label", firstBuilding.building_name);
      } else {
        markerContent.textContent = String(group.buildings.length);
      }
      markerContent.title =
        group.buildings.length > 1
          ? `${group.buildings.length}개 매물`
          : firstBuilding.building_name;
      markerContent.addEventListener("click", () => onSelect(group.buildings));

      const overlay = new kakao.maps.CustomOverlay({
        position,
        content: markerContent,
        yAnchor: 0.5,
      });
      overlay.setMap(mapRef.current);
      overlaysRef.current.push(overlay);
    });
  }, [ready, center, buildings, selectedId, onSelect, markerRenderKey]);

  useEffect(() => {
    return () => {
      window.clearTimeout(debounceRef.current);
      if (idleListenerRef.current && window.kakao?.maps) {
        window.kakao.maps.event.removeListener(idleListenerRef.current);
      }
      if (dragStartListenerRef.current && window.kakao?.maps) {
        window.kakao.maps.event.removeListener(dragStartListenerRef.current);
      }
      if (zoomChangeListenerRef.current && window.kakao?.maps) {
        window.kakao.maps.event.removeListener(zoomChangeListenerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!ready || !center || !mapRef.current) {
      return;
    }

    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      onBoundsChange(mapBoundsToPayload(mapRef.current.getBounds()));
    }, 0);
  }, [ready, center, onBoundsChange, boundsRefreshKey]);

  useEffect(() => {
    if (!ready || !mapRef.current || !selectedId) {
      return;
    }
    const selected = buildings.find((building) => building.id === selectedId);
    if (!selected?.lat || !selected?.lng) {
      return;
    }
    mapRef.current.panTo(
      new window.kakao.maps.LatLng(Number(selected.lat), Number(selected.lng)),
    );
  }, [ready, selectedId, buildings]);

  return (
    <div className="mapShell">
      <div ref={containerRef} className="mapCanvas" />
      <MapFilters
        filters={filters}
        onApply={onFiltersApply}
        onReset={onFiltersReset}
      />
      {(!ready || error) && (
        <div className="mapFallback">
          <strong>지도 영역</strong>
          <span>{error || "카카오 지도를 불러오는 중입니다."}</span>
        </div>
      )}
    </div>
  );
}

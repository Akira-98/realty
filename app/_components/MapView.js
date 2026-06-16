"use client";

import { useEffect, useRef, useState } from "react";

import { useKakaoMap } from "../_hooks/useKakaoMap";
import { groupBuildingsForMarkers } from "../_lib/buildings";
import { MapFilters } from "./MapFilters";

function mapBoundsToPayload(bounds, mapLevel = null) {
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();
  const payload = {
    swLat: sw.getLat(),
    swLng: sw.getLng(),
    neLat: ne.getLat(),
    neLng: ne.getLng(),
  };
  if (mapLevel) {
    payload.mapLevel = mapLevel;
  }
  return payload;
}

function hasServerClusterMarkers(buildings) {
  return buildings.some((building) => building.type === "cluster" || building.type === "building");
}

function markerGroupsForRender(buildings, options) {
  if (!hasServerClusterMarkers(buildings)) {
    return groupBuildingsForMarkers(buildings, options).map((group) => ({
      ...group,
      type: group.buildings.length > 1 ? "cluster" : "building",
      count: group.buildings.length,
    }));
  }

  return buildings
    .map((marker) => ({
      type: marker.type,
      count: marker.count ?? 1,
      lat: Number(marker.lat),
      lng: Number(marker.lng),
      marker,
      buildings: marker.type === "building" ? [marker] : [],
    }))
    .filter((group) => Number.isFinite(group.lat) && Number.isFinite(group.lng));
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
          onBoundsChangeRef.current(
            mapBoundsToPayload(mapRef.current.getBounds(), mapRef.current.getLevel()),
          );
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
    const level = mapRef.current.getLevel();

    markerGroupsForRender(buildings, {
      bounds: mapBounds,
      viewportWidth,
      viewportHeight,
      level,
    }).forEach((group) => {
      const firstBuilding = group.buildings[0];
      const position = new kakao.maps.LatLng(group.lat, group.lng);
      const markerContent = document.createElement("button");
      markerContent.type = "button";
      markerContent.className = group.buildings.some((building) => building.id === selectedId)
        ? "mapBuildingMarker active"
        : "mapBuildingMarker";
      if (group.type === "building") {
        markerContent.classList.add("single");
        markerContent.setAttribute(
          "aria-label",
          firstBuilding?.building_name || group.marker?.building_name || "매물",
        );
      } else {
        markerContent.textContent = String(group.count);
      }
      markerContent.title =
        group.type === "cluster"
          ? `${group.count}개 매물`
          : firstBuilding?.building_name || group.marker?.building_name || "매물";
      markerContent.addEventListener("click", () => {
        if (group.type === "cluster") {
          hasUserMovedMapRef.current = true;
          onMapMoveRef.current?.();
          mapRef.current.setCenter(position);
          mapRef.current.setLevel(Math.max(level - 2, 1));
          return;
        }
        onSelect(group.buildings);
      });

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
      onBoundsChange(mapBoundsToPayload(mapRef.current.getBounds(), mapRef.current.getLevel()));
    }, 0);
  }, [ready, center, onBoundsChange, boundsRefreshKey]);

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

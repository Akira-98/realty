"use client";

import { useEffect, useRef } from "react";

import { useKakaoMap } from "../../_hooks/useKakaoMap";

export function DetailMap({ lat, lng, label }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const { ready, error } = useKakaoMap();

  useEffect(() => {
    if (!ready || !lat || !lng || !containerRef.current) {
      return;
    }

    const { kakao } = window;
    const position = new kakao.maps.LatLng(Number(lat), Number(lng));

    if (!mapRef.current) {
      mapRef.current = new kakao.maps.Map(containerRef.current, {
        center: position,
        level: 3,
      });
    } else {
      mapRef.current.setCenter(position);
    }

    markerRef.current?.setMap(null);
    markerRef.current = new kakao.maps.Marker({ position });
    markerRef.current.setMap(mapRef.current);
  }, [ready, lat, lng]);

  if (!lat || !lng) {
    return (
      <div className="detailMapFallback">
        <strong>지도 정보 없음</strong>
        <span>이 매물은 위치 정보가 아직 연결되지 않았습니다.</span>
      </div>
    );
  }

  return (
    <div className="detailMapShell" aria-label={`${label} 위치 지도`}>
      <div ref={containerRef} className="detailMapCanvas" />
      {(!ready || error) && (
        <div className="detailMapFallback">
          <strong>위치 지도</strong>
          <span>{error || "카카오 지도를 불러오는 중입니다."}</span>
        </div>
      )}
    </div>
  );
}

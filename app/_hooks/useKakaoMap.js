"use client";

import { useEffect, useState } from "react";

export function useKakaoMap() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;
    if (!key) {
      setError("Kakao JavaScript key is missing.");
      return;
    }

    if (window.kakao?.maps) {
      window.kakao.maps.load(() => setReady(true));
      return;
    }

    const existingScript = document.querySelector("script[data-kakao-map]");
    if (existingScript) {
      existingScript.addEventListener("load", () => {
        window.kakao.maps.load(() => setReady(true));
      });
      return;
    }

    const script = document.createElement("script");
    script.dataset.kakaoMap = "true";
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false`;
    script.onload = () => {
      window.kakao.maps.load(() => setReady(true));
    };
    script.onerror = () => {
      setError("Kakao map failed to load.");
    };
    document.head.appendChild(script);
  }, []);

  return { ready, error };
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

export function BuildingImageGallery({ images, title }) {
  const galleryImages = useMemo(
    () => (Array.isArray(images) ? images.filter((image) => image.image_url) : []),
    [images],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const activeImage = galleryImages[activeIndex];
  const hasImages = galleryImages.length > 0;
  const hasMultipleImages = galleryImages.length > 1;

  useEffect(() => {
    if (!lightboxOpen) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setLightboxOpen(false);
      }
      if (event.key === "ArrowLeft" && hasMultipleImages) {
        showPrevious();
      }
      if (event.key === "ArrowRight" && hasMultipleImages) {
        showNext();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [hasMultipleImages, lightboxOpen]);

  useEffect(() => {
    const preloadTargets = galleryImages.slice(1, 3);
    if (preloadTargets.length === 0) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      preloadTargets.forEach((image) => {
        const preload = new Image();
        preload.src = image.image_url;
      });
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [galleryImages]);

  function showPrevious() {
    setActiveIndex((current) =>
      current === 0 ? galleryImages.length - 1 : current - 1,
    );
  }

  function showNext() {
    setActiveIndex((current) =>
      current === galleryImages.length - 1 ? 0 : current + 1,
    );
  }

  return (
    <div
      className={hasImages ? "detailPhoto hasPhoto" : "detailPhoto"}
      onClick={() => {
        if (hasImages) {
          setLightboxOpen(true);
        }
      }}
      onKeyDown={(event) => {
        if (hasImages && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          setLightboxOpen(true);
        }
      }}
      role={hasImages ? "button" : undefined}
      tabIndex={hasImages ? 0 : undefined}
      aria-label={hasImages ? `${title} 사진 갤러리 열기` : undefined}
    >
      {activeImage && <img src={activeImage.image_url} alt={`${title} 사진`} />}
      {hasMultipleImages && (
        <>
          <button
            type="button"
            className="detailPhotoNav previous"
            onClick={(event) => {
              event.stopPropagation();
              showPrevious();
            }}
            aria-label="이전 사진"
          >
            ‹
          </button>
          <button
            type="button"
            className="detailPhotoNav next"
            onClick={(event) => {
              event.stopPropagation();
              showNext();
            }}
            aria-label="다음 사진"
          >
            ›
          </button>
          <span className="detailPhotoCount">
            {activeIndex + 1} / {galleryImages.length}
          </span>
        </>
      )}
      {!hasImages && (
        <div>
          <strong>사진 준비 중</strong>
        </div>
      )}
      {lightboxOpen && activeImage && createPortal(
        <div
          className="imageLightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${title} 사진 크게 보기`}
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            className="imageLightboxClose"
            onClick={(event) => {
              event.stopPropagation();
              setLightboxOpen(false);
            }}
            aria-label="닫기"
          >
            ×
          </button>
          <h2 className="imageLightboxTitle">{title}</h2>
          {hasMultipleImages && (
            <button
              type="button"
              className="imageLightboxNav previous"
              onClick={(event) => {
                event.stopPropagation();
                showPrevious();
              }}
              aria-label="이전 사진"
            >
              ‹
            </button>
          )}
          <div className="imageLightboxStage">
            <img
              src={activeImage.image_url}
              alt={`${title} 사진 ${activeIndex + 1}`}
              onClick={(event) => event.stopPropagation()}
            />
          </div>
          {hasMultipleImages && (
            <button
              type="button"
              className="imageLightboxNav next"
              onClick={(event) => {
                event.stopPropagation();
                showNext();
              }}
              aria-label="다음 사진"
            >
              ›
            </button>
          )}
          {hasMultipleImages && (
            <span className="imageLightboxCount">
              {activeIndex + 1} / {galleryImages.length}
            </span>
          )}
          {hasMultipleImages && (
            <div className="imageLightboxThumbs" onClick={(event) => event.stopPropagation()}>
              {galleryImages.map((image, index) => (
                <button
                  type="button"
                  key={`${image.image_path}-${image.image_order}`}
                  className={index === activeIndex ? "active" : ""}
                  onClick={() => setActiveIndex(index)}
                  aria-label={`${index + 1}번째 사진 보기`}
                >
                  <img src={image.image_url} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}

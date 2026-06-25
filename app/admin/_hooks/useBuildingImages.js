"use client";

import { useCallback, useEffect, useState } from "react";

import { isUnauthorized } from "../_lib/admin-buildings";

export function useBuildingImages({ buildingId, onError, onUnauthorized }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [ordering, setOrdering] = useState(false);

  const handleError = useCallback(
    (error) => {
      onError?.(error.message);
    },
    [onError],
  );

  const fetchImages = useCallback(
    async (nextBuildingId = buildingId) => {
      if (!nextBuildingId) {
        setImages([]);
        return;
      }

      setLoading(true);
      onError?.("");

      try {
        const response = await fetch(`/api/admin/buildings/${nextBuildingId}/images`);
        const payload = await response.json();
        if (isUnauthorized(response)) {
          onUnauthorized?.();
          return;
        }
        if (!response.ok) {
          throw new Error(payload.error || "사진을 불러오지 못했습니다.");
        }
        setImages(payload.images ?? []);
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    },
    [buildingId, handleError, onError, onUnauthorized],
  );

  useEffect(() => {
    fetchImages(buildingId);
  }, [buildingId, fetchImages]);

  const uploadImage = useCallback(
    async (file) => {
      if (!buildingId || !file) {
        return;
      }

      setUploading(true);
      onError?.("");

      try {
        const formData = new FormData();
        formData.set("image", file);
        const response = await fetch(`/api/admin/buildings/${buildingId}/images`, {
          method: "POST",
          body: formData,
        });
        const payload = await response.json();
        if (isUnauthorized(response)) {
          onUnauthorized?.();
          return;
        }
        if (!response.ok) {
          throw new Error(payload.error || "사진을 업로드하지 못했습니다.");
        }
        setImages(payload.images ?? []);
      } catch (error) {
        handleError(error);
      } finally {
        setUploading(false);
      }
    },
    [buildingId, handleError, onError, onUnauthorized],
  );

  const deleteImage = useCallback(
    async (image) => {
      if (!buildingId || !image?.id) {
        return;
      }

      setDeletingId(image.id);
      onError?.("");

      try {
        const response = await fetch(
          `/api/admin/buildings/${buildingId}/images/${image.id}`,
          { method: "DELETE" },
        );
        const payload = await response.json();
        if (isUnauthorized(response)) {
          onUnauthorized?.();
          return;
        }
        if (!response.ok) {
          throw new Error(payload.error || "사진을 삭제하지 못했습니다.");
        }
        setImages(payload.images ?? []);
      } catch (error) {
        handleError(error);
      } finally {
        setDeletingId(null);
      }
    },
    [buildingId, handleError, onError, onUnauthorized],
  );

  const reorderImages = useCallback(
    async (nextImages) => {
      if (!buildingId || ordering) {
        return;
      }

      const previousImages = images;
      setImages(nextImages);
      setOrdering(true);
      onError?.("");

      try {
        const response = await fetch(`/api/admin/buildings/${buildingId}/images`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            images: nextImages.map((image) => ({ id: image.id })),
          }),
        });
        const payload = await response.json();
        if (isUnauthorized(response)) {
          onUnauthorized?.();
          return;
        }
        if (!response.ok) {
          throw new Error(payload.error || "사진 순서를 변경하지 못했습니다.");
        }
        setImages(payload.images ?? []);
      } catch (error) {
        setImages(previousImages);
        handleError(error);
      } finally {
        setOrdering(false);
      }
    },
    [buildingId, handleError, images, onError, onUnauthorized, ordering],
  );

  return {
    deletingId,
    deleteImage,
    fetchImages,
    images,
    loading,
    ordering,
    reorderImages,
    uploadImage,
    uploading,
  };
}

"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableImage({ buildingName, deleting, image, index, onDelete }) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: image.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const className = [
    "adminImageItem",
    isDragging && "dragging",
  ].filter(Boolean).join(" ");

  return (
    <article
      ref={setNodeRef}
      className={className}
      style={style}
      {...attributes}
      {...listeners}
    >
      <img src={image.image_url} alt={`${buildingName} 사진 ${index + 1}`} />
      <button
        type="button"
        className="adminImageDelete"
        disabled={deleting}
        onClick={(event) => {
          event.stopPropagation();
          onDelete(image);
        }}
        onKeyDown={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
      >
        {deleting ? "삭제 중" : "삭제"}
      </button>
    </article>
  );
}

export function BuildingImageManager({
  buildingName,
  deletingId,
  images,
  loading,
  ordering,
  uploading,
  onDelete,
  onReorder,
  onUpload,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const imageIds = images.map((image) => image.id);

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id || ordering) {
      return;
    }

    const oldIndex = images.findIndex((image) => image.id === active.id);
    const newIndex = images.findIndex((image) => image.id === over.id);
    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    onReorder(arrayMove(images, oldIndex, newIndex));
  }

  return (
    <section className="adminImageManager" aria-label="매물 사진 관리">
      <label
        className={uploading ? "adminImageUploadTile disabled" : "adminImageUploadTile"}
        aria-label={uploading ? "사진 업로드 중" : "사진 업로드"}
      >
        <span aria-hidden="true" />
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          disabled={uploading}
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (file) {
              await onUpload(file);
            }
            event.target.value = "";
          }}
        />
      </label>

      {loading && <div className="adminImageEmpty">사진을 불러오는 중입니다.</div>}

      {!loading && images.length === 0 && (
        <div className="adminImageEmpty">등록된 사진이 없습니다.</div>
      )}

      {!loading && images.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={imageIds} strategy={rectSortingStrategy}>
            <div className="adminImageGrid">
              {images.map((image, index) => (
                <SortableImage
                  key={image.id}
                  buildingName={buildingName}
                  deleting={deletingId === image.id}
                  image={image}
                  index={index}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </section>
  );
}

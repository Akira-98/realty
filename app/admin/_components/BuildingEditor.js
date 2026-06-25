import { EDIT_FIELDS } from "../_lib/admin-buildings";
import { BuildingImageManager } from "./BuildingImageManager";

function cleanNumericInput(value) {
  const [integer = "", ...decimalParts] = value.replaceAll(",", "").split(".");
  const normalizedInteger = integer.replace(/\D/g, "");
  const normalizedDecimal = decimalParts.join("").replace(/\D/g, "");

  return value.includes(".")
    ? `${normalizedInteger}.${normalizedDecimal}`
    : normalizedInteger;
}

function formatNumericInput(value) {
  const text = String(value ?? "");
  if (!text) {
    return "";
  }

  const [integer, decimal] = text.split(".");
  const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return text.includes(".") ? `${formattedInteger}.${decimal ?? ""}` : formattedInteger;
}

export function BuildingEditor({
  building,
  draft,
  imageManager,
  saving,
  onChange,
  onSave,
}) {
  if (!building) {
    return (
      <aside className="adminEditor">
        <div className="adminEmpty">수정할 매물을 선택하세요.</div>
      </aside>
    );
  }

  return (
    <aside className="adminEditor">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
      >
        <div className="adminEditorTitle">
          <span>{building.is_public ? "노출" : "노출종료"}</span>
          <h2>{building.building_name}</h2>
          <p>{building.address}</p>
        </div>
        <div className="adminEditGrid">
          {EDIT_FIELDS.map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                type="text"
                inputMode="decimal"
                placeholder="별도문의"
                value={formatNumericInput(draft[key])}
                onChange={(event) => onChange(key, cleanNumericInput(event.target.value))}
              />
            </label>
          ))}
        </div>
        <div className="adminEditorActions">
          <button type="submit" disabled={saving}>
            {saving ? "저장 중" : "저장"}
          </button>
        </div>
      </form>
      <BuildingImageManager
        buildingName={building.building_name}
        deletingId={imageManager.deletingId}
        images={imageManager.images}
        loading={imageManager.loading}
        ordering={imageManager.ordering}
        uploading={imageManager.uploading}
        onDelete={imageManager.deleteImage}
        onReorder={imageManager.reorderImages}
        onUpload={imageManager.uploadImage}
      />
    </aside>
  );
}

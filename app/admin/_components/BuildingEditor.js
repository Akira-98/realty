import { EDIT_FIELDS } from "../_lib/admin-buildings";

export function BuildingEditor({ building, draft, saving, onChange, onSave }) {
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
          <span>{building.is_public ? "공개" : "비공개"}</span>
          <h2>{building.building_name}</h2>
          <p>{building.address}</p>
        </div>
        <div className="adminEditGrid">
          {EDIT_FIELDS.map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                type="number"
                step="0.01"
                value={draft[key] ?? ""}
                onChange={(event) => onChange(key, event.target.value)}
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
    </aside>
  );
}

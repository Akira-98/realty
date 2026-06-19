import { priceSummary } from "../_lib/admin-buildings";
import { Pagination } from "./Pagination";

export function BuildingList({
  buildings,
  currentPage,
  editingId,
  loading,
  offset,
  pages,
  savingId,
  total,
  totalPages,
  onEdit,
  onPage,
  onTogglePublic,
}) {
  return (
    <div className="adminList">
      <div className="adminListMeta">
        <span>
          {buildings.length > 0 ? `${offset + 1}-${offset + buildings.length}` : "0"}
          {total !== null ? ` / ${total}` : ""}
        </span>
      </div>

      {buildings.map((building) => (
        <BuildingRow
          key={building.id}
          active={building.id === editingId}
          building={building}
          saving={savingId === building.id}
          onEdit={() => onEdit(building)}
          onTogglePublic={() => onTogglePublic(building)}
        />
      ))}

      {buildings.length === 0 && (
        <div className="adminEmpty">
          {loading ? "매물을 불러오는 중입니다." : "조회된 매물이 없습니다."}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          loading={loading}
          pages={pages}
          totalPages={totalPages}
          onPage={onPage}
        />
      )}
    </div>
  );
}

function BuildingRow({ active, building, saving, onEdit, onTogglePublic }) {
  const className = [
    "adminBuilding",
    active && "active",
    !building.is_public && "private",
  ].filter(Boolean).join(" ");

  return (
    <article className={className}>
      <button type="button" onClick={onEdit}>
        <strong>{building.building_name}</strong>
        <span>{building.address}</span>
        <em>{priceSummary(building) || "별도문의"}</em>
      </button>
      <div className="adminBuildingActions">
        <button type="button" disabled={saving} onClick={onTogglePublic}>
          {building.is_public ? "노출종료" : "노출"}
        </button>
      </div>
    </article>
  );
}

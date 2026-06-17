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
  return (
    <article className={active ? "adminBuilding active" : "adminBuilding"}>
      <button type="button" onClick={onEdit}>
        <strong>{building.building_name}</strong>
        <span>{building.address}</span>
        <em>{priceSummary(building) || "별도 문의"}</em>
      </button>
      <div className="adminBuildingActions">
        <span className={building.is_public ? "statusPublic" : "statusPrivate"}>
          {building.is_public ? "공개" : "비공개"}
        </span>
        <button type="button" disabled={saving} onClick={onTogglePublic}>
          {building.is_public ? "비공개" : "공개"}
        </button>
      </div>
    </article>
  );
}

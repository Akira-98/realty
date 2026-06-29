function FilterPopover({
  active,
  children,
  label,
  open,
  onToggle,
}) {
  return (
    <details
      open={open}
      className={active ? "mapFilterPopover active" : "mapFilterPopover"}
    >
      <summary
        onClick={(event) => {
          event.preventDefault();
          onToggle();
        }}
      >
        <span>{label}</span>
      </summary>
      <div className="mapFilterDropdown">{children}</div>
    </details>
  );
}

function rangeFilterButtonLabel(group, filters) {
  const min = filters[group.minKey];
  const max = filters[group.maxKey];
  if (!min && !max) {
    return group.label;
  }
  const unit = group.unit ? group.unit.replace(/^3\.3㎡$/, " 3.3㎡") : "";
  if (min && max) {
    return `${min}~${max}${unit}`;
  }
  if (min) {
    return `${min}${unit}~`;
  }
  return `~${max}${unit}`;
}

function ResetButton({ label, onClick }) {
  return (
    <button
      type="button"
      className="ghostButton"
      aria-label={`${label} 초기화`}
      title={`${label} 초기화`}
      onClick={onClick}
    >
      ↺
    </button>
  );
}

export function RangeFilterPopover({
  draft,
  filters,
  group,
  onDraftChange,
  onReset,
  onToggle,
  open,
}) {
  const isActive = Boolean(filters[group.minKey] || filters[group.maxKey]);

  return (
    <FilterPopover
      active={isActive}
      label={rangeFilterButtonLabel(group, filters)}
      open={open}
      onToggle={onToggle}
    >
      <div className="mapFilterInputs">
        <label>
          최소
          <input
            type="number"
            inputMode="numeric"
            min="0"
            placeholder="0"
            value={draft[group.minKey] ?? ""}
            onChange={(event) =>
              onDraftChange({
                ...draft,
                [group.minKey]: event.target.value,
              })
            }
          />
        </label>
        <label>
          최대
          <input
            type="number"
            inputMode="numeric"
            min="0"
            placeholder="제한 없음"
            value={draft[group.maxKey] ?? ""}
            onChange={(event) =>
              onDraftChange({
                ...draft,
                [group.maxKey]: event.target.value,
              })
            }
          />
        </label>
      </div>
      <span>{group.basisLabel || `${group.unit} 기준`}</span>
      <div className="mapFilterActions">
        <ResetButton label={group.label} onClick={onReset} />
        <button type="submit">적용</button>
      </div>
    </FilterPopover>
  );
}

export function ChoiceFilterPopover({
  active,
  choices,
  className = "",
  help,
  label,
  onReset,
  onSelect,
  onToggle,
  open,
  resetLabel,
  value,
}) {
  return (
    <FilterPopover active={active} label={label} open={open} onToggle={onToggle}>
      {help}
      <div className={["mapFilterChoices", className].filter(Boolean).join(" ")}>
        {choices.map((choice) => {
          const isActive = value === choice.value;
          return (
            <button
              key={choice.value}
              type="button"
              className={isActive ? "active" : ""}
              title={choice.title}
              onClick={() => onSelect(choice, isActive)}
            >
              {choice.label}
            </button>
          );
        })}
      </div>
      <div className="mapFilterActions">
        <ResetButton label={resetLabel} onClick={onReset} />
      </div>
    </FilterPopover>
  );
}

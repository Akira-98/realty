export function uniqueBuildingsById(buildings) {
  if (!Array.isArray(buildings)) {
    return [];
  }

  const seenIds = new Set();
  return buildings.filter((building) => {
    const id = building?.id;
    if (id === undefined || id === null) {
      return true;
    }
    if (seenIds.has(id)) {
      return false;
    }
    seenIds.add(id);
    return true;
  });
}

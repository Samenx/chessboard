export function isExactReorder(currentIds, requestedIds) {
  if (!Array.isArray(currentIds) || !Array.isArray(requestedIds)) return false;
  if (currentIds.length !== requestedIds.length) return false;
  const current = new Set(currentIds);
  if (current.size !== currentIds.length) return false;
  const requested = new Set(requestedIds);
  return requested.size === requestedIds.length && requestedIds.every(id => current.has(id));
}

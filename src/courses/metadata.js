export function normalizeObjectives(value) {
  if (!Array.isArray(value) || value.length > 20) {
    throw new Error('Learning objectives must be a list of at most 20 items.');
  }
  if (value.some(item => typeof item !== 'string' || item.length > 500)) {
    throw new Error('Each learning objective must be text no longer than 500 characters.');
  }
  return value.map(item => item.trim()).filter(Boolean);
}

export const DEFAULT_BRAND = Object.freeze({ name: 'Chess Arena', primary: '#1769aa', logoUrl: '' });

export function normalizeBrand(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Brand settings must be an object.');
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const primary = typeof input.primary === 'string' ? input.primary.trim().toLowerCase() : '';
  const logoUrl = typeof input.logoUrl === 'string' ? input.logoUrl.trim() : '';
  if (!name || name.length > 60) throw new Error('Brand name must be between 1 and 60 characters.');
  if (!/^#[0-9a-f]{6}$/.test(primary)) throw new Error('Brand color must be a six-digit hex color.');
  if (logoUrl.length > 2000 || (logoUrl && !logoUrl.startsWith('/media/') && !/^https:\/\//i.test(logoUrl))) {
    throw new Error('Logo must use an HTTPS URL or a Chess Arena media path.');
  }
  return { name, primary, logoUrl };
}

export function darkenHex(hex, amount = 0.14) {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return DEFAULT_BRAND.primary;
  const channels = [1, 3, 5].map(index => Math.round(parseInt(hex.slice(index, index + 2), 16) * (1 - amount)));
  return `#${channels.map(value => value.toString(16).padStart(2, '0')).join('')}`;
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { darkenHex, DEFAULT_BRAND, normalizeBrand } from './brand.js';

test('normalizes and validates brand identity', () => {
  assert.deepEqual(normalizeBrand({ name: '  Arena  ', primary: '#ABCDEF', logoUrl: '/media/mark.png' }), {
    name: 'Arena', primary: '#abcdef', logoUrl: '/media/mark.png'
  });
  assert.deepEqual(normalizeBrand(DEFAULT_BRAND), { ...DEFAULT_BRAND });
});

test('rejects unsafe or malformed brand values', () => {
  assert.throws(() => normalizeBrand({ name: 'Arena', primary: 'blue', logoUrl: '' }), /six-digit/);
  assert.throws(() => normalizeBrand({ name: 'Arena', primary: '#123456', logoUrl: 'javascript:alert(1)' }), /HTTPS/);
  assert.throws(() => normalizeBrand({ name: 'x'.repeat(61), primary: '#123456', logoUrl: '' }), /60 characters/);
});

test('derives a darker hover color from the configured primary', () => {
  assert.equal(darkenHex('#ffffff'), '#dbdbdb');
  assert.equal(darkenHex('invalid'), DEFAULT_BRAND.primary);
});

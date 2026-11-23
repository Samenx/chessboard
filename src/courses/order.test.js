import test from 'node:test';
import assert from 'node:assert/strict';
import { isExactReorder } from './order.js';

test('an exact reorder can change order without losing chapters or lessons', () => {
  assert.equal(isExactReorder(['a', 'b', 'c'], ['c', 'a', 'b']), true);
});

test('rejects missing, extra, duplicate, and non-list reorder data', () => {
  assert.equal(isExactReorder(['a', 'b'], ['a']), false);
  assert.equal(isExactReorder(['a', 'b'], ['a', 'b', 'c']), false);
  assert.equal(isExactReorder(['a', 'b'], ['a', 'a']), false);
  assert.equal(isExactReorder(['a', 'a'], ['a', 'a']), false);
  assert.equal(isExactReorder(['a'], null), false);
});

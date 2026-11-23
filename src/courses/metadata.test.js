import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeObjectives } from './metadata.js';

test('normalizes empty and whitespace-only learning objectives', () => {
  assert.deepEqual(normalizeObjectives([' Activate the king ', '', '  ']), ['Activate the king']);
});

test('limits objective count and rejects non-text or oversized entries', () => {
  assert.throws(() => normalizeObjectives(Array(21).fill('Outcome')), /at most 20/);
  assert.throws(() => normalizeObjectives(['outcome', null]), /must be text/);
  assert.throws(() => normalizeObjectives(['x'.repeat(501)]), /500 characters/);
});

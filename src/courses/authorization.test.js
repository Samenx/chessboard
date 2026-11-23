import test from 'node:test';
import assert from 'node:assert/strict';
import { canIncludeCourseDrafts, canManageCourse } from './authorization.js';

test('course ownership is scoped to instructors while admins manage all', () => {
  assert.equal(canManageCourse({ id: 'i1', role: 'instructor' }, 'i1'), true);
  assert.equal(canManageCourse({ id: 'i1', role: 'instructor' }, 'i2'), false);
  assert.equal(canManageCourse({ id: 's1', role: 'student' }, 's1'), false);
  assert.equal(canManageCourse({ id: 'a1', role: 'admin' }, 'i2'), true);
  assert.equal(canManageCourse(null, null), false);
});

test('only instructors and admins can request draft listings', () => {
  assert.equal(canIncludeCourseDrafts({ role: 'instructor' }), true);
  assert.equal(canIncludeCourseDrafts({ role: 'admin' }), true);
  assert.equal(canIncludeCourseDrafts({ role: 'student' }), false);
});

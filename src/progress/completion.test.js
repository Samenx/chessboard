import test from 'node:test';
import assert from 'node:assert/strict';
import { courseCompletionPercent, lessonIsComplete, recordLessonCompletion } from './completion.js';

test('course percentage counts only distinct completed lessons', () => {
  assert.equal(courseCompletionPercent(4, []), 0);
  assert.equal(courseCompletionPercent(4, ['a']), 25);
  assert.equal(courseCompletionPercent(4, ['a', 'a', 'b']), 50);
  assert.equal(courseCompletionPercent(0, ['a']), 0);
});

test('marking a lesson complete is idempotent and leaves navigation separate', () => {
  const opened = { lessonIndex: 2, pageIndex: 1, completedLessonIds: [] };
  assert.equal(lessonIsComplete(opened, 'lesson-c'), false);
  const done = recordLessonCompletion(opened, 'lesson-c', 4);
  assert.equal(lessonIsComplete(done, 'lesson-c'), true);
  assert.equal(done.progress, 25);
  assert.deepEqual(recordLessonCompletion(done, 'lesson-c', 4).completedLessonIds, ['lesson-c']);
});

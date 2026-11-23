import test from 'node:test';
import assert from 'node:assert/strict';
import { flattenLessonPages, normalizeLessonPages, readerPagesForLesson } from './pages.js';

test('legacy content blocks are represented as ordered single-block pages', () => {
  const content = [{ id: 'a', title: 'Page A' }, { id: 'b' }];
  const pages = normalizeLessonPages({ content });
  assert.deepEqual(pages.map(page => [page.title, page.position]), [['Page A', 0], ['Sector 2', 1]]);
  assert.deepEqual(flattenLessonPages(pages), content);
});

test('first-class pages can contain multiple blocks and retain page order', () => {
  const pages = normalizeLessonPages({ pages: [
    { title: 'Explain', blocks: [{ type: 'text' }, { type: 'position' }] },
    { title: 'Practice', blocks: [{ type: 'exercise' }] },
  ] });
  assert.deepEqual(pages.map(page => page.position), [0, 1]);
  assert.deepEqual(pages.map(page => page.schemaVersion), [1, 1]);
  assert.equal(flattenLessonPages(pages).length, 3);
});

test('first-class page IDs remain stable and duplicates are rejected', () => {
  const id = '0194a7b2-3c6d-7e8f-9a01-23456789abcd';
  const [page] = normalizeLessonPages({ pages: [{ id, title: 'Named page', blocks: [] }] });
  assert.equal(page.id, id);
  assert.throws(() => normalizeLessonPages({ pages: [
    { id, title: 'One', blocks: [] }, { id, title: 'Two', blocks: [] },
  ] }), /unique/);
});

test('invalid page structures and excessive page counts are rejected', () => {
  assert.throws(() => normalizeLessonPages({ pages: [{ title: 'Missing blocks' }] }), /blocks must be a list/);
  assert.throws(() => normalizeLessonPages({ pages: [{ title: 'x'.repeat(181), blocks: [] }] }), /title/);
  assert.throws(() => normalizeLessonPages({ pages: [{ title: 'Future', schemaVersion: 2, blocks: [] }] }), /unsupported schema version/);
  assert.throws(() => normalizeLessonPages({ pages: Array.from({ length: 201 }, () => ({ title: '', blocks: [] })) }), /200 pages/);
});

test('reader prefers first-class pages and adapts unchanged legacy lesson payloads', () => {
  const lesson = { content: [{ id: 'old' }], pages: [{ id: 'p1', title: 'Saved page', blocks: [{ id: 'new' }] }] };
  assert.deepEqual(readerPagesForLesson(lesson)[0].blocks[0], { id: 'new' });
  assert.equal(readerPagesForLesson({ content: [{ id: 'old' }] })[0].id, 'old');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { projectBookForViewer } from './access.js';

const book = {
  id: 'paid-course',
  price: 18,
  owned: false,
  lessons: [{ id: 'lesson-1', title: 'The main idea', text: 'Private lesson', moves: '1. e4', note: 'Secret plan', fen: 'position', content: [{ type: 'exercise' }] }],
  chapterList: [{ id: 'chapter-1', title: 'Opening', lessons: [{ id: 'lesson-1', title: 'The main idea', text: 'Private lesson', moves: '1. e4', note: 'Secret plan', fen: 'position', content: [{ type: 'exercise' }] }] }],
};

test('catalogue viewers can see paid course structure but not lesson content', () => {
  const result = projectBookForViewer(book);
  assert.equal(result.lessons[0].title, 'The main idea');
  assert.equal(result.lessons[0].text, '');
  assert.equal(result.lessons[0].moves, '');
  assert.equal(result.lessons[0].fen, null);
  assert.deepEqual(result.lessons[0].content, []);
  assert.deepEqual(result.chapterList[0].lessons[0].content, []);
  assert.equal(book.lessons[0].content.length, 1);
});

test('owners, administrators, and enrolled free-course students retain lesson content', () => {
  assert.equal(projectBookForViewer({ ...book, owned: true }).lessons[0].text, 'Private lesson');
  assert.equal(projectBookForViewer(book, { isAdmin: true }).lessons[0].text, 'Private lesson');
  assert.equal(projectBookForViewer({ ...book, price: 0 }).lessons[0].text, '');
  assert.equal(projectBookForViewer({ ...book, price: 0, owned: true }).lessons[0].text, 'Private lesson');
});

test('course creators can preview and manage only their own course projection', () => {
  const creator = projectBookForViewer(book, { isCreator: true });
  const stranger = projectBookForViewer(book, { isCreator: false });
  assert.equal(creator.canManage, true);
  assert.equal(creator.lessons[0].content.length, 1);
  assert.equal(stranger.canManage, false);
  assert.equal(stranger.lessons[0].content.length, 0);
});

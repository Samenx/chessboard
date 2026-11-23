import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createExerciseState,
  playExerciseMove,
  resetExercise,
  stepBackExercise,
  validateExercise,
} from './exercise.js';

function node(id, san, children = [], extra = {}) {
  return { id, san, children, ...extra };
}

function exercise(overrides = {}) {
  return {
    version: 1,
    startingFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    userColor: 'w',
    incorrectFeedback: 'Try another move.',
    revealCorrectMove: false,
    root: {
      id: 'root',
      children: [
        node('e4', 'e4', [node('e5', 'e5', [node('nf3', 'Nf3', [], { explanation: 'Develop the knight.' })], { automatic: true })], { explanation: 'Claim the center.' }),
        node('d4', 'd4', [node('d5', 'd5', [node('c4', 'c4', [], { explanation: 'Offer the queen pawn.' })], { automatic: true })], { explanation: 'Open a second central route.' }),
      ],
    },
    ...overrides,
  };
}

test('accepts multiple correct branches and reveals only the selected branch explanation', () => {
  const data = exercise();
  let state = createExerciseState(data);
  const first = playExerciseMove(data, state, 'd4');
  assert.equal(first.accepted, true);
  assert.deepEqual(first.explanations, ['Open a second central route.']);
  state = first.state;
  const next = playExerciseMove(data, state, 'c4');
  assert.equal(next.accepted, true);
  assert.deepEqual(next.explanations, ['Offer the queen pawn.']);
  assert.match(next.state.fen, /^rnbqkbnr\/ppp1pppp\/8\/3p4\/2PP4/);
});

test('a legal move outside the accepted tree leaves the position unchanged and hides the answer', () => {
  const data = exercise();
  const initial = createExerciseState(data);
  const result = playExerciseMove(data, initial, 'Nf3');
  assert.equal(result.accepted, false);
  assert.equal(result.state.fen, initial.fen);
  assert.equal(result.expectedMove, undefined);
  assert.equal(result.state.feedback, 'Try another move.');
  assert.deepEqual(result.explanations, []);
});

test('an authored incorrect branch shows its feedback without changing the board', () => {
  const data = exercise({ root: { id: 'root', children: [
    node('e4', 'e4'),
    node('h3', 'h3', [], { accepted: false, feedback: 'Keep the king-side pawns together.' }),
  ] } });
  const initial = createExerciseState(data);
  const result = playExerciseMove(data, initial, 'h3');
  assert.equal(result.accepted, false);
  assert.equal(result.state.fen, initial.fen);
  assert.equal(result.error, 'Keep the king-side pawns together.');
});

test('reveals an accepted move only when the author enables that option', () => {
  const data = exercise({ revealCorrectMove: true });
  const result = playExerciseMove(data, createExerciseState(data), 'Nf3');
  assert.equal(result.expectedMove, 'e4');
});

test('automatically applies a forced opponent reply and backs up to the previous student decision', () => {
  const data = exercise();
  const first = playExerciseMove(data, createExerciseState(data), 'e4');
  assert.equal(first.accepted, true);
  assert.equal(first.state.history.length, 2);
  assert.equal(first.state.history[1].san, 'e5');
  const previous = stepBackExercise(first.state, data);
  assert.equal(previous.nodeId, 'root');
  assert.equal(previous.fen, data.startingFen);
  assert.equal(previous.history.length, 0);
  assert.equal(resetExercise(data).fen, data.startingFen);
});

test('rejects illegal SAN, duplicate branches, wrong actors, and invalid FEN', () => {
  assert.throws(() => validateExercise(exercise({ root: { id: 'root', children: [node('bad', 'e5')] } })), /not a legal SAN/);
  assert.throws(() => validateExercise(exercise({ root: { id: 'root', children: [node('one', 'e4'), node('two', 'e4')] } })), /appears more than once/);
  assert.throws(() => validateExercise(exercise({ root: { id: 'root', children: [node('auto', 'e4', [], { automatic: true })] } })), /student move/);
  assert.throws(() => validateExercise(exercise({ startingFen: 'not a fen' })), /valid FEN/);
});

test('uses chess.js castling, en passant, and promotion legality', () => {
  const cases = [
    { startingFen: 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', san: 'O-O' },
    { startingFen: '4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1', san: 'exd6' },
    { startingFen: '7k/P7/8/8/8/8/8/7K w - - 0 1', san: 'a8=Q+' },
  ];
  for (const [index, item] of cases.entries()) {
    const data = exercise({
      startingFen: item.startingFen,
      root: { id: 'root', children: [node(`special-${index}`, item.san)] },
    });
    assert.equal(playExerciseMove(data, createExerciseState(data), item.san).accepted, true);
  }
});

test('recognizes a terminal checkmate at the end of an authored line', () => {
  const data = exercise({
    root: { id: 'root', children: [
      node('f3', 'f3', [node('e5', 'e5', [node('g4', 'g4', [node('d8h4', 'Qh4#', [], { automatic: true })])], { automatic: true })]),
    ] },
  });
  const white = playExerciseMove(data, createExerciseState(data), 'f3');
  const g4 = playExerciseMove(data, white.state, 'g4');
  assert.equal(g4.accepted, true);
  assert.equal(g4.state.complete, true);
  assert.equal(g4.state.history.at(-1).san, 'Qh4#');
});

test('rejects an already stalemated starting position', () => {
  assert.throws(() => validateExercise(exercise({
    startingFen: '7k/5Q2/6K1/8/8/8/8/8 b - - 0 1',
    userColor: 'b',
  })), /finished game/);
});

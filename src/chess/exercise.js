import { Chess } from 'chess.js';

export const EXERCISE_VERSION = 1;
export const DEFAULT_EXERCISE_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const MAX_NODES = 500;
const MAX_DEPTH = 100;
const MAX_EXPLANATION_LENGTH = 10_000;

export class ExerciseValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ExerciseValidationError';
  }
}

export function createEmptyExercise(startingFen = DEFAULT_EXERCISE_FEN, userColor = 'w') {
  return {
    version: EXERCISE_VERSION,
    startingFen,
    userColor,
    incorrectFeedback: 'That move does not fit this position. Try again.',
    revealCorrectMove: false,
    root: { id: 'root', children: [] },
  };
}

function assertText(value, label, max = MAX_EXPLANATION_LENGTH) {
  if (typeof value !== 'string' || value.length > max) {
    throw new ExerciseValidationError(`${label} must be text no longer than ${max} characters.`);
  }
}

function positionFrom(fen) {
  try {
    return new Chess(fen);
  } catch {
    throw new ExerciseValidationError('The exercise starting position is not a valid FEN.');
  }
}

function applySan(game, san) {
  try {
    return game.move(san, { strict: true });
  } catch {
    return null;
  }
}

/** Validate a versioned branching tree and every move against its full parent position. */
export function validateExercise(exercise) {
  if (!exercise || typeof exercise !== 'object' || Array.isArray(exercise)) {
    throw new ExerciseValidationError('An exercise must be an object.');
  }
  if (exercise.version !== EXERCISE_VERSION) {
    throw new ExerciseValidationError(`Exercise version must be ${EXERCISE_VERSION}.`);
  }
  const startingFen = exercise.startingFen || DEFAULT_EXERCISE_FEN;
  assertText(startingFen, 'Starting FEN', 200);
  if (!['w', 'b'].includes(exercise.userColor)) {
    throw new ExerciseValidationError('Choose which color the student plays.');
  }
  assertText(exercise.incorrectFeedback ?? '', 'Incorrect-move feedback');
  if (exercise.revealCorrectMove !== undefined && typeof exercise.revealCorrectMove !== 'boolean') {
    throw new ExerciseValidationError('Reveal-correct-move must be true or false.');
  }
  const game = positionFrom(startingFen);
  if (game.turn() !== exercise.userColor) {
    throw new ExerciseValidationError('The student color must be the side to move in the starting position.');
  }
  if (!exercise.root || typeof exercise.root !== 'object' || !Array.isArray(exercise.root.children)) {
    throw new ExerciseValidationError('The exercise needs a root position with a list of accepted moves.');
  }

  const ids = new Set(['root']);
  let nodeCount = 0;
  function visit(children, parentGame, depth) {
    if (depth > MAX_DEPTH) throw new ExerciseValidationError(`Exercise lines cannot exceed ${MAX_DEPTH} plies.`);
    if (!Array.isArray(children)) throw new ExerciseValidationError('Each move must have a list of continuation moves.');
    const siblingSans = new Set();
    let automaticCount = 0;
    for (const node of children) {
      nodeCount += 1;
      if (nodeCount > MAX_NODES) throw new ExerciseValidationError(`Exercises cannot exceed ${MAX_NODES} move nodes.`);
      if (!node || typeof node !== 'object' || Array.isArray(node)) throw new ExerciseValidationError('Every move node must be an object.');
      if (typeof node.id !== 'string' || !node.id.trim() || node.id.length > 100 || ids.has(node.id)) {
        throw new ExerciseValidationError('Every move node needs a unique id of at most 100 characters.');
      }
      ids.add(node.id);
      if (typeof node.san !== 'string' || !node.san.trim() || node.san.length > 16) {
        throw new ExerciseValidationError('Every move node needs a SAN move.');
      }
      const nextGame = new Chess(parentGame.fen());
      const played = applySan(nextGame, node.san);
      if (!played) throw new ExerciseValidationError(`“${node.san}” is not a legal SAN move in its parent position.`);
      if (siblingSans.has(played.san)) throw new ExerciseValidationError(`Move ${played.san} appears more than once at the same position.`);
      siblingSans.add(played.san);
      if (node.automatic !== undefined && typeof node.automatic !== 'boolean') {
        throw new ExerciseValidationError('Automatic moves must be marked true or false.');
      }
      if (node.accepted !== undefined && typeof node.accepted !== 'boolean') {
        throw new ExerciseValidationError('Accepted moves must be marked true or false.');
      }
      if (node.accepted === false && node.children?.length) {
        throw new ExerciseValidationError('An incorrect-move response cannot have continuations.');
      }
      const automatic = node.automatic === true;
      if (automatic !== (played.color !== exercise.userColor)) {
        throw new ExerciseValidationError(`Mark ${played.san} as ${played.color === exercise.userColor ? 'a student move' : 'an automatic reply'}.`);
      }
      if (automatic) automaticCount += 1;
      assertText(node.explanation ?? '', 'Move explanation');
      assertText(node.feedback ?? '', 'Move feedback');
      if (node.terminal !== undefined && typeof node.terminal !== 'boolean') {
        throw new ExerciseValidationError('Terminal must be true or false.');
      }
      if (node.terminal && Array.isArray(node.children) && node.children.length) {
        throw new ExerciseValidationError('A terminal move cannot have continuations.');
      }
      if (nextGame.isGameOver() && node.children?.length) {
        throw new ExerciseValidationError('A finished chess position cannot have continuation moves.');
      }
      visit(node.children ?? [], nextGame, depth + 1);
    }
    if (automaticCount && (automaticCount !== 1 || children.length !== 1)) {
      throw new ExerciseValidationError('An automatic opponent reply must be the only continuation at that position.');
    }
  }

  if (game.isGameOver()) throw new ExerciseValidationError('The exercise cannot start from a finished game.');
  visit(exercise.root.children, game, 1);
  return exercise;
}

export function createExerciseState(exercise) {
  validateExercise(exercise);
  return {
    nodeId: 'root',
    fen: exercise.startingFen || DEFAULT_EXERCISE_FEN,
    history: [],
    feedback: '',
    complete: exercise.root.children.length === 0,
  };
}

function childrenAt(exercise, nodeId) {
  if (nodeId === 'root') return exercise.root.children;
  const pending = [...exercise.root.children];
  while (pending.length) {
    const node = pending.pop();
    if (node.id === nodeId) return node.children ?? [];
    pending.push(...(node.children ?? []));
  }
  return [];
}

/** Apply one student move. Incorrect moves leave the actual exercise position unchanged. */
export function playExerciseMove(exercise, state, moveInput) {
  validateExercise(exercise);
  if (state.complete) return { state, accepted: false, explanations: [], error: 'This exercise is already complete.' };
  const game = positionFrom(state.fen);
  if (game.turn() !== exercise.userColor) {
    return { state, accepted: false, explanations: [], error: 'Wait for the position to return to your move.' };
  }

  let played = null;
  try {
    const candidate = new Chess(state.fen);
    played = candidate.move(moveInput, { strict: true });
  } catch {
    played = null;
  }
  const candidates = childrenAt(exercise, state.nodeId);
  const selected = played && candidates.find(node => node.san === played.san);
  if (!selected || selected.accepted === false) {
    const message = selected?.feedback || exercise.incorrectFeedback || 'That move is not part of this line. Try again.';
    const expectedMove = exercise.revealCorrectMove ? candidates.find(node => node.accepted !== false && !node.automatic)?.san : undefined;
    return {
      state: { ...state, feedback: message, expectedMove: expectedMove || '' }, accepted: false, explanations: [], error: message,
      ...(expectedMove ? { expectedMove } : {}),
    };
  }

  const history = [...state.history];
  let current = selected;
  let currentGame = new Chess(state.fen);
  const explanations = [];
  function record(node, san, beforeFen, afterGame) {
    const entry = { nodeId: node.id, san, fenBefore: beforeFen, fenAfter: afterGame.fen(), explanation: node.explanation || '' };
    history.push(entry);
    if (entry.explanation) explanations.push(entry.explanation);
  }
  const initialFen = currentGame.fen();
  const acceptedMove = applySan(currentGame, selected.san);
  record(selected, acceptedMove.san, initialFen, currentGame);

  while (!currentGame.isGameOver()) {
    const continuations = current.children ?? [];
    if (!continuations.length || currentGame.turn() === exercise.userColor) break;
    const reply = continuations[0];
    if (!reply.automatic) break;
    const beforeFen = currentGame.fen();
    const replyMove = applySan(currentGame, reply.san);
    if (!replyMove) break;
    record(reply, replyMove.san, beforeFen, currentGame);
    current = reply;
  }

  const nextState = {
    nodeId: current.id,
    fen: currentGame.fen(),
    history,
    feedback: '',
    expectedMove: '',
    complete: currentGame.isGameOver() || !(current.children ?? []).length,
  };
  return { state: nextState, accepted: true, explanations, error: '' };
}

export function stepBackExercise(state, exercise) {
  validateExercise(exercise);
  if (!state.history.length) return createExerciseState(exercise);
  const history = state.history.slice(0, -1);
  let previous = history.at(-1);
  let fen = previous?.fenAfter || exercise.startingFen || DEFAULT_EXERCISE_FEN;
  while (history.length && positionFrom(fen).turn() !== exercise.userColor) {
    history.pop();
    previous = history.at(-1);
    fen = previous?.fenAfter || exercise.startingFen || DEFAULT_EXERCISE_FEN;
  }
  return {
    nodeId: previous?.nodeId || 'root',
    fen,
    history,
    feedback: '',
    expectedMove: '',
    complete: false,
  };
}

export function resetExercise(exercise) {
  return createExerciseState(exercise);
}

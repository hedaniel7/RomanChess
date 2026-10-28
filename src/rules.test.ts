import { test } from 'node:test';
import assert from 'node:assert/strict';
import { START, fromFen, legalMoves, makeMove, san, square, status, type Position } from './rules.ts';

// Perft zählt alle Zugfolgen bis zu einer Tiefe. Die Sollzahlen sind Referenzwerte
// (chessprogramming.org, „Perft Results“). Fehlt eine Regel oder ist sie falsch, weicht die Zahl ab.
function perft(pos: Position, depth: number): number {
  if (depth === 0) return 1;
  let count = 0;
  for (const move of legalMoves(pos)) count += perft(makeMove(pos, move), depth - 1);
  return count;
}

function perftUpTo(fen: string, depth: number): number[] {
  const pos = fromFen(fen);
  return Array.from({ length: depth }, (_, i) => perft(pos, i + 1));
}

test('Perft Startstellung: 20, 400, 8902', () => {
  assert.deepEqual(perftUpTo(START, 3), [20, 400, 8902]);
});

// Die Startstellung enthält bis Tiefe 3 weder Rochade noch en passant noch Umwandlung.
// Diese drei Stellungen prüfen genau das.
test('Perft „Kiwipete“ (Rochaden, en passant, Fesselungen)', () => {
  const fen = 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1';
  assert.deepEqual(perftUpTo(fen, 3), [48, 2039, 97862]);
});

test('Perft Stellung 3 (en passant, das den König freilegen würde)', () => {
  assert.deepEqual(perftUpTo('8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1', 4), [14, 191, 2812, 43238]);
});

test('Perft Stellung 4 (Umwandlungen)', () => {
  const fen = 'r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1';
  assert.deepEqual(perftUpTo(fen, 3), [6, 264, 9467]);
});

function findMove(pos: Position, from: string, to: string) {
  return legalMoves(pos).find((m) => m.from === square(from) && m.to === square(to));
}

test('Rochade: Turm zieht mit, Rechte verfallen', () => {
  const pos = fromFen('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
  const next = makeMove(pos, findMove(pos, 'e1', 'g1')!);
  assert.equal(next.board[square('g1')], 'K');
  assert.equal(next.board[square('f1')], 'R');
  assert.equal(next.board[square('h1')], null);
  assert.equal(next.castling, 'kq');
});

test('Rochade: nicht durch ein angegriffenes Feld', () => {
  // Der schwarze Turm auf f2 greift f1 an: kurze Rochade verboten, lange erlaubt.
  const pos = fromFen('4k3/8/8/8/8/8/5r2/R3K2R w KQ - 0 1');
  assert.equal(findMove(pos, 'e1', 'g1'), undefined);
  assert.notEqual(findMove(pos, 'e1', 'c1'), undefined);
});

test('En passant: der geschlagene Bauer verschwindet', () => {
  // Schwarz hat gerade f7-f5 gezogen.
  const pos = fromFen('rnbqkbnr/ppp1p1pp/8/3pPp2/8/8/PPPP1PPP/RNBQKBNR w KQkq f6 0 3');
  const next = makeMove(pos, findMove(pos, 'e5', 'f6')!);
  assert.equal(next.board[square('f6')], 'P');
  assert.equal(next.board[square('f5')], null);
});

test('Umwandlung: vier Möglichkeiten, Dame steht danach auf a8', () => {
  const pos = fromFen('8/P7/8/8/8/8/8/k6K w - - 0 1');
  const promotions = legalMoves(pos).filter((m) => m.from === square('a7'));
  assert.deepEqual(promotions.map((m) => m.promotion), ['q', 'r', 'b', 'n']);
  assert.equal(makeMove(pos, promotions[0]).board[square('a8')], 'Q');
});

test('Status: Schach, Matt, Patt', () => {
  assert.equal(status(fromFen(START)), 'play');
  // 1. e4 f6 2. Dh5+
  assert.equal(status(fromFen('rnbqkbnr/ppppp1pp/5p2/7Q/4P3/8/PPPP1PPP/RNB1KBNR b KQkq - 1 2')), 'check');
  // Narrenmatt: 1. f3 e5 2. g4 Dh4#
  assert.equal(status(fromFen('rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3')), 'checkmate');
  // Schwarz hat keinen Zug und steht nicht im Schach.
  assert.equal(status(fromFen('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1')), 'stalemate');
});

// SAN: die Notation in der Zugliste. Aus einer Stellung den Zug von `from` nach `to` aufschreiben.
function sanOf(fen: string, from: string, to: string): string {
  const pos = fromFen(fen);
  return san(pos, findMove(pos, from, to)!);
}

test('SAN: Partieanfang 1. e4 Nc6 2. Nf3 d5', () => {
  let pos = fromFen(START);
  const written: string[] = [];
  for (const [from, to] of [['e2', 'e4'], ['b8', 'c6'], ['g1', 'f3'], ['d7', 'd5']]) {
    const move = findMove(pos, from, to)!;
    written.push(san(pos, move));
    pos = makeMove(pos, move);
  }
  assert.deepEqual(written, ['e4', 'Nc6', 'Nf3', 'd5']);
});

test('SAN: Schlagen exd5', () => {
  assert.equal(sanOf('rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2', 'e4', 'd5'), 'exd5');
});

test('SAN: Schach + und Matt #', () => {
  assert.equal(sanOf('rnbqkbnr/ppppp1pp/5p2/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2', 'd1', 'h5'), 'Qh5+');
  assert.equal(sanOf('rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 2', 'd8', 'h4'), 'Qh4#');
});

test('SAN: Rochade O-O und O-O-O', () => {
  const fen = 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1';
  assert.equal(sanOf(fen, 'e1', 'g1'), 'O-O');
  assert.equal(sanOf(fen, 'e1', 'c1'), 'O-O-O');
});

test('SAN: Umwandlung e8=Q', () => {
  assert.equal(sanOf('8/4P3/8/8/8/8/8/k6K w - - 0 1', 'e7', 'e8'), 'e8=Q');
});

test('SAN: Mehrdeutigkeit Nbd2 und R1a3', () => {
  // Beide Springer (b1, f3) können nach d2, beide Türme (a1, a5) nach a3.
  assert.equal(sanOf('4k3/8/8/8/8/5N2/8/1N2K3 w - - 0 1', 'b1', 'd2'), 'Nbd2');
  assert.equal(sanOf('4k3/8/8/R7/8/8/8/R3K3 w - - 0 1', 'a1', 'a3'), 'R1a3');
});

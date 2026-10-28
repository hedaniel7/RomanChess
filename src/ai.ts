// Computergegner: Minimax mit Alpha-Beta-Schnitt, dazu eine kurze Ruhesuche über Schlagzüge.

import { colorOf, fileOf, inCheck, legalMoves, makeMove, rankOf, type Move, type Piece, type Position } from './rules.ts';

const VALUE: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
const MATE = 100000;

const type = (piece: Piece) => piece.toLowerCase();

// Bester Zug für die Seite am Zug, `depth` Halbzüge tief gesucht.
export function bestMove(pos: Position, depth: number): Move {
  let best: Move | undefined;
  let bestScore = -Infinity;
  for (const move of sorted(pos, legalMoves(pos))) {
    const score = -search(makeMove(pos, move), depth - 1, -Infinity, -bestScore);
    if (score > bestScore) {
      bestScore = score;
      best = move;
    }
  }
  if (!best) throw new Error('Kein legaler Zug: Das Spiel ist schon zu Ende.');
  return best;
}

// Minimax in der Negamax-Form: Jede Seite rechnet aus eigener Sicht, der Wert für den Gegner
// ist das Negative. alpha = das, was wir sicher haben; beta = das, was der Gegner höchstens zulässt.
// Ist ein Zug besser als beta, wird der Gegner diese Stellung vermeiden: Rest überspringen.
function search(pos: Position, depth: number, alpha: number, beta: number): number {
  if (depth === 0) return quiesce(pos, alpha, beta);
  const moves = legalMoves(pos);
  if (moves.length === 0) return inCheck(pos) ? -MATE - depth : 0; // matt (ein frühes Matt zählt mehr) oder patt
  for (const move of sorted(pos, moves)) {
    const score = -search(makeMove(pos, move), depth - 1, -beta, -alpha);
    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }
  return alpha;
}

// Ruhesuche: Am Ende der Suche werden Schlagzüge noch zu Ende gerechnet.
// Sonst „gewinnt“ die KI im letzten Halbzug eine Figur und übersieht das Zurückschlagen.
function quiesce(pos: Position, alpha: number, beta: number): number {
  const standPat = evaluate(pos); // Wert, wenn man nicht weiter schlägt
  if (standPat >= beta) return beta;
  if (standPat > alpha) alpha = standPat;
  const captures = legalMoves(pos).filter((m) => m.captured !== undefined);
  for (const move of sorted(pos, captures)) {
    const score = -quiesce(makeMove(pos, move), -beta, -alpha);
    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }
  return alpha;
}

// Schläge zuerst, und zwar wertvolles Opfer mit billigem Angreifer zuerst.
// Gute Züge früh geprüft lassen Alpha-Beta mehr überspringen.
function sorted(pos: Position, moves: Move[]): Move[] {
  const gain = (m: Move) =>
    m.captured === undefined ? 0 : 10 * VALUE[type(pos.board[m.captured]!)] - VALUE[type(pos.board[m.from]!)];
  return moves.sort((a, b) => gain(b) - gain(a));
}

// Bewertung aus Sicht der Seite am Zug: Material plus kleine Boni für gute Felder.
function evaluate(pos: Position): number {
  let score = 0;
  pos.board.forEach((piece, sq) => {
    if (!piece) return;
    const value = VALUE[type(piece)] + bonus(piece, sq);
    score += colorOf(piece) === pos.turn ? value : -value;
  });
  return score;
}

// Springer und Läufer stehen in der Mitte besser, Bauern weiter vorne und in der Mitte.
function bonus(piece: Piece, sq: number): number {
  const file = fileOf(sq);
  const rank = colorOf(piece) === 'w' ? rankOf(sq) : 7 - rankOf(sq); // Reihe aus Sicht der eigenen Seite
  const centrality = 3.5 - Math.max(Math.abs(file - 3.5), Math.abs(rank - 3.5)); // 0 am Rand, 3 in der Mitte
  switch (type(piece)) {
    case 'n':
    case 'b':
      return 10 * centrality;
    case 'p':
      return 4 * rank + 4 * centrality;
    default:
      return 0;
  }
}

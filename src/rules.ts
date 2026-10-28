// Schachregeln: Stellung, legale Züge, Schach, Matt, Patt. Reine Logik ohne Grafik.

export type Color = 'w' | 'b';

// Figuren wie in der FEN-Notation: Großbuchstaben = Weiß (Rom), Kleinbuchstaben = Schwarz (Germanen).
// p = Bauer, n = Springer, b = Läufer, r = Turm, q = Dame, k = König.
export type Piece = 'P' | 'N' | 'B' | 'R' | 'Q' | 'K' | 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

export interface Position {
  board: (Piece | null)[]; // 64 Felder: a1 = 0, b1 = 1, …, h1 = 7, a2 = 8, …, h8 = 63
  turn: Color;
  castling: string; // noch erlaubte Rochaden, z. B. 'KQkq' oder ''
  enPassant: number | null; // Feld hinter einem Bauern, der gerade zwei Schritte gezogen ist
}

export interface Move {
  from: number;
  to: number;
  captured?: number; // Feld der geschlagenen Figur; bei en passant nicht gleich `to`
  promotion?: 'q' | 'r' | 'b' | 'n';
  rookFrom?: number; // bei der Rochade zieht der Turm mit
  rookTo?: number;
}

export type Status = 'play' | 'check' | 'checkmate' | 'stalemate';

export const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export const colorOf = (piece: Piece): Color => (piece === piece.toUpperCase() ? 'w' : 'b');
export const fileOf = (sq: number) => sq % 8; // Linie: 0 = a … 7 = h
export const rankOf = (sq: number) => Math.floor(sq / 8); // Reihe: 0 = 1 … 7 = 8
const opponent = (color: Color): Color => (color === 'w' ? 'b' : 'w');

// Feldnummer aus einem Namen wie 'e4'
export function square(name: string): number {
  return 'abcdefgh'.indexOf(name[0]) + (Number(name[1]) - 1) * 8;
}

// Name eines Feldes, z. B. 'e4'
function squareName(sq: number): string {
  return 'abcdefgh'[fileOf(sq)] + (rankOf(sq) + 1);
}

// Feldnummer aus Linie und Reihe, oder -1 außerhalb des Bretts.
// board[-1] ist undefined, ein Feld außerhalb ist also nie besetzt.
function at(file: number, rank: number): number {
  return file >= 0 && file < 8 && rank >= 0 && rank < 8 ? rank * 8 + file : -1;
}

// Liest eine Stellung in FEN-Notation. Halbzug- und Zugzähler werden nicht gebraucht.
export function fromFen(fen: string): Position {
  const [placement, turn, castling, enPassant] = fen.split(' ');
  const board: (Piece | null)[] = Array(64).fill(null);
  placement.split('/').forEach((row, i) => {
    const rank = 7 - i; // FEN beginnt mit Reihe 8
    let file = 0;
    for (const ch of row) {
      if (ch >= '1' && ch <= '8') file += Number(ch);
      else board[at(file++, rank)] = ch as Piece;
    }
  });
  return {
    board,
    turn: turn as Color,
    castling: castling === '-' ? '' : castling,
    enPassant: enPassant === '-' ? null : square(enPassant),
  };
}

const KNIGHT_STEPS = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
const KING_STEPS = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
const ROOK_DIRECTIONS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const BISHOP_DIRECTIONS = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

// Alle Züge, nach denen der eigene König nicht im Schach steht.
export function legalMoves(pos: Position): Move[] {
  return candidateMoves(pos).filter((move) => {
    const next = makeMove(pos, move);
    return !isAttacked(next.board, kingSquare(next.board, pos.turn), next.turn);
  });
}

export function inCheck(pos: Position): boolean {
  return isAttacked(pos.board, kingSquare(pos.board, pos.turn), opponent(pos.turn));
}

export function status(pos: Position): Status {
  const canMove = legalMoves(pos).length > 0;
  if (inCheck(pos)) return canMove ? 'check' : 'checkmate';
  return canMove ? 'play' : 'stalemate';
}

// Ein Zug in internationaler Notation (SAN): e4, Nf3, exd5, O-O, e8=Q, Nbd2, Qh5+, Qh4#.
// `pos` ist die Stellung vor dem Zug.
export function san(pos: Position, move: Move): string {
  const type = pos.board[move.from]!.toLowerCase();
  const capture = move.captured !== undefined ? 'x' : '';
  let text: string;
  if (move.rookFrom !== undefined) {
    text = move.to > move.from ? 'O-O' : 'O-O-O';
  } else if (type === 'p') {
    // Bauer: nur das Zielfeld; schlägt er, steht seine Linie davor
    text = (capture ? squareName(move.from)[0] + 'x' : '') + squareName(move.to);
    if (move.promotion) text += '=' + move.promotion.toUpperCase();
  } else {
    text = type.toUpperCase() + disambiguation(pos, move) + capture + squareName(move.to);
  }
  const after = status(makeMove(pos, move));
  if (after === 'checkmate') return text + '#';
  if (after === 'check') return text + '+';
  return text;
}

// Können zwei gleiche Figuren auf dasselbe Feld, steht die Linie der ziehenden davor (Nbd2);
// reicht die nicht, die Reihe (R1a3); sonst beides.
function disambiguation(pos: Position, move: Move): string {
  const rivals = legalMoves(pos).filter(
    (m) => m.to === move.to && m.from !== move.from && pos.board[m.from] === pos.board[move.from],
  );
  if (rivals.length === 0) return '';
  const [file, rank] = squareName(move.from);
  if (rivals.every((m) => fileOf(m.from) !== fileOf(move.from))) return file;
  if (rivals.every((m) => rankOf(m.from) !== rankOf(move.from))) return rank;
  return file + rank;
}

// Führt einen Zug aus und gibt die neue Stellung zurück. Die alte bleibt unverändert.
export function makeMove(pos: Position, move: Move): Position {
  const board = pos.board.slice();
  const piece = board[move.from]!;
  if (move.captured !== undefined) board[move.captured] = null;
  board[move.from] = null;
  board[move.to] = move.promotion ? promoted(move.promotion, pos.turn) : piece;
  if (move.rookFrom !== undefined && move.rookTo !== undefined) {
    board[move.rookTo] = board[move.rookFrom];
    board[move.rookFrom] = null;
  }
  const doublePawnStep = piece.toLowerCase() === 'p' && Math.abs(move.to - move.from) === 16;
  return {
    board,
    turn: opponent(pos.turn),
    castling: remainingCastling(pos.castling, move),
    enPassant: doublePawnStep ? (move.from + move.to) / 2 : null,
  };
}

function promoted(type: 'q' | 'r' | 'b' | 'n', color: Color): Piece {
  return (color === 'w' ? type.toUpperCase() : type) as Piece;
}

// Rochaderechte verfallen, sobald König oder Turm ihr Startfeld verlassen
// oder der Turm dort geschlagen wird.
const CASTLING_LOST_ON: Record<number, string> = { 4: 'KQ', 0: 'Q', 7: 'K', 60: 'kq', 56: 'q', 63: 'k' };

function remainingCastling(castling: string, move: Move): string {
  for (const sq of [move.from, move.to]) {
    for (const right of CASTLING_LOST_ON[sq] ?? '') castling = castling.replace(right, '');
  }
  return castling;
}

function kingSquare(board: (Piece | null)[], color: Color): number {
  return board.indexOf(color === 'w' ? 'K' : 'k');
}

// Steht `sq` unter Angriff einer Figur der Farbe `by`?
// Dafür wird vom Feld aus gesucht: Wo müsste ein Angreifer stehen?
function isAttacked(board: (Piece | null)[], sq: number, by: Color): boolean {
  const file = fileOf(sq);
  const rank = rankOf(sq);
  const [pawn, knight, bishop, rook, queen, king] = by === 'w' ? 'PNBRQK' : 'pnbrqk';

  // Ein weißer Bauer schlägt schräg nach oben, steht also eine Reihe tiefer.
  const pawnRank = by === 'w' ? rank - 1 : rank + 1;
  if (board[at(file - 1, pawnRank)] === pawn || board[at(file + 1, pawnRank)] === pawn) return true;

  for (const [df, dr] of KNIGHT_STEPS) if (board[at(file + df, rank + dr)] === knight) return true;
  for (const [df, dr] of KING_STEPS) if (board[at(file + df, rank + dr)] === king) return true;

  return (
    firstPieceInDirections(board, sq, ROOK_DIRECTIONS, rook, queen) ||
    firstPieceInDirections(board, sq, BISHOP_DIRECTIONS, bishop, queen)
  );
}

// Geht von `sq` in jede Richtung bis zur ersten Figur. Ist es `a` oder `b`?
function firstPieceInDirections(
  board: (Piece | null)[], sq: number, directions: number[][], a: string, b: string,
): boolean {
  for (const [df, dr] of directions) {
    for (let i = 1; ; i++) {
      const target = at(fileOf(sq) + df * i, rankOf(sq) + dr * i);
      if (target < 0) break;
      const piece = board[target];
      if (piece) {
        if (piece === a || piece === b) return true;
        break;
      }
    }
  }
  return false;
}

// Alle Züge nach den Gangarten der Figuren. Ob der eigene König danach
// im Schach steht, prüft erst legalMoves.
function candidateMoves(pos: Position): Move[] {
  const moves: Move[] = [];
  for (let from = 0; from < 64; from++) {
    const piece = pos.board[from];
    if (!piece || colorOf(piece) !== pos.turn) continue;
    switch (piece.toLowerCase()) {
      case 'p': addPawnMoves(pos, from, moves); break;
      case 'n': addSteps(pos, from, KNIGHT_STEPS, moves); break;
      case 'b': addSlides(pos, from, BISHOP_DIRECTIONS, moves); break;
      case 'r': addSlides(pos, from, ROOK_DIRECTIONS, moves); break;
      case 'q': addSlides(pos, from, [...ROOK_DIRECTIONS, ...BISHOP_DIRECTIONS], moves); break;
      case 'k': addSteps(pos, from, KING_STEPS, moves); addCastling(pos, from, moves); break;
    }
  }
  return moves;
}

// Springer und König: ein Schritt pro Richtung.
function addSteps(pos: Position, from: number, steps: number[][], moves: Move[]) {
  for (const [df, dr] of steps) {
    const to = at(fileOf(from) + df, rankOf(from) + dr);
    if (to < 0) continue;
    const target = pos.board[to];
    if (!target) moves.push({ from, to });
    else if (colorOf(target) !== pos.turn) moves.push({ from, to, captured: to });
  }
}

// Läufer, Turm, Dame: gleiten bis zur ersten Figur; eine gegnerische dürfen sie schlagen.
function addSlides(pos: Position, from: number, directions: number[][], moves: Move[]) {
  for (const [df, dr] of directions) {
    for (let i = 1; ; i++) {
      const to = at(fileOf(from) + df * i, rankOf(from) + dr * i);
      if (to < 0) break;
      const target = pos.board[to];
      if (!target) {
        moves.push({ from, to });
        continue;
      }
      if (colorOf(target) !== pos.turn) moves.push({ from, to, captured: to });
      break;
    }
  }
}

function addPawnMoves(pos: Position, from: number, moves: Move[]) {
  const forward = pos.turn === 'w' ? 1 : -1;
  const startRank = pos.turn === 'w' ? 1 : 6;
  const file = fileOf(from);
  const rank = rankOf(from);

  // Vorwärts nur auf freie Felder, vom Start aus auch zwei Schritte.
  const one = at(file, rank + forward);
  if (!pos.board[one]) {
    addPawnMove(from, one, undefined, moves);
    const two = at(file, rank + 2 * forward);
    if (rank === startRank && !pos.board[two]) moves.push({ from, to: two });
  }

  // Schlagen schräg nach vorne, auch en passant.
  for (const df of [-1, 1]) {
    const to = at(file + df, rank + forward);
    if (to < 0) continue;
    const target = pos.board[to];
    if (target && colorOf(target) !== pos.turn) addPawnMove(from, to, to, moves);
    else if (to === pos.enPassant) moves.push({ from, to, captured: at(file + df, rank) });
  }
}

// Auf der letzten Reihe wird umgewandelt: vier Züge, einer pro möglicher Figur.
function addPawnMove(from: number, to: number, captured: number | undefined, moves: Move[]) {
  if (rankOf(to) === 0 || rankOf(to) === 7) {
    for (const promotion of ['q', 'r', 'b', 'n'] as const) moves.push({ from, to, captured, promotion });
  } else {
    moves.push({ from, to, captured });
  }
}

// Rochade: König und Turm haben noch nicht gezogen (Recht vorhanden), dazwischen ist frei,
// und der König steht nicht im Schach und läuft nicht durch ein angegriffenes Feld.
function addCastling(pos: Position, from: number, moves: Move[]) {
  const e = pos.turn === 'w' ? square('e1') : square('e8');
  const [kingSide, queenSide] = pos.turn === 'w' ? 'KQ' : 'kq';
  const enemy = opponent(pos.turn);
  const free = (...squares: number[]) => squares.every((sq) => !pos.board[sq]);
  const safe = (...squares: number[]) => squares.every((sq) => !isAttacked(pos.board, sq, enemy));

  if (from !== e || !safe(e)) return;
  if (pos.castling.includes(kingSide) && free(e + 1, e + 2) && safe(e + 1, e + 2)) {
    moves.push({ from, to: e + 2, rookFrom: e + 3, rookTo: e + 1 });
  }
  if (pos.castling.includes(queenSide) && free(e - 1, e - 2, e - 3) && safe(e - 1, e - 2)) {
    moves.push({ from, to: e - 2, rookFrom: e - 4, rookTo: e - 1 });
  }
}

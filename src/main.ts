// Spielablauf: verbindet Regeln, Brett und Leiste.
// Die Stellungen des Spiels liegen in `history`; die letzte ist die aktuelle.

import { START, colorOf, fromFen, legalMoves, makeMove, status, type Move, type Position } from './rules.ts';
import * as board from './board.ts';

const statusText = document.querySelector('#status')!;
const boardElement = document.querySelector<HTMLElement>('#board')!;

let history: Position[] = [];
let selected: number | null = null; // Feld der gewählten Figur

board.init(boardElement);
boardElement.addEventListener('pointerdown', (e) => tap(board.squareAt(e.clientX, e.clientY)));
document.querySelector('#new-game')!.addEventListener('click', newGame);
document.querySelector('#undo')!.addEventListener('click', undo);
newGame();

function current(): Position {
  return history[history.length - 1];
}

function newGame() {
  history = [fromFen(START)];
  refresh();
}

function undo() {
  if (history.length > 1) history.pop();
  refresh();
}

// Erster Tipp wählt eine eigene Figur, zweiter Tipp auf ein markiertes Feld zieht.
function tap(sq: number | null) {
  const pos = current();
  const move = legalMoves(pos).find(
    (m) => m.from === selected && m.to === sq && (!m.promotion || m.promotion === 'q'), // Umwandlung: immer Dame
  );
  if (move) return play(move);

  const piece = sq === null ? null : pos.board[sq];
  selected = piece && colorOf(piece) === pos.turn ? sq : null;
  const targets = legalMoves(pos).filter((m) => m.from === selected).map((m) => m.to);
  board.select(selected, [...new Set(targets)]);
}

function play(move: Move) {
  history.push(makeMove(current(), move));
  refresh();
}

function refresh() {
  selected = null;
  board.select(null, []);
  board.show(current());
  showStatus();
}

function showStatus() {
  const pos = current();
  const side = pos.turn === 'w' ? 'Rom' : 'Germanen';
  const winner = pos.turn === 'w' ? 'Die Germanen siegen' : 'Rom siegt';
  statusText.textContent = {
    play: `${side} am Zug`,
    check: `Schach! ${side} am Zug`,
    checkmate: `Schachmatt. ${winner}.`,
    stalemate: 'Patt. Unentschieden.',
  }[status(pos)];
}

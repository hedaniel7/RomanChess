// Spielablauf: verbindet Regeln, Brett, Computergegner und Leiste.
// Du spielst Rom (Weiß), der Computer die Germanen (Schwarz).
// Die Stellungen des Spiels liegen in `history`; die letzte ist die aktuelle.

import { START, colorOf, fromFen, legalMoves, makeMove, status, type Move, type Position } from './rules.ts';
import { bestMove } from './ai.ts';
import { animateMove } from './animate.ts';
import * as board from './board.ts';

const COMPUTER = 'b';
const DEPTH = 3; // Halbzüge, die der Computer vorausrechnet

const statusText = document.querySelector('#status')!;
const boardElement = document.querySelector<HTMLElement>('#board')!;

let history: Position[] = [];
let selected: number | null = null; // Feld der gewählten Figur
let busy = false; // ein Zug läuft gerade (Animation oder Computer)

board.init(boardElement);
board.onTap(tap);
document.querySelector('#new-game')!.addEventListener('click', newGame);
document.querySelector('#undo')!.addEventListener('click', undo);
document.querySelector('#view-standard')!.addEventListener('click', () => board.showView('standard'));
document.querySelector('#view-bird')!.addEventListener('click', () => board.showView('bird'));
document.querySelector('#view-shield-wall')!.addEventListener('click', () => board.showView('shieldWall'));
newGame();

function current(): Position {
  return history[history.length - 1];
}

function newGame() {
  if (busy) return;
  history = [fromFen(START)];
  refresh();
}

// Nimmt den eigenen letzten Zug zurück, samt der Antwort des Computers.
function undo() {
  if (busy || history.length === 1) return;
  history.pop();
  if (current().turn === COMPUTER) history.pop();
  refresh();
}

// Erster Tipp wählt eine eigene Figur, zweiter Tipp auf ein markiertes Feld zieht.
async function tap(sq: number | null) {
  const pos = current();
  if (busy || pos.turn === COMPUTER) return;
  const move = legalMoves(pos).find(
    (m) => m.from === selected && m.to === sq && (!m.promotion || m.promotion === 'q'), // Umwandlung: immer Dame
  );
  if (move) {
    busy = true;
    await play(move);
    if (!isOver()) await computerTurn();
    busy = false;
    return;
  }
  const piece = sq === null ? null : pos.board[sq];
  selected = piece && colorOf(piece) === pos.turn ? sq : null;
  const targets = legalMoves(pos).filter((m) => m.from === selected).map((m) => m.to);
  board.select(selected, [...new Set(targets)]);
}

async function computerTurn() {
  statusText.textContent = 'Die Germanen überlegen …';
  await nextPaint(); // erst den Status zeigen, dann rechnen (die Suche blockiert kurz)
  await play(bestMove(current(), DEPTH));
}

async function play(move: Move) {
  board.select(null, []);
  await animateMove(current(), move);
  history.push(makeMove(current(), move));
  refresh();
}

function isOver(): boolean {
  const s = status(current());
  return s === 'checkmate' || s === 'stalemate';
}

function refresh() {
  selected = null;
  board.select(null, []);
  board.show(current());
  showStatus();
}

function showStatus() {
  const pos = current();
  const winner = pos.turn === 'w' ? 'Die Germanen siegen' : 'Rom siegt';
  statusText.textContent = {
    play: 'Dein Zug',
    check: 'Schach! Dein Zug',
    checkmate: `Schachmatt. ${winner}.`,
    stalemate: 'Patt. Unentschieden.',
  }[status(pos)];
}

// Wartet, bis der Browser einmal gezeichnet hat.
function nextPaint(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve)));
}

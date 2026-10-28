import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fromFen, square, type Move } from './rules.ts';
import { bestMove } from './ai.ts';

const DEPTH = 3; // wie im Spiel

function fromTo(move: Move): string {
  const name = (sq: number) => 'abcdefgh'[sq % 8] + (Math.floor(sq / 8) + 1);
  return name(move.from) + name(move.to);
}

test('setzt matt in einem Zug (Grundreihe)', () => {
  assert.equal(fromTo(bestMove(fromFen('6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1'), DEPTH)), 'a1a8');
});

test('schlägt eine ungedeckte Dame', () => {
  assert.equal(fromTo(bestMove(fromFen('4k3/8/8/3q4/8/8/8/3RK3 w - - 0 1'), DEPTH)), 'd1d5');
});

test('schlägt keinen gedeckten Bauern mit der Dame', () => {
  // d5 ist von c6 gedeckt: Dxd5 cxd5 kostet die Dame.
  const pos = fromFen('4k3/8/2p5/3p4/8/8/8/3QK3 w - - 0 1');
  assert.notEqual(bestMove(pos, DEPTH).to, square('d5'));
  // Auch mit Tiefe 1, wo das Zurückschlagen hinter dem Suchhorizont liegt: Das fängt die Ruhesuche ab.
  assert.notEqual(bestMove(pos, 1).to, square('d5'));
});

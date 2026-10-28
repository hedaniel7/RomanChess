// Animation eines Zuges, bevor das Brett die neue Stellung zeigt.
// Die Figur gleitet als Ganzes über das Brett, ein Springer springt im Bogen.
// Beim Schlagen: bis vor das Opfer gehen, kurzer Ausfall, das Opfer kippt um und versinkt.

import * as THREE from 'three';
import type { Move, Position } from './rules.ts';
import * as board from './board.ts';

const UP = new THREE.Vector3(0, 1, 0);

export async function animateMove(pos: Position, move: Move) {
  const mover = board.figureAt(move.from)!;
  const hop = pos.board[move.from]!.toLowerCase() === 'n' ? 0.5 : 0;
  const to = board.squareCenter(move.to);

  if (move.captured !== undefined) {
    const victim = board.figureAt(move.captured)!;
    const victimAt = board.squareCenter(move.captured); // bei en passant nicht das Zielfeld
    const direction = victimAt.clone().sub(mover.position).normalize();
    await slide(mover, victimAt.clone().addScaledVector(direction, -0.75), hop);
    await lunge(mover, direction);
    await topple(victim, direction);
    await Promise.all([sink(victim), slide(mover, to)]);
  } else {
    await slide(mover, to, hop);
  }

  if (move.rookFrom !== undefined && move.rookTo !== undefined) {
    await slide(board.figureAt(move.rookFrom)!, board.squareCenter(move.rookTo)); // Rochade
  }
}

function slide(figure: THREE.Object3D, to: THREE.Vector3, hop = 0): Promise<void> {
  const from = figure.position.clone();
  return board.tween(0.25 + 0.08 * from.distanceTo(to), (t) => {
    const e = board.smooth(t);
    figure.position.lerpVectors(from, to, e);
    figure.position.y = hop * Math.sin(Math.PI * e);
  });
}

// Kurzer Ausfall nach vorne und zurück, dabei nach vorne gelehnt.
function lunge(figure: THREE.Object3D, direction: THREE.Vector3): Promise<void> {
  const start = figure.position.clone();
  const rest = figure.quaternion.clone();
  const axis = UP.clone().cross(direction); // kippt die Oberseite in Richtung `direction`
  return board.tween(0.3, (t) => {
    const k = Math.sin(Math.PI * t); // 0 → 1 → 0
    figure.position.copy(start).addScaledVector(direction, 0.25 * k);
    figure.quaternion.setFromAxisAngle(axis, 0.35 * k).multiply(rest);
  });
}

// Umkippen über den Rand des Sockels, immer schneller wie ein Fall.
function topple(figure: THREE.Object3D, direction: THREE.Vector3): Promise<void> {
  const start = figure.position.clone();
  const rest = figure.quaternion.clone();
  const axis = UP.clone().cross(direction);
  const edge = 0.35; // Abstand von der Mitte bis zur Kippkante
  return board.tween(0.4, (t) => {
    const angle = (Math.PI / 2) * t * t;
    figure.quaternion.setFromAxisAngle(axis, angle).multiply(rest);
    figure.position.copy(start).addScaledVector(direction, edge * (1 - Math.cos(angle)));
    figure.position.y = edge * Math.sin(angle);
  });
}

// Versinkt im Brett und verschwindet.
function sink(figure: THREE.Object3D): Promise<void> {
  const startY = figure.position.y;
  return board.tween(0.35, (t) => {
    figure.position.y = startY - 0.9 * t;
  });
}

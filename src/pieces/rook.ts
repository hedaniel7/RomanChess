// Turm. Rom: Wachturm aus Stein mit Zinnen und rotem Feldzeichen.
// Germanen: runder Holzturm, oben mit angespitzten Pfählen.

import * as THREE from 'three';
import type { Color } from '../rules.ts';
import { BROWN, DARK_BROWN, DARK_RED, FUR, GOLD, RED, STONE, WOOD, base, box, cylinder } from './parts.ts';

export function rook(color: Color): THREE.Object3D {
  return color === 'w' ? watchtower() : woodenTower();
}

function watchtower(): THREE.Object3D {
  const tower = new THREE.Group().add(
    base(DARK_RED),
    box(STONE, 0.5, 0.58, 0.5, 0, 0.37, 0),
    box(RED, 0.52, 0.06, 0.52, 0, 0.5, 0), // rotes Band
    box(STONE, 0.6, 0.06, 0.6, 0, 0.69, 0), // Plattform
    cylinder(GOLD, 0.012, 0.012, 0.34, 0, 0.89, 0, 6), // Fahnenstange
    box(RED, 0.16, 0.11, 0.012, 0.08, 0.99, 0), // Fahne
  );
  // Zinnen an den Ecken und in der Mitte jeder Seite
  for (const x of [-0.24, 0, 0.24]) {
    for (const z of [-0.24, 0, 0.24]) {
      if (x !== 0 || z !== 0) tower.add(box(STONE, 0.12, 0.12, 0.12, x, 0.78, z));
    }
  }
  return tower;
}

function woodenTower(): THREE.Object3D {
  const tower = new THREE.Group().add(
    base(DARK_BROWN),
    cylinder(BROWN, 0.26, 0.28, 0.6, 0, 0.38, 0, 9),
    cylinder(FUR, 0.29, 0.29, 0.06, 0, 0.52, 0, 9), // Band aus Fell
  );
  // Ein Kranz aus angespitzten Pfählen
  for (let i = 0; i < 9; i++) {
    const angle = (i / 9) * Math.PI * 2;
    tower.add(cylinder(WOOD, 0, 0.055, 0.18, Math.sin(angle) * 0.22, 0.77, Math.cos(angle) * 0.22, 5));
  }
  return tower;
}

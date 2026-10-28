// König, die höchste Figur, erkennbar am runden Reif und dem langen Stab.
// Rom: Kaiser mit Goldpanzer, rotem Feldherrnmantel, Lorbeerkranz und Zepter.
// Germanen: Fürst mit großem Fellumhang, Bart, Goldreif und Stab.

import * as THREE from 'three';
import type { Color } from '../rules.ts';
import {
  BROWN, DARK_BROWN, DARK_RED, FUR, GOLD, GREEN, HAIR, RED, SKIN, WOOD,
  ball, base, cylinder, lump, ring, shell,
} from './parts.ts';

export function king(color: Color): THREE.Object3D {
  return color === 'w' ? emperor() : chieftain();
}

function emperor(): THREE.Object3D {
  const cloak = shell(RED, 0.3, 0.38, 0.62, 0, 0.5, 0.16);
  cloak.rotation.y = Math.PI; // Wölbung nach hinten
  return new THREE.Group().add(
    base(DARK_RED),
    cylinder(RED, 0.14, 0.18, 0.42, 0, 0.29, 0), // Tunika
    cylinder(GOLD, 0.15, 0.14, 0.3, 0, 0.65, 0), // Panzer
    cloak,
    ball(SKIN, 0.09, 0, 0.9, 0),
    ring(GOLD, 0.085, 0.022, 0, 0.94, 0), // Lorbeerkranz
    cylinder(GOLD, 0.014, 0.014, 0.95, 0.22, 0.76, 0, 6), // Zepter
    ball(GOLD, 0.045, 0.22, 1.27, 0),
  );
}

function chieftain(): THREE.Object3D {
  return new THREE.Group().add(
    base(DARK_BROWN),
    cylinder(GREEN, 0.15, 0.18, 0.42, 0, 0.29, 0), // Kittel
    cylinder(BROWN, 0.15, 0.15, 0.28, 0, 0.64, 0), // Lederwams
    lump(FUR, 0.24, 0, 0.72, 0.03), // großer Fellumhang
    ball(SKIN, 0.09, 0, 0.9, 0),
    ball(HAIR, 0.095, 0, 0.93, 0.025),
    cylinder(HAIR, 0.055, 0.012, 0.12, 0, 0.8, -0.06, 6), // Bart
    ring(GOLD, 0.088, 0.022, 0, 0.97, 0), // Goldreif
    cylinder(WOOD, 0.016, 0.016, 0.95, 0.24, 0.76, 0, 6), // Stab
    ball(GOLD, 0.045, 0.24, 1.27, 0),
  );
}

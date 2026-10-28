// Läufer als Priester, erkennbar an der spitzen Kopfbedeckung.
// Rom: Flamen in heller Toga mit rotem Saum und goldener Kappe mit Spitze (apex).
// Germanen: Seher mit spitzer Kapuze, Fellkragen und Stab.

import * as THREE from 'three';
import type { Color } from '../rules.ts';
import {
  BROWN, DARK_BROWN, DARK_RED, FUR, GOLD, GREEN, IRON, RED, SKIN, TOGA, WOOD,
  ball, base, cylinder, dome, lump,
} from './parts.ts';

export function bishop(color: Color): THREE.Object3D {
  return color === 'w' ? flamen() : seer();
}

function flamen(): THREE.Object3D {
  return new THREE.Group().add(
    base(DARK_RED),
    cylinder(TOGA, 0.11, 0.22, 0.62, 0, 0.39, 0), // Toga
    cylinder(RED, 0.225, 0.23, 0.06, 0, 0.12, 0), // roter Saum
    cylinder(RED, 0.115, 0.13, 0.05, 0, 0.66, 0), // rote Borte
    cylinder(TOGA, 0.1, 0.12, 0.12, 0, 0.76, 0), // Schultern
    ball(SKIN, 0.08, 0, 0.88, 0),
    dome(GOLD, 0.084, 0, 0.9, 0), // Kappe
    cylinder(GOLD, 0.008, 0.014, 0.18, 0, 1.06, 0, 6), // Spitze
    ball(RED, 0.026, 0, 1.15, 0),
  );
}

function seer(): THREE.Object3D {
  return new THREE.Group().add(
    base(DARK_BROWN),
    cylinder(GREEN, 0.1, 0.22, 0.62, 0, 0.39, 0), // Gewand
    lump(FUR, 0.17, 0, 0.7, 0.01), // Fellkragen
    ball(SKIN, 0.075, 0, 0.83, -0.01),
    cylinder(BROWN, 0, 0.11, 0.36, 0, 0.98, 0.025, 8), // spitze Kapuze
    cylinder(WOOD, 0.014, 0.014, 1.0, 0.2, 0.58, 0, 6), // Stab
    ball(IRON, 0.035, 0.2, 1.1, 0),
  );
}

// Dame, erkennbar an der Zackenkrone. Rom: Kaiserin in rotem Gewand mit Goldgürtel.
// Germanen: Fürstin in ockerfarbenem Kleid mit Fellkragen und langem, blondem Haar.

import * as THREE from 'three';
import type { Color } from '../rules.ts';
import { BLOND, BROWN, DARK_BROWN, DARK_RED, FUR, GOLD, OCHRE, RED, SKIN, ball, base, box, cylinder, lump } from './parts.ts';

export function queen(color: Color): THREE.Object3D {
  return color === 'w' ? empress() : chieftainess();
}

function empress(): THREE.Object3D {
  return new THREE.Group().add(
    base(DARK_RED),
    cylinder(RED, 0.1, 0.25, 0.82, 0, 0.49, 0), // Gewand
    cylinder(GOLD, 0.165, 0.17, 0.05, 0, 0.55, 0), // Gürtel
    ball(SKIN, 0.085, 0, 0.97, 0),
    crown(GOLD, 1.05),
  );
}

function chieftainess(): THREE.Object3D {
  return new THREE.Group().add(
    base(DARK_BROWN),
    cylinder(OCHRE, 0.1, 0.24, 0.8, 0, 0.48, 0), // Kleid
    cylinder(BROWN, 0.16, 0.165, 0.05, 0, 0.55, 0), // Gürtel
    lump(FUR, 0.16, 0, 0.86, 0.01), // Fellkragen
    box(BLOND, 0.14, 0.24, 0.05, 0, 0.88, 0.07), // langes Haar
    ball(SKIN, 0.08, 0, 0.97, 0),
    crown(GOLD, 1.04),
  );
}

// Reif mit sechs Zacken, unten bei y = bottom.
function crown(mat: THREE.Material, bottom: number): THREE.Object3D {
  const crown = new THREE.Group().add(cylinder(mat, 0.09, 0.085, 0.05, 0, bottom + 0.025, 0));
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    crown.add(cylinder(mat, 0, 0.022, 0.07, Math.sin(angle) * 0.075, bottom + 0.085, Math.cos(angle) * 0.075, 4));
  }
  return crown;
}

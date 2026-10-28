// Springer als Reiter. Rom: helles Pferd mit roter Decke, Reiter mit Goldpanzer und rotem Umhang.
// Germanen: braunes Pferd mit Felldecke, Reiter mit Fell und langem Haar.

import * as THREE from 'three';
import type { Color } from '../rules.ts';
import {
  BROWN, DARK_BROWN, DARK_RED, FUR, GOLD, GREEN, HAIR, PALE_HORSE, RED, SKIN,
  ball, base, box, cylinder, dome, lump,
} from './parts.ts';

export function knight(color: Color): THREE.Object3D {
  const rider = color === 'w' ? romanRider() : germanicRider();
  const horseAndRider = new THREE.Group().add(
    color === 'w' ? horse(PALE_HORSE, RED) : horse(BROWN, FUR),
    rider,
  );
  horseAndRider.rotation.y = -0.6; // schräg gestellt, damit man das Pferd von der Seite sieht
  return new THREE.Group().add(base(color === 'w' ? DARK_RED : DARK_BROWN), horseAndRider);
}

function horse(coat: THREE.Material, blanket: THREE.Material): THREE.Object3D {
  const neck = box(coat, 0.11, 0.3, 0.13, 0, 0.62, -0.2);
  neck.rotation.x = -0.35; // oben nach vorne geneigt
  const head = box(coat, 0.1, 0.11, 0.22, 0, 0.77, -0.31);
  head.rotation.x = -0.5; // Maul nach unten
  const tail = box(coat, 0.04, 0.2, 0.04, 0, 0.38, 0.24);
  tail.rotation.x = 0.4;
  return new THREE.Group().add(
    box(coat, 0.18, 0.18, 0.44, 0, 0.42, 0), // Rumpf
    box(coat, 0.05, 0.26, 0.05, -0.06, 0.21, -0.16), // Beine
    box(coat, 0.05, 0.26, 0.05, 0.06, 0.21, -0.16),
    box(coat, 0.05, 0.26, 0.05, -0.06, 0.21, 0.16),
    box(coat, 0.05, 0.26, 0.05, 0.06, 0.21, 0.16),
    neck,
    head,
    tail,
    box(blanket, 0.21, 0.04, 0.2, 0, 0.52, 0.02), // Decke
  );
}

function romanRider(): THREE.Object3D {
  return new THREE.Group().add(
    cylinder(GOLD, 0.075, 0.085, 0.17, 0, 0.63, 0.02), // Panzer
    box(RED, 0.16, 0.2, 0.025, 0, 0.6, 0.1), // Umhang
    ball(SKIN, 0.06, 0, 0.77, 0.02),
    dome(GOLD, 0.066, 0, 0.78, 0.02), // Helm
    box(RED, 0.02, 0.05, 0.12, 0, 0.86, 0.02), // Helmbusch
  );
}

function germanicRider(): THREE.Object3D {
  return new THREE.Group().add(
    cylinder(GREEN, 0.075, 0.09, 0.17, 0, 0.63, 0.02),
    lump(FUR, 0.12, 0, 0.71, 0.03),
    ball(SKIN, 0.06, 0, 0.79, 0.02),
    ball(HAIR, 0.065, 0, 0.81, 0.04),
  );
}

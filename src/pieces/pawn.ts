// Bauer. Rom: Legionär mit gewölbtem Scutum und Speer. Der Schild reicht vom Schienbein bis zur
// Schulter (gut 60 % der Figur), Kopf, Helm und Speerspitze ragen darüber. Er ist 0,9 Feld breit,
// damit die Bauernreihe fast wie eine geschlossene Schildmauer wirkt.
// Germanen: Krieger mit Rundschild, Fellumhang und schräg gehaltenem Speer.

import * as THREE from 'three';
import type { Color } from '../rules.ts';
import {
  BROWN, DARK_BROWN, DARK_RED, FUR, GOLD, GREEN, HAIR, IRON, OCHRE, RED, SKIN, WOOD,
  ball, base, box, cylinder, dome, lump, shell,
} from './parts.ts';

export function pawn(color: Color): THREE.Object3D {
  return color === 'w' ? legionary() : warrior();
}

function legionary(): THREE.Object3D {
  const spear = new THREE.Group().add(
    cylinder(WOOD, 0.016, 0.016, 0.95, 0, 0.6, 0),
    cylinder(GOLD, 0, 0.035, 0.11, 0, 1.13, 0, 6), // Spitze
  );
  spear.position.set(0.22, 0, 0.02);
  spear.rotation.x = -0.08; // leicht nach vorne geneigt

  return new THREE.Group().add(
    base(DARK_RED),
    box(SKIN, 0.05, 0.2, 0.06, -0.05, 0.18, 0), // Beine
    box(SKIN, 0.05, 0.2, 0.06, 0.05, 0.18, 0),
    cylinder(RED, 0.13, 0.16, 0.2, 0, 0.38, 0), // Tunika
    cylinder(GOLD, 0.14, 0.13, 0.22, 0, 0.59, 0), // Panzer
    box(SKIN, 0.05, 0.2, 0.06, 0.17, 0.58, 0), // Arm mit dem Speer
    ball(SKIN, 0.08, 0, 0.78, 0), // Kopf
    dome(GOLD, 0.088, 0, 0.79, 0), // Helm
    box(RED, 0.025, 0.06, 0.15, 0, 0.9, 0), // Helmbusch
    shell(RED, 0.53, 0.9, 0.58, 0, 0.42, -0.24), // Scutum: 0,9 breit, 0,58 hoch
    shell(GOLD, 0.54, 0.91, 0.035, 0, 0.71, -0.25), // goldener Rand oben und unten
    shell(GOLD, 0.54, 0.91, 0.035, 0, 0.13, -0.25),
    ball(GOLD, 0.06, 0, 0.42, -0.26), // Schildbuckel
    spear,
  );
}

function warrior(): THREE.Object3D {
  const shield = new THREE.Group().add(
    cylinder(OCHRE, 0.25, 0.25, 0.035, 0, 0, 0, 12),
    cylinder(IRON, 0.04, 0.06, 0.05, 0, 0.035, 0, 8), // Buckel
  );
  shield.position.set(-0.1, 0.42, -0.2);
  shield.rotation.set(-Math.PI / 2 + 0.2, 0, 0.25); // Fläche nach vorne, etwas schief

  const spear = new THREE.Group().add(
    cylinder(WOOD, 0.016, 0.016, 0.9, 0, 0.55, 0),
    cylinder(IRON, 0, 0.035, 0.12, 0, 1.06, 0, 6), // Spitze
  );
  spear.position.set(0.2, 0, 0.02);
  spear.rotation.set(-0.3, 0, -0.2); // schräg, nicht in Reih und Glied

  return new THREE.Group().add(
    base(DARK_BROWN),
    box(BROWN, 0.05, 0.2, 0.06, -0.05, 0.18, 0), // Hosen
    box(BROWN, 0.05, 0.2, 0.06, 0.05, 0.18, 0),
    cylinder(GREEN, 0.14, 0.17, 0.3, 0, 0.43, 0), // Kittel
    lump(FUR, 0.18, 0, 0.62, 0.02), // Fell über den Schultern
    ball(SKIN, 0.08, 0, 0.75, 0), // Kopf
    ball(HAIR, 0.085, 0, 0.78, 0.025),
    cylinder(HAIR, 0.045, 0.01, 0.1, 0, 0.69, -0.055, 6), // Bart
    shield,
    spear,
  );
}

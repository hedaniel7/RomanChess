// Gemeinsame Bausteine der Figuren: Farben und einfache Formen.
//
// Jede Figur-Datei (pawn.ts, rook.ts, …) exportiert eine Funktion `(color: Color) => THREE.Object3D`.
// Diese Abmachung muss auch ein glTF-Modell einhalten, das eine Figur ersetzt:
// - Die Figur steht auf y = 0, mittig über dem Ursprung, und passt in ein Feld (1 × 1).
// - Sie schaut nach −z, zur gegnerischen Seite von Weiß. Das Brett dreht schwarze Figuren um 180°.

import * as THREE from 'three';

// flatShading: jede Fläche einfarbig, das ergibt den kantigen Statuen-Look
const material = (color: string) => new THREE.MeshLambertMaterial({ color, flatShading: true });

// Rom: Rot und Gold
export const RED = material('#a3201b');
export const DARK_RED = material('#6e1612');
export const GOLD = material('#d4a640');
export const STONE = material('#d8cfb8');
export const TOGA = material('#ece4d0');
export const PALE_HORSE = material('#d9d3c4');

// Germanen: Erdfarben
export const BROWN = material('#6b4a2b');
export const DARK_BROWN = material('#3e2c1d');
export const GREEN = material('#56603a');
export const OCHRE = material('#b08a3e');
export const FUR = material('#8f7d68');
export const IRON = material('#5d6266');
export const HAIR = material('#9a6a36');
export const BLOND = material('#c9a45c');

// Beide
export const SKIN = material('#d8a47c');
export const WOOD = material('#7a5230');

// Alle Formen werden mit ihrer Mitte bei (x, y, z) platziert.

// Zylinder oder Kegelstumpf; radiusTop = 0 ergibt einen Kegel.
export function cylinder(
  mat: THREE.Material, radiusTop: number, radiusBottom: number, height: number,
  x: number, y: number, z: number, segments = 10,
): THREE.Mesh {
  return place(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), mat, x, y, z);
}

export function box(
  mat: THREE.Material, width: number, height: number, depth: number, x: number, y: number, z: number,
): THREE.Mesh {
  return place(new THREE.BoxGeometry(width, height, depth), mat, x, y, z);
}

// Kugel aus wenigen Dreiecken, passt zum kantigen Stil.
export function ball(mat: THREE.Material, radius: number, x: number, y: number, z: number): THREE.Mesh {
  return place(new THREE.IcosahedronGeometry(radius, 1), mat, x, y, z);
}

// Klumpen für Fell: eine flachgedrückte, grobe Kugel.
export function lump(mat: THREE.Material, radius: number, x: number, y: number, z: number): THREE.Mesh {
  const mesh = place(new THREE.DodecahedronGeometry(radius), mat, x, y, z);
  mesh.scale.y = 0.6;
  return mesh;
}

// Halbkugel, offen nach unten (Helm, Kappe).
export function dome(mat: THREE.Material, radius: number, x: number, y: number, z: number): THREE.Mesh {
  return place(new THREE.SphereGeometry(radius, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), mat, x, y, z);
}

// Waagrechter Ring (Kranz, Reif).
export function ring(mat: THREE.Material, radius: number, tube: number, x: number, y: number, z: number): THREE.Mesh {
  const mesh = place(new THREE.TorusGeometry(radius, tube, 4, 12), mat, x, y, z);
  mesh.rotation.x = Math.PI / 2;
  return mesh;
}

// Gewölbte Fläche, ein Stück Zylindermantel, z. B. Scutum oder Umhang.
// Die Wölbung zeigt nach −z; (x, y, z) ist ihr vorderster Punkt. `width` = Breite von Kante zu Kante.
export function shell(
  mat: THREE.MeshLambertMaterial, radius: number, width: number, height: number, x: number, y: number, z: number,
): THREE.Mesh {
  const angle = 2 * Math.asin(width / 2 / radius);
  const geometry = new THREE.CylinderGeometry(radius, radius, height, 8, 1, true, Math.PI - angle / 2, angle);
  geometry.translate(0, 0, radius); // vorderster Punkt in den Ursprung
  const twoSided = mat.clone();
  twoSided.side = THREE.DoubleSide; // auch die Innenseite zeichnen
  return place(geometry, twoSided, x, y, z);
}

// Sockel, auf dem jede Figur steht wie eine Statue. Oberkante bei y = 0.08.
export function base(mat: THREE.Material): THREE.Mesh {
  return cylinder(mat, 0.34, 0.37, 0.08, 0, 0.04, 0, 14);
}

function place(geometry: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.position.set(x, y, z);
  return mesh;
}

// Das Brett in three.js: Szene, Kamera, Licht, Figuren der aktuellen Stellung,
// Markierungen für Auswahl und Ziele, und welches Feld angetippt wurde.
// Gezeichnet wird nur, wenn sich etwas ändert (render), nicht in einer Dauerschleife.

import * as THREE from 'three';
import { colorOf, fileOf, rankOf, type Color, type Piece, type Position } from './rules.ts';
import { bishop } from './pieces/bishop.ts';
import { king } from './pieces/king.ts';
import { knight } from './pieces/knight.ts';
import { pawn } from './pieces/pawn.ts';
import { queen } from './pieces/queen.ts';
import { rook } from './pieces/rook.ts';

const LIGHT_SQUARE = '#e6e0d2'; // heller Marmor
const DARK_SQUARE = '#5f6a73'; // Schiefer

const renderer = new THREE.WebGLRenderer({ antialias: true });
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
const raycaster = new THREE.Raycaster();
const boardTop = makeBoardTop();
const pieces = new THREE.Group(); // Figuren der aktuellen Stellung
const marks = new THREE.Group(); // Auswahl und legale Ziele

export function init(container: HTMLElement) {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 3x kostet auf dem iPhone viel, bringt wenig
  container.append(renderer.domElement);

  scene.background = new THREE.Color('#1c1d21');
  scene.add(new THREE.HemisphereLight('#fff6e8', '#4a4038', 1.6));
  const sun = new THREE.DirectionalLight('#ffffff', 2.0);
  sun.position.set(-3, 8, 4);
  scene.add(sun, boardTop, makeFrame(), pieces, marks);

  new ResizeObserver(() => resize(container)).observe(container);
}

// Mitte eines Feldes in der Welt. Ein Feld ist 1 breit, Reihe 1 liegt vorne bei der Kamera.
export function squareCenter(sq: number): THREE.Vector3 {
  return new THREE.Vector3(fileOf(sq) - 3.5, 0, 3.5 - rankOf(sq));
}

// Stellt die Figuren einer Stellung auf. Alte Figuren werden einfach ersetzt.
export function show(pos: Position) {
  pieces.clear();
  pos.board.forEach((piece, sq) => {
    if (!piece) return;
    const figure = makeFigure(piece);
    figure.position.copy(squareCenter(sq));
    if (colorOf(piece) === 'b') figure.rotation.y = Math.PI + disorder(sq); // Schwarz schaut zur Kamera
    figure.userData.square = sq;
    pieces.add(figure);
  });
  render();
}

// Die Figur, die gerade auf `sq` steht (für Animationen).
export function figureAt(sq: number): THREE.Object3D | undefined {
  return pieces.children.find((figure) => figure.userData.square === sq);
}

// Markiert das gewählte Feld und die Felder, auf die die Figur ziehen darf.
export function select(from: number | null, targets: number[]) {
  marks.clear();
  if (from !== null) marks.add(mark(squareShape, from));
  for (const sq of targets) marks.add(mark(figureAt(sq) ? ringShape : dotShape, sq));
  render();
}

// Welches Feld liegt unter dem Finger oder Mauszeiger? null, wenn keins.
export function squareAt(clientX: number, clientY: number): number | null {
  const rect = renderer.domElement.getBoundingClientRect();
  const pointer = new THREE.Vector2(
    ((clientX - rect.left) / rect.width) * 2 - 1,
    -((clientY - rect.top) / rect.height) * 2 + 1,
  );
  raycaster.setFromCamera(pointer, camera);
  // Figuren zuerst: Ein Tipp auf den Kopf einer Figur gilt für ihr Feld.
  const hit = raycaster.intersectObjects([pieces, boardTop], true)[0];
  if (!hit) return null;
  for (let obj: THREE.Object3D | null = hit.object; obj; obj = obj.parent) {
    if (obj.userData.square !== undefined) return obj.userData.square;
  }
  const file = Math.floor(hit.point.x + 4);
  const rank = Math.floor(4 - hit.point.z);
  return file >= 0 && file < 8 && rank >= 0 && rank < 8 ? rank * 8 + file : null;
}

export function render() {
  renderer.render(scene, camera);
}

// Feste, leicht schräge Sicht von der Seite Roms. Der Abstand passt sich dem Bildschirm an,
// damit das Brett im Hochformat in die Breite und im Querformat in die Höhe passt.
function resize(container: HTMLElement) {
  const width = container.clientWidth;
  const height = container.clientHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  const halfHeight = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const distance = Math.max(5.0 / (halfHeight * camera.aspect), 4.6 / halfHeight);
  camera.position.set(0, 1.6, 1).normalize().multiplyScalar(distance);
  camera.lookAt(0, 0, 0.3);
  camera.updateProjectionMatrix();
  render();
}

// Spielfläche: eine Ebene mit einer 8×8-Pixel-Textur ohne Glättung, ein Pixel pro Feld.
// Pixel `sq` landet genau auf Feld `sq` (a1 links vorne).
function makeBoardTop(): THREE.Mesh {
  const data = new Uint8Array(64 * 4);
  const light = new THREE.Color(LIGHT_SQUARE);
  const dark = new THREE.Color(DARK_SQUARE);
  for (let sq = 0; sq < 64; sq++) {
    const color = (fileOf(sq) + rankOf(sq)) % 2 === 1 ? light : dark; // a1 ist dunkel
    data.set([color.r * 255, color.g * 255, color.b * 255, 255], sq * 4); // lineare Werte, wie THREE.Color sie speichert
  }
  const texture = new THREE.DataTexture(data, 8, 8);
  texture.magFilter = THREE.NearestFilter;
  texture.needsUpdate = true;
  const top = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshLambertMaterial({ map: texture }));
  top.rotation.x = -Math.PI / 2;
  return top;
}

function makeFrame(): THREE.Mesh {
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(8.7, 0.4, 8.7),
    new THREE.MeshLambertMaterial({ color: '#3b332b' }),
  );
  frame.position.y = -0.21; // Oberkante knapp unter der Spielfläche
  return frame;
}

// Markierungen: ganzes Feld = gewählte Figur, Punkt = freies Ziel, Ring = Figur, die geschlagen werden kann.
const markMaterial = new THREE.MeshBasicMaterial({ color: '#f2c94c', transparent: true, opacity: 0.6 });
const squareShape = new THREE.PlaneGeometry(1, 1);
const dotShape = new THREE.CircleGeometry(0.15, 20);
const ringShape = new THREE.RingGeometry(0.36, 0.46, 24);

function mark(shape: THREE.BufferGeometry, sq: number): THREE.Mesh {
  const mesh = new THREE.Mesh(shape, markMaterial);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.copy(squareCenter(sq)).setY(0.01);
  return mesh;
}

// Germanen stehen nicht in Reih und Glied: jede Figur etwas gedreht, je nach Feld anders.
function disorder(sq: number): number {
  return (((sq * 7) % 5) - 2) * 0.08;
}

// Eine Datei pro Figurentyp, alle mit derselben Schnittstelle (siehe pieces/parts.ts).
const BUILDERS: Record<string, (color: Color) => THREE.Object3D> = {
  p: pawn, n: knight, b: bishop, r: rook, q: queen, k: king,
};

// Jede Figur wird einmal gebaut und danach geklont. Klone teilen Geometrie und Material.
const templates = new Map<Piece, THREE.Object3D>();

function makeFigure(piece: Piece): THREE.Object3D {
  if (!templates.has(piece)) templates.set(piece, BUILDERS[piece.toLowerCase()](colorOf(piece)));
  return templates.get(piece)!.clone();
}

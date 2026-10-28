// Das Brett in three.js: Szene, Kamera, Licht, Figuren der aktuellen Stellung,
// Markierungen für Auswahl und Ziele, und welches Feld angetippt wurde.
// Gezeichnet wird nur, wenn sich etwas ändert (render), nicht in einer Dauerschleife.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
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

// Kamera drehen und zoomen. Ein Finger dreht, zwei Finger zoomen (so ist OrbitControls voreingestellt).
// Verschieben ist aus, darum bleibt das Ziel die Brettmitte.
const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.maxPolarAngle = 1.35; // nicht tiefer als gut 10° über dem Brett
controls.addEventListener('change', render);

// Abstand, bei dem das ganze Brett ins Bild passt. Hängt vom Bildschirm ab, siehe resize.
let fit = 1;

// Die festen Ansichten. polar: Winkel von senkrecht oben; azimuth: Drehung ums Brett, 0 = hinter Rom;
// distance: Abstand als Vielfaches von `fit`.
const VIEWS = {
  standard: { polar: 0.56, azimuth: 0, distance: 1 }, // schräg hinter Rom
  bird: { polar: 0.001, azimuth: 0, distance: 1 }, // von oben
};
export type View = keyof typeof VIEWS;

export function init(container: HTMLElement) {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 3x kostet auf dem iPhone viel, bringt wenig
  container.append(renderer.domElement);
  const start = VIEWS.standard;
  camera.position.setFromSphericalCoords(fit, start.polar, start.azimuth); // resize skaliert auf den richtigen Abstand
  controls.update();

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

// Ruft `handler` mit dem angetippten Feld auf. Entschieden wird beim Loslassen:
// Hat sich der Finger kaum bewegt, war es ein Tipp, sonst hat er die Kamera gedreht.
// Ein zweiter Finger (Zoomen) macht aus der Berührung nie einen Tipp.
export function onTap(handler: (sq: number | null) => void) {
  let pressedAt: { x: number; y: number } | null = null;
  renderer.domElement.addEventListener('pointerdown', (e) => {
    pressedAt = e.isPrimary ? { x: e.clientX, y: e.clientY } : null;
  });
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (pressedAt && Math.hypot(e.clientX - pressedAt.x, e.clientY - pressedAt.y) < 10) {
      handler(squareAt(e.clientX, e.clientY));
    }
    pressedAt = null;
  });
}

// Fährt die Kamera sanft in eine der festen Ansichten. Während der Fahrt ist Drehen aus.
export async function showView(name: View) {
  if (!controls.enabled) return; // es läuft schon eine Fahrt
  const from = new THREE.Spherical().setFromVector3(camera.position);
  const to = VIEWS[name];
  const turn = Math.atan2(Math.sin(to.azimuth - from.theta), Math.cos(to.azimuth - from.theta)); // kürzerer Weg
  controls.enabled = false;
  await tween(0.8, (t) => {
    const e = smooth(t);
    const distance = THREE.MathUtils.lerp(from.radius, to.distance * fit, e);
    const polar = THREE.MathUtils.lerp(from.phi, to.polar, e);
    camera.position.setFromSphericalCoords(distance, polar, from.theta + turn * e);
    camera.lookAt(controls.target);
  });
  controls.enabled = true;
  controls.update();
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

// Ruft step(t) bei jedem Bild auf und zeichnet; t läuft in `seconds` Sekunden von 0 bis 1.
// Für Figuren (animate.ts) und Kamerafahrten.
export function tween(seconds: number, step: (t: number) => void): Promise<void> {
  return new Promise((resolve) => {
    let start: number | undefined;
    function frame(now: number) {
      start ??= now; // Zeit des ersten Bildes
      const t = Math.min((now - start) / (seconds * 1000), 1);
      step(t);
      render();
      if (t < 1) requestAnimationFrame(frame);
      else resolve();
    }
    requestAnimationFrame(frame);
  });
}

// Langsam anfahren, langsam abbremsen.
export function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

// Passt Bildgröße und Kamera an den Bildschirm an. `fit` ist der Abstand, bei dem das Brett
// im Hochformat in die Breite und im Querformat in die Höhe passt. Blickrichtung und Zoom
// bleiben erhalten, nur im Verhältnis zum neuen `fit`. Die Zoomgrenzen hängen ebenfalls an `fit`.
function resize(container: HTMLElement) {
  const width = container.clientWidth;
  const height = container.clientHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  const halfHeight = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const previousFit = fit;
  fit = Math.max(5.0 / (halfHeight * camera.aspect), 4.6 / halfHeight);
  controls.minDistance = 0.5 * fit;
  controls.maxDistance = 1.3 * fit;
  camera.position.multiplyScalar(fit / previousFit); // Ziel ist der Ursprung, also skaliert das den Abstand
  controls.update();
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

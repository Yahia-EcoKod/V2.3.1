// Дорога из простых фигур: кусок дороги, разметка, заборы, деревья по бокам.
// Дорога «едет» навстречу герою — на самом деле двигается сама дорога, а не герой.
import * as THREE from 'three';
import { TILE_LEN, TILE_COUNT, ROAD_HALF, FENCE_X, GRASS_COLOR, ROAD_COLOR } from './config.js';
import { grayable } from './mood.js';

const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const cylGeo = new THREE.CylinderGeometry(1, 1, 1, 6);
const coneGeo = new THREE.ConeGeometry(1, 1, 6);
const lambert = (c) => grayable(new THREE.MeshLambertMaterial({ color: c, flatShading: true }));

const matRoad = lambert(ROAD_COLOR);
const matCurb = lambert(0xfcf0db);
const matGrass = lambert(GRASS_COLOR);
const matGrassDark = lambert(new THREE.Color(GRASS_COLOR).multiplyScalar(0.92));   // чередуется с светлой: так видно скорость
const matDash = lambert(0xfcf0db);
const matWood = lambert(0xb5835a);
const matTrunk = lambert(0x8a6240);
const matCrown = lambert(0xffffff); // цвет задаётся для каждого дерева отдельно

// Много одинаковых предметов рисуются «одним махом» — так телефону легче
function instanced(geometry, material, items) {
  const mesh = new THREE.InstancedMesh(geometry, material, items.length);
  const d = new THREE.Object3D();
  items.forEach((it, i) => {
    d.position.set(it.x, it.y, it.z);
    d.scale.set(it.sx, it.sy, it.sz);
    d.updateMatrix();
    mesh.setMatrixAt(i, d.matrix);
    if (it.color) mesh.setColorAt(i, new THREE.Color(it.color));
  });
  mesh.frustumCulled = false;
  return mesh;
}

function buildTile() {
  const g = new THREE.Group(); // кусок занимает z от -TILE_LEN до 0
  const road = new THREE.Mesh(boxGeo, matRoad);
  road.scale.set(ROAD_HALF * 2, 0.2, TILE_LEN);
  road.position.set(0, -0.1, -TILE_LEN / 2);
  g.add(road);

  for (const x of [-1, 1]) {   // светлые кромки по краям дороги
    const curb = new THREE.Mesh(boxGeo, matCurb);
    curb.scale.set(0.3, 0.04, TILE_LEN);
    curb.position.set(x * (ROAD_HALF - 0.15), 0.01, -TILE_LEN / 2);
    g.add(curb);
  }

  for (let k = 0; k < 2; k++) {   // трава двумя полосами: светлая и чуть темнее
    const grass = new THREE.Mesh(boxGeo, k ? matGrassDark : matGrass);
    grass.scale.set(70, 0.2, TILE_LEN / 2);
    grass.position.set(0, -0.14, -TILE_LEN / 4 - k * TILE_LEN / 2);
    g.add(grass);
  }

  const dashes = [], posts = [], rails = [], trunks = [], crowns = [];
  for (let k = 0; k < 6; k++) {
    const z = -2 - 4 * k;
    for (const x of [-0.85, 0.85]) dashes.push({ x, y: 0.01, z, sx: 0.12, sy: 0.02, sz: 2 });
    for (const x of [-FENCE_X, FENCE_X]) posts.push({ x, y: 0.45, z, sx: 0.25, sy: 0.9, sz: 0.25 });
  }
  for (const x of [-FENCE_X, FENCE_X]) {
    for (const y of [0.65, 0.3]) rails.push({ x, y, z: -TILE_LEN / 2, sx: 0.1, sy: 0.12, sz: TILE_LEN });
  }
  const crownColors = [0x4fb04f, 0x6cc36a, 0x3f9e5a];
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const x = side * (7.5 + Math.random() * 4)   // ближний ряд (до 6 от дороги) свободен: там сажаем деревья за верные ответы;
      const z = -2 - Math.random() * (TILE_LEN - 4);
      const s = 0.8 + Math.random() * 0.8;
      const h = 1.2 * s;
      trunks.push({ x, y: h / 2, z, sx: 0.25 * s, sy: h, sz: 0.25 * s });
      crowns.push({ x, y: h + 1.2 * s, z, sx: 1.2 * s, sy: 2.6 * s, sz: 1.2 * s,
                    color: crownColors[Math.floor(Math.random() * crownColors.length)] });
    }
  }
  g.add(instanced(boxGeo, matDash, dashes));
  g.add(instanced(boxGeo, matWood, posts));
  g.add(instanced(boxGeo, matWood, rails));
  g.add(instanced(cylGeo, matTrunk, trunks));
  g.add(instanced(coneGeo, matCrown, crowns));
  return g;
}

export function createWorld(scene) {
  const group = new THREE.Group();
  const tiles = [];
  for (let i = 0; i < TILE_COUNT; i++) {
    const t = buildTile();
    group.add(t);
    tiles.push(t);
  }
  group.visible = false;
  scene.add(group);

  function reset() {
    tiles.forEach((t, i) => { t.position.z = -i * TILE_LEN + TILE_LEN; });
  }
  reset();

  return {
    show() { reset(); group.visible = true; },
    hide() { group.visible = false; },
    update(dt, speed) {
      const wrap = TILE_COUNT * TILE_LEN;
      for (const t of tiles) {
        t.position.z += speed * dt;
        if (t.position.z - TILE_LEN > 14) t.position.z -= wrap;
      }
    },
  };
}

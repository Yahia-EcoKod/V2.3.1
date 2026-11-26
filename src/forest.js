// Растущий лес. За каждый верный ответ вырастает одно дерево.
// Во время игры деревья растут вдали по бокам дороги. На экране конца они вырастают по очереди
// вокруг героя (так их видно на узком экране телефона).
import * as THREE from 'three';
import { QUESTIONS_TO_WIN, TREE_GROW_TIME, END_TREE_DELAY } from './config.js';
import { grayable } from './mood.js';

const lambert = (c) => grayable(new THREE.MeshLambertMaterial({ color: c, flatShading: true }));
const trunkMat = lambert(0x7a5230);
const crownMats = [lambert(0x2f9e4f), lambert(0x4cb85a), lambert(0x3aa857)];
const trunkGeo = new THREE.CylinderGeometry(0.18, 0.24, 1, 6);
const coneGeo = new THREE.ConeGeometry(1, 1, 7);

// Дерево: ствол и два яруса кроны. Высота дерева примерно 3,3 при размере 1.
function makeTree(i) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 0.5;
  const low = new THREE.Mesh(coneGeo, crownMats[i % 3]);
  low.scale.set(1, 1.9, 1); low.position.y = 1.75;
  const top = new THREE.Mesh(coneGeo, crownMats[(i + 1) % 3]);
  top.scale.set(0.72, 1.6, 0.72); top.position.y = 2.5;
  g.add(trunk, low, top);
  return g;
}

// Размеры посаженных деревьев (по кругу, плюс небольшой случайный разброс), чтобы лес был разным
const SIZES = [1.5, 0.95, 1.25, 1.7, 1.05, 1.4];
const PLANT_Z = -22;   // где вдали вырастает посаженное дерево
const GONE_Z = 11;     // где оно уже позади камеры и исчезает

// Места деревьев на экране конца: «V» за спиной героя (камера меню видит узкую полосу)
function endSlot(i) {
  const side = i % 2 ? 1 : -1, r = Math.floor(i / 2);
  const z = -5 - r * 3.2;
  return { x: side * 0.167 * (5.4 - z) * (0.8 + (r % 3) * 0.08), z, s: 0.9 + r * 0.12 };
}

const easeOutBack = (t) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2);

export function createForest(scene) {
  const root = new THREE.Group();
  root.visible = false;
  scene.add(root);
  const trees = [];
  for (let i = 0; i < QUESTIONS_TO_WIN; i++) {
    const group = makeTree(i);
    group.visible = false;
    root.add(group);
    trees.push({ group, size: 1, t: 0, delay: 0, active: false, moving: false });
  }
  let layout = 'game', planted = 0;

  function start(i, delay, p, moving) {
    const tree = trees[i];
    tree.moving = moving;
    tree.group.position.set(p.x, -0.03, p.z);
    tree.group.rotation.y = i * 2.1;
    tree.group.scale.setScalar(0.001);
    tree.size = p.s; tree.t = 0; tree.delay = delay; tree.active = true;
    tree.group.visible = false;
  }
  function hideAll() {
    trees.forEach((t) => { t.active = false; t.moving = false; t.group.visible = false; });
  }

  return {
    // Новая игра: леса ещё нет
    reset() { layout = 'game'; planted = 0; hideAll(); root.visible = true; },
    hide() { hideAll(); root.visible = false; },
    // Верный ответ: в ближнем ряду у дороги вырастает дерево (слева и справа по очереди) и едет мимо вместе с миром
    plant() {
      if (planted >= trees.length) return;
      const i = planted++;
      const s = SIZES[i % SIZES.length] * (0.92 + Math.random() * 0.16);
      const side = i % 2 ? 1 : -1;
      start(i, 0, { x: side * (3.5 + s + Math.random() * 0.5), z: PLANT_Z, s }, true);
    },
    // Экран конца: лес из n деревьев вырастает заново вокруг героя
    showAtEnd(n) {
      layout = 'end'; hideAll();
      for (let i = 0; i < Math.min(n, trees.length); i++) start(i, i * END_TREE_DELAY, endSlot(i), false);
    },
    update(dt, speed = 0) {
      for (const tree of trees) {
        if (tree.moving) {                       // посаженное дерево едет вместе с дорогой
          tree.group.position.z += speed * dt;
          if (tree.group.position.z > GONE_Z) { tree.moving = false; tree.active = false; tree.group.visible = false; continue; }
        }
        if (!tree.active) continue;
        if (tree.delay > 0) { tree.delay -= dt; continue; }
        tree.group.visible = true;
        tree.t = Math.min(1, tree.t + dt / TREE_GROW_TIME);
        tree.group.scale.setScalar(Math.max(0.001, tree.size * easeOutBack(tree.t)));
        if (tree.t >= 1) tree.active = false;
      }
    },
  };
}

// Медаль «Юный эколог»: золотой кружок с зелёной ёлочкой на зелёной ленте.
// Висит на груди героя на экране победы и «вырастает» с небольшим пружинистым эффектом.
import * as THREE from 'three';
import { MEDAL_DY, MEDAL_Z, MEDAL_POP_DELAY, MEDAL_POP_TIME } from './config.js';

const lambert = (c) => new THREE.MeshLambertMaterial({ color: c, flatShading: true });
const easeOutBack = (t) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2);

export function createMedal() {
  const group = new THREE.Group();
  const tmp = new THREE.Vector3();

  const gold = lambert(0xf2b632), darkGold = lambert(0xc88a00);
  const green = lambert(0x2f9e4f), brown = lambert(0x7a5230);

  // Круглая медаль (цилиндр повёрнут так, чтобы плоская сторона смотрела на игрока)
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.04, 24), gold);
  disc.rotation.x = Math.PI / 2;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.025, 8, 24), darkGold);
  group.add(disc, rim);

  // Ёлочка в центре медали
  const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 0.02), brown);
  trunk.position.set(0, -0.085, 0.03);
  const crown = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.17, 6), green);
  crown.position.set(0, 0.01, 0.03);
  crown.rotation.x = Math.PI / 2 * 0;     // стоит вертикально
  group.add(trunk, crown);

  // Лента: две полоски буквой V от шеи к медали
  function ribbon(x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.06, len, 0.02), green);
    m.position.set((x1 + x2) / 2, (y1 + y2) / 2, -0.015);
    m.rotation.z = Math.atan2(-dx, dy);
    return m;
  }
  group.add(ribbon(-0.12, 0.27, -0.02, 0.16), ribbon(0.12, 0.27, 0.02, 0.16));

  let parent = null, bone = null, t = 0;
  group.visible = false;

  // Ставим медаль на уровень кости груди (по высоте и по бокам), чуть выдвинув вперёд
  function follow() {
    if (!bone) return;
    bone.getWorldPosition(tmp);
    parent.worldToLocal(tmp);
    group.position.set(tmp.x, tmp.y + MEDAL_DY, MEDAL_Z);
  }

  return {
    // Повесить на героя: p — его контейнер hero.root, chest — кость груди (медаль едет за ней, когда герой прыгает)
    attach(p, chest) {
      parent = p; bone = chest; p.add(group);
      follow();
      t = -MEDAL_POP_DELAY;
      group.scale.setScalar(0.001); group.visible = false;
    },
    detach() {
      if (parent) parent.remove(group);
      parent = null; bone = null; group.visible = false;
    },
    update(dt) {
      if (!parent) return;
      follow();
      if (t >= MEDAL_POP_TIME) return;
      t += dt;
      if (t < 0) return;
      group.visible = true;
      group.scale.setScalar(Math.max(0.001, easeOutBack(Math.min(1, t / MEDAL_POP_TIME))));
    },
  };
}

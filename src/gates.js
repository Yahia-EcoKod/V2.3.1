// Ворота с заданием: рама и три окна на дорожках. В окне картинка или слово.
// Если вариантов два, третья дорожка закрыта полосатым барьером.
import * as THREE from 'three';
import { LANES, REMOVE_Z, GATE_WIN_W, GATE_WIN_H } from './config.js';
import { getImage } from './images.js';

const PX = 200;                                   // пикселей текстуры на единицу мира
const W = Math.round(GATE_WIN_W * PX);
const H = Math.round(GATE_WIN_H * PX);
const WIN_Y = GATE_WIN_H / 2 + 0.1;
const POST_X = LANES[2] + GATE_WIN_W / 2 + 0.22;  // стойки по краям

const planeGeo = new THREE.PlaneGeometry(GATE_WIN_W, GATE_WIN_H);
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const postMat = new THREE.MeshLambertMaterial({ color: 0x9a6a40, flatShading: true });
const beamMat = new THREE.MeshLambertMaterial({ color: 0x3f9e4a, flatShading: true });

// ---------- Рисуем содержимое окон на холсте ----------
function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

// Цвета окна. Зелёный и красный бывают ТОЛЬКО после ответа, поэтому обычная рамка белая.
const LOOK = {
  normal: { fill: '#fffbe8', frame: '#ffffff', text: '#24323f' },
  good:   { fill: '#8fdc7a', frame: '#2e9e44', text: '#1b3d1f' },
  bad:    { fill: '#ff8a80', frame: '#d32f2f', text: '#4a1512' },
};

function newCanvas(fill, frame) {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = frame; roundRect(g, 0, 0, W, H, 28); g.fill();      // рамка окна
  g.fillStyle = fill; roundRect(g, 10, 10, W - 20, H - 20, 20); g.fill();
  return [c, g];
}

// Значок в углу окна: галочка или крестик (чтобы было понятно и тем, кто плохо различает красный и зелёный)
function drawMark(g, mode) {
  const cx = W - 52, cy = 52;
  g.fillStyle = mode === 'good' ? '#2e9e44' : '#d32f2f';
  g.beginPath(); g.arc(cx, cy, 36, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#fff'; g.lineWidth = 10; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath();
  if (mode === 'good') {
    g.moveTo(cx - 16, cy + 1); g.lineTo(cx - 4, cy + 13); g.lineTo(cx + 17, cy - 12);
  } else {
    g.moveTo(cx - 14, cy - 14); g.lineTo(cx + 14, cy + 14);
    g.moveTo(cx + 14, cy - 14); g.lineTo(cx - 14, cy + 14);
  }
  g.stroke();
}

// Делим слова на строки; null, если какое-то слово не помещается по ширине
function wrap(g, text, maxW) {
  const lines = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    if (g.measureText(word).width > maxW) return null;
    const test = line ? line + ' ' + word : word;
    if (g.measureText(test).width <= maxW) line = test;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines;
}

// Подбираем самый крупный шрифт, при котором слово помещается в окно
function drawText(g, text, color) {
  const boxW = W - 40, boxH = H - 40;
  let size = 72, lines = null;
  for (; size >= 18; size -= 4) {
    g.font = `800 ${size}px system-ui, "Segoe UI", Arial, sans-serif`;
    lines = wrap(g, text, boxW);
    if (lines && lines.length * size * 1.12 <= boxH) break;
    lines = null;
  }
  if (!lines) { size = 18; g.font = `800 18px system-ui, Arial, sans-serif`; lines = [text]; }
  g.fillStyle = color;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const lh = size * 1.12;
  const top = H / 2 - (lines.length * lh) / 2 + lh / 2;
  lines.forEach((l, i) => g.fillText(l, W / 2, top + i * lh));
}

function drawOption(opt, mode = 'normal') {
  const look = LOOK[mode];
  const [c, g] = newCanvas(look.fill, look.frame);
  if (opt.type === 'image') {
    const img = getImage(opt.value);
    if (img) {
      const k = Math.min((W - 40) / img.width, (H - 40) / img.height);
      const w = img.width * k, h = img.height * k;
      g.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
    } else drawText(g, '?', look.text);
  } else {
    drawText(g, opt.value, look.text);
  }
  if (mode !== 'normal') drawMark(g, mode);
  return c;
}

function drawBarrier(mode = 'normal') {
  const look = LOOK[mode === 'normal' ? 'normal' : 'bad'];
  const [c, g] = newCanvas('#f7f3e8', look.frame);
  g.save();
  roundRect(g, 10, 10, W - 20, H - 20, 20); g.clip();
  g.fillStyle = '#e0574f';
  for (let x = -H; x < W + H; x += 70) {
    g.beginPath();
    g.moveTo(x, H); g.lineTo(x + 35, H); g.lineTo(x + 35 + H, 0); g.lineTo(x + H, 0);
    g.closePath(); g.fill();
  }
  g.restore();
  if (mode !== 'normal') drawMark(g, 'bad');   // выбрали закрытую дорожку: это ошибка
  return c;
}

function makeMat(canvas) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshBasicMaterial({ map: tex });
}

// ---------- Ворота в мире ----------
export function createGates(scene) {
  const root = new THREE.Group();
  scene.add(root);
  let gates = [];

  function build(q) {
    const group = new THREE.Group();
    const mats = [];
    for (const x of [-POST_X, POST_X]) {
      const post = new THREE.Mesh(boxGeo, postMat);
      post.scale.set(0.24, 2.6, 0.24); post.position.set(x, 1.3, 0);
      group.add(post);
    }
    const beam = new THREE.Mesh(boxGeo, beamMat);
    beam.scale.set(POST_X * 2 + 0.24, 0.4, 0.3); beam.position.set(0, 2.5, 0);
    group.add(beam);
    for (let i = 0; i < 3; i++) {
      const mat = makeMat(q.slots[i] ? drawOption(q.slots[i]) : drawBarrier());
      mats.push(mat);
      const win = new THREE.Mesh(planeGeo, mat);
      win.position.set(LANES[i], WIN_Y, 0.02);
      group.add(win);
    }
    return { group, mats };
  }

  function release(g) {
    root.remove(g.group);
    g.mats.forEach((m) => { m.map.dispose(); m.dispose(); });
  }

  return {
    spawn(q, z) {
      const { group, mats } = build(q);
      group.position.set(0, 0, z);
      root.add(group);
      gates.push({ q, group, mats, z, done: false });
    },
    // Ближайшие ворота, через которые герой ещё не пробежал (null, если их нет)
    next() { return gates.find((g) => !g.done) || null; },
    // Показать результат: правильное окно зеленеет, выбранное неверное краснеет
    reveal(q, chosenLane) {
      const gate = gates.find((x) => x.q === q);
      if (!gate) return;
      for (let i = 0; i < 3; i++) {
        const mode = i === q.correctLane ? 'good' : (i === chosenLane ? 'bad' : null);
        if (!mode) continue;
        const tex = gate.mats[i].map;
        tex.image = q.slots[i] ? drawOption(q.slots[i], mode) : drawBarrier(mode);
        tex.needsUpdate = true;
      }
    },
    clear() { gates.forEach(release); gates = []; },
    // cb.onGate(q, lane) вызывается в момент, когда герой пробегает ворота; lane: 0, 1 или 2
    update(dt, speed, heroX, cb) {
      const move = speed * dt;
      for (let i = gates.length - 1; i >= 0; i--) {
        const g = gates[i];
        g.z += move;
        g.group.position.z = g.z;
        if (!g.done && g.z >= 0) {
          g.done = true;
          let lane = 0;
          for (let k = 1; k < 3; k++) {
            if (Math.abs(LANES[k] - heroX) < Math.abs(LANES[lane] - heroX)) lane = k;
          }
          cb.onGate(g.q, lane);
        }
        if (g.z > REMOVE_Z) { release(g); gates.splice(i, 1); }
      }
    },
  };
}

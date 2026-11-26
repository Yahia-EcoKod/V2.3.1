// Небо: огромный купол вокруг сцены. Вверху синее, к горизонту светлеет, в стороне лёгкое солнце.
// Цвета неба меняет mood.js (при ошибке небо серое), поэтому снаружи нужен только setColors.
import * as THREE from 'three';
import { SKY_TOP, SKY_HORIZON } from './config.js';

const vertexShader = `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;

const fragmentShader = `
  uniform vec3 uTop;
  uniform vec3 uHorizon;
  uniform vec3 uSunDir;
  uniform float uSun;
  varying vec3 vDir;
  void main() {
    vec3 dir = normalize(vDir);
    vec3 col = mix(uHorizon, uTop, smoothstep(-0.05, 0.4, dir.y));
    float d = max(dot(dir, uSunDir), 0.0);
    col += vec3(1.0, 0.93, 0.7) * pow(d, 60.0) * 0.35 * uSun;   // мягкое сияние вокруг солнца
    col = mix(col, vec3(1.0, 0.96, 0.78), smoothstep(0.9992, 0.9996, d) * uSun);   // сам диск
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>   // перевод цвета в тот вид, в котором его показывает экран
  }`;

export function createSky(scene) {
  const uniforms = {
    uTop: { value: new THREE.Color(SKY_TOP) },
    uHorizon: { value: new THREE.Color(SKY_HORIZON) },
    uSunDir: { value: new THREE.Vector3(-0.3, 0.25, -1).normalize() },
    uSun: { value: 1 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms, vertexShader, fragmentShader,
    side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(100, 24, 12), material);
  dome.renderOrder = -1;      // рисуется первым, всё остальное поверх
  dome.frustumCulled = false;
  scene.add(dome);

  return {
    setColors(top, horizon, sunStrength) {
      uniforms.uTop.value.copy(top);
      uniforms.uHorizon.value.copy(horizon);
      uniforms.uSun.value = sunStrength;
    },
  };
}

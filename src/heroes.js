// Загрузка 6 героев и их анимаций: ожидание, бег, радость (прыжки), удар и «номера» для экрана выбора.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { HEROES, HERO_HEIGHT, ANIM_FILES } from './config.js';

export async function loadHeroes(onProgress) {
  const loader = new GLTFLoader();
  const total = HEROES.length + ANIM_FILES.length;
  let done = 0;
  const load = (url) => new Promise((resolve, reject) => {
    loader.load(url, (g) => { done++; onProgress(done / total); resolve(g); }, undefined,
      () => reject(new Error('Не удалось загрузить ' + url)));
  });

  const loaded = await Promise.all([
    ...ANIM_FILES.map((f) => load(`assets/models/anim/${f}.glb`)),
    ...HEROES.map((h) => load(`assets/models/heroes/${h.file}.glb`)),
  ]);
  const gltfs = loaded.slice(ANIM_FILES.length);
  const clips = loaded.slice(0, ANIM_FILES.length).flatMap((g) => g.animations);
  console.info('Анимации в наборе:', clips.map((c) => c.name).join(', '));   // список можно посмотреть в консоли браузера
  const byName = new Map(clips.map((c) => [c.name, c]));
  const need = (name) => {
    const c = byName.get(name);
    if (!c) throw new Error('Нет анимации ' + name);
    return c;
  };
  const idleClip = need('Idle_A');
  const runClip = need('Running_A');                   
  const joyClip = byName.get('Jump_Full_Short') || null;   // радость на победе: прыжок, повторяется

  return gltfs.map((gltf, i) => {
    const model = gltf.scene;
    model.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });

    // Приводим героя к нужному росту и ставим ногами на землю
    const box = new THREE.Box3().setFromObject(model);
    const h = box.max.y - box.min.y;
    const k = h > 0.1 ? HERO_HEIGHT / h : 1;
    model.scale.setScalar(k);
    model.position.y = -box.min.y * k;

    const root = new THREE.Group(); // за этот «контейнер» двигаем и поворачиваем героя
    root.add(model);

    const mixer = new THREE.AnimationMixer(model);
    // Постоянные позы (повторяются по кругу)
    const poses = { idle: mixer.clipAction(idleClip), run: mixer.clipAction(runClip) };
    if (joyClip) poses.joy = mixer.clipAction(joyClip);
    const once = new Map();         // разовые анимации по имени (Hit_B, Throw и т. д.)
    let current = null;             // что играет сейчас
    let wanted = poses.idle;        // в какую позу вернуться после разовой анимации
    let playing = null;             // разовая анимация, которая играет сейчас

    function crossTo(next, fade) {
      if (current === next) return;
      next.reset().fadeIn(fade).play();
      if (current) current.fadeOut(fade);
      current = next;
    }
    // Разовая анимация закончилась: возвращаемся к позе (бег или ожидание)
    mixer.addEventListener('finished', (e) => {
      if (e.action !== playing) return;
      playing = null;
      crossTo(wanted, 0.2);
    });

    return {
      name: HEROES[i].name,
      root,
      mixer,
      chest: model.getObjectByName('chest') || model,   // кость груди: за ней едет медаль
      hasJoyClip: !!joyClip,   // есть ли анимация радости (иначе герой просто подпрыгивает)
      // Включить позу: 'idle' (ожидание), 'run' (бег) или 'joy' (радость). Обрывает разовую анимацию.
      setPose(pose) {
        wanted = poses[pose] || poses.idle;
        playing = null;
        crossTo(wanted, 0.2);
      },
      // Сыграть анимацию один раз по имени и вернуться к позе: 'Hit_B', 'Throw', 'Interact'...
      playOnce(name, fade = 0.15, hold = false) {
        const clip = byName.get(name);
        if (!clip) return false;
        let a = once.get(name);
        if (!a) {
          a = mixer.clipAction(clip);
          a.setLoop(THREE.LoopOnce, 1);
          a.clampWhenFinished = true;
          once.set(name, a);
        }
        if (playing === a) { a.reset().play(); return true; }   // уже играет: начинаем заново
        playing = a;
        crossTo(a, fade);
        if (hold) playing = null;   // hold: после конца герой остаётся в последней позе (не возвращается к бегу)
        return true;
      },
      // Длина анимации в секундах (0, если такой анимации нет в наборе)
      clipLength(name) { const c = byName.get(name); return c ? c.duration : 0; },
      hitB() { return this.playOnce('Hit_B', 0.05); },      // удар в ограждение или падение в дыру
      death() { return this.playOnce('Death_A', 0.1, true); },   // сердца закончились: герой падает и остаётся лежать
    };
  });
}

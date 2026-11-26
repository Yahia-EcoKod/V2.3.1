// Все настройки игры в одном месте. Числа можно менять.

export const LANES = [-1.7, 0, 1.7];   // положение трёх дорожек по ширине
export const TILE_LEN = 24;            // длина одного куска дороги
export const TILE_COUNT = 5;           // сколько кусков дороги одновременно
export const ROAD_HALF = 2.7;          // половина ширины дороги
export const FENCE_X = 2.95;           // где стоят заборы
export const HERO_HEIGHT = 1.7;        // рост героя в мире игры
export const SPEED_START = 8;          // стартовая скорость (этап 6: было 9)
export const SPEED_MAX = 12;           // максимальная скорость (этап 6: было 16)
export const SPEED_GROWTH = 0.05;      // на сколько растёт скорость за секунду (этап 6: было 0.12)

// Этап 3а: цвета мира (палитра из game-spec-v2.md)
export const SKY_TOP = 0x61c5fd;       // небо вверху
export const SKY_HORIZON = 0xceebfc;   // небо у горизонта (в этот же цвет уходит туман вдали)
export const GRASS_COLOR = 0x92d46a;   // трава (светлая полоса; тёмная считается от неё в world.js)
export const ROAD_COLOR = 0xf0d49a;    // дорога

// Этап 3: препятствия, семена, сердца
export const LIVES = 3;                // сколько сердец у игрока
export const INVULN_TIME = 1.2;        // сколько секунд герой мерцает после удара (в это время сердце не теряется)
export const SEED_POINTS = 10;         // очков за одно семя
export const SPAWN_Z = -70;            // где вдалеке появляются предметы
export const REMOVE_Z = 9;             // где предметы исчезают (уже позади героя)
export const ROW_GAP = 15;             // расстояние между «рядами» предметов на дороге
export const HIT_DX = 0.8;             // насколько близко по ширине герой должен быть к предмету

// Ширина игрового окна не больше 62% его высоты (на ноутбуке игра идёт узкой колонкой по центру)
export const MAX_FRAME_ASPECT = 0.62;

// Герои: имя файла в assets/models/heroes и имя на экране (имена можно менять здесь)
export const HEROES = [
  // show: «номера» героя на экране выбора (названия анимаций из набора KayKit). Их можно менять местами и добавлять.
  { file: 'Ranger',       name: 'Яша',   show: ['Throw', 'Jump_Full_Short', 'Interact'] },
  { file: 'Knight',       name: 'Игорь', show: ['Use_Item', 'Interact', 'Jump_Full_Long'] },
  { file: 'Mage',         name: 'Женя',  show: ['Use_Item', 'Throw', 'Idle_B'] },
  { file: 'Barbarian',    name: 'Давид', show: ['Jump_Full_Long', 'PickUp', 'Throw'] },
  { file: 'Rogue',        name: 'Катя',  show: ['Jump_Full_Short', 'Idle_B', 'Interact'] },
  { file: 'Rogue_Hooded', name: 'Даша',  show: ['PickUp', 'Use_Item', 'Jump_Full_Short'] },
];
export const SHOW_FIRST_DELAY = 1.2;   // через сколько секунд после выбора героя он показывает первый «номер»
export const SHOW_EVERY = 4;           // как часто (секунд) герой показывает новый «номер», если ничего не нажимать
export const MENU_SPIN_SPEED = 0.012;     // на сколько радиан поворачивается герой на каждый пиксель движения пальца
export const MENU_SPIN_BACK_DELAY = 3;    // через сколько секунд после отпускания герой плавно разворачивается к игроку
export const MENU_SWITCH_TIME = 0.35;     // сколько секунд герои меняются местами

// Разделы по классам
export const SECTIONS = [
  { id: '1-4',  title: '1-4 классы',  name: 'Исследователь' },
  { id: '5-8',  title: '5-8 классы',  name: 'Натуралист' },
  { id: '9-11', title: '9-11 классы', name: 'Эксперт природы' },
];

// Этап 4: задания (ворота с вопросами)
export const QUESTIONS_URL = 'data/questions.json';   // откуда читаем вопросы
export const IMAGES_DIR = 'assets/images/';           // папка с картинками (пути в вопросах считаются от неё)
export const QUESTIONS_TO_WIN = 20;    // сколько заданий нужно пройти до победы
export const GATE_EVERY_ROWS = 3;      // сколько рядов с препятствиями между воротами
export const CORRECT_POINTS = 50;      // очков за правильный ответ
export const GATE_WIN_W = 1.6;         // ширина окна ворот
export const GATE_WIN_H = 1.9;         // высота окна ворот

// Этап 5: лес, ошибки, конец игры
export const FEEDBACK_TIME = 1.6;      // сколько секунд показываем красное/зелёное после ответа
export const TREE_GROW_TIME = 0.9;     // сколько секунд растёт одно дерево
export const END_TREE_DELAY = 0.12;    // на экране конца: пауза между деревьями (лес вырастает по очереди)
export const GRAY_MAX = 0.9;           // насколько серым становится мир при ошибке (1 = совсем чёрно-белый)
export const GRAY_IN = 0.25;           // за сколько секунд мир сереет
export const GRAY_HOLD = 0.8;          // сколько секунд мир остаётся серым
export const GRAY_OUT = 2.6;           // за сколько секунд цвет возвращается

// Этап 6: баланс и финиш
// Файлы с анимациями из папки assets/models/anim (без .glb). Нужны ещё анимации из набора KayKit?
// Добавьте сюда имя файла и положите его в ту папку.
export const ANIM_FILES = ['Rig_Medium_General', 'Rig_Medium_MovementBasic'];
export const MEDAL_DY = -0.10;         // на сколько медаль ниже кости груди (отрицательное число = ниже)
export const MEDAL_Z = 0.30;           // насколько медаль выдвинута вперёд от героя (если «тонет» в теле, увеличьте)
export const MEDAL_POP_DELAY = 0.5;    // через сколько секунд после начала финиша появляется медаль
export const MEDAL_POP_TIME = 0.5;     // за сколько секунд медаль «вырастает»
export const JOY_HOP_HEIGHT = 0.28;    // запасной вариант: высота подпрыгивания, если нет анимации прыжка
export const JOY_HOP_SPEED = 6;        // запасной вариант: как часто подпрыгивает

// Этап 7: звуки и музыка (файлы лежат в assets/audio/sfx и assets/audio/music, формат mp3)
export const SFX_FILES = {
  click: 'button_click',       // нажатие кнопки
  seed: 'collect_seed',        // собрано семя
  correct: 'correct_answer',   // верный ответ
  wrong: 'wrong_answer',       // неверный ответ
  collision: 'collision',      // удар в ограждение или падение в дыру
  victory: 'victory',          // победа
  gameOver: 'game_over',       // проигрыш
};
export const MUSIC_FILES = {
  menu: 'music_menu',          // музыка в меню
  game: 'music_game',          // музыка в игре
};
export const MUSIC_VOLUME = 0.4;   // громкость музыки (0 - тишина, 1 - максимум)
export const SFX_VOLUME = 0.9;     // громкость звуков

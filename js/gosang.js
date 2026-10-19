/* ============================================================
   거상풍 엔진 — 유기적 지형 · 빽빽한 초목 · 8방향 스프라이트 · 깊이 정렬
   스프라이트는 블렌더로 구운 images/sprites, images/props
   ============================================================ */
(() => {
'use strict';
const $ = id => document.getElementById(id);

/* ---------------- 잡음 (지형 섞기용) ---------------- */
function hash2(x, y, s = 0) {
  let h = (x * 374761393 + y * 668265263 + s * 982451653) | 0;
  h = (h ^ (h >>> 13)) * 1274126177 | 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function noise2(x, y, s = 0) {                 // 부드러운 값잡음
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s);
  const c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}
function fbm(x, y, s = 0) {
  return noise2(x, y, s) * 0.55 + noise2(x * 2.1, y * 2.1, s + 7) * 0.28 + noise2(x * 4.3, y * 4.3, s + 13) * 0.17;
}

/* ---------------- 스프라이트 ---------------- */
const SPR = {}, PROP = {};
let loaded = 0, total = 0;
function imgLoad(src, store, key, info) {
  const img = new Image(); img.src = src; total++;
  img.onload = () => loaded++;
  img.onerror = () => loaded++;
  store[key] = { img, ...info };
}

/* ---------------- 맵 ---------------- */
const TW = 64, TH = 32;
const MAP = { w: 60, h: 60, blocked: [], props: [], scatter: [] };

/* 지면 종류: 0 흙길 · 1 풀 · 2 마른풀 · 3 석회암 · 4 올리브 덤불 · 5 포석 · 6 바다 · 7 모래 */
function groundAt(x, y) {
  const sea = seaMask(x, y);
  if (sea > 0.5) return 6;
  if (sea > 0.0) return 7;
  if (plazaMask(x, y)) return 5;
  const road = roadMask(x, y);
  if (road > 0.5) return 0;
  const n = fbm(x * 0.085, y * 0.085, 1);
  const m = fbm(x * 0.165, y * 0.165, 5);
  if (n < 0.33) return 2;
  if (n > 0.71) return 4;
  if (m > 0.74) return 3;
  return 1;
}
/* 바다: 섬의 북서쪽이 에게해. 1 이면 물, 0~1 사이는 모래사장 */
function seaMask(x, y) {
  const shore = 11 + Math.sin(y * 0.21) * 2.6 + Math.sin(y * 0.077) * 3.4
                   + fbm(x * 0.06, y * 0.06, 91) * 4.0;
  const d = shore - x;                       // 양수면 바다 쪽
  if (d > 2.6) return 1;
  if (d > -1.4) return (d + 1.4) / 4.0;
  return 0;
}
/* 바다 깊이 — 멀수록 짙어요 */
function seaDepth(x, y) {
  const shore = 11 + Math.sin(y * 0.21) * 2.6 + Math.sin(y * 0.077) * 3.4;
  return Math.max(0, Math.min(1, (shore - x) / 13));
}
/* 광장: 신전 앞 포석 마당 */
function plazaMask(x, y) {
  const dx = x - 30, dy = y - 31;
  return (dx*dx) / 72 + (dy*dy) / 42 < 1;
}
/* 길: 마을을 가로지르는 두 갈래 + 구불구불 */
function roadMask(x, y) {
  const wig1 = Math.sin(x * 0.18) * 2.6 + Math.sin(x * 0.07) * 4.2;
  const d1 = Math.abs(y - 30 - wig1);
  const wig2 = Math.sin(y * 0.16) * 3.0 + Math.cos(y * 0.06) * 3.6;
  const d2 = Math.abs(x - 28 - wig2);
  const d = Math.min(d1, d2);
  return d < 1.45 ? 1 : d < 2.55 ? 1 - (d - 1.45) / 1.1 : 0;
}

const TREES  = ['olive', 'cypress', 'pine_umb', 'fig', 'laurel'];
const BUSHES = ['shrub_laurel', 'shrub_myrtle', 'shrub_thyme', 'shrub_dry'];
const GRASS  = ['grass_green', 'grass_dry', 'wheat'];
const ROCKS  = ['rock_lime', 'rock_marble'];

function genMap() {
  const { w, h } = MAP;
  for (let y = 0; y < h; y++) { MAP.blocked[y] = []; for (let x = 0; x < w; x++) MAP.blocked[y][x] = 0; }
  const block = (x, y, bw, bh) => {
    for (let j = 0; j < bh; j++) for (let i = 0; i < bw; i++)
      if (MAP.blocked[y + j] !== undefined && MAP.blocked[y + j][x + i] !== undefined) MAP.blocked[y + j][x + i] = 1;
  };
  // 여러 칸을 차지하는 건물은 발자국 한가운데를 기준점으로 삼아야 앞뒤가 맞아요
  const put = (kind, x, y, bw = 1, bh = 1, extra) => {
    MAP.props.push(Object.assign({ kind, x: x + (bw - 1) / 2, y: y + (bh - 1) / 2 }, extra));
    block(x, y, bw, bh);
  };
  // 바다는 걸어 들어갈 수 없어요
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++)
    if (seaMask(x, y) > 0.35) MAP.blocked[y][x] = 1;

  // 이타카 — 언덕 위 신전, 그 앞 포석 광장, 둘레에 흰 집과 아고라
  put('temple', 27, 20, 5, 4);
  [[20, 25], [42, 26], [19, 41], [43, 40], [24, 48], [36, 47]].forEach(([x, y], i) => {
    put(i % 2 === 0 ? 'house' : 'villa', x, y, 3, 3);
  });
  put('stoa', 34, 35, 3, 2);
  put('stoa', 23, 35, 3, 2);
  put('altar', 30, 26, 1, 1);
  put('well', 30, 38, 1, 1);
  [[26, 29], [34, 29], [26, 33], [34, 33]].forEach(([x, y]) => put('brazier', x, y));
  [[22, 30], [38, 30]].forEach(([x, y]) => put('statue', x, y));
  [[27, 16], [32, 16], [15, 32], [45, 32]].forEach(([x, y]) => put('herm', x, y));
  [[31, 39], [28, 39], [37, 37], [22, 37]].forEach(([x, y]) => put('amphora', x, y));
  // 바닷가 쪽 폐허와 흩어진 기둥 — 오디세이아의 옛 영광
  put('ruin', 47, 46, 2, 2);
  put('ruin', 20, 12, 2, 2);
  [[16, 15], [45, 44], [50, 49], [23, 52], [49, 20], [19, 46]].forEach(([x, y]) => put('column', x, y));
  // 신화 — 하늘에 떠 있는 부서진 신전, 땅에 반쯤 묻힌 거신상
  put('temple', 24, 8, 5, 4, { float: 96, bob: 1 });
  put('statue', 44, 15, 1, 1, { big: 2.4, tilt: 1 });
  put('column', 41, 12, 1, 1, { big: 1.8 });
  put('column', 47, 18, 1, 1, { big: 1.5, tilt: 1 });

  // 초목: 길과 건물을 피해 빽빽하게
  const free = (x, y, r = 1) => {
    for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
      const nx = x + i, ny = y + j;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) return false;
      if (MAP.blocked[ny][nx]) return false;
    }
    return roadMask(x, y) < 0.25 && !plazaMask(x, y) && seaMask(x, y) <= 0;
  };
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const dens = fbm(x * 0.12, y * 0.12, 21);
    const r = hash2(x, y, 31);
    if (!free(x, y)) continue;
    const g = groundAt(x, y);
    if (dens > 0.60 && r > 0.72) {                      // 큰 나무 (길 막음)
      const t = TREES[(hash2(x, y, 41) * TREES.length) | 0];
      MAP.props.push({ kind: t, x, y }); MAP.blocked[y][x] = 1;
    } else if (r > 0.55 && g !== 0) {                    // 수풀·바위 (지나갈 수 있음)
      const pick = hash2(x, y, 51);
      const kind = pick > 0.90 ? ROCKS[(pick * 10 | 0) % ROCKS.length]
                 : pick > 0.58 ? BUSHES[(pick * 20 | 0) % BUSHES.length]
                 : GRASS[(pick * 30 | 0) % GRASS.length];
      MAP.scatter.push({ kind, x: x + hash2(x, y, 61) * 0.7 - 0.35, y: y + hash2(x, y, 71) * 0.7 - 0.35 });
    }
  }
}
genMap();
const walkable = (x, y) => x >= 0 && y >= 0 && x < MAP.w && y < MAP.h && !MAP.blocked[y][x];

/* ---------------- 좌표 ---------------- */
const isoX = (x, y) => (x - y) * (TW / 2);
const isoY = (x, y) => (x + y) * (TH / 2);
function screenToTile(sx, sy) { const a = sx / (TW / 2), b = sy / (TH / 2); return [(a + b) / 2, (b - a) / 2]; }

/* ---------------- 길 찾기 ---------------- */
function findPath(sx, sy, tx, ty) {
  sx |= 0; sy |= 0; tx |= 0; ty |= 0;
  if (!walkable(tx, ty)) {
    let best = null, bd = 1e9;
    for (let r = 1; r < 6 && !best; r++)
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        const nx = tx + dx, ny = ty + dy;
        if (!walkable(nx, ny)) continue;
        const d = Math.hypot(nx - tx, ny - ty);
        if (d < bd) { bd = d; best = [nx, ny]; }
      }
    if (!best) return null;
    tx = best[0]; ty = best[1];
  }
  const key = (x, y) => y * MAP.w + x;
  const open = [[sx, sy]], g = new Map([[key(sx, sy), 0]]), par = new Map();
  const H = (x, y) => Math.hypot(x - tx, y - ty);
  const f = new Map([[key(sx, sy), H(sx, sy)]]);
  const seen = new Set();
  let guard = 20000;
  while (open.length && guard-- > 0) {
    let bi = 0, bf = 1e9;
    for (let i = 0; i < open.length; i++) { const v = f.get(key(open[i][0], open[i][1])) ?? 1e9; if (v < bf) { bf = v; bi = i; } }
    const [cx, cy] = open.splice(bi, 1)[0], ck = key(cx, cy);
    if (cx === tx && cy === ty) {
      const path = []; let k = ck;
      while (k !== undefined) { path.push([k % MAP.w, (k / MAP.w) | 0]); k = par.get(k); }
      return path.reverse().slice(1);
    }
    if (seen.has(ck)) continue;
    seen.add(ck);
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) {
      const nx = cx + dx, ny = cy + dy;
      if (!walkable(nx, ny)) continue;
      if (dx && dy && (!walkable(cx + dx, cy) || !walkable(cx, cy + dy))) continue;
      const ng = (g.get(ck) || 0) + (dx && dy ? 1.42 : 1), nk = key(nx, ny);
      if (g.has(nk) && g.get(nk) <= ng) continue;
      g.set(nk, ng); par.set(nk, ck); f.set(nk, ng + H(nx, ny));
      open.push([nx, ny]);
    }
  }
  return null;
}

/* ---------------- 인물 ---------------- */
function Actor(key, x, y, o = {}) {
  return { key, x, y, dir: 4, anim: 'idle', frame: 0, t: Math.random() * 40,
           path: null, speed: 3.2, follow: null, hp: 100, maxHp: 100, name: '', atk: 0, hurt: 0, ...o };
}
const player = Actor('dad', 28, 34, { name: '전시현', speed: 3.4 });
const mom = Actor('mom', 27, 35, { name: '세은', follow: player, speed: 3.6 });
const ian = Actor('ian', 26, 35, { name: '이안', follow: mom, speed: 3.6 });
const actors = [player, mom, ian];

/* 화면상 진행 방향 → 스프라이트 방향(0=정면, 시계 반대로 45°씩).
   블렌더에서 root 를 +Z 로 d*45° 돌려 구웠으므로 화면 각도는 (π/2 − d·π/4) 입니다.
   예전 식은 부호가 반대라 좌우가 뒤집혀 문워크처럼 보였어요. */
function dirFrom(dx, dy) {
  const ang = Math.atan2(isoY(dx, dy), isoX(dx, dy));
  return (((Math.round((Math.PI / 2 - ang) / (Math.PI / 4)) % 8) + 8) % 8);
}
function stepActor(a, dt) {
  a.t += dt;
  if (a.hurt > 0) a.hurt -= dt;
  if (a.atk > 0) { a.atk -= dt; a.anim = 'attack'; }
  else if (a.follow) {
    const t = a.follow, d = Math.hypot(t.x - a.x, t.y - a.y);
    if (d > 1.3) {
      const sp = Math.min(a.speed * dt, d - 1.1);
      a.x += (t.x - a.x) / d * sp; a.y += (t.y - a.y) / d * sp;
      a.dir = dirFrom(t.x - a.x, t.y - a.y); a.anim = 'walk';
    } else a.anim = 'idle';
  } else if (a.path && a.path.length) {
    const [tx, ty] = a.path[0], dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy);
    if (d < 0.12) { a.x = tx; a.y = ty; a.path.shift(); }
    else { const sp = Math.min(a.speed * dt, d); a.x += dx / d * sp; a.y += dy / d * sp; a.dir = dirFrom(dx, dy); }
    a.anim = 'walk';
  } else a.anim = 'idle';
  const info = SPR[a.key];
  if (info && info.anims) {
    const an = info.anims[a.anim] || info.anims.idle;
    const fps = a.anim === 'walk' ? 11 : a.anim === 'attack' ? 14 : 6;
    a.frame = Math.floor(a.t * fps) % an.frames;
  }
  // 걸을 때 흙먼지
  a.stepT = (a.stepT || 0) + (a.anim === 'walk' ? dt : -dt * 2);
  if (a.stepT > 0.34) { a.stepT = 0; if (groundAt(Math.round(a.x), Math.round(a.y)) === 0) puff(a.x, a.y); }
  if (a.stepT < 0) a.stepT = 0;
}


/* ================= 이타카 사람들과 동물 ================= */
const TALK = {
  merchant: ['올리브기름 한 병 어떠시오. 이타카에서 제일 좋은 것이오.',
             '바다 건너 소식 말이오? …요즘은 배가 잘 안 들어옵니다.',
             '값은 깎아드리지. 아이가 참 곱구먼.'],
  fisher:   ['오늘은 바다가 잠잠해. 그물을 던지기 좋은 날이지.',
             '서쪽 물길은 조심하시오. 거기엔… 뭔가 있소.',
             '이십 년 전에도 저 신전은 저렇게 떠 있었소.'],
  elder:    ['그 사람은 돌아올 걸세. 반드시.',
             '신들은 기다리는 자를 미워하지 않아.',
             '광장 바닥의 문양 말인가. 아무도 누가 새겼는지 모른다네.'],
  woman:    ['우물물이 요새 차가워졌어요. 가을이 오려나 봐요.',
             '아이들이 또 올리브밭으로 갔네. 해 지기 전엔 와야 할 텐데.',
             '제단의 불은 꺼뜨리면 안 돼요. 절대로.'],
  girl:     ['저기 떠 있는 거 봤어요? 밤엔 더 잘 보여요!',
             '염소가 또 도망갔어요. 같이 찾아줄래요?',
             '엄마가 바닷가엔 가지 말래요.'],
  boy:      ['나는 커서 배를 탈 거예요. 아주 먼 데까지!',
             '저 석상, 밤에 눈이 빛나는 거 봤어요. 진짜로요.',
             '달리기 시합할래요?'],
  goat:     ['메에—'],
  cat:      ['갸릉…'],
  dove:     ['구구.'],
};
const NPC_SPAWN = [
  ['merchant', 35, 33, 2.0], ['merchant', 23, 33, 1.9],
  ['fisher',   18, 28, 2.1], ['fisher',   19, 43, 2.0],
  ['elder',    30, 29, 1.5], ['woman',    30, 40, 1.8],
  ['girl',     27, 33, 2.6], ['boy',      33, 31, 2.7],
  ['goat',     22, 45, 1.6], ['goat',     24, 47, 1.5], ['goat', 21, 46, 1.7],
  ['cat',      31, 35, 2.2], ['cat',      26, 27, 2.0],
  ['dove',     29, 26, 2.4], ['dove',     32, 25, 2.3], ['dove', 27, 26, 2.5],
];
/* 막힌 칸에 생기면 가까운 빈 칸을 찾아 옮겨요 */
function freeSpot(x, y) {
  if (walkable(x, y)) return [x, y];
  for (let r = 1; r <= 6; r++)
    for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++)
      if (Math.max(Math.abs(i), Math.abs(j)) === r && walkable(x + i, y + j)) return [x + i, y + j];
  return [x, y];
}
const npcs = [];
for (const [kind, sx0, sy0, sp] of NPC_SPAWN) {
  const [x, y] = freeSpot(sx0, sy0);
  const a = Actor(kind, x, y, { speed: sp });
  a.home = [x, y];
  a.wait = Math.random() * 4;
  a.anim = 'idle';
  a.lineIdx = 0;
  npcs.push(a);
}
function stepNpc(a, dt) {
  a.t += dt;
  if (a.talk > 0) { a.talk -= dt; a.anim = 'idle'; a.path = null; }
  else if (a.path && a.path.length) {
    const [tx, ty] = a.path[0], dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy);
    if (d < 0.12) { a.x = tx; a.y = ty; a.path.shift(); }
    else { const sp = Math.min(a.speed * dt, d); a.x += dx / d * sp; a.y += dy / d * sp; a.dir = dirFrom(dx, dy); }
    a.anim = 'walk';
  } else {
    a.anim = 'idle';
    a.wait -= dt;
    if (a.wait <= 0) {
      a.wait = 2 + Math.random() * 6;
      const r = a.key === 'dove' ? 3 : a.key === 'cat' ? 5 : 4;
      const tx = Math.round(a.home[0] + (Math.random() * 2 - 1) * r);
      const ty = Math.round(a.home[1] + (Math.random() * 2 - 1) * r);
      const path = findPath(Math.round(a.x), Math.round(a.y), tx, ty);
      if (path && path.length && path.length < 14) a.path = path;
    }
  }
  const info = SPR[a.key];
  if (info && info.anims) {
    const an = info.anims[a.anim] || info.anims.idle;
    const fps = a.anim === 'walk' ? (a.key === 'dove' ? 14 : 10) : 5;
    a.frame = Math.floor(a.t * fps) % an.frames;
  }
}
/* 말 걸기 */
let speech = null;
function tryTalk() {
  let best = null, bd = 3.2;
  for (const a of npcs) {
    const d = Math.hypot(a.x - player.x, a.y - player.y);
    if (d < bd) { bd = d; best = a; }
  }
  const hint = $('hint');
  if (!best) { if (hint) hint.textContent = '말을 걸 사람이 가까이 없어요'; return; }
  const lines = TALK[best.key] || ['…'];
  const line = lines[best.lineIdx % lines.length];
  best.lineIdx++;
  best.talk = 3.0;
  best.dir = dirFrom(player.x - best.x, player.y - best.y);
  speech = { a: best, t: 0, line };
  if (hint) hint.textContent = line;
}
function drawSpeech() {
  if (!speech) return;
  speech.t += lastDt;
  if (speech.t > 3.0) { speech = null; return; }
  const a = speech.a;
  const px = isoX(a.x, a.y) - camX, py = isoY(a.x, a.y) - camY - 96;
  ctx.font = '600 11px "Noto Sans KR", sans-serif'; ctx.textAlign = 'center';
  const w = Math.min(230, ctx.measureText(speech.line).width + 18);
  const fade = Math.min(1, (3.0 - speech.t) * 2);
  ctx.globalAlpha = fade;
  ctx.fillStyle = 'rgba(28,22,18,.86)';
  ctx.beginPath(); ctx.roundRect(px - w / 2, py - 15, w, 24, 6); ctx.fill();
  ctx.strokeStyle = 'rgba(214,176,112,.6)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(px - 5, py + 9); ctx.lineTo(px, py + 15); ctx.lineTo(px + 5, py + 9);
  ctx.fillStyle = 'rgba(28,22,18,.86)'; ctx.fill();
  ctx.fillStyle = '#f6edd6';
  ctx.fillText(speech.line, px, py + 2);
  ctx.globalAlpha = 1;
}

/* ---------------- 화면 ---------------- */
const cv = $('gl'), ctx = cv.getContext('2d');
let SW = 0, SH = 0, DPR = 1, camX = 0, camY = 0, zoom = 1;
let groundDirty = true, gOffX = 0, gOffY = 0;
function resize() {
  DPR = Math.min(devicePixelRatio || 1, 2);
  SW = innerWidth; SH = innerHeight;
  cv.width = SW * DPR; cv.height = SH * DPR;
  cv.style.width = SW + 'px'; cv.style.height = SH + 'px';
  zoom = SW < 700 ? 1.30 : 1.15;
  groundDirty = true;
}
addEventListener('resize', resize); resize();

/* 지면 색 — 거상처럼 탁한 자연색 */
const GC = [
  ['#c0a070', '#b39566', '#cdae7e'],   // 0 흙길 — 볕에 마른 흙
  ['#6e9440', '#648a39', '#7ca24e'],   // 1 풀
  ['#bdaa52', '#b09d49', '#c8b65f'],   // 2 여름 마른 들판
  ['#bcb59f', '#b0a994', '#c7c0ab'],   // 3 석회암
  ['#4d7437', '#456b31', '#587f41'],   // 4 올리브 덤불
  ['#d6cdb8', '#c9c0ac', '#e1d9c6'],   // 5 광장 포석
  ['#1c5f82', '#17506f', '#246f94'],   // 6 바다
  ['#ded0a6', '#d2c398', '#e9dcb6'],   // 7 모래사장
];

/* 지면을 오프스크린에 한 번만 그려두고 재사용 */
const gcv = document.createElement('canvas'), gctx = gcv.getContext('2d');
const bcv = document.createElement('canvas'), bctx = bcv.getContext('2d');
function paintGround() {
  const pad = 400;
  const vw = Math.ceil(SW / zoom) + pad * 2, vh = Math.ceil(SH / zoom) + pad * 2;
  gcv.width = vw; gcv.height = vh;
  gOffX = camX - pad; gOffY = camY - pad;
  const g = gctx;
  g.clearRect(0, 0, vw, vh);
  const half = TW / 2 + 1, hh = TH / 2 + 1;   // 1px 겹쳐 그려 격자 이음새를 없애요
  // 보이는 범위의 타일만
  const [ax, ay] = screenToTile(gOffX, gOffY);
  const [bx, by] = screenToTile(gOffX + vw, gOffY);
  const [cx2, cy2] = screenToTile(gOffX, gOffY + vh);
  const [dx2, dy2] = screenToTile(gOffX + vw, gOffY + vh);
  const x0 = Math.max(0, Math.floor(Math.min(ax, bx, cx2, dx2)) - 1);
  const x1 = Math.min(MAP.w - 1, Math.ceil(Math.max(ax, bx, cx2, dx2)) + 1);
  const y0 = Math.max(0, Math.floor(Math.min(ay, by, cy2, dy2)) - 1);
  const y1 = Math.min(MAP.h - 1, Math.ceil(Math.max(ay, by, cy2, dy2)) + 1);
  // 1차 — 지면 바탕색 + 이웃 지면 번짐
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const px = isoX(x, y) - gOffX, py = isoY(x, y) - gOffY;
    const t = groundAt(x, y), pal = GC[t];
    const shade = fbm(x * 0.33, y * 0.33, 9);
    g.fillStyle = pal[(shade * 3) | 0];
    g.beginPath(); g.moveTo(px, py - hh); g.lineTo(px + half, py); g.lineTo(px, py + hh); g.lineTo(px - half, py); g.closePath(); g.fill();
    if (t === 6) {                       // 깊이에 따라 짙어지는 바다 (흐림에 섞여 경계가 안 보여요)
      g.fillStyle = `rgba(6,30,56,${0.08 + seaDepth(x, y) * 0.50})`;
      g.beginPath(); g.moveTo(px, py - hh); g.lineTo(px + half, py); g.lineTo(px, py + hh); g.lineTo(px - half, py); g.closePath(); g.fill();
    }
    for (const [dx, dy] of [[1,0],[0,1],[-1,0],[0,-1]]) {
      const nt = groundAt(x + dx, y + dy);
      if (nt === t) continue;
      const np = GC[nt];
      g.save(); g.beginPath();
      g.moveTo(px, py - hh); g.lineTo(px + half, py); g.lineTo(px, py + hh); g.lineTo(px - half, py); g.closePath(); g.clip();
      g.globalAlpha = 0.62;
      const ex = isoX(x + dx * 0.62, y + dy * 0.62) - gOffX, ey = isoY(x + dx * 0.62, y + dy * 0.62) - gOffY;
      const rg = g.createRadialGradient(ex, ey, 2, ex, ey, 34);
      rg.addColorStop(0, np[1]); rg.addColorStop(1, np[1] + '00');
      g.fillStyle = rg; g.fillRect(px - half, py - hh, TW + 2, TH + 2);
      g.restore();
    }
  }

  // 2차 — 흐리게 뭉개 격자 자국을 지워요 (거상의 그려 넣은 땅 느낌)
  try {
    bcv.width = vw; bcv.height = vh;
    bctx.clearRect(0, 0, vw, vh);
    bctx.filter = 'blur(3.5px)'; bctx.drawImage(gcv, 0, 0); bctx.filter = 'none';
    g.save(); g.globalCompositeOperation = 'copy'; g.drawImage(bcv, 0, 0); g.restore();
  } catch (e) { /* filter 미지원 브라우저는 그대로 */ }

  // 3차 — 큰 얼룩: 햇빛 든 자리와 구름 그늘
  for (let y = y0 - 2; y <= y1 + 2; y += 4) for (let x = x0 - 2; x <= x1 + 2; x += 4) {
    const v = fbm(x * 0.045, y * 0.045, 77);
    if (v > 0.40 && v < 0.62) continue;
    const px = isoX(x, y) - gOffX, py = isoY(x, y) - gOffY;
    const warm = v >= 0.62;
    const k = warm ? (v - 0.62) / 0.38 : (0.40 - v) / 0.40;
    const rg = g.createRadialGradient(px, py, 4, px, py, 150);
    rg.addColorStop(0, warm ? `rgba(255,246,206,${0.12 + k * 0.15})` : `rgba(58,62,70,${0.06 + k * 0.09})`);
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg; g.fillRect(px - 150, py - 80, 300, 160);
  }

  // 3.5차 — 먼 바다: 안개와 섬 그림자
  if (x0 < 14) {
    const ISLANDS = [[-9, 20, 150, 46], [-14, 36, 190, 58], [-6, 50, 120, 38], [-18, 8, 130, 40]];
    for (const [ix, iy, iw, ih] of ISLANDS) {
      const px = isoX(ix, iy) - gOffX, py = isoY(ix, iy) - gOffY;
      if (px < -500 || px > vw + 500 || py < -300 || py > vh + 300) continue;
      g.save();
      g.fillStyle = 'rgba(86,112,132,.52)';
      g.beginPath();
      g.moveTo(px - iw, py + ih * 0.30);
      g.quadraticCurveTo(px - iw * 0.45, py - ih * 0.85, px, py - ih * 0.55);
      g.quadraticCurveTo(px + iw * 0.50, py - ih * 1.05, px + iw, py + ih * 0.30);
      g.closePath(); g.fill();
      g.fillStyle = 'rgba(132,158,176,.34)';
      g.beginPath();
      g.ellipse(px, py + ih * 0.30, iw, ih * 0.34, 0, 0, Math.PI, true);
      g.fill();
      g.restore();
    }
    // 수평선 안개
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const dp = seaDepth(x, y);
      if (dp < 0.60) continue;
      const px = isoX(x, y) - gOffX, py = isoY(x, y) - gOffY;
      g.fillStyle = `rgba(178,202,218,${(dp - 0.60) * 0.95})`;
      g.beginPath(); g.moveTo(px, py - TH / 2 - 1); g.lineTo(px + TW / 2 + 1, py);
      g.lineTo(px, py + TH / 2 + 1); g.lineTo(px - TW / 2 - 1, py); g.closePath(); g.fill();
    }
  }

  // 4차 — 풀잎·자갈·꽃 같은 손맛 디테일
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const px = isoX(x, y) - gOffX, py = isoY(x, y) - gOffY;
    groundDetail(g, groundAt(x, y), px, py, x, y);
  }
  groundDirty = false;
}
function groundDetail(g, t, px, py, x, y) {
  const h1 = hash2(x, y, 11), h2 = hash2(x, y, 22), h3 = hash2(x, y, 33);
  if (t === 1 || t === 4) {                       // 풀 · 올리브 덤불
    for (let k = 0; k < 7; k++) {
      const a = hash2(x, y, k) * 6.283, r = hash2(y, x, k) * 24;
      const gx = px + Math.cos(a) * r, gy = py + Math.sin(a) * r * 0.5;
      g.strokeStyle = k % 2 ? 'rgba(74,108,52,.52)' : 'rgba(164,194,104,.48)';
      g.lineWidth = 1; g.beginPath(); g.moveTo(gx, gy);
      g.lineTo(gx + (hash2(x, k, y) - .5) * 3, gy - 3 - hash2(k, y, x) * 4); g.stroke();
    }
    if (h3 > 0.92) {                              // 들꽃 — 흰 데이지 · 양귀비 · 라벤더
      g.fillStyle = ['#fff4e2', '#e8604e', '#b48ad8'][(h1 * 3) | 0];
      g.beginPath(); g.arc(px + (h2 - .5) * 18, py + (h3 - .5) * 9, 1.8, 0, 7); g.fill();
    }
  } else if (t === 0) {                           // 흙길 — 조약돌과 바퀴 자국
    for (let k = 0; k < 5; k++) {
      const a = hash2(x, y, k + 5) * 6.283, r = hash2(y, x, k + 5) * 26;
      g.fillStyle = hash2(x, k, y) > .5 ? 'rgba(158,132,92,.46)' : 'rgba(226,206,168,.44)';
      g.beginPath(); g.ellipse(px + Math.cos(a) * r, py + Math.sin(a) * r * 0.5, 2.4, 1.3, 0, 0, 7); g.fill();
    }
  } else if (t === 3) {                           // 석회암 — 갈라진 바위면
    for (let k = 0; k < 6; k++) {
      const a = hash2(x, y, k + 9) * 6.283, r = hash2(y, x, k + 9) * 25;
      g.fillStyle = 'rgba(150,144,130,.44)';
      g.beginPath(); g.ellipse(px + Math.cos(a) * r, py + Math.sin(a) * r * 0.5, 2.8, 1.5, 0, 0, 7); g.fill();
    }
  } else if (t === 2) {                           // 마른 들판 — 금빛 이삭
    for (let k = 0; k < 6; k++) {
      const a = hash2(x, y, k + 3) * 6.283, r = hash2(y, x, k + 3) * 24;
      const gx = px + Math.cos(a) * r, gy = py + Math.sin(a) * r * 0.5;
      g.strokeStyle = k % 2 ? 'rgba(196,176,92,.52)' : 'rgba(232,218,146,.46)';
      g.lineWidth = 1; g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx + 1, gy - 4); g.stroke();
    }
  } else if (t === 6) {                           // 바다 — 깊이에 따라 짙어지고 윤슬이 반짝
    const dp = seaDepth(x, y);
    for (let k = 0; k < 3; k++) {
      const a = hash2(x, y, k + 40), b2 = hash2(y, x, k + 40);
      g.strokeStyle = `rgba(190,232,245,${0.14 + (1 - dp) * 0.20})`;
      g.lineWidth = 1;
      const wx = px + (a - .5) * 46, wy = py + (b2 - .5) * 20;
      g.beginPath(); g.moveTo(wx - 5, wy); g.quadraticCurveTo(wx, wy - 2, wx + 5, wy); g.stroke();
    }
  } else if (t === 7) {                           // 모래사장 — 포말과 조개
    for (let k = 0; k < 5; k++) {
      const a = hash2(x, y, k + 60) * 6.283, r = hash2(y, x, k + 60) * 24;
      g.fillStyle = hash2(x, k, y) > .6 ? 'rgba(248,240,214,.52)' : 'rgba(196,178,132,.42)';
      g.beginPath(); g.ellipse(px + Math.cos(a) * r, py + Math.sin(a) * r * 0.5, 2.3, 1.2, 0, 0, 7); g.fill();
    }
    if (seaMask(x + 1, y) > 0.5 || seaMask(x, y + 1) > 0.5) {   // 파도 거품
      g.strokeStyle = 'rgba(255,255,255,.62)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(px - TW / 2, py); g.quadraticCurveTo(px, py + TH / 2 - 2, px + TW / 2, py); g.stroke();
    }
  } else if (t === 5) {                           // 광장 — 대리석 포석 (여기만 격자가 어울려요)
    const hw = TW / 2 - 3, hh = TH / 2 - 1.5;
    g.strokeStyle = 'rgba(176,166,146,.55)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(px, py - hh); g.lineTo(px + hw, py);
    g.lineTo(px, py + hh); g.lineTo(px - hw, py); g.closePath(); g.stroke();
    g.strokeStyle = 'rgba(255,250,238,.40)';
    g.beginPath(); g.moveTo(px - hw, py); g.lineTo(px, py - hh); g.stroke();
    if (h1 > 0.86) {                              // 틈새 잡초
      g.strokeStyle = 'rgba(110,140,74,.55)';
      const gx = px + (h2 - .5) * 20, gy = py + (h3 - .5) * 10;
      g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx + 1, gy - 3); g.stroke();
    }
  }
}

const SHADOW_IMG = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const rg = g.createRadialGradient(64, 64, 11, 64, 64, 64);
  rg.addColorStop(0, 'rgba(26,20,34,1)');
  rg.addColorStop(0.62, 'rgba(26,20,34,.68)');
  rg.addColorStop(1, 'rgba(26,20,34,0)');
  g.fillStyle = rg; g.fillRect(0, 0, 128, 128);
  return c;
})();
function shadow(px, py, r, a = 0.26) {
  ctx.globalAlpha = a;
  ctx.drawImage(SHADOW_IMG, px - r, py - r * 0.45, r * 2, r * 0.9);
  ctx.globalAlpha = 1;
}
function drawActor(a) {
  const info = SPR[a.key]; if (!info || !info.img.complete || !info.img.naturalWidth) return;
  const px = isoX(a.x, a.y) - camX, py = isoY(a.x, a.y) - camY;
  const an = info.anims[a.anim] || info.anims.idle;
  const fw = info.w, fh = info.h;
  const sx = (an.col0 + Math.min(a.frame, an.frames - 1)) * fw, sy = (an.row0 + a.dir) * fh;
  const foot = info.foot != null ? info.foot : Math.round(fh * 0.12);
  shadow(px, py, fw * 0.19);
  ctx.save();
  if (a.hurt > 0 && Math.floor(a.hurt * 20) % 2 === 0) ctx.globalAlpha = 0.45;
  ctx.drawImage(info.img, sx, sy, fw, fh, Math.round(px - fw / 2), Math.round(py - fh + foot), fw, fh);
  ctx.restore();
  if (a.name) {
    ctx.font = '700 10px "Noto Sans KR", sans-serif'; ctx.textAlign = 'center';
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(10,8,16,.9)';
    ctx.strokeText(a.name, px, py + 12); ctx.fillStyle = '#f6edd6'; ctx.fillText(a.name, px, py + 12);
  }
}
const BIG = { temple: 1, house: 1, villa: 1, stoa: 1, ruin: 1 };
/* 풀포기는 그림자를 그리지 않아요 — 수백 개라 그게 제일 비쌉니다 */
const NOSHADOW = { grass_green: 1, grass_dry: 1, wheat: 1 };
/* 그림자 반지름 — 그림 폭이 아니라 실제 바닥 발자국에 맞춰요 */
const SHR = {
  temple: 128, house: 78, villa: 78, stoa: 74, ruin: 48,
  well: 20, altar: 18, statue: 16, herm: 12, amphora: 10, brazier: 14, column: 13,
  olive: 20, cypress: 13, pine_umb: 22, fig: 18, laurel: 17,
};
function drawProp(p, small) {
  const d = PROP[p.kind]; if (!d || !d.img.complete || !d.img.naturalWidth) return;
  const px = isoX(p.x, p.y) - camX, py = isoY(p.x, p.y) - camY;
  const sc = p.big || 1;
  const hw = d.w * 0.5 * sc + 8, up = (d.h - d.foot) * sc + 8, dn = d.foot * sc + 8;
  if (px < -hw || px > SW / zoom + hw || py < -up || py > SH / zoom + dn) return;
  const lift = p.float ? p.float + Math.sin(worldT * 0.5 + p.x) * 7 : 0;
  if (!NOSHADOW[p.kind])
    shadow(px, py, (SHR[p.kind] || d.w * (small ? 0.16 : 0.2)) * sc,
           (small ? 0.17 : 0.22) * (p.float ? 0.45 : 1));
  // 큰 건물 뒤에 가족이 들어가면 살짝 비쳐 보이게 (거상처럼)
  let al = 1;
  if (BIG[p.kind]) {
    for (const a of actors) {
      if (a.x + a.y <= p.x + p.y) continue;
      const ax = isoX(a.x, a.y) - camX, ay = isoY(a.x, a.y) - camY;
      if (Math.abs(ax - px) < d.w * 0.34 && ay - py > -d.h * 0.86 && ay - py < -6) { al = 0.46; break; }
    }
  }
  if (al < 1) ctx.globalAlpha = al;
  if (sc !== 1 || lift || p.tilt) {
    ctx.save(); ctx.translate(px, py - lift);
    if (p.tilt) ctx.rotate(p.tilt * 0.11);
    ctx.scale(sc, sc);
    ctx.drawImage(d.img, Math.round(-d.w / 2), Math.round(-d.h + d.foot));
    ctx.restore();
  } else {
    // 바람에 흔들리는 풀과 가지
    const sway = small ? Math.sin(worldT * 1.6 + p.x * 0.7 + p.y * 0.4) * windAmt * 2.2 : 0;
    ctx.drawImage(d.img, Math.round(px - d.w / 2 + sway), Math.round(py - d.h + d.foot));
  }
  if (al < 1) ctx.globalAlpha = 1;
}

/* 발자국 먼지 */
const dust = [];
function puff(x, y) { dust.push({ x, y, t: 0, r: 3 + Math.random() * 3, vx: (Math.random() - .5) * 8, vy: -6 - Math.random() * 6 }); }
function drawDust(dt) {
  for (let i = dust.length - 1; i >= 0; i--) {
    const d = dust[i]; d.t += dt;
    if (d.t > 0.55) { dust.splice(i, 1); continue; }
    const k = d.t / 0.55;
    const px = isoX(d.x, d.y) - camX + d.vx * d.t * 10, py = isoY(d.x, d.y) - camY + d.vy * d.t * 3;
    ctx.fillStyle = `rgba(222,204,166,${0.44 * (1 - k)})`;
    ctx.beginPath(); ctx.ellipse(px, py, d.r * (1 + k * 1.8), d.r * 0.5 * (1 + k * 1.4), 0, 0, 7); ctx.fill();
  }
}

/* 흘러가는 구름 그늘 */
const CLOUDS = Array.from({ length: 7 }, (_, i) => ({
  x: hash2(i, 3, 91) * 4000, y: hash2(i, 7, 93) * 3000,
  r: 170 + hash2(i, 11, 95) * 220, a: 0.07 + hash2(i, 13, 97) * 0.07,
}));
let cloudT = 0;
function drawClouds(dt) {
  cloudT += dt;
  for (const c of CLOUDS) {
    const px = c.x + cloudT * 13 - camX, py = c.y + cloudT * 5 - camY;
    const wx = ((px % 4000) + 4000) % 4000 - 600, wy = ((py % 3000) + 3000) % 3000 - 500;
    if (wx < -c.r * 2 || wx > SW / zoom + c.r * 2 || wy < -c.r || wy > SH / zoom + c.r) continue;
    const rg = ctx.createRadialGradient(wx, wy, c.r * 0.2, wx, wy, c.r);
    rg.addColorStop(0, `rgba(44,50,62,${c.a * 0.7})`); rg.addColorStop(1, 'rgba(44,50,62,0)');
    ctx.save(); ctx.translate(wx, wy); ctx.scale(1.7, 0.72); ctx.translate(-wx, -wy);
    ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(wx, wy, c.r, 0, 7); ctx.fill(); ctx.restore();
  }
}



/* 빛무리는 매 프레임 그라디언트를 만들면 느려요 — 한 번 그려두고 가져다 씁니다 */
function makeGlow(size, stops) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  const rg = g.createRadialGradient(size / 2, size / 2, 1, size / 2, size / 2, size / 2);
  for (const [o, col] of stops) rg.addColorStop(o, col);
  g.fillStyle = rg; g.fillRect(0, 0, size, size);
  return c;
}
const GLOW_FIRE = makeGlow(128, [[0, 'rgba(255,186,96,1)'], [0.42, 'rgba(238,132,54,.45)'], [1, 'rgba(238,132,54,0)']]);
const GLOW_MIST = makeGlow(128, [[0, 'rgba(126,176,210,1)'], [1, 'rgba(126,176,210,0)']]);
const GLOW_SPK  = makeGlow(32,  [[0, 'rgba(255,252,226,1)'], [1, 'rgba(255,252,226,0)']]);
const GLOW_SPKN = makeGlow(32,  [[0, 'rgba(190,220,255,1)'], [1, 'rgba(190,220,255,0)']]);

/* ================= 시간 · 날씨 · 빛 ================= */
let worldT = 0, windAmt = 0.45, dayT = 0.34;
const DAY_LEN = 420;                     // 하루 7분
const urlp = new URLSearchParams(location.search);
const FIXED = { dawn: 0.20, morning: 0.30, noon: 0.50, dusk: 0.76, night: 0.92 }[urlp.get('time')];
if (FIXED != null) dayT = FIXED;
const DAY_RUN = FIXED == null;

/* [시각, R, G, B, 덮는 세기, 밤 정도] */
const SKY = [
  [0.00,  16,  24,  60, 0.60, 1.00],
  [0.15,  44,  42,  88, 0.46, 0.88],
  [0.23, 232, 146, 122, 0.28, 0.38],
  [0.32, 255, 226, 172, 0.13, 0.06],
  [0.50, 255, 248, 218, 0.05, 0.00],
  [0.64, 255, 224, 166, 0.12, 0.05],
  [0.75, 246, 138,  84, 0.30, 0.36],
  [0.85,  70,  56, 112, 0.48, 0.88],
  [1.00,  16,  24,  60, 0.60, 1.00],
];
function skyAt(t) {
  for (let i = 1; i < SKY.length; i++) {
    if (t <= SKY[i][0]) {
      const a = SKY[i - 1], b = SKY[i];
      const k = (t - a[0]) / (b[0] - a[0] || 1);
      return [1, 2, 3, 4, 5].map(j => a[j] + (b[j] - a[j]) * k);
    }
  }
  return SKY[0].slice(1);
}
let sky = skyAt(dayT);
const nightAmt = () => sky[4];

/* 날씨 — 맑음 → 바람 → 비 */
let weather = 'clear', wTimer = 40 + Math.random() * 50, rainAmt = 0;
const drops = Array.from({ length: 260 }, () => ({
  x: Math.random(), y: Math.random(), s: 0.6 + Math.random() * 0.8,
}));
function stepWeather(dt) {
  wTimer -= dt;
  if (wTimer <= 0) {
    const r = Math.random();
    weather = r < 0.5 ? 'clear' : r < 0.82 ? 'windy' : 'rain';
    wTimer = weather === 'rain' ? 30 + Math.random() * 30 : 50 + Math.random() * 60;
  }
  const targetRain = weather === 'rain' ? 1 : 0;
  rainAmt += (targetRain - rainAmt) * Math.min(1, dt * 0.35);
  const targetWind = weather === 'windy' ? 1.5 : weather === 'rain' ? 1.2 : 0.45;
  windAmt += (targetWind - windAmt) * Math.min(1, dt * 0.5);
}
function drawRain() {
  if (rainAmt < 0.02) return;
  const W = SW / zoom, H = SH / zoom;
  ctx.strokeStyle = `rgba(190,214,238,${0.30 * rainAmt})`; ctx.lineWidth = 1;
  ctx.beginPath();
  for (const d of drops) {
    const x = ((d.x + worldT * 0.10 * d.s) % 1) * W;
    const y = ((d.y + worldT * 0.95 * d.s) % 1) * H;
    ctx.moveTo(x, y); ctx.lineTo(x - 4 * d.s, y + 13 * d.s);
  }
  ctx.stroke();
  ctx.fillStyle = `rgba(26,34,48,${0.20 * rainAmt})`;
  ctx.fillRect(0, 0, W, H);
}

/* 떠다니는 빛가루 */
const MOTES = Array.from({ length: 56 }, (_, i) => ({
  x: hash2(i, 1, 5) * 3000, y: hash2(i, 2, 7) * 2200,
  r: 0.8 + hash2(i, 3, 9) * 1.7, sp: 0.3 + hash2(i, 4, 11) * 0.8,
  ph: hash2(i, 5, 13) * 6.283,
}));
function drawMotes() {
  const W = SW / zoom, H = SH / zoom, n = nightAmt();
  ctx.fillStyle = n > 0.4 ? 'rgb(186,236,255)' : 'rgb(255,240,190)';
  const base = n > 0.4 ? 0.30 + n * 0.45 : 0.34;
  for (const m of MOTES) {
    const px = ((m.x + worldT * 7 * m.sp - camX) % 3000 + 3000) % 3000 - 200;
    const py = ((m.y - worldT * 4 * m.sp - camY) % 2200 + 2200) % 2200 - 200;
    if (px < -30 || px > W + 30 || py < -30 || py > H + 30) continue;
    const tw = 0.45 + 0.55 * Math.sin(worldT * 1.6 + m.ph);
    ctx.globalAlpha = base * tw;
    const r = m.r * (1 + n * 0.5);
    ctx.beginPath(); ctx.arc(px + Math.sin(worldT * 0.8 + m.ph) * 9, py, r, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/* 신전에서 쏟아지는 빛줄기 */
const RAY_IMG = (() => {
  const w = 160, h = 560;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  const lg = g.createLinearGradient(0, 0, 0, h);
  lg.addColorStop(0, 'rgba(255,244,206,.85)');
  lg.addColorStop(1, 'rgba(255,244,206,0)');
  g.fillStyle = lg;
  g.beginPath(); g.moveTo(w / 2 - 16, 0); g.lineTo(w / 2 + 16, 0);
  g.lineTo(w / 2 + 64, h); g.lineTo(w / 2 - 64, h); g.closePath(); g.fill();
  return c;
})();
function drawGodRays() {
  const strength = (1 - nightAmt()) * (0.55 + 0.45 * Math.sin(worldT * 0.3));
  if (strength < 0.06) return;
  const sx = isoX(29, 21.5) - camX, sy = isoY(29, 21.5) - camY - 160;
  if (sx < -600 || sx > SW / zoom + 600) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 5; i++) {
    const a = -0.40 + i * 0.20 + Math.sin(worldT * 0.25 + i) * 0.035;
    const len = 520 + Math.sin(worldT * 0.4 + i * 2) * 60;
    ctx.globalAlpha = 0.17 * strength;
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(-a);
    ctx.drawImage(RAY_IMG, -80, 0, 160, len);
    ctx.restore();
  }
  ctx.globalAlpha = 1; ctx.restore();
}

/* 불빛 — 밤이 될수록 강해져요 */
const FIRES = [];
function collectFires() {
  for (const p of MAP.props)
    if (p.kind === 'brazier' || p.kind === 'altar') FIRES.push({ x: p.x, y: p.y, r: p.kind === 'altar' ? 140 : 110 });
}
function drawGlows() {
  const k = 0.22 + nightAmt() * 0.78;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const f of FIRES) {
    const px = isoX(f.x, f.y) - camX, py = isoY(f.x, f.y) - camY - 40;
    if (px < -200 || px > SW / zoom + 200 || py < -200 || py > SH / zoom + 200) continue;
    const fl = 1 + Math.sin(worldT * 7 + f.x * 3) * 0.08 + Math.sin(worldT * 11 + f.y) * 0.05;
    const r = f.r * fl;
    ctx.globalAlpha = 0.34 * k;
    ctx.drawImage(GLOW_FIRE, px - r, py - r, r * 2, r * 2);
  }
  ctx.globalAlpha = 1; ctx.restore();
}

/* 광장 한가운데 희미하게 빛나는 신의 문양 */
function drawSigil() {
  const px = isoX(30, 31) - camX, py = isoY(30, 31) - camY;
  if (px < -300 || px > SW / zoom + 300 || py < -200 || py > SH / zoom + 200) return;
  const n = nightAmt(), k = 0.20 + n * 0.80;
  ctx.save(); ctx.translate(px, py); ctx.scale(1, 0.5);
  ctx.globalCompositeOperation = 'lighter';
  for (let ring = 0; ring < 2; ring++) {
    const rr = 86 + ring * 34;
    const pulse = 0.55 + 0.45 * Math.sin(worldT * 0.9 - ring);
    ctx.strokeStyle = `rgba(150,214,255,${0.16 * k * pulse})`;
    ctx.lineWidth = ring ? 2 : 3;
    ctx.beginPath(); ctx.arc(0, 0, rr, 0, 7); ctx.stroke();
    ctx.save(); ctx.rotate(worldT * (ring ? -0.16 : 0.11));
    ctx.strokeStyle = `rgba(190,232,255,${0.13 * k * pulse})`;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * 6.283;
      ctx.moveTo(Math.cos(a) * rr * 0.55, Math.sin(a) * rr * 0.55);
      ctx.lineTo(Math.cos(a + 2.094) * rr * 0.55, Math.sin(a + 2.094) * rr * 0.55);
    }
    ctx.stroke(); ctx.restore();
  }
  ctx.restore();
}

/* 숲 깊은 곳의 푸른 안개 */
function drawMist() {
  const k = 0.35 + nightAmt() * 0.65;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 3; i++) {
    const bx = 1200 + i * 1400, by = 900 + i * 980;
    const px = ((bx + worldT * 6 - camX) % 3400 + 3400) % 3400 - 400;
    const py = ((by + worldT * 3 - camY) % 2600 + 2600) % 2600 - 300;
    if (px < -500 || px > SW / zoom + 500 || py < -300 || py > SH / zoom + 300) continue;
    const r = 260 + i * 40;
    ctx.globalAlpha = 0.09 * k;
    ctx.drawImage(GLOW_MIST, px - r * 1.8, py - r * 0.62, r * 3.6, r * 1.24);
  }
  ctx.globalAlpha = 1; ctx.restore();
}

/* 바다 윤슬 — 화면에 보이는 물만 */
let seaOnScreen = false;
function drawSeaSparkle() {
  if (!seaOnScreen) return;
  const W = SW / zoom, H = SH / zoom, n = nightAmt();
  const img = n > 0.5 ? GLOW_SPKN : GLOW_SPK;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 64; i++) {
    const wx = ((hash2(i, 1, 77) * 3000 + Math.sin(worldT * 0.6 + i) * 26 - camX) % 3000 + 3000) % 3000 - 300;
    const wy = ((hash2(i, 2, 79) * 2400 + Math.sin(worldT * 0.4 + i * 2) * 10 - camY) % 2400 + 2400) % 2400 - 300;
    if (wx < -20 || wx > W + 20 || wy < -20 || wy > H + 20) continue;
    const [tx, ty] = screenToTile(wx + camX, wy + camY);
    if (seaMask(tx, ty) < 0.5) continue;
    const tw = Math.max(0, Math.sin(worldT * 2.2 + i * 1.7));
    if (tw < 0.05) continue;
    const r = 7 * tw + 2;
    ctx.globalAlpha = 0.55 * tw;
    ctx.drawImage(img, wx - r, wy - r * 0.42, r * 2, r * 0.84);
  }
  ctx.globalAlpha = 1; ctx.restore();
}

/* 하루의 색 ─ 마지막에 전체를 덮어요 */
function drawGrade() {
  const [r, g, b, a] = sky;
  const W = SW / zoom, H = SH / zoom;
  const n = nightAmt();
  if (a > 0.035) {
    ctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${Math.min(0.74, a * (n > 0.4 ? 0.9 : 1.3))})`;
    ctx.fillRect(0, 0, W, H);
  }
  if (n > 0.04) {                       // 밤은 한 겹 더 어둡게 — 그래야 불빛이 살아요
    ctx.fillStyle = `rgba(8,12,30,${n * 0.42})`;
    ctx.fillRect(0, 0, W, H);
  }
}

let clickFx = null;
function draw() {
  ctx.setTransform(DPR * zoom, 0, 0, DPR * zoom, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#6f8449'; ctx.fillRect(0, 0, SW / zoom, SH / zoom);
  if (groundDirty || Math.abs(camX - gOffX - 400) > 240 || Math.abs(camY - gOffY - 400) > 240) {
    paintGround();
    const [cx, cy] = screenToTile(camX + SW / zoom / 2, camY + SH / zoom / 2);
    seaOnScreen = seaMask(cx - 14, cy) > 0 || seaMask(cx, cy) > 0 || seaMask(cx - 7, cy + 7) > 0;
  }
  ctx.drawImage(gcv, gOffX - camX, gOffY - camY);
  drawSeaSparkle();
  drawClouds(lastDt);
  drawMist();
  drawSigil();

  if (clickFx) {
    const px = isoX(clickFx.x, clickFx.y) - camX, py = isoY(clickFx.x, clickFx.y) - camY, k = clickFx.t / 0.5;
    ctx.strokeStyle = `rgba(250,226,160,${1 - k})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(px, py, 10 + k * 18, (10 + k * 18) * 0.45, 0, 0, 7); ctx.stroke();
  }
  const items = [];
  MAP.scatter.forEach(p => items.push({ d: p.x + p.y - 0.2, f: () => drawProp(p, true) }));
  MAP.props.forEach(p => items.push({ d: p.x + p.y, f: () => drawProp(p, false) }));
  actors.forEach(a => items.push({ d: a.x + a.y + 0.35, f: () => drawActor(a) }));
  npcs.forEach(a => items.push({ d: a.x + a.y + 0.3, f: () => drawActor(a) }));
  items.sort((a, b) => a.d - b.d).forEach(it => it.f());
  drawDust(lastDt);
  drawGlows();
  drawGodRays();
  drawMotes();
  drawRain();
  drawGrade();
  drawSpeech();

  const g = ctx.createRadialGradient(SW / zoom / 2, SH / zoom / 2, Math.min(SW, SH) / zoom * 0.36,
                                     SW / zoom / 2, SH / zoom / 2, Math.max(SW, SH) / zoom * 0.74);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(32,26,38,.26)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, SW / zoom, SH / zoom);
}

/* ---------------- 입력 ---------------- */
cv.addEventListener('pointerdown', e => {
  const r = cv.getBoundingClientRect();
  const sx = (e.clientX - r.left) / zoom + camX, sy = (e.clientY - r.top) / zoom + camY;
  const [tx, ty] = screenToTile(sx, sy);
  const p = findPath(Math.round(player.x), Math.round(player.y), Math.round(tx), Math.round(ty));
  if (p && p.length) { player.path = p; clickFx = { x: Math.round(tx), y: Math.round(ty), t: 0 }; }
});
addEventListener('keydown', e => { if (e.key === ' ') { e.preventDefault(); player.atk = 0.45; } });
const atkBtn = $('bAtk'); if (atkBtn) atkBtn.addEventListener('pointerdown', e => { e.preventDefault(); player.atk = 0.45; });
const talkBtn = $('bTalk'); if (talkBtn) talkBtn.addEventListener('pointerdown', e => { e.preventDefault(); tryTalk(); });
addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === 'f') { e.preventDefault(); tryTalk(); } });

/* ---------------- 루프 ---------------- */
let last = performance.now(), lastDt = 0.016;
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - last) / 1000); last = now; lastDt = dt;
  worldT += dt;
  if (DAY_RUN) dayT = (dayT + dt / DAY_LEN) % 1;
  sky = skyAt(dayT);
  stepWeather(dt);
  actors.forEach(a => stepActor(a, dt));
  npcs.forEach(a => stepNpc(a, dt));
  if (clickFx) { clickFx.t += dt; if (clickFx.t > 0.5) clickFx = null; }
  const tx = isoX(player.x, player.y) - SW / zoom / 2, ty = isoY(player.x, player.y) - SH / zoom / 2;
  camX += (tx - camX) * 0.1; camY += (ty - camY) * 0.1;
  draw();
  const L = $('loading');
  if (L && total && loaded >= total) L.style.display = 'none';
}

Promise.all([
  fetch('images/sprites/meta.json').then(r => r.json()),
  fetch('images/props/meta.json').then(r => r.json()).catch(() => ({}))
]).then(([cm, pm]) => {
  Object.entries(cm.chars).forEach(([k, i]) => imgLoad(`images/sprites/${k}.png`, SPR, k, i));
  Object.entries(pm).forEach(([k, i]) => imgLoad(`images/props/${k}.png`, PROP, k, i));
  collectFires();
  requestAnimationFrame(loop);
}).catch(() => { const L = $('loading'); if (L) L.textContent = '그림을 불러오지 못했어요'; });

window.__gs = { player, actors, npcs, MAP, findPath, SPR, PROP, groundAt, seaMask,
  state: () => ({ loaded, total }), time: () => ({ dayT, weather, rainAmt, night: nightAmt() }) };
})();

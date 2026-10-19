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

/* 지면 종류: 0 흙 · 1 풀 · 2 마른풀 · 3 자갈 · 4 이끼 */
function groundAt(x, y) {
  const n = fbm(x * 0.09, y * 0.09, 1);
  const m = fbm(x * 0.17, y * 0.17, 5);
  const road = roadMask(x, y);
  if (road > 0.5) return 0;
  if (n < 0.34) return 2;
  if (n > 0.70) return 4;
  if (m > 0.72) return 3;
  return 1;
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

const TREES = ['tree_pine', 'tree_cherry', 'tree_maple', 'tree_green', 'tree_willow', 'tree_dark'];
const BUSHES = ['bush_green', 'bush_flower', 'bush_dry'];
const GRASS = ['grass_a', 'grass_b'];
const ROCKS = ['rock_gray', 'rock_moss'];

function genMap() {
  const { w, h } = MAP;
  for (let y = 0; y < h; y++) { MAP.blocked[y] = []; for (let x = 0; x < w; x++) MAP.blocked[y][x] = 0; }
  const block = (x, y, bw, bh) => {
    for (let j = 0; j < bh; j++) for (let i = 0; i < bw; i++)
      if (MAP.blocked[y + j] !== undefined && MAP.blocked[y + j][x + i] !== undefined) MAP.blocked[y + j][x + i] = 1;
  };
  // 여러 칸을 차지하는 건물은 발자국 한가운데를 기준점으로 삼아야 앞뒤가 맞아요
  const put = (kind, x, y, bw = 1, bh = 1) => {
    MAP.props.push({ kind, x: x + (bw - 1) / 2, y: y + (bh - 1) / 2 });
    block(x, y, bw, bh);
  };

  // 마을: 길 양옆으로 건물
  [[22, 24], [34, 25], [22, 36], [35, 37], [16, 30], [41, 31]].forEach(([x, y], i) => {
    put(i % 3 === 0 ? 'shop' : i % 3 === 1 ? 'house' : 'tavern', x, y, 3, 3);
  });
  put('gate', 28, 18, 4, 2);
  put('well', 30, 33, 1, 1);
  [[26, 21], [31, 21], [26, 41], [31, 41]].forEach(([x, y]) => put('jangseung', x, y, 1, 1));

  // 초목: 길과 건물을 피해 빽빽하게
  const free = (x, y, r = 1) => {
    for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
      const nx = x + i, ny = y + j;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) return false;
      if (MAP.blocked[ny][nx]) return false;
    }
    return roadMask(x, y) < 0.25;
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

function dirFrom(dx, dy) {
  const ang = Math.atan2(isoY(dx, dy), isoX(dx, dy));
  return (((Math.round((ang - Math.PI / 2) / (Math.PI / 4)) % 8) + 8) % 8);
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

/* ---------------- 화면 ---------------- */
const cv = $('gl'), ctx = cv.getContext('2d');
let SW = 0, SH = 0, DPR = 1, camX = 0, camY = 0, zoom = 1;
let groundDirty = true, gOffX = 0, gOffY = 0;
function resize() {
  DPR = Math.min(devicePixelRatio || 1, 2);
  SW = innerWidth; SH = innerHeight;
  cv.width = SW * DPR; cv.height = SH * DPR;
  cv.style.width = SW + 'px'; cv.style.height = SH + 'px';
  zoom = SW < 700 ? 1.0 : 1.2;
  groundDirty = true;
}
addEventListener('resize', resize); resize();

/* 지면 색 — 거상처럼 탁한 자연색 */
const GC = [
  ['#c3aa7e', '#b9a176', '#cfb78c'],   // 0 흙길
  ['#74ad50', '#6ba349', '#82ba5c'],   // 1 풀
  ['#a2b460', '#98aa5a', '#aec06d'],   // 2 마른풀
  ['#b0aca1', '#a6a298', '#bab6ab'],   // 3 자갈
  ['#54974a', '#4d8e44', '#5fa354'],   // 4 이끼
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
    rg.addColorStop(0, warm ? `rgba(255,243,196,${0.10 + k * 0.13})` : `rgba(34,44,58,${0.08 + k * 0.13})`);
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg; g.fillRect(px - 150, py - 80, 300, 160);
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
  if (t === 1 || t === 4) {
    for (let k = 0; k < 7; k++) {
      const a = hash2(x, y, k) * 6.283, r = hash2(y, x, k) * 24;
      const gx = px + Math.cos(a) * r, gy = py + Math.sin(a) * r * 0.5;
      g.strokeStyle = k % 2 ? 'rgba(46,104,44,.55)' : 'rgba(142,196,98,.5)';
      g.lineWidth = 1; g.beginPath(); g.moveTo(gx, gy);
      g.lineTo(gx + (hash2(x, k, y) - .5) * 3, gy - 3 - hash2(k, y, x) * 4); g.stroke();
    }
    if (h3 > 0.93) { g.fillStyle = ['#ffd45a', '#ff9ac0', '#fff6e0'][(h1 * 3) | 0]; g.beginPath(); g.arc(px + (h2 - .5) * 18, py + (h3 - .5) * 9, 1.8, 0, 7); g.fill(); }
  } else if (t === 0) {
    for (let k = 0; k < 5; k++) {
      const a = hash2(x, y, k + 5) * 6.283, r = hash2(y, x, k + 5) * 26;
      g.fillStyle = hash2(x, k, y) > .5 ? 'rgba(146,122,88,.5)' : 'rgba(200,180,142,.45)';
      g.beginPath(); g.ellipse(px + Math.cos(a) * r, py + Math.sin(a) * r * 0.5, 2.4, 1.3, 0, 0, 7); g.fill();
    }
  } else if (t === 3) {
    for (let k = 0; k < 6; k++) {
      const a = hash2(x, y, k + 9) * 6.283, r = hash2(y, x, k + 9) * 25;
      g.fillStyle = 'rgba(124,120,114,.5)';
      g.beginPath(); g.ellipse(px + Math.cos(a) * r, py + Math.sin(a) * r * 0.5, 2.6, 1.5, 0, 0, 7); g.fill();
    }
  } else if (t === 2) {
    for (let k = 0; k < 5; k++) {
      const a = hash2(x, y, k + 3) * 6.283, r = hash2(y, x, k + 3) * 24;
      const gx = px + Math.cos(a) * r, gy = py + Math.sin(a) * r * 0.5;
      g.strokeStyle = 'rgba(160,152,88,.5)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx + 1, gy - 3); g.stroke();
    }
  }
}

function shadow(px, py, r, a = 0.26) {
  ctx.save();
  ctx.translate(px, py); ctx.scale(1, 0.45);
  const rg = ctx.createRadialGradient(0, 0, r * 0.18, 0, 0, r);
  rg.addColorStop(0, `rgba(26,20,34,${a})`);
  rg.addColorStop(0.62, `rgba(26,20,34,${a * 0.68})`);
  rg.addColorStop(1, 'rgba(26,20,34,0)');
  ctx.fillStyle = rg;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
  ctx.restore();
}
function drawActor(a) {
  const info = SPR[a.key]; if (!info || !info.img.complete || !info.img.naturalWidth) return;
  const px = isoX(a.x, a.y) - camX, py = isoY(a.x, a.y) - camY;
  const an = info.anims[a.anim] || info.anims.idle;
  const fw = info.w, fh = info.h;
  const sx = (an.col0 + Math.min(a.frame, an.frames - 1)) * fw, sy = (an.row0 + a.dir) * fh;
  shadow(px, py, fw * 0.16);
  ctx.save();
  if (a.hurt > 0 && Math.floor(a.hurt * 20) % 2 === 0) ctx.globalAlpha = 0.45;
  ctx.drawImage(info.img, sx, sy, fw, fh, Math.round(px - fw / 2), Math.round(py - fh + fh * 0.12), fw, fh);
  ctx.restore();
  if (a.name) {
    ctx.font = '700 11px "Noto Sans KR", sans-serif'; ctx.textAlign = 'center';
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(10,8,16,.9)';
    ctx.strokeText(a.name, px, py + 13); ctx.fillStyle = '#f4e8cc'; ctx.fillText(a.name, px, py + 13);
  }
}
const BIG = { shop: 1, house: 1, tavern: 1, gate: 1 };
function drawProp(p, small) {
  const d = PROP[p.kind]; if (!d || !d.img.complete || !d.img.naturalWidth) return;
  const px = isoX(p.x, p.y) - camX, py = isoY(p.x, p.y) - camY;
  if (px < -300 || px > SW / zoom + 300 || py < -400 || py > SH / zoom + 300) return;
  shadow(px, py, d.w * (small ? 0.16 : 0.2), small ? 0.18 : 0.24);
  // 큰 건물 뒤에 가족이 들어가면 살짝 비쳐 보이게 (거상처럼)
  let al = 1;
  if (BIG[p.kind]) {
    for (const a of actors) {
      if (a.x + a.y <= p.x + p.y) continue;
      const ax = isoX(a.x, a.y) - camX, ay = isoY(a.x, a.y) - camY;
      if (Math.abs(ax - px) < d.w * 0.5 && ay - py > -d.h + d.foot && ay - py < d.foot + 10) { al = 0.42; break; }
    }
  }
  if (al < 1) ctx.globalAlpha = al;
  ctx.drawImage(d.img, Math.round(px - d.w / 2), Math.round(py - d.h + d.foot));
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
    ctx.fillStyle = `rgba(206,188,150,${0.42 * (1 - k)})`;
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
    rg.addColorStop(0, `rgba(30,38,54,${c.a})`); rg.addColorStop(1, 'rgba(30,38,54,0)');
    ctx.save(); ctx.translate(wx, wy); ctx.scale(1.7, 0.72); ctx.translate(-wx, -wy);
    ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(wx, wy, c.r, 0, 7); ctx.fill(); ctx.restore();
  }
}

let clickFx = null;
function draw() {
  ctx.setTransform(DPR * zoom, 0, 0, DPR * zoom, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#3a4430'; ctx.fillRect(0, 0, SW / zoom, SH / zoom);
  if (groundDirty || Math.abs(camX - gOffX - 400) > 240 || Math.abs(camY - gOffY - 400) > 240) paintGround();
  ctx.drawImage(gcv, gOffX - camX, gOffY - camY);
  drawClouds(lastDt);

  if (clickFx) {
    const px = isoX(clickFx.x, clickFx.y) - camX, py = isoY(clickFx.x, clickFx.y) - camY, k = clickFx.t / 0.5;
    ctx.strokeStyle = `rgba(250,226,160,${1 - k})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(px, py, 10 + k * 18, (10 + k * 18) * 0.45, 0, 0, 7); ctx.stroke();
  }
  const items = [];
  MAP.scatter.forEach(p => items.push({ d: p.x + p.y - 0.2, f: () => drawProp(p, true) }));
  MAP.props.forEach(p => items.push({ d: p.x + p.y, f: () => drawProp(p, false) }));
  actors.forEach(a => items.push({ d: a.x + a.y + 0.35, f: () => drawActor(a) }));
  items.sort((a, b) => a.d - b.d).forEach(it => it.f());
  drawDust(lastDt);

  const g = ctx.createRadialGradient(SW / zoom / 2, SH / zoom / 2, Math.min(SW, SH) / zoom * 0.36,
                                     SW / zoom / 2, SH / zoom / 2, Math.max(SW, SH) / zoom * 0.74);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(24,18,32,.32)');
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

/* ---------------- 루프 ---------------- */
let last = performance.now(), lastDt = 0.016;
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - last) / 1000); last = now; lastDt = dt;
  actors.forEach(a => stepActor(a, dt));
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
  requestAnimationFrame(loop);
}).catch(() => { const L = $('loading'); if (L) L.textContent = '그림을 불러오지 못했어요'; });

window.__gs = { player, actors, MAP, findPath, SPR, PROP, groundAt, state: () => ({ loaded, total }) };
})();

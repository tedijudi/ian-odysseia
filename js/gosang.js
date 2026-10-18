/* ============================================================
   거상풍 엔진 — 클릭해서 걸어가기 · 8방향 스프라이트 · 깊이 정렬 · 일행 동행
   스프라이트는 블렌더로 구운 images/sprites/*.png (8방향 × 동작별 프레임)
   ============================================================ */
(() => {
'use strict';
const $ = id => document.getElementById(id);

/* ---------------- 스프라이트 ---------------- */
const SPR = {};                       // key → {img, w, h, anims:{name:{row0,frames}}, dirs}
let spriteMeta = null, loaded = 0, total = 0;
function loadSprites(meta) {
  spriteMeta = meta;
  Object.entries(meta.chars).forEach(([key, info]) => {
    const img = new Image();
    img.src = `images/sprites/${key}.png`;
    total++;
    img.onload = () => { loaded++; };
    SPR[key] = { img, ...info };
  });
  (meta.props ? Object.entries(meta.props) : []).forEach(([key, info]) => {
    const img = new Image();
    img.src = `images/props/${key}.png`;
    total++;
    img.onload = () => { loaded++; };
    PROPIMG[key] = { img, ...info };
  });
}
const PROPIMG = {};

/* ---------------- 맵 ---------------- */
const TW = 64, TH = 32;               // 타일 한 칸(화면 픽셀)
const MAP = {
  w: 34, h: 34,
  ground: [],                          // 0 흙 · 1 풀 · 2 돌바닥 · 3 물
  blocked: [],
  props: []                            // {kind,x,y}
};
function genMap() {
  const { w, h } = MAP;
  for (let y = 0; y < h; y++) {
    MAP.ground[y] = []; MAP.blocked[y] = [];
    for (let x = 0; x < w; x++) {
      const road = (Math.abs(y - 17) < 2) || (Math.abs(x - 17) < 2);
      MAP.ground[y][x] = road ? 0 : (((x * 7 + y * 13) % 11 === 0) ? 2 : 1);
      MAP.blocked[y][x] = 0;
    }
  }
  const put = (kind, x, y, bw = 1, bh = 1) => {
    MAP.props.push({ kind, x, y });
    for (let j = 0; j < bh; j++) for (let i = 0; i < bw; i++) {
      if (MAP.blocked[y + j]) MAP.blocked[y + j][x + i] = 1;
    }
  };
  // 마을: 길 양옆으로 집과 상점
  [[6, 7], [12, 6], [23, 7], [28, 11]].forEach(([x, y]) => put('hanok_shop', x, y, 3, 3));
  [[7, 22], [13, 26], [24, 23], [29, 27], [20, 12]].forEach(([x, y]) => put('hanok_house', x, y, 3, 3));
  [[4, 14], [10, 13], [26, 16], [31, 20], [5, 28], [18, 30], [30, 5]].forEach(([x, y]) => put('pine', x, y, 1, 1));
  [[9, 18], [21, 19], [15, 9], [27, 29], [3, 20]].forEach(([x, y]) => put('rock', x, y, 1, 1));
  [[15, 16], [19, 16], [15, 20], [19, 20]].forEach(([x, y]) => put('lantern', x, y, 1, 1));
  [[16, 14], [18, 22]].forEach(([x, y]) => put('stall', x, y, 2, 2));
}
genMap();

const walkable = (x, y) => x >= 0 && y >= 0 && x < MAP.w && y < MAP.h && !MAP.blocked[y][x];

/* ---------------- 좌표 변환 ---------------- */
const isoX = (x, y) => (x - y) * (TW / 2);
const isoY = (x, y) => (x + y) * (TH / 2);
function screenToTile(sx, sy) {
  const a = sx / (TW / 2), b = sy / (TH / 2);
  return [(a + b) / 2, (b - a) / 2];
}

/* ---------------- 길 찾기 (A*) ---------------- */
function findPath(sx, sy, tx, ty) {
  sx |= 0; sy |= 0; tx |= 0; ty |= 0;
  if (!walkable(tx, ty)) {                 // 가장 가까운 갈 수 있는 칸으로
    let best = null, bd = 1e9;
    for (let r = 1; r < 5 && !best; r++)
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
  let guard = 9000;
  while (open.length && guard-- > 0) {
    open.sort((a, b) => (f.get(key(...a)) || 1e9) - (f.get(key(...b)) || 1e9));
    const [cx, cy] = open.shift(), ck = key(cx, cy);
    if (cx === tx && cy === ty) {
      const path = [];
      let k = ck;
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
function Actor(key, x, y, opts = {}) {
  return { key, x, y, dir: 4, anim: 'idle', frame: 0, t: Math.random() * 40,
           path: null, speed: opts.speed || 3.2, follow: opts.follow || null,
           hp: 100, maxHp: 100, name: opts.name || '', atk: 0, hurt: 0, ...opts };
}
const player = Actor('dad', 17, 24, { name: '전시현', speed: 3.4 });
const party = [Actor('mom', 16, 25, { name: '세은', follow: player, speed: 3.6 }),
               Actor('ian', 15, 25, { name: '이안', follow: null, speed: 3.6 })];
party[1].follow = party[0];
const actors = [player, ...party];

function dirFrom(dx, dy) {
  // 화면상 방향 → 8방향 (스프라이트 d0 = 정면/아래)
  const ang = Math.atan2(isoY(dx, dy), isoX(dx, dy));
  let d = Math.round((ang - Math.PI / 2) / (Math.PI / 4));
  d = ((d % 8) + 8) % 8;
  return d;
}

function stepActor(a, dt) {
  a.t += dt;
  if (a.hurt > 0) a.hurt -= dt;
  if (a.atk > 0) { a.atk -= dt; a.anim = 'attack'; }
  else if (a.follow) {                     // 일행: 앞사람을 따라가요
    const tgt = a.follow;
    const d = Math.hypot(tgt.x - a.x, tgt.y - a.y);
    if (d > 1.6) {
      const sp = Math.min(a.speed * dt, d - 1.2);
      const nx = a.x + (tgt.x - a.x) / d * sp;
      const ny = a.y + (tgt.y - a.y) / d * sp;
      a.dir = dirFrom(tgt.x - a.x, tgt.y - a.y);
      if (walkable(Math.round(nx), Math.round(a.y))) a.x = nx;
      if (walkable(Math.round(a.x), Math.round(ny))) a.y = ny;
      a.anim = 'walk';
    } else a.anim = 'idle';
  } else if (a.path && a.path.length) {
    const [tx, ty] = a.path[0];
    const dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy);
    if (d < 0.12) { a.x = tx; a.y = ty; a.path.shift(); }
    else {
      const sp = a.speed * dt;
      a.x += dx / d * Math.min(sp, d); a.y += dy / d * Math.min(sp, d);
      a.dir = dirFrom(dx, dy);
    }
    a.anim = 'walk';
  } else a.anim = 'idle';

  const info = SPR[a.key];
  if (info) {
    const n = info.anims[a.anim] ? info.anims[a.anim].frames : 1;
    const fps = a.anim === 'walk' ? 11 : a.anim === 'attack' ? 14 : 6;
    a.frame = Math.floor(a.t * fps) % n;
  }
}

/* ---------------- 화면 ---------------- */
const cv = $('gl'), ctx = cv.getContext('2d');
let SW = 0, SH = 0, DPR = 1, camX = 0, camY = 0, zoom = 1;
function resize() {
  DPR = Math.min(devicePixelRatio || 1, 2);
  SW = innerWidth; SH = innerHeight;
  cv.width = SW * DPR; cv.height = SH * DPR;
  cv.style.width = SW + 'px'; cv.style.height = SH + 'px';
  zoom = SW < 700 ? 1.0 : 1.25;
}
addEventListener('resize', resize); resize();

const groundColors = [['#c9b089', '#c3a981'], ['#6fa84f', '#689f49'], ['#9aa0a8', '#949aa2'], ['#4aa8d8', '#43a0d0']];
function hash(x, y, s = 0) { let h = (x * 374761393 + y * 668265263 + s * 982451653) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
function tileDetail(t, px, py, x, y) {
  const h1 = hash(x, y, 11), h2 = hash(x, y, 22), h3 = hash(x, y, 33);
  if (t === 1) {                                    // 풀: 포기와 돌
    for (let k = 0; k < 5; k++) {
      const a = hash(x, y, k) * 6.283, r = hash(y, x, k) * 22;
      const gx = px + Math.cos(a) * r, gy = py + Math.sin(a) * r * 0.5;
      ctx.strokeStyle = k % 2 ? 'rgba(52,122,58,.7)' : 'rgba(150,212,112,.65)';
      ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(gx, gy);
      ctx.lineTo(gx + (hash(x, k, y) - .5) * 3, gy - 3 - hash(k, y, x) * 3); ctx.stroke();
    }
    if (h2 > 0.9) { ctx.fillStyle = 'rgba(120,112,100,.55)'; ctx.beginPath(); ctx.ellipse(px + (h3 - .5) * 18, py + (h1 - .5) * 9, 3, 1.6, 0, 0, 7); ctx.fill(); }
    if (h3 > 0.95) { ctx.fillStyle = ['#ffd45a', '#ff9ac0', '#fff6e0'][(h1 * 3) | 0]; ctx.beginPath(); ctx.arc(px + (h2 - .5) * 16, py + (h3 - .5) * 8, 1.6, 0, 7); ctx.fill(); }
  } else if (t === 0) {                             // 흙길: 자갈과 바퀴자국
    for (let k = 0; k < 4; k++) {
      const a = hash(x, y, k + 5) * 6.283, r = hash(y, x, k + 5) * 24;
      ctx.fillStyle = hash(x, k, y) > .5 ? 'rgba(150,126,92,.55)' : 'rgba(196,176,140,.5)';
      ctx.beginPath(); ctx.ellipse(px + Math.cos(a) * r, py + Math.sin(a) * r * 0.5, 2.2, 1.2, 0, 0, 7); ctx.fill();
    }
    if (h1 > 0.82) { ctx.strokeStyle = 'rgba(140,116,84,.4)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(px - 26, py + (h2 - .5) * 6); ctx.lineTo(px + 26, py + (h3 - .5) * 6); ctx.stroke(); }
  } else if (t === 2) {                             // 돌바닥: 금과 이끼
    ctx.strokeStyle = 'rgba(70,72,80,.35)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(px - 24, py); ctx.lineTo(px, py - 11); ctx.lineTo(px + 24, py); ctx.stroke();
    if (h2 > 0.75) { ctx.fillStyle = 'rgba(110,150,100,.35)'; ctx.beginPath(); ctx.ellipse(px + (h1 - .5) * 20, py + (h3 - .5) * 9, 6, 3, 0, 0, 7); ctx.fill(); }
  }
}
function drawGround() {
  const half = TW / 2, hh = TH / 2;
  for (let y = 0; y < MAP.h; y++) for (let x = 0; x < MAP.w; x++) {
    const px = isoX(x, y) - camX, py = isoY(x, y) - camY;
    if (px < -TW || px > SW / zoom + TW || py < -TH * 2 || py > SH / zoom + TH * 3) continue;
    const g = groundColors[MAP.ground[y][x]];
    ctx.fillStyle = g[(x + y) % 2];
    ctx.beginPath();
    ctx.moveTo(px, py - hh); ctx.lineTo(px + half, py); ctx.lineTo(px, py + hh); ctx.lineTo(px - half, py);
    ctx.closePath(); ctx.fill();
    tileDetail(MAP.ground[y][x], px, py, x, y);
    // 길과 풀의 경계에 밝은 테두리
    const t0 = MAP.ground[y][x];
    if (MAP.ground[y][x + 1] !== undefined && MAP.ground[y][x + 1] !== t0) {
      ctx.strokeStyle = 'rgba(255,245,210,.18)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(px + half, py); ctx.lineTo(px, py + hh); ctx.stroke();
    }
  }
}

function drawShadow(px, py, r) {
  ctx.fillStyle = 'rgba(20,14,30,.26)';
  ctx.beginPath(); ctx.ellipse(px, py, r, r * 0.45, 0, 0, 7); ctx.fill();
}

function drawActor(a) {
  const info = SPR[a.key]; if (!info || !info.img.complete) return;
  const px = isoX(a.x, a.y) - camX, py = isoY(a.x, a.y) - camY;
  const an = info.anims[a.anim] || info.anims.idle;
  const fw = info.w, fh = info.h;
  const sx = (an.col0 + Math.min(a.frame, an.frames - 1)) * fw;
  const sy = (an.row0 + a.dir) * fh;
  drawShadow(px, py, fw * 0.17);
  ctx.save();
  if (a.hurt > 0 && Math.floor(a.hurt * 20) % 2 === 0) ctx.globalAlpha = 0.45;
  ctx.drawImage(info.img, sx, sy, fw, fh, Math.round(px - fw / 2), Math.round(py - fh + fh * 0.12), fw, fh);
  ctx.restore();
  if (a.name) {
    ctx.font = '700 12px "Noto Sans KR", sans-serif'; ctx.textAlign = 'center';
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(10,8,16,.85)';
    ctx.strokeText(a.name, px, py + 14); ctx.fillStyle = '#f2e6c8'; ctx.fillText(a.name, px, py + 14);
  }
}

function drawProp(p) {
  const img = PROPIMG[p.kind]; if (!img || !img.img.complete) return;
  const px = isoX(p.x, p.y) - camX, py = isoY(p.x, p.y) - camY;
  const w = img.w, h = img.h;
  drawShadow(px, py, w * 0.22);
  ctx.drawImage(img.img, Math.round(px - w / 2), Math.round(py - h + img.foot));
}

let clickFx = null;
function draw() {
  ctx.setTransform(DPR * zoom, 0, 0, DPR * zoom, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#2b2a3c'; ctx.fillRect(0, 0, SW / zoom, SH / zoom);
  drawGround();
  // 깊이 정렬: 타일 좌표 합이 작은 것부터
  const items = [];
  MAP.props.forEach(p => items.push({ d: p.x + p.y, f: () => drawProp(p) }));
  actors.forEach(a => items.push({ d: a.x + a.y + 0.4, f: () => drawActor(a) }));
  if (clickFx) {
    const px = isoX(clickFx.x, clickFx.y) - camX, py = isoY(clickFx.x, clickFx.y) - camY;
    const k = clickFx.t / 0.5;
    ctx.strokeStyle = `rgba(250,220,150,${1 - k})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(px, py, 10 + k * 16, (10 + k * 16) * 0.45, 0, 0, 7); ctx.stroke();
  }
  items.sort((a, b) => a.d - b.d).forEach(it => it.f());
  // 가장자리 어둡게
  const g = ctx.createRadialGradient(SW / zoom / 2, SH / zoom / 2, Math.min(SW, SH) / zoom * 0.35,
                                     SW / zoom / 2, SH / zoom / 2, Math.max(SW, SH) / zoom * 0.72);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(20,14,36,.34)');
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
let last = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  actors.forEach(a => stepActor(a, dt));
  if (clickFx) { clickFx.t += dt; if (clickFx.t > 0.5) clickFx = null; }
  const tx = isoX(player.x, player.y) - SW / zoom / 2, ty = isoY(player.x, player.y) - SH / zoom / 2;
  camX += (tx - camX) * 0.12; camY += (ty - camY) * 0.12;
  draw();
  if ($('loading') && total && loaded >= total) $('loading').style.display = 'none';
}

fetch('images/sprites/meta.json').then(r => r.json()).then(meta => {
  loadSprites(meta);
  requestAnimationFrame(loop);
}).catch(() => {
  if ($('loading')) $('loading').textContent = '스프라이트를 불러오지 못했어요';
});

window.__gs = { player, party, MAP, findPath, SPR, PROPIMG, actors, state: () => ({ loaded, total }) };
})();

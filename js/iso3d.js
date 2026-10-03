/* ============================================================
   3D 시험판 — 한라의 정상 (HD-2D 방식)
   · 지형 · 조명 · 이펙트는 3D, 캐릭터는 지금 쓰는 도트 그림을 세워서 씁니다.
   · 2D 맵(js/ch2.js 의 halla)을 그대로 읽어 3D 지형으로 자동 변환해요.
   ============================================================ */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const $ = id => document.getElementById(id);
const FAST = /[?&]fast/.test(location.search);   // 테스트·저사양용 경량 모드

/* ---------------- 맵 (2D 데이터를 그대로 사용) ---------------- */
const MAP = (typeof CH2 !== 'undefined' && CH2.scenes.halla) ? CH2.scenes.halla : null;
const ROWS = MAP ? MAP.rows : ['Zqqqqqqqq', 'Zqqqqqqqq', 'Zqqqqqqqq'];
const MH = ROWS.length, MW = ROWS[0].length;
const cell = (x, y) => (y < 0 || y >= MH || x < 0 || x >= MW) ? 'Z' : ROWS[y][x];
const TILE = 1.5;
const wx = x => (x - MW / 2) * TILE, wz = y => (y - MH / 2) * TILE;
const tileX = v => Math.round(v / TILE + MW / 2), tileY = v => Math.round(v / TILE + MH / 2);

/* ---------------- 기본 세팅 ---------------- */
const renderer = new THREE.WebGLRenderer({ canvas: $('gl'), antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, FAST ? 1 : 1.75));
renderer.shadowMap.enabled = !FAST;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.92;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#2a2550');
scene.fog = new THREE.Fog('#6a5a96', 36, 100);

const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 400);
const CAM_OFF = new THREE.Vector3(0, 19.5, 20);

let composer = null;
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  if (composer) composer.setSize(w, h);
}
addEventListener('resize', resize);

/* ---------------- 빛 ---------------- */
scene.add(new THREE.HemisphereLight('#ffe6f2', '#3a3a78', 0.95));
const sun = new THREE.DirectionalLight('#ffd2b4', 1.75);
sun.position.set(-20, 30, 14);
sun.castShadow = !FAST;
sun.shadow.mapSize.set(768, 768);
sun.shadow.camera.near = 1; sun.shadow.camera.far = 110;
sun.shadow.camera.left = -38; sun.shadow.camera.right = 38;
sun.shadow.camera.top = 38; sun.shadow.camera.bottom = -38;
sun.shadow.bias = -0.0013;
scene.add(sun);
const rim = new THREE.DirectionalLight('#8fd0ff', 0.45); rim.position.set(16, 12, -18); scene.add(rim);

/* ---------------- 하늘 · 구름바다 ---------------- */
{
  const cv = document.createElement('canvas'); cv.width = 32; cv.height = 256;
  const c = cv.getContext('2d'), grd = c.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0, '#241f58'); grd.addColorStop(0.4, '#6a4a9a'); grd.addColorStop(0.72, '#f0869e'); grd.addColorStop(1, '#ffd6a8');
  c.fillStyle = grd; c.fillRect(0, 0, 32, 256);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(170, 24, 16), new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false })));
}
let cloudSea = null;
{
  const s = 256, cv = document.createElement('canvas'); cv.width = cv.height = s;
  const c = cv.getContext('2d');
  c.fillStyle = '#c9bedd'; c.fillRect(0, 0, s, s);
  for (let i = 0; i < 170; i++) {
    const x = Math.random() * s, y = Math.random() * s, r = 8 + Math.random() * 28;
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(240,232,246,.9)'); g.addColorStop(1, 'rgba(180,165,205,0)');
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(7, 7); t.colorSpace = THREE.SRGBColorSpace;
  cloudSea = new THREE.Mesh(new THREE.PlaneGeometry(320, 320), new THREE.MeshBasicMaterial({ map: t, fog: false }));
  cloudSea.rotation.x = -Math.PI / 2; cloudSea.position.y = -13; scene.add(cloudSea);
  cloudSea.userData.tex = t;
}

/* ---------------- 지형: 2D 타일을 3D 블록으로 자동 변환 ---------------- */
const COLORS = { q: ['#6a6374', '#645d6e'], g: ['#6fbf63', '#68b75d'], _: ['#dcbf8e', '#d5b786'], m: ['#e8e2f4', '#e2dcef'], n: ['#bab3ab', '#b4ada5'] };
const BLOCKED = new Set(['Z', 'w', 'z', 'r', '#']);
const solidAt = (x, y) => BLOCKED.has(cell(x, y));

const terrain = new THREE.Group(); scene.add(terrain);
let waterMesh = null;
function buildTerrain() {
  const box = new THREE.BoxGeometry(TILE, 1, TILE);
  const counts = {};
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const t = cell(x, y); if (t === 'w' || t === 'Z') continue;
    const k = COLORS[t] ? t : 'q'; counts[k] = (counts[k] || 0) + 1;
  }
  const meshes = {};
  Object.keys(counts).forEach(k => {
    const im = new THREE.InstancedMesh(box, new THREE.MeshLambertMaterial({ color: '#ffffff' }), counts[k]);
    im.receiveShadow = true; im.count = 0; meshes[k] = im; terrain.add(im);
  });
  const m4 = new THREE.Matrix4(), col = new THREE.Color();
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const t = cell(x, y); if (t === 'w' || t === 'Z') continue;
    const k = COLORS[t] ? t : 'q';
    const im = meshes[k], i = im.count++;
    const edge = (x < 2 || y < 2 || x > MW - 3 || y > MH - 3) ? -0.35 : 0;   // 가장자리는 살짝 낮게
    m4.makeTranslation(wx(x), -0.5 + edge, wz(y));
    im.setMatrixAt(i, m4);
    col.set(COLORS[k][(x + y) % 2]); if (edge) col.offsetHSL(0, -0.1, -0.08);
    col.offsetHSL(0, 0, (Math.sin(x * 12.9898 + y * 78.233) * 0.5 + 0.5) * 0.035 - 0.018);
    im.setColorAt(i, col);
  }
  Object.values(meshes).forEach(im => { im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; });

  // 백록담
  waterMesh = new THREE.Mesh(new THREE.CircleGeometry(TILE * 4.4, 36),
    new THREE.MeshPhongMaterial({ color: '#4fb4dc', transparent: true, opacity: 0.88, shininess: 110, specular: '#ffffff' }));
  waterMesh.rotation.x = -Math.PI / 2; waterMesh.position.set(wx(11.5), 0.08, wz(6.5)); scene.add(waterMesh);

  // 섬 아래 절벽
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(MW * TILE * 0.56, MW * TILE * 0.18, 13, 14, 1, true),
    new THREE.MeshLambertMaterial({ color: '#3b3450', side: THREE.DoubleSide, flatShading: true }));
  skirt.position.y = -7; skirt.scale.z = (MH / MW) * 1.12; scene.add(skirt);
}
buildTerrain();

/* ---------------- 소품 ---------------- */
function addProps() {
  const rockGeo = new THREE.DodecahedronGeometry(0.6, 0);
  const rockMat = new THREE.MeshLambertMaterial({ color: '#8d879c', flatShading: true });
  const bushMat = new THREE.MeshLambertMaterial({ color: '#4f9a4a', flatShading: true });
  const flowerMat = new THREE.MeshBasicMaterial({ color: '#ff6fae' });
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const t = cell(x, y);
    if (t === 'z') {
      const g = new THREE.Group();
      for (let k = 0; k < 4; k++) {
        const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32 + Math.random() * 0.16, 0), bushMat);
        b.position.set((Math.random() - .5) * 0.8, 0.32 + Math.random() * 0.2, (Math.random() - .5) * 0.8); b.castShadow = true; g.add(b);
      }
      for (let k = 0; k < 8; k++) {
        const f = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 5), flowerMat);
        f.position.set((Math.random() - .5) * 1.0, 0.45 + Math.random() * 0.35, (Math.random() - .5) * 1.0); g.add(f);
      }
      g.position.set(wx(x), 0, wz(y)); terrain.add(g);
    }
    if (t === 'r' || t === '#') {
      const r = new THREE.Mesh(rockGeo, rockMat);
      r.position.set(wx(x), 0.34, wz(y)); r.rotation.set(Math.random(), Math.random(), Math.random());
      r.scale.setScalar(0.85 + Math.random() * 0.7); r.castShadow = true; r.receiveShadow = true; terrain.add(r);
    }
  }
  for (let i = 0; i < (FAST ? 30 : 70); i++) {
    const a = Math.random() * Math.PI * 2, rr = MW * TILE * 0.34 + Math.random() * 2.2;
    const r = new THREE.Mesh(rockGeo, rockMat);
    r.position.set(Math.cos(a) * rr, -0.25 + Math.random() * 0.5, Math.sin(a) * rr * (MH / MW) * 1.25);
    r.scale.setScalar(0.6 + Math.random() * 1.6); r.rotation.set(Math.random(), Math.random(), Math.random());
    r.castShadow = true; terrain.add(r);
  }
  const colGeo = new THREE.CylinderGeometry(0.32, 0.4, 5.2, 10);
  const colMat = new THREE.MeshLambertMaterial({ color: '#efe9fb' });
  const glowMat = new THREE.MeshBasicMaterial({ color: '#a8dcff' });
  [[3, 3], [20, 3], [3, 17], [20, 17]].forEach(([x, y]) => {
    const c = new THREE.Mesh(colGeo, colMat); c.position.set(wx(x), 2.6, wz(y)); c.castShadow = true; terrain.add(c);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.3, 1.15), colMat); cap.position.set(wx(x), 5.35, wz(y)); terrain.add(cap);
    const o = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), glowMat); o.position.set(wx(x), 6.0, wz(y)); terrain.add(o);
    if (!FAST && (x + y) % 2 === 0) { const pl = new THREE.PointLight('#8fd0ff', 6, 13, 2); pl.position.set(wx(x), 5.6, wz(y)); terrain.add(pl); }
  });
}
addProps();

/* ---------------- 도트 캐릭터를 3D에 세우기 ---------------- */
function spriteTexture(draw, w, h) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const g = cv.getContext('2d'); draw(g);
  const id = g.getImageData(0, 0, w, h), d = id.data, op = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) { if (d[i * 4 + 3] > 120) { op[i] = 1; d[i * 4 + 3] = 255; } else d[i * 4 + 3] = 0; }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x; if (op[i]) continue;
    if ((x > 0 && op[i - 1]) || (x < w - 1 && op[i + 1]) || (y > 0 && op[i - w]) || (y < h - 1 && op[i + w])) { d[i * 4] = 26; d[i * 4 + 1] = 18; d[i * 4 + 2] = 32; d[i * 4 + 3] = 255; }
  }
  g.putImageData(id, 0, 0);
  const t = new THREE.CanvasTexture(cv);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const charCache = new Map();
function charTex(palKey, pose, frame, gear) {
  const key = palKey + '|' + pose + '|' + frame + '|' + gear;
  if (charCache.has(key)) return charCache.get(key);
  const W = 128, H = 160;
  const t = spriteTexture(g => {
    const pal = { ...PALETTES[palKey], eye: PALETTES[palKey].eye || '#3a2418' };
    const o = { seed: 2, facingRight: true, gear: gear === 'bow' ? { weapon: 'eros_bow' } : {} };
    if (pose === 'walk') { o.moving = true; o.t = frame * 3.3 + 0.5; }
    else if (pose === 'aim') { o.t = 1; o.aim = 10; }
    else o.t = 1 + frame * 40;
    AV.draw(g, W / 2, H - 8, pal, o, 1.35);
  }, W, H);
  charCache.set(key, t); return t;
}
function makeBillboard(tex, hgt) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(hgt * (tex.image.width / tex.image.height), hgt),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.4 }));
  m.userData.billboard = true; return m;
}
function blobShadow(size) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64;
  const c = cv.getContext('2d'), g = c.createRadialGradient(32, 32, 2, 32, 32, 30);
  g.addColorStop(0, 'rgba(10,6,20,.62)'); g.addColorStop(1, 'rgba(10,6,20,0)');
  c.fillStyle = g; c.fillRect(0, 0, 64, 64);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.07; return m;
}

const player = new THREE.Group(); scene.add(player);
const pSprite = makeBillboard(charTex('dad', 'idle', 0, 'bow'), 2.4); pSprite.position.y = 1.2; player.add(pSprite);
player.add(blobShadow(2.0));
player.position.set(wx(11.5), 0, wz(17));
const P = { hp: 100, max: 100, face: 1, t: 0, atkCD: 0, hurt: 0, dash: 0, dashCD: 0, moving: false, dead: false };

const mate = new THREE.Group(); scene.add(mate);
const mSprite = makeBillboard(charTex('mom', 'idle', 0, ''), 2.3); mSprite.position.y = 1.15; mate.add(mSprite);
mate.add(blobShadow(1.8)); mate.position.set(wx(10.4), 0, wz(18));

/* 보스 */
function cyclopsTex(frame, flash, cleared) {
  return spriteTexture(g => {
    const OL = '#2a1a20', b = Math.sin(frame * 0.8) * 3, raise = frame === 3;
    g.translate(160, 300); g.scale(2.4, 2.4); g.lineJoin = 'round'; g.lineCap = 'round';
    const skin = flash ? '#ffffff' : '#c8a88a', fur = '#6a4a32';
    g.fillStyle = '#4a3a2a'; g.fillRect(-26, -30, 14, 30); g.fillRect(12, -30, 14, 30);
    g.strokeStyle = OL; g.lineWidth = 3; g.strokeRect(-26, -30, 14, 30); g.strokeRect(12, -30, 14, 30);
    g.beginPath(); g.ellipse(0, -56 + b, 40, 34, 0, 0, 6.28); g.fillStyle = skin; g.fill(); g.stroke();
    g.beginPath(); g.moveTo(-38, -40 + b); g.lineTo(38, -40 + b); g.lineTo(32, -24); g.lineTo(-32, -24); g.closePath(); g.fillStyle = fur; g.fill(); g.stroke();
    g.lineWidth = 11; g.strokeStyle = OL; g.beginPath(); g.moveTo(34, -66 + b); g.lineTo(raise ? 46 : 50, raise ? -100 : -40); g.stroke(); g.lineWidth = 7; g.strokeStyle = skin; g.stroke();
    g.save(); g.translate(raise ? 46 : 50, raise ? -100 : -40); g.rotate(raise ? -0.4 : 0.6);
    g.fillStyle = '#7a5234'; g.strokeStyle = OL; g.lineWidth = 3; g.beginPath(); g.ellipse(0, -14, 7, 18, 0, 0, 6.28); g.fill(); g.stroke(); g.restore();
    g.lineWidth = 11; g.strokeStyle = OL; g.beginPath(); g.moveTo(-34, -66 + b); g.lineTo(-48, -40); g.stroke(); g.lineWidth = 7; g.strokeStyle = skin; g.stroke();
    g.lineWidth = 3; g.strokeStyle = OL; g.beginPath(); g.ellipse(0, -94 + b, 24, 20, 0, 0, 6.28); g.fillStyle = skin; g.fill(); g.stroke();
    g.fillStyle = '#4a3020'; g.beginPath(); g.ellipse(0, -110 + b, 20, 7, 0, Math.PI, 0); g.fill();
    g.beginPath(); g.ellipse(0, -96 + b, 10, 9, 0, 0, 6.28); g.fillStyle = '#ffffff'; g.fill(); g.stroke();
    g.fillStyle = cleared ? '#5a8ad0' : '#3a2a2a'; g.beginPath(); g.arc(1, -95 + b, 5, 0, 6.28); g.fill();
    g.fillStyle = '#fff'; g.fillRect(-1, -98 + b, 2, 2);
    if (!cleared) { g.fillStyle = 'rgba(150,120,230,.85)'; for (let k = 0; k < 7; k++) { g.beginPath(); g.arc(-10 + k * 3.4, -97 + b + Math.sin(k * 1.7) * 3, 6, 0, 6.28); g.fill(); } }
    g.strokeStyle = OL; g.lineWidth = 2.5; g.beginPath(); g.arc(0, -80 + b, 6, 0.1 * Math.PI, 0.9 * Math.PI); g.stroke();
  }, 320, 320);
}
const bossG = new THREE.Group(); scene.add(bossG);
const bSprite = makeBillboard(cyclopsTex(0, false, false), 6.6); bSprite.position.y = 3.3; bossG.add(bSprite);
bossG.add(blobShadow(5.4));
bossG.position.set(wx(11.5), 0, wz(11));
const bossLight = new THREE.PointLight('#b07aff', 5, 18, 2); bossLight.position.set(0, 3, 0); bossG.add(bossLight);
const BOSS = { hp: 520, max: 520, t: 0, cd: 120, act: null, actT: 0, flash: 0, dead: 0, frame: 0 };

/* ---------------- 이펙트 ---------------- */
const vfx = [];
const telegraphTex = (() => {
  const s = 256, cv = document.createElement('canvas'); cv.width = cv.height = s; const c = cv.getContext('2d');
  const g = c.createRadialGradient(s / 2, s / 2, s * 0.08, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(255,90,70,0)'); g.addColorStop(0.7, 'rgba(255,110,80,.5)'); g.addColorStop(0.94, 'rgba(255,220,160,.95)'); g.addColorStop(1, 'rgba(255,220,160,0)');
  c.fillStyle = g; c.fillRect(0, 0, s, s);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
function telegraph(x, z, r, time, onHit) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2),
    new THREE.MeshBasicMaterial({ map: telegraphTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  m.rotation.x = -Math.PI / 2; m.position.set(x, 0.1, z); scene.add(m);
  vfx.push({ m, t: 0, life: time, kind: 'tele', onHit, x, z });
}
function beam(x, z, color = '#b07aff') {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.6, 24, 16, 1, true),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }));
  m.position.set(x, 12, z); scene.add(m);
  const pl = new THREE.PointLight(color, 18, 22, 2); pl.position.set(x, 3, z); scene.add(pl);
  vfx.push({ m, pl, t: 0, life: 44, kind: 'beam' });
}
function shock(x, z, color = '#ffd8a0', max = 9) {
  const m = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.75, 44),
    new THREE.MeshBasicMaterial({ color, transparent: true, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.set(x, 0.14, z); scene.add(m);
  vfx.push({ m, t: 0, life: 34, kind: 'shock', max });
}
const sparkGeo = new THREE.SphereGeometry(0.1, 6, 5);
function burst(x, y, z, color, n = 16, spd = 0.2) {
  for (let i = 0; i < n; i++) {
    const s = new THREE.Mesh(sparkGeo, new THREE.MeshBasicMaterial({ color, blending: THREE.AdditiveBlending, transparent: true }));
    s.position.set(x, y, z); scene.add(s);
    vfx.push({ m: s, t: 0, life: 24 + Math.random() * 16, kind: 'spark', v: new THREE.Vector3((Math.random() - .5) * spd * 3, Math.random() * spd * 2.4, (Math.random() - .5) * spd * 3) });
  }
}
const arrows = [];
function shoot() {
  if (P.atkCD > 0 || P.dead || BOSS.dead) return;
  P.atkCD = 15;
  const dir = new THREE.Vector3(bossG.position.x - player.position.x, 0, bossG.position.z - player.position.z).normalize();
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.55, 4, 6), new THREE.MeshBasicMaterial({ color: '#ffb0d8', blending: THREE.AdditiveBlending }));
  m.position.copy(player.position).add(new THREE.Vector3(0, 1.3, 0));
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  m.add(new THREE.PointLight('#ff8ac0', 2.5, 6, 2));
  scene.add(m); arrows.push({ m, dir, life: 80 });
  P.face = dir.x > 0 ? 1 : -1;
}

/* ---------------- UI ---------------- */
const numsEl = $('nums'), v3 = new THREE.Vector3();
function popNum(x, y, z, val, cls) {
  v3.set(x, y, z).project(camera);
  const el = document.createElement('div');
  el.className = 'num' + (cls ? ' ' + cls : ''); el.textContent = val;
  el.style.left = (v3.x * 0.5 + 0.5) * innerWidth + 'px';
  el.style.top = (-v3.y * 0.5 + 0.5) * innerHeight + 'px';
  numsEl.appendChild(el); setTimeout(() => el.remove(), 950);
}
function hint(t, ms = 2800) { const el = $('hint'); el.textContent = t; el.classList.add('on'); clearTimeout(hint._t); hint._t = setTimeout(() => el.classList.remove('on'), ms); }
function updateHud() { $('uHp').style.width = (P.hp / P.max * 100) + '%'; $('bossFill').style.width = Math.max(0, BOSS.hp / BOSS.max * 100) + '%'; }
setTimeout(() => { const c = $('uFace').getContext('2d'); c.imageSmoothingEnabled = false; c.drawImage(charTex('dad', 'idle', 0, 'bow').image, 40, 12, 50, 50, 0, 0, 38, 38); }, 120);

/* ---------------- 입력 ---------------- */
const K = {}, J = { x: 0, y: 0 };
addEventListener('keydown', e => { K[e.key.toLowerCase()] = true; if (e.key === ' ') { e.preventDefault(); dash(); } });
addEventListener('keyup', e => { K[e.key.toLowerCase()] = false; });
const joy = $('joy'), knob = $('knob'); let jid = null;
function joyMove(e) {
  const r = joy.getBoundingClientRect(); let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
  const m = Math.hypot(dx, dy), R = r.width / 2 - 10; if (m > R) { dx = dx / m * R; dy = dy / m * R; }
  knob.style.transform = `translate(${dx}px,${dy}px)`; J.x = dx / R; J.y = dy / R;
}
joy.addEventListener('pointerdown', e => { jid = e.pointerId; joy.setPointerCapture(jid); joyMove(e); });
joy.addEventListener('pointermove', e => { if (e.pointerId === jid) joyMove(e); });
['pointerup', 'pointercancel'].forEach(ev => joy.addEventListener(ev, e => { if (e.pointerId !== jid) return; jid = null; J.x = J.y = 0; knob.style.transform = ''; }));
let atkHeld = false;
$('bAtk').addEventListener('pointerdown', e => { e.preventDefault(); atkHeld = true; });
['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => $('bAtk').addEventListener(ev, () => atkHeld = false));
$('bDash').addEventListener('pointerdown', e => { e.preventDefault(); dash(); });
$('back').onclick = () => location.href = 'iso.html?ch=2';
$('cBack').onclick = () => location.href = 'iso.html?ch=2';
function dash() {
  if (P.dashCD > 0 || P.dead) return;
  P.dash = 12; P.dashCD = 48; P.hurt = Math.max(P.hurt, 18);
  burst(player.position.x, 0.5, player.position.z, '#bfe8ff', 10, 0.12);
}

/* ---------------- 전투 ---------------- */
let shakeT = 0, shakeA = 0, slow = 0;
function hurtPlayer(n) {
  if (P.hurt > 0 || P.dead) return;
  P.hp = Math.max(0, P.hp - n); P.hurt = 52; shakeT = 14; shakeA = 0.5;
  popNum(player.position.x, 2.8, player.position.z, n, 'me'); updateHud();
  if (P.hp <= 0) {
    P.dead = true; hint('잠시 쉬어갔어요 — 곧 다시 시작해요');
    setTimeout(() => { P.hp = P.max; P.dead = false; P.hurt = 80; player.position.set(wx(11.5), 0, wz(17)); updateHud(); }, 1500);
  }
}
function hitBoss(dmg, crit) {
  if (BOSS.dead) return;
  BOSS.hp -= dmg; BOSS.flash = 7; shakeT = Math.max(shakeT, crit ? 10 : 5); shakeA = crit ? 0.4 : 0.2;
  popNum(bossG.position.x + (Math.random() - .5), 5.0, bossG.position.z, dmg, crit ? 'crit' : '');
  updateHud();
  if (BOSS.hp <= 0) {
    BOSS.hp = 0; BOSS.dead = 1; slow = 150; shakeT = 32; shakeA = 0.75;
    burst(bossG.position.x, 3.4, bossG.position.z, '#ffe9b0', 60, 0.34);
    shock(bossG.position.x, bossG.position.z, '#ffffff', 17);
    hint('안개가 걷혔다 — 거인이 구름바다를 바라본다', 4200);
    setTimeout(() => {
      $('cTitle').textContent = '시험판 클리어';
      $('cText').innerHTML = '3D로 옮긴 한라의 정상이에요.<br>이 느낌이면 나머지 장면도 옮길게요.';
      $('cGo').textContent = '다시 하기'; $('card').style.display = 'flex';
    }, 3000);
  }
}
function bossAI() {
  BOSS.t++;
  if (BOSS.flash > 0) BOSS.flash--;
  if (BOSS.dead) { bSprite.material.map = cyclopsTex(0, false, true); bossLight.color.set('#8fd0ff'); return; }
  const dx = player.position.x - bossG.position.x, dz = player.position.z - bossG.position.z, d = Math.hypot(dx, dz) || 1;
  if (!BOSS.act) {
    if (d > 7.5) { bossG.position.x += dx / d * 0.012; bossG.position.z += dz / d * 0.012; }
    else if (d < 5.5) { bossG.position.x -= dx / d * 0.01; bossG.position.z -= dz / d * 0.01; }
    if (--BOSS.cd <= 0) {
      BOSS.act = d < 5.5 ? 'stomp' : (Math.random() < 0.45 ? 'beam' : 'rock'); BOSS.actT = 0;
      if (BOSS.act === 'rock') {
        for (let k = 0; k < 3; k++) {
          const tx = player.position.x + (k ? (Math.random() - .5) * 7 : 0), tz = player.position.z + (k ? (Math.random() - .5) * 7 : 0);
          telegraph(tx, tz, 2.3, 72 + k * 12, (x, z) => {
            shock(x, z, '#ffc080', 6); burst(x, 0.5, z, '#b0a090', 18, 0.22);
            if (Math.hypot(player.position.x - x, player.position.z - z) < 2.3) hurtPlayer(14);
          });
        }
      }
      if (BOSS.act === 'stomp') telegraph(bossG.position.x, bossG.position.z, 6.5, 62, (x, z) => {
        shock(x, z, '#ffd8a0', 13); burst(x, 0.6, z, '#d8c8a0', 28, 0.3);
        if (Math.hypot(player.position.x - x, player.position.z - z) < 6.5) hurtPlayer(16);
      });
      if (BOSS.act === 'beam') {
        for (let k = 0; k < 2; k++) {
          const tx = player.position.x + (Math.random() - .5) * 6, tz = player.position.z + (Math.random() - .5) * 6;
          telegraph(tx, tz, 1.8, 84 + k * 16, (x, z) => {
            beam(x, z); shock(x, z, '#c8a0ff', 7); burst(x, 1.2, z, '#c8a0ff', 22, 0.26);
            if (Math.hypot(player.position.x - x, player.position.z - z) < 2.0) hurtPlayer(18);
          });
        }
      }
    }
  } else {
    BOSS.actT++;
    if (BOSS.actT > 72) { BOSS.act = null; BOSS.cd = BOSS.hp < BOSS.max / 2 ? 85 : 120; }
  }
  BOSS.frame = BOSS.act ? 3 : (Math.floor(BOSS.t / 24) % 2);
  bSprite.material.map = cyclopsTex(BOSS.frame, BOSS.flash > 0, false);
  bossLight.intensity = 4 + Math.sin(BOSS.t * 0.1) * 1.5 + (BOSS.flash > 0 ? 10 : 0);
}

/* ---------------- 카메라 · 루프 ---------------- */
let intro = FAST ? 20 : 170;
const camLook = new THREE.Vector3(bossG.position.x, 0, bossG.position.z);
let started = false;
function frame() {
  requestAnimationFrame(frame);
  const step = slow > 0 ? 0.45 : 1;
  if (slow > 0) slow--;
  P.t++;

  if (started) {
    let mx = J.x, mz = J.y;
    if (K['arrowleft'] || K['a']) mx -= 1; if (K['arrowright'] || K['d']) mx += 1;
    if (K['arrowup'] || K['w']) mz -= 1; if (K['arrowdown'] || K['s']) mz += 1;
    const mag = Math.hypot(mx, mz);
    P.moving = mag > 0.18 && !P.dead;
    if (P.moving) {
      const sp = (P.dash > 0 ? 0.4 : 0.135) * step;
      const nx = player.position.x + mx / mag * sp, nz = player.position.z + mz / mag * sp;
      if (!solidAt(tileX(nx), tileY(player.position.z))) player.position.x = nx;
      if (!solidAt(tileX(player.position.x), tileY(nz))) player.position.z = nz;
      if (Math.abs(mx) > 0.12) P.face = mx > 0 ? 1 : -1;
    }
    if (P.dash > 0) P.dash--;
    if (P.dashCD > 0) P.dashCD--;
    if (P.hurt > 0) P.hurt--;
    if (P.atkCD > 0) P.atkCD--;
    if (atkHeld || K['f'] || K['j']) shoot();
    bossAI();
  }

  const pose = P.atkCD > 9 ? 'aim' : P.moving ? 'walk' : 'idle';
  pSprite.material.map = charTex('dad', pose, pose === 'walk' ? Math.floor(P.t / 6) % 6 : 0, 'bow');
  pSprite.scale.x = (P.face < 0 ? -1 : 1) * Math.abs(pSprite.scale.x || 1);
  pSprite.position.y = 1.2 + (P.moving ? Math.abs(Math.sin(P.t * 0.3)) * 0.08 : Math.sin(P.t * 0.05) * 0.04);
  pSprite.visible = !(P.hurt > 0 && Math.floor(P.hurt / 4) % 2 === 0);

  {
    const dx = player.position.x - 1.5 - mate.position.x, dz = player.position.z + 1.0 - mate.position.z, d = Math.hypot(dx, dz);
    if (d > 0.7) { mate.position.x += dx * 0.035 * step; mate.position.z += dz * 0.035 * step; mSprite.material.map = charTex('mom', 'walk', Math.floor(P.t / 7) % 6, ''); }
    else mSprite.material.map = charTex('mom', 'idle', 0, '');
  }

  for (let i = arrows.length - 1; i >= 0; i--) {
    const a = arrows[i];
    a.m.position.addScaledVector(a.dir, 0.5 * step); a.life--;
    const bp = bossG.position.clone().setY(1.8);
    if (!BOSS.dead && a.m.position.distanceTo(bp) < 2.8) {
      const crit = Math.random() < 0.15;
      hitBoss(Math.round((16 + Math.random() * 8) * (crit ? 1.7 : 1)), crit);
      burst(a.m.position.x, a.m.position.y, a.m.position.z, crit ? '#ff8ab8' : '#ffd8a0', 10, 0.18);
      a.life = 0;
    }
    if (a.life <= 0) { scene.remove(a.m); arrows.splice(i, 1); }
  }

  for (let i = vfx.length - 1; i >= 0; i--) {
    const f = vfx[i]; f.t += step;
    if (f.kind === 'tele') {
      f.m.material.opacity = 0.35 + 0.5 * Math.abs(Math.sin(f.t * 0.26));
      f.m.scale.setScalar(0.65 + (f.t / f.life) * 0.35);
      if (f.t >= f.life) { f.onHit && f.onHit(f.x, f.z); scene.remove(f.m); vfx.splice(i, 1); }
    } else if (f.kind === 'beam') {
      const k = f.t / f.life; f.m.material.opacity = (1 - k) * 0.9; f.m.scale.set(1 + k * 0.5, 1, 1 + k * 0.5); f.pl.intensity = 18 * (1 - k);
      if (f.t >= f.life) { scene.remove(f.m); scene.remove(f.pl); vfx.splice(i, 1); }
    } else if (f.kind === 'shock') {
      const k = f.t / f.life; f.m.scale.setScalar(1 + k * f.max); f.m.material.opacity = 1 - k;
      if (f.t >= f.life) { scene.remove(f.m); vfx.splice(i, 1); }
    } else if (f.kind === 'spark') {
      f.m.position.addScaledVector(f.v, step); f.v.y -= 0.013 * step;
      f.m.material.opacity = Math.max(0, 1 - f.t / f.life);
      if (f.t >= f.life) { scene.remove(f.m); vfx.splice(i, 1); }
    }
  }

  if (waterMesh) waterMesh.position.y = 0.08 + Math.sin(P.t * 0.02) * 0.05;
  if (cloudSea) { cloudSea.userData.tex.offset.x += 0.00012 * step; cloudSea.userData.tex.offset.y += 0.00007 * step; }

  const mid = player.position.clone().lerp(bossG.position, started && !BOSS.dead ? 0.3 : 0);
  let target = mid;
  const off = CAM_OFF.clone();
  if (intro > 0 && started) { intro--; target = bossG.position; off.set(0, 10, 13); }
  else if (!started) { target = bossG.position; off.set(Math.sin(P.t * 0.004) * 16, 12, 16); }
  camLook.lerp(target, 0.12);
  camera.position.lerp(camLook.clone().add(off), 0.12);
  camera.lookAt(camLook.x, camLook.y + 1.8, camLook.z);
  if (shakeT > 0) { shakeT--; camera.position.x += (Math.random() - .5) * shakeA; camera.position.y += (Math.random() - .5) * shakeA; }
  scene.traverse(o => { if (o.userData.billboard) { o.quaternion.copy(camera.quaternion); } });
  pSprite.scale.x = P.face < 0 ? -Math.abs(pSprite.scale.x) : Math.abs(pSprite.scale.x);

  composer ? composer.render() : renderer.render(scene, camera);
}

function boot() {
  if (!FAST) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), 0.34, 0.5, 0.93));
    composer.addPass(new OutputPass());
  }
  resize(); updateHud(); frame();
}
$('cGo').onclick = () => {
  if ($('cGo').textContent === '다시 하기') { location.reload(); return; }
  $('card').style.display = 'none'; $('bossBar').classList.add('on'); started = true;
  hint('바닥에 붉은 범위가 뜨면 피하세요 — 회피 버튼으로 구를 수 있어요', 4400);
};
boot();
window.__d3 = { P, BOSS, player, bossG, camera, scene, start: () => $('cGo').click(), vfx, state: () => ({ started, intro }) };

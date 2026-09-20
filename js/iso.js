/* ============================================================
   ISO — 쿼터뷰 네오픽셀 엔진 (실시간 전투)
   - 낮은 해상도로 도트를 그리고(선명하게 확대) 그 위에 부드러운 조명을 얹어요
   - 바닥·벽·건물은 픽셀마다 계산해서 그려요 (그림 파일 없이)
   ============================================================ */
(function(){
'use strict';
const $=id=>document.getElementById(id);

/* ---------------- 맵 (한 글자 = 한 칸) ----------------
   B 사무실 건물(뒤) · S 식당(뒤) · . 보도 · , 광장 · = 도로
   L 가로등 · T 가을 나무 · b 벤치 · p 화분 · c 상자 · v 자판기 · k 통 */
const MAP = {
  name:'회사 앞 거리', key:'street1',
  rows:[
    'BBBBBBSSSSSBBBBBB',
    'B.p..L...b..v.L.p',
    'B....,,,,,,,,....',
    'BT...,,,,,,,,..T.',
    'B....,,,,,,,,....',
    'Bb.......c......k',
    'B================',
    'B================',
    'B....L....T...L..',
    'B................',
    'B.p....b.....p...',
    'B................'
  ],
  spawn:[2.6, 9.4],
  npcs:{ cw_f1:[8.4, 1.8], eros1:[11.4, 3.6], cw_m1:[3.6, 2.2] },
  mobs:[ ['cloud',6.5,9.2], ['cloud',11.5,9.6], ['cloud',14.2,4.2], ['shadow',9.5,4.8], ['cloud',4.5,4.6] ]
};
const ROWS=MAP.rows, MH_=ROWS.length, MW_=ROWS[0].length;
const TW=32, TH=16, BH=76, EDGE=30;
const OX=MH_*16+8, OY=BH+26;
const PW=(MW_+MH_)*16+16, PH=(MW_+MH_)*8+OY+EDGE+8;
const cell=(x,y)=> (x<0||y<0||x>=MW_||y>=MH_) ? 'X' : ROWS[y][x];
const SOLID=new Set(['B','S','L','T','b','p','c','v','k','X']);
const WALL=new Set(['B','S','X']);
function isoX(x,y){ return (x-y)*16+OX; }
function isoY(x,y,z=0){ return (x+y)*8+OY-z; }

/* ---------------- 화면 ---------------- */
const view=$('view'), vc=view.getContext('2d');
const lc=document.createElement('canvas'), l=lc.getContext('2d');
const lightC=document.createElement('canvas'), lg=lightC.getContext('2d');
let SW=0, SH=0, DPR=1, S=1, LW=0, LH=0, camX=0, camY=0;
function resize(){
  DPR=Math.min(window.devicePixelRatio||1, 2.5);
  SW=innerWidth; SH=innerHeight;
  view.width=Math.round(SW*DPR); view.height=Math.round(SH*DPR);
  S=Math.max(1.2, SW<SH ? SW/215 : Math.min(SW,SH)/270);   // 도트 1칸의 화면 크기 (세로 화면은 조금 더 가까이)
  LW=Math.ceil(SW/S); LH=Math.ceil(SH/S);
  lc.width=LW; lc.height=LH;
  lightC.width=Math.ceil(SW*DPR/2); lightC.height=Math.ceil(SH*DPR/2);
}
addEventListener('resize', resize); resize();

/* ---------------- 유틸 ---------------- */
function hash(x,y,s=0){ let h=(x*374761393+y*668265263+s*982451653)|0; h=(h^(h>>>13))*1274126177|0; return ((h^(h>>>16))>>>0)/4294967295; }
function rgb(h){ h=h.replace('#',''); return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]; }
function adj(c,d){ return [Math.max(0,Math.min(255,c[0]+d)),Math.max(0,Math.min(255,c[1]+d)),Math.max(0,Math.min(255,c[2]+d))]; }
function mixc(a,b,f){ return [a[0]+(b[0]-a[0])*f, a[1]+(b[1]-a[1])*f, a[2]+(b[2]-a[2])*f]; }
const C=h=>rgb(h);

/* ---------------- 배경 한 번 그리기 (픽셀 단위) ---------------- */
const bg=document.createElement('canvas'); bg.width=PW; bg.height=PH;
(function paintBackground(){
  const g=bg.getContext('2d'), img=g.createImageData(PW,PH), d=img.data;
  const put=(i,c)=>{ d[i]=c[0]; d[i+1]=c[1]; d[i+2]=c[2]; d[i+3]=255; };
  const sidewalk=C('#5d6477'), plaza=C('#72707a'), road=C('#343947'), mortar=C('#2c303c'), curb=C('#8c8f9a');
  const office=C('#4a4f63'), brick=C('#5c3f3a'), wood=C('#6a4a36');
  for(let py=0; py<PH; py++) for(let px=0; px<PW; px++){
    const i=(py*PW+px)*4, n=hash(px,py);
    const a=(px-OX)/16, b=(py-OY)/8;
    const wx=(a+b)/2, wy=(b-a)/2;
    let col=null;
    // 1) 뒤쪽 건물 정면 (y=1 면 · x=1 면)
    if(px>=OX){
      const x=a+1, z=(x+1)*8+OY-py;
      if(x>=1 && x<=MW_ && z>=0 && z<=BH+4) col=facadeRow(x,z,px,py,n);
    } else {
      const y=1-a, z=(1+y)*8+OY-py;
      if(y>=1 && y<=MH_ && z>=0 && z<=BH+4) col=facadeCol(y,z,px,py,n);
    }
    // 2) 바닥
    if(!col && wx>=0 && wy>=0 && wx<MW_ && wy<MH_){
      const tx=Math.floor(wx), ty=Math.floor(wy), fx=wx-tx, fy=wy-ty, t=cell(tx,ty);
      if(t!=='B' && t!=='S') col=floorPix(t,tx,ty,fx,fy,wx,wy,n,px,py);
    }
    // 3) 앞쪽 낭떠러지 면
    if(!col){
      const xL=a+MH_; const eL=(xL+MH_)*8+OY;
      if(xL>=0 && xL<=MW_ && py>eL && py<=eL+EDGE) col=edgePix(xL*16, py-eL, true, n);
      const yR=MW_-a; const eR=(MW_+yR)*8+OY;
      if(!col && yR>=0 && yR<=MH_ && py>eR && py<=eR+EDGE) col=edgePix(yR*16, py-eR, false, n);
    }
    // 4) 하늘 (어두운 밤)
    if(!col){
      if(py < OY+(MW_+MH_)*8){ const t=py/PH; col=mixc(C('#0d1020'),C('#1a1f33'),t); if(n>0.9975) col=C('#c8d0ff'); }
      else { d[i+3]=0; continue; }
    }
    put(i,col);
  }
  g.putImageData(img,0,0);

  function floorPix(t,tx,ty,fx,fy,wx,wy,n){
    let c;
    if(t==='='){
      c=adj(road, (n*14|0)-7);
      if(Math.abs(wy-7)<0.045 && Math.floor(wx*1.2)%2===0) c=C('#b9a668');
      if(wy<6.08 || wy>7.92) c=adj(curb,(n*10|0)-5);
      return c;
    }
    if(t===','){
      const edge=fx<0.05||fy<0.05;
      c=adj(plaza, ((hash(tx,ty,3)*16)|0)-8 + ((n*10)|0)-5);
      if(edge) c=adj(mortar,6);
      if(Math.abs(fx-0.5)<0.03 && Math.abs(fy-0.5)<0.2) c=adj(plaza,-14);
      return c;
    }
    // 보도블록: 한 칸에 벽돌 네 장 (줄마다 어긋나게)
    const r=fy<0.5?0:1, sx=(fx+(r?0.25:0))%0.5, sy=fy%0.5;
    const bid=Math.floor((fx+(r?0.25:0))*2)+r*3+tx*7+ty*13;
    c=adj(sidewalk, ((hash(bid,ty,1)*18)|0)-9 + ((n*10)|0)-5);
    if(sx<0.05 || sy<0.07) c=mortar;
    else if(sy<0.12 || sx<0.1) c=adj(c,10);
    if(hash(tx,ty,9)>0.8 && Math.abs((fx*1.3-fy)-(hash(tx,ty,4)-0.3))<0.022) c=adj(mortar,-6);    // 금
    if(n>0.985) c=adj(c,-18);
    // 도로 옆 연석
    if((ty===5 && fy>0.9) || (ty===8 && fy<0.1)) c=adj(curb,(n*10|0)-5);
    return c;
  }
  function edgePix(u, v, left, n){
    let c=left?C('#3b3f4e'):C('#2c2f3c');
    const row=Math.floor(v/7), off=row%2?6:0;
    if(v%7===0 || (Math.floor((u+off))%12===0)) c=adj(c,-12);
    else if(v%7===1) c=adj(c,8);
    c=adj(c,((n*10)|0)-5);
    return mixc(c, C('#07080d'), Math.min(1, v/EDGE*0.9));
  }
  function windowPix(u, z, lit, x0){
    // u: 가로 위치(px) · 창틀 · 불빛
    return null;
  }
  function facadeRow(x, z, px, py, n){
    const u=(x-1)*16;           // 가로 픽셀
    if(z>BH) return z>BH+2 ? C('#1c1f2b') : C('#6a6f82');
    const shop = x>=6 && x<11;
    if(shop){
      let c=adj(wood, ((n*12)|0)-6); if(Math.floor(z)%4===0) c=adj(c,-14);
      if(z>=6 && z<=26 && x>6.3 && x<10.7){           // 큰 유리창 (불 켜짐)
        const mull=Math.abs(((x-6.3)*16)%18)<1.2 || Math.abs(z-16)<0.8;
        c = mull ? C('#3a2a20') : mixc(C('#ffcf85'),C('#ffe9bf'),Math.max(0,(z-6)/20)*0.6);
        if(!mull && hash(Math.floor(x*4),Math.floor(z/3),5)>0.8) c=adj(c,-30);   // 안쪽 손님 그림자
      }
      if(z>28 && z<=34) c = (Math.floor(u/4)%2) ? C('#b8484a') : C('#efe2cc');       // 차양
      if(z>34 && z<=35.5) c=C('#5a2426');
      if(z>=40 && z<=52 && x>6.6 && x<10.4){          // 간판
        c=C('#6e2426'); if(z<41.2||z>50.8||x<6.75||x>10.25) c=C('#e2b75a');
        else if(hash(Math.floor(u/2),Math.floor(z/2),7)>0.62 && z>43 && z<49 && x>7 && x<10) c=C('#ffe9b0');
      }
      if(z>56 && z<70){ const wi=Math.floor((x-6)*2); const fu=((x-6)*2)%1; if(fu>0.18 && fu<0.82 && z>58 && z<68) c = hash(wi,3,11)>0.4 ? C('#ffd48a') : C('#20283c'); }
      return c;
    }
    let c=adj(office, ((n*10)|0)-5);
    if(Math.floor(z)%18===0) c=adj(c,-16);
    if(Math.floor(u)%16===0) c=adj(c,-10);
    const door = x>3.1 && x<4.3 && z<24;
    if(door){ c = (Math.abs(x-3.7)<0.04 || z>22.5) ? C('#2a2e3a') : mixc(C('#bfe0ff'),C('#6f90b8'),z/24); return c; }
    const floor=Math.floor(z/18), fz=z-floor*18, fu=(x*2)%1, wi=Math.floor(x*2);
    if(fz>4 && fz<14 && fu>0.14 && fu<0.86 && z<BH-4){
      const lit=hash(wi,floor,21)>0.45;
      c = lit ? mixc(C('#ffd27a'),C('#fff0c8'),(fz-4)/10*0.5) : C('#1d2436');
      if(!lit && Math.abs((fu-0.3)-(fz-4)/10*0.4)<0.05) c=C('#39456a');
      if(fu<0.2||fu>0.8||fz<5.2||fz>12.8) c=C('#2a2e3a');
    }
    return c;
  }
  function facadeCol(y, z, px, py, n){
    const u=(y-1)*16;
    if(z>BH) return z>BH+2 ? C('#1a1c28') : C('#5a5e70');
    let c=adj(brick, ((n*12)|0)-6);
    const row=Math.floor(z/5), off=row%2?5:0;
    if(Math.floor(z)%5===0 || Math.floor(u+off)%10===0) c=adj(c,-18);
    const floor=Math.floor(z/19), fz=z-floor*19, fu=(y*1.5)%1, wi=Math.floor(y*1.5);
    if(fz>5 && fz<15 && fu>0.25 && fu<0.75 && z>6 && z<BH-4){
      const lit=hash(wi,floor,31)>0.55; c= lit ? C('#ffcf88') : C('#1b2032');
      if(fu<0.3||fu>0.7||fz<6||fz>14) c=C('#2a2226');
    }
    if(y>4.2 && y<5.4 && z>10 && z<26) c = hash(Math.floor(y*8),Math.floor(z/3),2)>0.5 ? C('#d8c9a4') : C('#b44a5a');   // 벽보
    return c;
  }
})();

/* ---------------- 도트 소품 (정확한 픽셀) ---------------- */
function R(c,x,y,w,h){ l.fillStyle=c; l.fillRect(Math.round(x),Math.round(y),w,h); }
function box(cx,cy,hw,h,top,lef,rig){           // 네모 상자: 바닥 중심(cx,cy)
  cx=Math.round(cx); cy=Math.round(cy);
  for(let dx=-hw; dx<hw; dx++){
    const k=Math.floor((hw-Math.abs(dx+0.5))/2);
    R(top, cx+dx, cy-h-k, 1, 2*k+1);
    R(dx<0?lef:rig, cx+dx, cy-h+k, 1, h);
  }
}
function drawProp(t,x,y){
  const sx=isoX(x+0.5,y+0.5)-camX, sy=isoY(x+0.5,y+0.5)-camY;
  if(t==='L'){ R('#1e222e',sx-3,sy-2,6,3); R('#2c3242',sx-1,sy-46,3,45); R('#454c62',sx,sy-46,1,45); R('#2c3242',sx-5,sy-50,11,4); R('#fff2c0',sx-3,sy-47,7,2); R('#1e222e',sx-5,sy-51,11,1); }
  else if(t==='T'){
    R('#3a2618',sx-2,sy-18,4,18); R('#5a3a24',sx-1,sy-18,1,18);
    const cols=['#8c3a1c','#b8541e','#d9782a','#f0a040','#6e2e18'];
    for(let k=0;k<60;k++){ const a=hash(k,x,y)*6.283, r=hash(k,y,x)*13; const px=sx+Math.cos(a)*r*1.1, py=sy-30+Math.sin(a)*r*0.8;
      R(cols[(hash(k,3,x)*5)|0], px-2, py-2, 4, 4); }
    R('#f5c060',sx-6,sy-38,2,2); R('#f5c060',sx+4,sy-34,2,2);
  }
  else if(t==='b'){ box(sx,sy,9,5,'#8a5a3a','#5e3c26','#6e4630'); R('#a06a44',sx-9,sy-10,18,1); R('#3a2a20',sx-7,sy-4,1,4); R('#3a2a20',sx+6,sy-4,1,4); }
  else if(t==='p'){ box(sx,sy,6,7,'#6a5a50','#4a3e38','#56483f'); for(let k=0;k<14;k++){ const a=hash(k,x,y)*6.283, r=hash(y,k,x)*5; R(k%3?'#3f7a3a':'#5fa84a', sx+Math.cos(a)*r-1, sy-13+Math.sin(a)*r*0.7, 3, 3); } }
  else if(t==='c'){ box(sx-3,sy+1,7,8,'#a67a48','#6e4c2c','#83603a'); box(sx+4,sy-1,6,7,'#b8884e','#7a5430','#8c6a40'); R('#5a3a20',sx-9,sy-4,14,1); }
  else if(t==='k'){ R('#5a3a22',sx-5,sy-14,10,14); R('#7a5230',sx-4,sy-14,3,14); R('#2e2a2a',sx-5,sy-11,10,1); R('#2e2a2a',sx-5,sy-4,10,1); R('#8a6038',sx-5,sy-15,10,2); }
  else if(t==='v'){ box(sx,sy,7,28,'#c04448','#8e2e32','#a8383c'); R('#9fe6ff',sx-5,sy-24,5,9); R('#dff8ff',sx-4,sy-23,2,2); R('#e8e0d0',sx+1,sy-22,4,12); R('#2a2226',sx-5,sy-10,5,3); }
}

/* ---------------- 캐릭터 도트화 (벡터 → 도트 + 외곽선) ---------------- */
const pxCache=new Map();
function pixelize(key, w, h, draw){
  let c=pxCache.get(key); if(c) return c;
  c=document.createElement('canvas'); c.width=w; c.height=h;
  const g=c.getContext('2d'); draw(g);
  const id=g.getImageData(0,0,w,h), d=id.data, op=new Uint8Array(w*h);
  for(let i=0;i<w*h;i++){ if(d[i*4+3]>120){ op[i]=1; d[i*4+3]=255; } else d[i*4+3]=0; }
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){
    const i=y*w+x; if(op[i]) continue;
    if((x>0&&op[i-1])||(x<w-1&&op[i+1])||(y>0&&op[i-w])||(y<h-1&&op[i+w])){ d[i*4]=22; d[i*4+1]=16; d[i*4+2]=28; d[i*4+3]=255; }
  }
  g.putImageData(id,0,0); pxCache.set(key,c); return c;
}
const CHW=56, CHH=68, CHS=0.52;
function charSprite(palKey, pose, frame, gearKey){
  const key=`${palKey}|${pose}|${frame}|${gearKey}`;
  return pixelize(key, CHW, CHH, g=>{
    const pal={...PALETTES[palKey], eye:PALETTES[palKey].eye||'#3a2418'};
    const o={ seed:0, facingRight:true, gear: gearKey==='bow'?{weapon:'eros_bow'}:{} };
    if(pose==='walk'){ o.moving=true; o.t=frame*3.27+0.5; }
    else if(pose==='blink'){ o.t=231; }
    else if(pose==='aim'){ o.t=1; o.aim=10; }
    else if(pose==='hurt'){ o.t=1; o.hurt=true; }
    else o.t=1+frame*40;
    AV.draw(g, CHW/2, CHH-4, pal, o, CHS);
  });
}
function mobSprite(look, frame, flash){
  return pixelize(`mob|${look}|${frame}|${flash?1:0}`, 40, 44, g=>{ g.translate(20,39); g.scale(0.52,0.52); AV.mob(g, look, frame*18, flash, true, false); });
}
function drawChar(spr, sx, sy, flip){
  const x=Math.round(sx-CHW/2), y=Math.round(sy-CHH+4);
  if(flip){ l.save(); l.translate(Math.round(sx)*2,0); l.scale(-1,1); l.drawImage(spr,x,y); l.restore(); }
  else l.drawImage(spr,x,y);
}
function shadowAt(sx,sy,w){ l.fillStyle='rgba(0,0,0,.35)'; l.beginPath(); l.ellipse(Math.round(sx),Math.round(sy),w,w*0.42,0,0,Math.PI*2); l.fill(); }

/* ---------------- 게임 상태 ---------------- */
const CH=CHAPTER_FIELDS.chapter1, F=CH.fields.street1;
const npcs=F.npcs.filter(n=>MAP.npcs[n.id]).map(n=>({...n, x:MAP.npcs[n.id][0], y:MAP.npcs[n.id][1], talked:false}));
const P={ x:MAP.spawn[0], y:MAP.spawn[1], vx:0, vy:0, face:1, t:0, hp:100, maxHp:100, hurt:0, atkCD:0, aim:0, skillCD:0, armed:false, moving:false, dead:false };
let mobs=[], shots=[], fx=[], nums=[], drops=[], leaves=[], motes=[];
let mode='intro', near=null, globalT=0, shake=0, hostile=false, cleared=false;
function spawnMobs(){
  mobs=MAP.mobs.map(([look,x,y],i)=>({ look, x, y, sx:x, sy:y, hp:look==='shadow'?60:34, maxHp:look==='shadow'?60:34, atk:look==='shadow'?11:7, spd:look==='shadow'?0.022:0.016,
    flash:0, hpShow:0, dead:0, gone:false, wind:0, cd:0, t:i*17, wanderA:hash(i,3)*6.28, kb:[0,0] }));
}
spawnMobs();
for(let i=0;i<40;i++) motes.push({x:Math.random(),y:Math.random(),s:0.3+Math.random()*0.7,p:Math.random()*6});

/* ---------------- 입력 ---------------- */
const K={}, J={x:0,y:0,on:false};
let atkHeld=false, atkQ=false, skillQ=false, talkQ=false;
addEventListener('keydown',e=>{
  const k=e.key.toLowerCase(); K[k]=true;
  if(mode==='dlg'){ if(k===' '||k==='enter'||k==='z'){ e.preventDefault(); advance(); } return; }
  if(k==='f'||k==='j'){ atkQ=true; atkHeld=true; }
  if(k==='g'||k==='k') skillQ=true;
  if(k==='enter'||k===' '||k==='z'){ e.preventDefault(); talkQ=true; }
});
addEventListener('keyup',e=>{ const k=e.key.toLowerCase(); K[k]=false; if(k==='f'||k==='j') atkHeld=false; });
const joy=$('joy'), knob=$('knob'); let jid=null;
function joyMove(e){ const r=joy.getBoundingClientRect(); let dx=e.clientX-(r.left+r.width/2), dy=e.clientY-(r.top+r.height/2); const m=Math.hypot(dx,dy), R=r.width/2-10;
  if(m>R){ dx=dx/m*R; dy=dy/m*R; } knob.style.transform=`translate(${dx}px,${dy}px)`; J.x=dx/R; J.y=dy/R; J.on=true; }
joy.addEventListener('pointerdown',e=>{ jid=e.pointerId; joy.setPointerCapture(jid); joyMove(e); });
joy.addEventListener('pointermove',e=>{ if(e.pointerId===jid) joyMove(e); });
['pointerup','pointercancel'].forEach(ev=>joy.addEventListener(ev,e=>{ if(e.pointerId!==jid) return; jid=null; J.x=J.y=0; J.on=false; knob.style.transform=''; }));
function hold(el, down, up){ el.addEventListener('pointerdown',e=>{ e.preventDefault(); down(); }); ['pointerup','pointercancel','pointerleave'].forEach(ev=>el.addEventListener(ev,()=>up&&up())); }
hold($('bAtk'), ()=>{ atkQ=true; atkHeld=true; }, ()=>{ atkHeld=false; });
hold($('bSkill'), ()=>{ skillQ=true; });
hold($('bTalk'), ()=>{ talkQ=true; });
$('menuBtn').onclick=()=>{ location.href='index.html'; };
$('homeBtn').onclick=e=>{ e.stopPropagation(); location.href='index.html'; };
$('replayBtn').onclick=e=>{ e.stopPropagation(); location.reload(); };

/* ---------------- 소리 ---------------- */
let AC=null;
function beep(f,d,type='sine',v=0.1,delay=0){ try{ AC=AC||new (window.AudioContext||window.webkitAudioContext)(); const t=AC.currentTime+delay, o=AC.createOscillator(), g=AC.createGain(); o.type=type; o.frequency.setValueAtTime(f,t); g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(0.001,t+d); o.connect(g).connect(AC.destination); o.start(t); o.stop(t+d); }catch(e){} }
const sfx={ shoot:()=>{ beep(900,0.05,'triangle',0.08); beep(560,0.07,'triangle',0.06,0.03); }, hit:()=>beep(170,0.07,'square',0.08), pop:()=>{ beep(620,0.07); beep(930,0.1,'sine',0.09,0.05); },
  hurt:()=>{ beep(220,0.12,'sawtooth',0.07); }, talk:()=>beep(880,0.05,'sine',0.06), skill:()=>[660,880,1100,1320].forEach((f,i)=>beep(f,0.12,'triangle',0.09,i*0.05)), get:()=>[784,988,1318].forEach((f,i)=>beep(f,0.1,'sine',0.08,i*0.06)) };

/* ---------------- 알림 ---------------- */
let toastT=null;
function toast(t,ms=2200){ const el=$('toast'); el.textContent=t; el.classList.add('on'); clearTimeout(toastT); toastT=setTimeout(()=>el.classList.remove('on'),ms); }
let bannerT=null;
function banner(t){ $('bannerT').textContent=t; const b=$('banner'); b.classList.add('on'); clearTimeout(bannerT); bannerT=setTimeout(()=>b.classList.remove('on'),1300); }
function updateHud(){
  $('uHp').style.width=(P.hp/P.maxHp*100)+'%'; $('uHpT').textContent=`${Math.ceil(P.hp)}/${P.maxHp}`;
  const done=npcs.filter(n=>n.talked).length, alive=mobs.filter(m=>!m.gone && m.dead===0).length;
  $('obj').innerHTML = `<i>◆</i> 이야기 ${done}/${npcs.length}` + (hostile ? ` · 안개 ${mobs.length-alive}/${mobs.length}` : '');
  $('bAtk').classList.toggle('off', !P.armed); $('bSkill').classList.toggle('off', !P.armed);
}
const HEADTOP=()=>Math.round(CHH-4-73*CHS);
function drawFace(){ const c=$('uFace').getContext('2d'); c.imageSmoothingEnabled=false; c.clearRect(0,0,40,40); c.fillStyle='#2a3044'; c.fillRect(0,0,40,40);
  c.drawImage(charSprite('dad','idle',0,''), CHW/2-14, HEADTOP()-3, 28, 28, 0, 1, 40, 40); }

/* ---------------- 대화 (양피지 말풍선) ---------------- */
let dq=[], dcb=null, typing=null, full='', shown=0, curSide='left';
function portraitEl(key){
  const p=PORTRAITS[key]||{};
  if(p.img){ const im=new Image(); im.src=p.img; return im; }
  const palKey={eros:'eros', apron:'apron', suit:'suit', coworker_f:'apron', coworker_m:'suit'}[key] || key;
  if(PALETTES[palKey]){
    const c=document.createElement('canvas'); c.width=46; c.height=46; const g=c.getContext('2d'); g.imageSmoothingEnabled=false;
    g.drawImage(charSprite(palKey,'idle',0,''), CHW/2-20, HEADTOP()-(PALETTES[palKey].float?14:4), 40, 40, 3, 6, 40, 40); return c;
  }
  const s=document.createElement('div'); s.textContent=p.emoji||'✦'; s.style.cssText='position:absolute;bottom:20px;left:50%;transform:translateX(-50%);font-size:56px'; return s;
}
function speakerName(k){ return (PORTRAITS[k] && PORTRAITS[k].name) || k; }
function showDialog(lines, cb){ dq=lines.slice(); dcb=cb; mode='dlg'; $('dlg').style.display='block'; nextLine(); }
function fmt(t){ return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/《(.+?)》/g,'<b>$1</b>').replace(/\n/g,'<br>'); }
function nextLine(){
  if(!dq.length){ $('dlg').style.display='none'; $('dlg').innerHTML=''; mode='play'; const f=dcb; dcb=null; f&&f(); return; }
  const ln=dq.shift(), side = ln.speaker==='dad' ? 'right' : (ln.speaker==='muse' ? (curSide==='left'?'right':'left') : 'left'); curSide=side;
  const box=document.createElement('div'); box.className='bubble '+side;
  const port=document.createElement('div'); port.className='port'; port.appendChild(portraitEl(ln.speaker));
  box.innerHTML=`<div class="nm">${speakerName(ln.speaker)}</div>${ln.label?`<div class="lb">${ln.label}</div>`:''}<div class="tx"></div><div class="nx">⌄</div>`;
  box.appendChild(port);
  $('dlg').innerHTML=''; $('dlg').appendChild(box);
  full=fmt(ln.text); shown=0; const plain=ln.text.replace(/《|》/g,'');
  clearInterval(typing); const tx=box.querySelector('.tx');
  typing=setInterval(()=>{ shown+=2; if(shown>=plain.length){ clearInterval(typing); typing=null; tx.innerHTML=full; return; } tx.textContent=plain.slice(0,shown); if(shown%6===0) sfx.talk(); }, 28);
}
function advance(){ if(typing){ clearInterval(typing); typing=null; const tx=document.querySelector('#dlg .tx'); if(tx) tx.innerHTML=full; } else nextLine(); }
$('dlg').addEventListener('pointerdown',e=>{ e.preventDefault(); advance(); });

/* ---------------- 이동 · 충돌 ---------------- */
function walkable(x,y){ const r=0.22; for(const [dx,dy] of [[-r,-r],[r,-r],[-r,r],[r,r]]){ if(SOLID.has(cell(Math.floor(x+dx),Math.floor(y+dy)))) return false; } return true; }
function screenToWorld(dx,dy){ return [ (dx/16+dy/8)/2, (dy/8-dx/16)/2 ]; }
function tryMove(o, mx, my){ if(walkable(o.x+mx,o.y)) o.x+=mx; if(walkable(o.x,o.y+my)) o.y+=my; }

/* ---------------- 전투 ---------------- */
function nearestMob(maxD){ let best=null, bd=maxD; mobs.forEach(m=>{ if(m.gone||m.dead) return; const d=Math.hypot(m.x-P.x,m.y-P.y); if(d<bd){ bd=d; best=m; } }); return best; }
function shoot(){
  if(!P.armed){ if(atkQ){ toast('🏹 아직 무기가 없어요 — 에로스를 먼저 만나요'); } return; }
  const tgt=nearestMob(6.5); let dx, dy;
  if(tgt){ dx=tgt.x-P.x; dy=tgt.y-P.y; } else { const w=screenToWorld(P.face,0.001); dx=w[0]; dy=w[1]; }
  const m=Math.hypot(dx,dy)||1; shots.push({x:P.x,y:P.y,vx:dx/m*0.2,vy:dy/m*0.2,life:40});
  const sd=(dx-dy); if(Math.abs(sd)>0.05) P.face=sd>0?1:-1;
  P.atkCD=20; P.aim=10; sfx.shoot();
}
function skill(){
  if(!P.armed){ toast('✦ 에로스의 활을 받아야 쓸 수 있어요'); return; }
  if(P.skillCD>0) return;
  const tgt=nearestMob(7) || {x:P.x+1.5*P.face, y:P.y};
  banner('사랑의 화살비'); sfx.skill(); P.skillCD=360; P.aim=14; shake=6;
  for(let k=0;k<18;k++){ const a=Math.random()*6.283, r=Math.random()*1.5; fx.push({type:'rain', x:tgt.x+Math.cos(a)*r, y:tgt.y+Math.sin(a)*r, t:-k*2, life:26}); }
  setTimeout(()=>{ mobs.forEach(m=>{ if(m.gone||m.dead) return; if(Math.hypot(m.x-tgt.x,m.y-tgt.y)<1.9) damage(m, 28+Math.random()*8, true); }); }, 380);
  fx.push({type:'ring', x:tgt.x, y:tgt.y, t:0, life:40});
}
function damage(m, base, skillHit){
  const crit=Math.random()<0.14, dmg=Math.round(base*(crit?1.6:1));
  m.hp-=dmg; m.flash=8; m.hpShow=180;
  const dx=m.x-P.x, dy=m.y-P.y, d=Math.hypot(dx,dy)||1; m.kb=[dx/d*0.12, dy/d*0.12];
  nums.push({x:m.x,y:m.y,z:34,v:dmg,crit,t:0});
  for(let k=0;k<8;k++) fx.push({type:'spark', x:m.x, y:m.y, z:22, vx:(Math.random()-.5)*2.4, vy:(Math.random()-.5)*2.4-1, t:0, life:18, col:crit?'#ff8fb8':'#ffd27a'});
  sfx.hit(); if(crit) shake=Math.max(shake,4);
  if(m.hp<=0){ m.dead=30; sfx.pop(); for(let k=0;k<22;k++) fx.push({type:'spark', x:m.x, y:m.y, z:18, vx:(Math.random()-.5)*3, vy:(Math.random()-.5)*3-1.5, t:0, life:30, col:'#fff2b0'});
    drops.push({x:m.x,y:m.y,t:0}); }
  updateHud();
}
function hurtPlayer(n, from){
  if(P.hurt>0 || P.dead) return;
  P.hp=Math.max(0,P.hp-n); P.hurt=60; shake=5; sfx.hurt();
  nums.push({x:P.x,y:P.y,z:46,v:n,crit:false,t:0,me:true});
  const dx=P.x-from.x, dy=P.y-from.y, d=Math.hypot(dx,dy)||1; tryMove(P, dx/d*0.35, dy/d*0.35);
  updateHud();
  if(P.hp<=0){ P.dead=true; toast('잠시 쉬어갔어요 — 다시 힘을 내요', 2000); setTimeout(()=>{ P.x=MAP.spawn[0]; P.y=MAP.spawn[1]; P.hp=P.maxHp; P.dead=false; P.hurt=90; updateHud(); }, 1200); }
}

/* ---------------- 대화 · 이야기 흐름 ---------------- */
function talk(n){
  sfx.talk(); P.face = (n.x-n.y)-(P.x-P.y) > 0 ? 1 : -1;
  showDialog(n.lines, ()=>{
    if(!n.talked){ n.talked=true; toast(`◆ 이야기 — ${n.label}`); sfx.get(); }
    if(n.id==='eros1' && !P.armed){
      P.armed=true; drawFace(); updateHud();
      setTimeout(()=>{ banner('에로스의 활'); toast('🏹 공격 버튼(F)으로 사랑의 화살을 쏴요 — 가까운 안개를 자동으로 겨눠요', 3600); }, 200);
      setTimeout(()=>{ hostile=true; toast('레테의 안개가 짙어진다…', 2400); updateHud(); }, 2600);
    }
    updateHud(); checkClear();
  });
}
function checkClear(){
  if(cleared) return;
  if(npcs.every(n=>n.talked) && mobs.every(m=>m.gone||m.dead)){ cleared=true; setTimeout(()=>{ $('endCard').style.display='flex'; }, 1400); }
}

/* ---------------- 업데이트 ---------------- */
function update(){
  globalT++; P.t++;
  if(P.hurt>0) P.hurt--; if(P.atkCD>0) P.atkCD--; if(P.aim>0) P.aim--; if(P.skillCD>0) P.skillCD--;
  if(mode==='play' && !P.dead){
    let jx=J.x, jy=J.y;
    if(K['arrowleft']||K['a']) jx-=1; if(K['arrowright']||K['d']) jx+=1; if(K['arrowup']||K['w']) jy-=1; if(K['arrowdown']||K['s']) jy+=1;
    const m=Math.hypot(jx,jy);
    P.moving = m>0.2;
    if(P.moving){ const sp=1.25*Math.min(1,m); const w=screenToWorld(jx/m*sp, jy/m*sp); tryMove(P,w[0],w[1]); if(Math.abs(jx)>0.15) P.face=jx>0?1:-1; }
    // 가까운 사람
    near=null; let nd=1.3; npcs.forEach(n=>{ const d=Math.hypot(n.x-P.x,n.y-P.y); if(d<nd){ nd=d; near=n; } });
    $('bTalk').style.display = near ? 'flex' : 'none';
    if(talkQ && near) talk(near);
    if(skillQ) skill();
    else if((atkQ||atkHeld) && P.atkCD<=0) shoot();
    if(P.hurt<=0 && P.hp<P.maxHp && globalT%30===0){ P.hp=Math.min(P.maxHp,P.hp+1); updateHud(); }
  }
  atkQ=false; skillQ=false; talkQ=false;
  // 스킬 쿨타임 표시
  $('bSkill').querySelector('.cd').style.setProperty('--cd', (P.skillCD/360*360)+'deg');
  $('bAtk').querySelector('.cd').style.setProperty('--cd', (P.atkCD/20*360)+'deg');
  // 몬스터
  mobs.forEach(m=>{
    m.t++; if(m.flash>0) m.flash--; if(m.hpShow>0) m.hpShow--; if(m.cd>0) m.cd--;
    if(m.gone) return;
    if(m.dead>0){ if(--m.dead===0){ m.gone=true; checkClear(); updateHud(); } return; }
    if(m.kb[0]||m.kb[1]){ tryMove(m,m.kb[0],m.kb[1]); m.kb=[m.kb[0]*0.7,m.kb[1]*0.7]; if(Math.abs(m.kb[0])+Math.abs(m.kb[1])<0.005) m.kb=[0,0]; }
    const dx=P.x-m.x, dy=P.y-m.y, d=Math.hypot(dx,dy);
    if(hostile && d<5.5 && !P.dead){
      if(m.wind>0){ if(--m.wind===0){ if(d<1.1) hurtPlayer(m.atk, m); m.cd=70; } }
      else if(d<0.9 && m.cd<=0){ m.wind=26; }
      else if(d>0.7){ tryMove(m, dx/d*m.spd, dy/d*m.spd); }
    } else {
      m.wanderA+= (hash(m.t,3)-0.5)*0.2;
      const hx=m.sx-m.x, hy=m.sy-m.y;
      tryMove(m, Math.cos(m.wanderA)*0.006+hx*0.004, Math.sin(m.wanderA)*0.006+hy*0.004);
    }
  });
  // 화살
  shots.forEach(s=>{ s.x+=s.vx; s.y+=s.vy; s.life--;
    if(WALL.has(cell(Math.floor(s.x),Math.floor(s.y)))) s.life=0;   // 화살은 건물 벽에만 막혀요 (가로등·벤치는 통과)
    for(const m of mobs){ if(m.gone||m.dead) continue; if(Math.hypot(m.x-s.x,m.y-s.y)<0.42){ damage(m, 11+Math.random()*5); s.life=0; break; } } });
  shots=shots.filter(s=>s.life>0);
  // 추억 조각
  drops.forEach(d=>{ d.t++; const dd=Math.hypot(P.x-d.x,P.y-d.y); if(d.t>20 && dd<2.2){ d.x+=(P.x-d.x)*0.12; d.y+=(P.y-d.y)*0.12; } if(d.t>20 && dd<0.3){ d.got=true; sfx.get(); nums.push({x:P.x,y:P.y,z:58,v:'+6 추억',t:0,exp:true}); } });
  drops=drops.filter(d=>!d.got);
  fx.forEach(f=>{ f.t++; if(f.type==='spark'){ f.vy+=0.12; } }); fx=fx.filter(f=>f.t<f.life);
  nums.forEach(n=>n.t++); nums=nums.filter(n=>n.t<50);
  if(shake>0) shake*=0.85; if(shake<0.2) shake=0;
  // 낙엽
  if(globalT%9===0) for(let y=0;y<MH_;y++) for(let x=0;x<MW_;x++) if(cell(x,y)==='T' && Math.random()<0.25) leaves.push({x:x+0.5+(Math.random()-.5), y:y+0.5+(Math.random()-.5), z:36+Math.random()*10, t:0, c:Math.random()<0.5?'#e07a2a':'#f0a848'});
  leaves.forEach(f=>{ f.t++; f.z-=0.35; f.x+=Math.sin(f.t*0.08)*0.01; }); leaves=leaves.filter(f=>f.z>0);
}

/* ---------------- 그리기 ---------------- */
const LIGHTS=[];
for(let y=0;y<MH_;y++) for(let x=0;x<MW_;x++){ const t=cell(x,y);
  if(t==='L') LIGHTS.push({x:x+0.5,y:y+0.5,z:46,r:110,c:'255,190,110',a:1,flick:1});
  if(t==='v') LIGHTS.push({x:x+0.5,y:y+0.5,z:18,r:44,c:'130,220,255',a:0.7}); }
[[3.7,1.02,14,52,'170,210,255',0.55],[8.5,1.02,16,70,'255,196,120',0.9],[8.5,1.02,46,34,'255,150,100',0.55]].forEach(([x,y,z,r,c,a])=>LIGHTS.push({x,y,z,r,c,a}));

function toScreen(x,y,z=0){ return [ (isoX(x,y)-camX)*S, (isoY(x,y,z)-camY)*S ]; }
function draw(){
  // 카메라: 주인공 따라가기 (도트 단위로 딱 맞춰서)
  const px=isoX(P.x,P.y), py=isoY(P.x,P.y);
  const tx = PW<=LW ? (PW-LW)/2 : Math.max(0, Math.min(PW-LW, px-LW/2));
  const ty = PH<=LH ? (PH-LH)/2 : Math.max(0, Math.min(PH-LH, py-LH*0.55));
  camX+= (tx-camX)*0.12; camY+=(ty-camY)*0.12;
  const sk = shake ? [(Math.random()-.5)*shake, (Math.random()-.5)*shake] : [0,0];
  const cX=Math.round(camX+sk[0]), cY=Math.round(camY+sk[1]); const saveX=camX, saveY=camY; camX=cX; camY=cY;

  l.fillStyle='#07080d'; l.fillRect(0,0,LW,LH);
  l.drawImage(bg, -camX, -camY);
  // 깊이 순서대로 (뒤 → 앞)
  const items=[];
  for(let y=0;y<MH_;y++) for(let x=0;x<MW_;x++){ const t=cell(x,y); if('LTbpckv'.includes(t) && t!=='.') items.push({d:x+y+1, f:()=>drawProp(t,x,y)}); }
  npcs.forEach(n=>items.push({d:n.x+n.y, f:()=>{
    const sx=isoX(n.x,n.y)-camX, sy=isoY(n.x,n.y)-camY, pal=PALETTES[n.palette]||{};
    shadowAt(sx,sy,7);
    const lift = pal.float ? 0 : 0;
    const spr = n.palette==='eros' ? charSprite('eros','idle',Math.floor(globalT/40)%2,'') : charSprite(n.palette,(Math.floor((globalT+n.x*37)/7)%40===39)?'blink':'idle',0,'');
    drawChar(spr, sx, sy-lift, P.x-P.y < n.x-n.y);
  }}));
  mobs.forEach(m=>{ if(m.gone) return; items.push({d:m.x+m.y, f:()=>{
    const sx=isoX(m.x,m.y)-camX, sy=isoY(m.x,m.y)-camY;
    shadowAt(sx,sy,8);
    const spr=mobSprite(m.look, Math.floor(m.t/10)%4, m.flash>0);
    l.save(); if(m.dead>0) l.globalAlpha=m.dead/30; if(m.wind>0 && m.wind%6<3) l.globalAlpha*=0.6;
    l.drawImage(spr, Math.round(sx-20), Math.round(sy-40 - (m.dead>0?(30-m.dead)*0.5:0))); l.restore();
  }}); });
  items.push({d:P.x+P.y, f:()=>{
    const sx=isoX(P.x,P.y)-camX, sy=isoY(P.x,P.y)-camY;
    shadowAt(sx,sy,7);
    if(P.hurt>0 && Math.floor(P.hurt/4)%2===0 && !P.dead) return;
    const pose = P.aim>0 ? 'aim' : P.moving ? 'walk' : (Math.floor(P.t/7)%45===44 ? 'blink' : 'idle');
    const fr = pose==='walk' ? Math.floor(P.t/5)%6 : 0;
    drawChar(charSprite('dad',pose,fr,P.armed?'bow':''), sx, sy, P.face<0);
  }});
  drops.forEach(d=>items.push({d:d.x+d.y, f:()=>{ const sx=isoX(d.x,d.y)-camX, sy=isoY(d.x,d.y)-camY-6-Math.sin(d.t*0.15)*2; R('#fff6c8',sx-1,sy-2,3,5); R('#fff6c8',sx-2,sy-1,5,3); R('#ffffff',sx,sy-1,1,1); }}));
  items.sort((a,b)=>a.d-b.d).forEach(it=>it.f());
  // 낙엽 · 화살 (도트)
  leaves.forEach(f=>{ R(f.c, isoX(f.x,f.y)-camX, isoY(f.x,f.y,f.z)-camY, 2, 1); });
  shots.forEach(s=>{ const x=isoX(s.x,s.y)-camX, y=isoY(s.x,s.y,20)-camY, ex=isoX(s.x-s.vx*3,s.y-s.vy*3)-camX, ey=isoY(s.x-s.vx*3,s.y-s.vy*3,20)-camY;
    l.strokeStyle='#f3dca0'; l.lineWidth=1; l.beginPath(); l.moveTo(Math.round(ex)+.5,Math.round(ey)+.5); l.lineTo(Math.round(x)+.5,Math.round(y)+.5); l.stroke(); R('#ff6f9f',x-1,y-1,3,3); });
  fx.forEach(f=>{ if(f.type==='rain' && f.t>0){ const k=f.t/f.life, x=isoX(f.x,f.y)-camX, y=isoY(f.x,f.y,(1-k)*90)-camY; R('#ffd8e8',x,y-6,1,6); R('#ff6f9f',x-1,y,3,2); } });

  // 도트 화면을 선명하게 확대
  vc.setTransform(1,0,0,1,0,0);
  vc.imageSmoothingEnabled=false;
  vc.drawImage(lc, 0, 0, LW*S*DPR, LH*S*DPR);
  vc.setTransform(DPR,0,0,DPR,0,0);

  // 조명: 어두운 밤 + 따뜻한 불빛 (곱하기) → 빛 번짐 (더하기)
  const LS=lightC.width/SW;
  lg.globalCompositeOperation='source-over'; lg.fillStyle='rgb(44,52,92)'; lg.fillRect(0,0,lightC.width,lightC.height);
  lg.globalCompositeOperation='lighter';
  const allLights=LIGHTS.slice();
  allLights.push({x:P.x,y:P.y,z:24,r:64,c:'170,185,255',a:0.5});
  npcs.forEach(n=>{ if(n.palette==='eros') allLights.push({x:n.x,y:n.y,z:34,r:60,c:'255,200,230',a:0.8}); });
  shots.forEach(s=>allLights.push({x:s.x,y:s.y,z:20,r:22,c:'255,150,200',a:0.8}));
  fx.forEach(f=>{ if(f.type==='ring') allLights.push({x:f.x,y:f.y,z:4,r:70*(1-f.t/f.life)+20,c:'255,140,200',a:1-f.t/f.life}); });
  drops.forEach(d=>allLights.push({x:d.x,y:d.y,z:8,r:26,c:'255,240,190',a:0.7}));
  mobs.forEach(m=>{ if(!m.gone && m.look==='shadow') allLights.push({x:m.x,y:m.y,z:24,r:30,c:'150,120,255',a:0.45}); });
  allLights.forEach(L=>{
    const [sx,sy]=toScreen(L.x,L.y,L.z); const fl = L.flick ? 0.93+Math.sin(globalT*0.3+L.x*7)*0.04+Math.random()*0.03 : 1;
    const r=L.r*S*fl*LS, X=sx*LS, Y=sy*LS;
    const g=lg.createRadialGradient(X,Y,0,X,Y,r); g.addColorStop(0,`rgba(${L.c},${L.a})`); g.addColorStop(0.45,`rgba(${L.c},${L.a*0.45})`); g.addColorStop(1,`rgba(${L.c},0)`);
    lg.fillStyle=g; lg.fillRect(X-r,Y-r,r*2,r*2);
  });
  vc.globalCompositeOperation='multiply'; vc.imageSmoothingEnabled=true;
  vc.drawImage(lightC, 0, 0, SW, SH);
  vc.globalCompositeOperation='lighter';
  allLights.forEach(L=>{ if(!L.flick && L.r>40) return; const [sx,sy]=toScreen(L.x,L.y,L.z); const r=(L.flick?16:L.r*0.5)*S;
    const g=vc.createRadialGradient(sx,sy,0,sx,sy,r); g.addColorStop(0,`rgba(${L.c},${L.flick?0.55:0.35})`); g.addColorStop(1,`rgba(${L.c},0)`); vc.fillStyle=g; vc.fillRect(sx-r,sy-r,r*2,r*2); });
  // 떠다니는 먼지 빛
  motes.forEach(m=>{ const x=((m.x*SW + globalT*0.15*m.s)%SW), y=(m.y*SH + Math.sin(globalT*0.01+m.p)*20); vc.fillStyle=`rgba(255,230,190,${0.15+0.15*Math.sin(globalT*0.03+m.p)})`; vc.fillRect(x,y,1.5*m.s+0.5,1.5*m.s+0.5); });
  vc.globalCompositeOperation='source-over';
  // 가장자리 어둡게 (영화 같은 느낌)
  const vg=vc.createRadialGradient(SW/2,SH/2,Math.min(SW,SH)*0.35,SW/2,SH/2,Math.max(SW,SH)*0.72);
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(4,5,10,.72)'); vc.fillStyle=vg; vc.fillRect(0,0,SW,SH);

  // 화면 위 정보 (부드러운 글씨)
  npcs.forEach(n=>{
    const [sx,sy]=toScreen(n.x,n.y,(PALETTES[n.palette]||{}).float?64:48);
    if(!n.talked){ const b=Math.sin(globalT*0.1)*3; vc.save(); vc.translate(sx,sy-8+b); vc.rotate(Math.PI/4); vc.fillStyle='#e8cf96'; vc.fillRect(-6,-6,12,12); vc.strokeStyle='#5a4420'; vc.lineWidth=1.5; vc.strokeRect(-6,-6,12,12); vc.restore();
      vc.fillStyle='#3a2a10'; vc.font=`900 11px ${getComputedStyle(document.body).fontFamily}`; vc.textAlign='center'; vc.fillText('!',sx,sy-4+b); }
    if(near===n){ label(n.label, sx, sy+ (PALETTES[n.palette]||{}).float? 70*S/2 : 64*S/2 ); }
  });
  mobs.forEach(m=>{ if(m.gone||m.dead||!(m.hpShow>0||hostile)) return; const [sx,sy]=toScreen(m.x,m.y,40); const w=30;
    vc.fillStyle='rgba(10,12,20,.8)'; vc.fillRect(sx-w/2-1,sy-1,w+2,6); vc.fillStyle= m.look==='shadow'?'#c46a8a':'#d77a7a'; vc.fillRect(sx-w/2,sy,w*Math.max(0,m.hp/m.maxHp),4);
    vc.fillStyle='rgba(255,255,255,.35)'; vc.fillRect(sx-w/2,sy,w*Math.max(0,m.hp/m.maxHp),1.5); });
  nums.forEach(n=>{ const [sx,sy]=toScreen(n.x,n.y,n.z+n.t*0.5); const a=Math.min(1,(50-n.t)/15);
    vc.save(); vc.globalAlpha=a; vc.textAlign='center';
    const sz = n.exp?13 : n.crit?26:20; vc.font=`900 ${sz}px "Noto Sans KR", system-ui`;
    vc.lineWidth=4; vc.strokeStyle='rgba(20,10,10,.9)'; vc.strokeText(String(n.v), sx, sy);
    const g=vc.createLinearGradient(0,sy-sz,0,sy); if(n.me){ g.addColorStop(0,'#e8e0ff'); g.addColorStop(1,'#9a8cff'); } else if(n.exp){ g.addColorStop(0,'#fff6c8'); g.addColorStop(1,'#f2c66d'); } else if(n.crit){ g.addColorStop(0,'#fff0f6'); g.addColorStop(1,'#ff5f94'); } else { g.addColorStop(0,'#fff4c8'); g.addColorStop(1,'#ff9a3a'); }
    vc.fillStyle=g; vc.fillText(String(n.v), sx, sy);
    if(n.crit){ vc.fillStyle='#ffd6e6'; vc.font='700 10px "Noto Sans KR"'; vc.fillText('CRITICAL', sx, sy-sz); }
    vc.restore(); });
  // 식당 간판 글씨
  { const [sx,sy]=toScreen(8.5,1.02,46); vc.save(); vc.font=`700 ${Math.round(6.5*S)}px "Gowun Batang", serif`; vc.textAlign='center'; vc.fillStyle='rgba(255,236,190,.95)'; vc.shadowColor='rgba(255,180,90,.9)'; vc.shadowBlur=8; vc.fillText('행복 식당', sx, sy+2.5*S); vc.restore(); }
  camX=saveX; camY=saveY;
}
function label(t, sx, sy){ vc.save(); vc.font='700 12px "Noto Sans KR"'; vc.textAlign='center'; const w=vc.measureText(t).width+16; vc.fillStyle='rgba(30,34,48,.88)'; vc.fillRect(sx-w/2,sy,w,20); vc.strokeStyle='rgba(201,168,106,.7)'; vc.strokeRect(sx-w/2+.5,sy+.5,w-1,19); vc.fillStyle='#f1ead8'; vc.fillText(t,sx,sy+14); vc.restore(); }

/* ---------------- 시작 ---------------- */
$('introMyth').textContent = (CHAPTERS.find(c=>c.launch==='chapter1')||{}).myth || '';
$('introCard').addEventListener('click', ()=>{ $('introCard').style.display='none'; mode='play'; beep(1,0.01,'sine',0.0001);
  setTimeout(()=>toast('왼쪽 조이스틱으로 걸어요 · ◆ 표시가 있는 사람과 대화해요', 3400), 400); });
updateHud(); drawFace();
function loop(){ update(); draw(); requestAnimationFrame(loop); }
loop();
// 테스트용
if(/[?&]debug/.test(location.search)) window.__iso={ P, npcs, get mobs(){return mobs;}, talk, get mode(){return mode;}, get near(){return near;}, get cleared(){return cleared;}, advance, tp(x,y){ P.x=x; P.y=y; } };

})();

/* ============================================================
   ISO — 쿼터뷰 네오픽셀 엔진 (실시간 전투)
   - 낮은 해상도로 도트를 그리고(선명하게 확대) 그 위에 부드러운 조명을 얹어요
   - 바닥·벽·건물은 픽셀마다 계산해서 그려요 (그림 파일 없이)
   ============================================================ */
(function(){
'use strict';
const $=id=>document.getElementById(id);

/* ---------------- 맵 (한 글자 = 한 칸) ----------------
   맨 윗줄 건물: B 사무실 · S 행복식당 · C 단짝 카페   /   왼쪽 줄 B 벽돌 건물
   . 보도 · , 광장 · = 도로 · g 풀밭 · f 꽃밭 · _ 오솔길 · w 연못
   L 가로등 · T 가을 나무 · Y 벚꽃나무 · M 신비한 나무 · F 분수 · r 바위 · b 벤치 · p 화분 · c 상자 · v 자판기 · k 통 */
const MAP = {
  name:'회사 앞 거리 · 망설임의 숲', key:'street1',
  rows:[
    'BBBBBBSSSSSBBBBBBBBBCCCCCBBBBBBBBBBBBBBB',
    'Bp.L........L.....Lv....p.L...p...L.....',
    'B...Y,,,,,,,,,,,Y.......................',
    'B...,,,,,,,,,,,,,.....b...............T.',
    'B...,,,,,,,,,,,,,............T..........',
    'B...,,,,,FF,,,,,,..p....................',
    'B...,,,,,FF,,,,,,.............b....T....',
    'B...,,,,,,,,,,,,,.......................',
    'B...,,,,,,,,,,,,,..............T........',
    'B.p.Y,,b,,,,,b,,Y....c................k.',
    'B..L..............L.........L........L..',
    'B=======================================',
    'B=======================================',
    'Bk...L..............L............L......',
    'Bggggggggggg__gggggggggggggggggggfffgggg',
    'BggMfffggbgg__gggggggggggggMggggfffffMgg',
    'Bggfffffggggg__gMgggggggrgggggggfffffggg',
    'BggfffffgggLg__gggggMgggggggggggfffffggg',
    'Bggfffffggggg__ggggggggggggggggMgfffrggg',
    'BgggfffgMggggg__gggggggggggwwwwggggggggg',
    'Bgggggggggggg__________L_gwwwwwwgggggggg',
    'Bgggggrgggggg____b_______wwwwwwwwggMgggg',
    'BgggMgggggggggg__ggggggggwwwwwwwwggggggg',
    'BgggggfffggggggL_ggggggggwwwwwwwwggggggg',
    'Bggggfffffggggg__ggfggMgggwwwwwwggggggMg',
    'Bggggfffffgggg__ggfffggggggwwwwggggggggg',
    'Bggggfffffgggg__gfffffgggggggggggMgfffgg',
    'BgggggfffgMggg__ggfffggggggggrgggggfffgg',
    'BgMgggggggggg__gggMfggggggMggggggggfffgg',
    'Bgggggggggggg__ggggggggggggggggggggggggg'
  ],
  spawn:[7.5, 8.2],
  npcs:{ cw_f1:[8.5, 1.9], cw_m1:[3.7, 2.4], eros1:[12.6, 6.6] },
  // 몬스터: 넓은 곳에 듬성듬성 (쓰러뜨리면 한참 뒤 다시 나타나요)
  mobs:[ ['cloud',33.5,5.5], ['cloud',26.5,8.5], ['shadow',37.5,7.5],
         ['cloud',6.5,16.5], ['shadow',14.5,19.5], ['cloud',10.5,22.5], ['cloud',18.5,18.5], ['shadow',3.5,25.5],
         ['cloud',21.5,27.5], ['cloud',30.5,16.5], ['shadow',24.5,18.5], ['cloud',36.5,20.5],
         ['shadow',33.5,23.5], ['cloud',8.5,28.5], ['cloud',27.5,27.5], ['shadow',38.5,28.5] ],
  notes:{ note1:[20.5, 20.5], note2:[35.5, 27.5] },
  killGoal:10
};
const ROWS=MAP.rows, MH_=ROWS.length, MW_=ROWS[0].length;
const TW=32, TH=16, BH=76, EDGE=30;
const OX=MH_*16+8, OY=BH+26;
const PW=(MW_+MH_)*16+16, PH=(MW_+MH_)*8+OY+EDGE+8;
const cell=(x,y)=> (x<0||y<0||x>=MW_||y>=MH_) ? 'X' : ROWS[y][x];
const SOLID=new Set(['B','S','C','L','T','Y','M','F','r','w','b','p','c','v','k','X']);
const WALL=new Set(['B','S','C','X']);
const TOPROW=ROWS[0], RUN=[];
for(let i=0;i<MW_;){ let j=i; while(j<MW_ && TOPROW[j]===TOPROW[i]) j++; for(let k=i;k<j;k++) RUN[k]={t:TOPROW[i], s:i, e:j}; i=j; }
let ROAD0=-1, ROAD1=-1; ROWS.forEach((r,y)=>{ if(r.slice(1).split('').every(c=>c==='=')){ if(ROAD0<0) ROAD0=y; ROAD1=y; } });
const PARK_Y = ROAD1+2;
function baseFloor(tx,ty){ const t=cell(tx,ty); if('.,=gf_w'.includes(t)) return t;
  if(t==='F') return ','; if(ty>=PARK_Y) return 'g';
  if(tx>=4&&tx<=16&&ty>=2&&ty<=9) return ','; return '.'; }
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
  const sidewalk=C('#a29cc0'), plaza=C('#d2a9bd'), road=C('#565a7e'), mortar=C('#7a7098'), curb=C('#e4dcf0');
  const office=C('#7c82b8'), brick=C('#b0685e'), wood=C('#9a6444'), mint=C('#6fc4b4');
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
      if(!WALL.has(t)) col=floorPix(baseFloor(tx,ty),tx,ty,fx,fy,wx,wy,n,px,py);
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
      if(py < OY+(MW_+MH_)*8){ const t=Math.min(1,py/(OY*2+40)); col=mixc(C('#3a2a78'),C('#e88fb0'),t); if(n>0.9965) col=C('#fff6ff'); }
      else { d[i+3]=0; continue; }
    }
    put(i,col);
  }
  g.putImageData(img,0,0);

  function floorPix(t,tx,ty,fx,fy,wx,wy,n){
    let c;
    if(t==='g'||t==='f'){
      const h=hash(tx,ty,2);
      c=mixc(C('#5fc46e'),C('#8ad86a'),h*0.6); c=adj(c,((n*16)|0)-8);
      if(hash(Math.floor(wx*9),Math.floor(wy*9),5)>0.86) c=C('#b8f08a');
      else if(hash(Math.floor(wx*7),Math.floor(wy*7),6)>0.9) c=C('#3f9c5a');
      if(t==='f'){ const k=hash(Math.floor(wx*5),Math.floor(wy*5),8); if(k>0.72){ const pal=['#ff7fb8','#ffe066','#ffffff','#b58cff','#ff9a5c']; const q=hash(Math.floor(wx*5),Math.floor(wy*5),9); const d=Math.abs((wx*5)%1-0.5)+Math.abs((wy*5)%1-0.5); if(d<0.35) c=C(pal[(q*5)|0]); if(d<0.12) c=C('#fff6c8'); } }
      return c;
    }
    if(t==='_'){
      c=adj(C('#e0c89a'),((n*14)|0)-7);
      if(hash(Math.floor(wx*6),Math.floor(wy*6),3)>0.82) c=adj(C('#c8ae80'),((n*10)|0)-5);
      const ed=['g','f'].includes(cell(tx-1,ty))&&fx<0.08 || ['g','f'].includes(cell(tx+1,ty))&&fx>0.92 || ['g','f'].includes(cell(tx,ty-1))&&fy<0.08 || ['g','f'].includes(cell(tx,ty+1))&&fy>0.92;
      if(ed) c=C('#9acb72');
      return c;
    }
    if(t==='w'){
      const shore = cell(tx-1,ty)!=='w'&&fx<0.12 || cell(tx+1,ty)!=='w'&&fx>0.88 || cell(tx,ty-1)!=='w'&&fy<0.12 || cell(tx,ty+1)!=='w'&&fy>0.88;
      c=mixc(C('#3fc6e0'),C('#7fe6f2'),0.3+0.3*Math.sin(wx*3+wy*5)); c=adj(c,((n*10)|0)-5);
      if(Math.abs(Math.sin(wx*5.2+wy*2.1))<0.06) c=C('#d8fbff');
      if(shore) c=C('#f2e6c8');
      return c;
    }
    if(t==='='){
      c=adj(road, (n*14|0)-7);
      if(Math.abs(wy-(ROAD1))<0.045 && Math.floor(wx*1.2)%2===0) c=C('#ffe08a');
      if(wy<ROAD0+0.08 || wy>ROAD1+0.92) c=adj(curb,(n*10|0)-5);
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
    if((ty===ROAD0-1 && fy>0.9) || (ty===ROAD1+1 && fy<0.1)) c=adj(curb,(n*10|0)-5);
    return c;
  }
  function edgePix(u, v, left, n){
    let c=left?C('#6a6594'):C('#555080');
    const row=Math.floor(v/7), off=row%2?6:0;
    if(v%7===0 || (Math.floor((u+off))%12===0)) c=adj(c,-12);
    else if(v%7===1) c=adj(c,8);
    c=adj(c,((n*10)|0)-5);
    return mixc(c, C('#231b44'), Math.min(1, v/EDGE*0.85));
  }
  function windowPix(u, z, lit, x0){
    // u: 가로 위치(px) · 창틀 · 불빛
    return null;
  }
  function facadeRow(x, z, px, py, n){
    const u=(x-1)*16;           // 가로 픽셀
    if(z>BH) return z>BH+2 ? C('#3a3268') : C('#b8b2d8');
    const R=RUN[Math.min(MW_-1, Math.floor(x))]||{t:'B',s:0,e:1};
    if(R.t==='S' || R.t==='C'){
      const cafe=R.t==='C', rx=x-R.s, len=R.e-R.s;
      let c=adj(cafe?mint:wood, ((n*12)|0)-6); if(Math.floor(z)%4===0) c=adj(c,-14);
      if(z>=6 && z<=26 && rx>0.3 && rx<len-0.3){                         // 큰 유리창 (불 켜짐)
        const mull=Math.abs(((rx-0.3)*16)%18)<1.2 || Math.abs(z-16)<0.8;
        c = mull ? (cafe?C('#2f6a62'):C('#4a3024')) : mixc(C(cafe?'#fff0b0':'#ffcf85'),C('#fff4d8'),Math.max(0,(z-6)/20)*0.6);
        if(!mull && hash(Math.floor(x*4),Math.floor(z/3),5)>0.8) c=adj(c,-30);
      }
      if(z>28 && z<=34) c = (Math.floor(u/4)%2) ? (cafe?C('#4ab8a0'):C('#e05a5c')) : C('#fff6e6');   // 차양
      if(z>34 && z<=35.5) c=cafe?C('#2a6a5c'):C('#7a2a2e');
      if(z>=40 && z<=52 && rx>0.6 && rx<len-0.6){                         // 간판
        c=C(cafe?'#1f5a58':'#8a2a2e'); if(z<41.2||z>50.8||rx<0.75||rx>len-0.75) c=C('#f2c86a');
        else if(hash(Math.floor(u/2),Math.floor(z/2),7)>0.62 && z>43 && z<49 && rx>1 && rx<len-1) c=C('#fff0c0');
      }
      if(z>56 && z<70){ const wi=Math.floor(rx*2); const fu=(rx*2)%1; if(fu>0.18 && fu<0.82 && z>58 && z<68) c = hash(wi+R.s,3,11)>0.4 ? C('#ffe0a0') : C('#4a4a7a'); }
      return c;
    }
    let c=adj(office, ((n*10)|0)-5);
    if(Math.floor(z)%18===0) c=adj(c,-18);
    if(Math.floor(u)%16===0) c=adj(c,-12);
    const door = x>3.1 && x<4.3 && z<24;
    if(door){ c = (Math.abs(x-3.7)<0.04 || z>22.5) ? C('#3a3e5a') : mixc(C('#dff2ff'),C('#8fb2e0'),z/24); return c; }
    const floor=Math.floor(z/18), fz=z-floor*18, fu=(x*2)%1, wi=Math.floor(x*2);
    if(fz>4 && fz<14 && fu>0.14 && fu<0.86 && z<BH-4){
      const lit=hash(wi,floor,21)>0.35;
      c = lit ? mixc(C('#ffe29a'),C('#fff6dc'),(fz-4)/10*0.5) : C('#5a6aa8');
      if(!lit && Math.abs((fu-0.3)-(fz-4)/10*0.4)<0.05) c=C('#9ab0e8');
      if(fu<0.2||fu>0.8||fz<5.2||fz>12.8) c=C('#4a4e78');
    }
    return c;
  }
  function facadeCol(y, z, px, py, n){
    const u=(y-1)*16;
    if(z>BH) return z>BH+2 ? C('#3a3268') : C('#c8b8d0');
    let c=adj(brick, ((n*12)|0)-6);
    const row=Math.floor(z/5), off=row%2?5:0;
    if(Math.floor(z)%5===0 || Math.floor(u+off)%10===0) c=adj(c,-18);
    const floor=Math.floor(z/19), fz=z-floor*19, fu=(y*1.5)%1, wi=Math.floor(y*1.5);
    if(fz>5 && fz<15 && fu>0.25 && fu<0.75 && z>6 && z<BH-4){
      const lit=hash(wi,floor,31)>0.45; c= lit ? C('#ffe0a0') : C('#5a5a8a');
      if(fu<0.3||fu>0.7||fz<6||fz>14) c=C('#5a3a3a');
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
  else if(t==='Y'){
    R('#5a3a2a',sx-2,sy-18,4,18); R('#7a5238',sx-1,sy-18,1,18);
    const cols=['#ffb8d8','#ff9ac4','#ffd6e8','#ffffff','#f58ab8'];
    for(let k=0;k<70;k++){ const a=hash(k,x,y)*6.283, r=hash(k,y,x)*14; R(cols[(hash(k,3,x)*5)|0], sx+Math.cos(a)*r*1.15-2, sy-31+Math.sin(a)*r*0.8-2, 4, 4); }
    R('#fff6fb',sx-6,sy-40,2,2); R('#fff6fb',sx+5,sy-36,2,2);
  }
  else if(t==='M'){
    R('#3a2a5a',sx-2,sy-20,4,20); R('#5a4a8a',sx-1,sy-20,1,20);
    const cols=['#7a5ae0','#9a7aff','#5a8ae8','#b89cff','#6a4ac8'];
    for(let k=0;k<70;k++){ const a=hash(k,x,y)*6.283, r=hash(k,y,x)*14; R(cols[(hash(k,3,x)*5)|0], sx+Math.cos(a)*r*1.1-2, sy-34+Math.sin(a)*r*0.85-2, 4, 4); }
    for(let k=0;k<6;k++){ const a=hash(k,x,9)*6.283, r=hash(k,9,y)*11; const tw=(Math.sin(globalT*0.08+k+x)+1)/2; R(tw>0.5?'#fff6c0':'#bfe8ff', sx+Math.cos(a)*r-1, sy-34+Math.sin(a)*r*0.8-1, 2, 2); }
  }
  else if(t==='F'){
    if(cell(x-1,y)==='F' || cell(x,y-1)==='F') return;          // 2×2 분수는 왼쪽 위 칸에서 한 번만
    const cx=isoX(x+1,y+1)-camX, cy=isoY(x+1,y+1)-camY;
    for(let dx=-22; dx<22; dx++){ const k=Math.floor((22-Math.abs(dx+0.5))/2); R('#e8e2f4', cx+dx, cy-6-k, 1, 2*k+1); R(dx<0?'#b8b0d0':'#a098c0', cx+dx, cy-6+k, 1, 6); }
    for(let dx=-17; dx<17; dx++){ const k=Math.floor((17-Math.abs(dx+0.5))/2); R(((dx+globalT/6|0)%7===0)?'#dffaff':'#5fd0e8', cx+dx, cy-5-k, 1, 2*k); }
    R('#d8d0ec',cx-3,cy-22,6,16); R('#f4f0ff',cx-2,cy-22,2,16); R('#d8d0ec',cx-7,cy-24,14,3);
    for(let k=0;k<10;k++){ const ph=(globalT*0.6+k*9)%30; const dx=(k%2?1:-1)*(ph*0.35); R('#e8fcff', cx+dx, cy-26-(ph<15?ph:30-ph)*0.8, 1, 2); }
  }
  else if(t==='r'){ box(sx,sy+1,8,6,'#b8b4c8','#8a86a0','#9c98b4'); R('#d8d4e8',sx-4,sy-9,5,2); R('#7fae5a',sx+2,sy-8,3,2); }
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
const npcs=F.npcs.filter(n=>MAP.npcs[n.id]).map(n=>({...n, x:MAP.npcs[n.id][0], y:MAP.npcs[n.id][1], talked:false}))
  .concat(((typeof ISO_EXTRA!=='undefined' && ISO_EXTRA.chapter1)||[]).filter(n=>MAP.notes[n.id]).map(n=>({...n, x:MAP.notes[n.id][0], y:MAP.notes[n.id][1], talked:false})));
const storyNpcs=()=>npcs.filter(n=>!n.note);
let kills=0;
const P={ x:MAP.spawn[0], y:MAP.spawn[1], vx:0, vy:0, face:1, t:0, hp:100, maxHp:100, hurt:0, atkCD:0, aim:0, skillCD:0, armed:false, moving:false, dead:false };
let mobs=[], shots=[], fx=[], nums=[], drops=[], leaves=[], motes=[];
let mode='intro', near=null, globalT=0, shake=0, hostile=false, cleared=false;
function spawnMobs(){
  mobs=MAP.mobs.map(([look,x,y],i)=>({ look, x, y, sx:x, sy:y, respawn:0, hp:look==='shadow'?60:34, maxHp:look==='shadow'?60:34, atk:look==='shadow'?11:7, spd:look==='shadow'?0.022:0.016,
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
  const st=storyNpcs(), done=st.filter(n=>n.talked).length, nt=npcs.filter(n=>n.note), nd=nt.filter(n=>n.talked).length;
  $('obj').innerHTML = `<i>◆</i> 이야기 ${done}/${st.length}` + (hostile ? ` · 안개 ${Math.min(kills,MAP.killGoal)}/${MAP.killGoal}` : '') + (nt.length ? ` · 쪽지 ${nd}/${nt.length}` : '');
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
      setTimeout(()=>{ hostile=true; toast('레테의 안개가 짙어진다… 도로 건너 망설임의 숲으로', 3000); updateHud(); }, 2600);
    }
    updateHud(); checkClear();
  });
}
function checkClear(){
  if(cleared) return;
  if(storyNpcs().every(n=>n.talked) && kills>=MAP.killGoal){ cleared=true; setTimeout(()=>{ $('endCard').style.display='flex'; }, 1400); }
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
    if(P.moving){ const sp=1.0*Math.min(1,m); const w=screenToWorld(jx/m*sp, jy/m*sp); tryMove(P,w[0],w[1]); if(Math.abs(jx)>0.15) P.face=jx>0?1:-1; }
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
    if(m.gone){ if(++m.respawn>1200 && Math.hypot(P.x-m.sx,P.y-m.sy)>7){ Object.assign(m,{gone:false, dead:0, x:m.sx, y:m.sy, hp:m.maxHp, respawn:0, hpShow:0, wind:0}); } return; }
    if(m.dead>0){ if(--m.dead===0){ m.gone=true; m.respawn=0; kills++; checkClear(); updateHud(); } return; }
    if(m.kb[0]||m.kb[1]){ tryMove(m,m.kb[0],m.kb[1]); m.kb=[m.kb[0]*0.7,m.kb[1]*0.7]; if(Math.abs(m.kb[0])+Math.abs(m.kb[1])<0.005) m.kb=[0,0]; }
    const dx=P.x-m.x, dy=P.y-m.y, d=Math.hypot(dx,dy);
    if(hostile && (d<4.2 || (m.hpShow>0 && d<7)) && !P.dead){
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
LIGHTS.push({x:3.7,y:1.02,z:14,r:52,c:'190,220,255',a:0.55});
const SHOPS=[]; for(let i=1;i<MW_;i++){ const R=RUN[i]; if((R.t==='S'||R.t==='C') && R.s===i) SHOPS.push({x:(R.s+R.e)/2, t:R.t}); }
SHOPS.forEach(sh=>{ LIGHTS.push({x:sh.x,y:1.02,z:16,r:70,c:sh.t==='C'?'200,255,230':'255,200,130',a:0.85}); LIGHTS.push({x:sh.x,y:1.02,z:46,r:34,c:sh.t==='C'?'150,255,220':'255,160,110',a:0.5}); });
for(let y=0;y<MH_;y++) for(let x=0;x<MW_;x++){ const t=cell(x,y);
  if(t==='M') LIGHTS.push({x:x+0.5,y:y+0.5,z:30,r:46,c:'170,140,255',a:0.55});
  if(t==='F' && cell(x-1,y)!=='F' && cell(x,y-1)!=='F') LIGHTS.push({x:x+1,y:y+1,z:12,r:80,c:'140,230,255',a:0.8}); }

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
  for(let y=0;y<MH_;y++) for(let x=0;x<MW_;x++){ const t=cell(x,y); if('LTYMFrbpckv'.includes(t)) items.push({d:x+y+1, f:()=>drawProp(t,x,y)}); }
  npcs.forEach(n=>items.push({d:n.x+n.y, f:()=>{
    const sx=isoX(n.x,n.y)-camX, sy=isoY(n.x,n.y)-camY, pal=PALETTES[n.palette]||{};
    if(n.note){   // 뮤즈의 쪽지: 공중에 떠서 빛나는 두루마리
      const b=Math.round(Math.sin(globalT*0.06+n.x)*2);
      shadowAt(sx,sy,4);
      R('#f6e6b8',sx-5,sy-17+b,10,7); R('#fffaf0',sx-4,sy-16+b,8,5); R('#c9a15a',sx-6,sy-18+b,2,9); R('#c9a15a',sx+4,sy-18+b,2,9);
      R('#8a6a3a',sx-3,sy-15+b,6,1); R('#8a6a3a',sx-3,sy-13+b,5,1); R('#e05a7a',sx-1,sy-11+b,2,3);
      if(!n.talked && globalT%40<20){ R('#ffffff',sx+6,sy-22+b,1,1); R('#fff6c0',sx-8,sy-19+b,1,1); }
      return;
    }
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
  lg.globalCompositeOperation='source-over'; lg.fillStyle='rgb(176,166,226)'; lg.fillRect(0,0,lightC.width,lightC.height);
  lg.globalCompositeOperation='lighter';
  const allLights=LIGHTS.slice();
  allLights.push({x:P.x,y:P.y,z:24,r:64,c:'170,185,255',a:0.5});
  npcs.forEach(n=>{ if(n.palette==='eros') allLights.push({x:n.x,y:n.y,z:34,r:60,c:'255,200,230',a:0.8}); if(n.note && !n.talked) allLights.push({x:n.x,y:n.y,z:14,r:34,c:'255,240,190',a:0.9}); });
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
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(30,16,60,.34)'); vc.fillStyle=vg; vc.fillRect(0,0,SW,SH);

  // 화면 위 정보 (부드러운 글씨)
  npcs.forEach(n=>{
    const [sx,sy]=toScreen(n.x,n.y,(PALETTES[n.palette]||{}).float?64:48);
    if(!n.talked && n.note){ const [qx,qy]=toScreen(n.x,n.y,30); const b=Math.sin(globalT*0.1)*3; vc.save(); vc.fillStyle='rgba(255,246,200,.95)'; vc.font=`900 ${Math.round(7*S)}px system-ui`; vc.textAlign='center'; vc.fillText('✦', qx, qy+b); vc.restore(); }
    else if(!n.talked){ const b=Math.sin(globalT*0.1)*3; vc.save(); vc.translate(sx,sy-8+b); vc.rotate(Math.PI/4); vc.fillStyle='#e8cf96'; vc.fillRect(-6,-6,12,12); vc.strokeStyle='#5a4420'; vc.lineWidth=1.5; vc.strokeRect(-6,-6,12,12); vc.restore();
      vc.fillStyle='#3a2a10'; vc.font=`900 11px ${getComputedStyle(document.body).fontFamily}`; vc.textAlign='center'; vc.fillText('!',sx,sy-4+b); }
    if(near===n){ label(n.label, sx, sy+ (PALETTES[n.palette]||{}).float? 70*S/2 : 64*S/2 ); }
  });
  mobs.forEach(m=>{ if(m.gone||m.dead||!(m.hpShow>0||(hostile && Math.hypot(m.x-P.x,m.y-P.y)<5))) return; const [sx,sy]=toScreen(m.x,m.y,40); const w=30;
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
  SHOPS.forEach(sh=>{ const [sx,sy]=toScreen(sh.x,1.02,46); vc.save(); vc.font=`700 ${Math.round(6.5*S)}px "Gowun Batang", serif`; vc.textAlign='center'; vc.fillStyle='rgba(255,240,200,.97)'; vc.shadowColor=sh.t==='C'?'rgba(120,255,220,.9)':'rgba(255,180,90,.9)'; vc.shadowBlur=8; vc.fillText(sh.t==='C'?'단짝 카페':'행복 식당', sx, sy+2*S); vc.restore(); });
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

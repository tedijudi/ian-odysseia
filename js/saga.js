/* ============================================================
   SAGA — 쿼터뷰 스토리 엔진 (장면 · 미션 · 컷신 · 실시간 전투)
   - 이야기와 맵은 js/ch1.js 에 있어요. 이 파일은 "어떻게 보여줄지"만 담당해요.
   ============================================================ */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const CH=CH1;

/* ---------------- 화면 ---------------- */
const view=$('view'), vc=view.getContext('2d');
const lc=document.createElement('canvas'), l=lc.getContext('2d');
const lightC=document.createElement('canvas'), lg=lightC.getContext('2d');
let SW=0, SH=0, DPR=1, S=1, LW=0, LH=0, camX=0, camY=0;
function resize(){
  DPR=Math.min(window.devicePixelRatio||1, 2.5);
  SW=innerWidth; SH=innerHeight;
  view.width=Math.round(SW*DPR); view.height=Math.round(SH*DPR);
  S=Math.max(1.2, SW<SH ? SW/215 : Math.min(SW,SH)/270);
  LW=Math.ceil(SW/S); LH=Math.ceil(SH/S);
  lc.width=LW; lc.height=LH;
  lightC.width=Math.ceil(SW*DPR/2); lightC.height=Math.ceil(SH*DPR/2);
}
addEventListener('resize', resize); resize();

/* ---------------- 유틸 ---------------- */
function hash(x,y,s=0){ let h=(x*374761393+y*668265263+s*982451653)|0; h=(h^(h>>>13))*1274126177|0; return ((h^(h>>>16))>>>0)/4294967295; }
function rgb(h){ h=h.replace('#',''); return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]; }
const CC=new Map(); const C=h=>{ let v=CC.get(h); if(!v){ v=rgb(h); CC.set(h,v); } return v; };
function adj(c,d){ return [Math.max(0,Math.min(255,c[0]+d)),Math.max(0,Math.min(255,c[1]+d)),Math.max(0,Math.min(255,c[2]+d))]; }
function mixc(a,b,f){ return [a[0]+(b[0]-a[0])*f, a[1]+(b[1]-a[1])*f, a[2]+(b[2]-a[2])*f]; }
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

/* ---------------- 장면 ---------------- */
const BH=72, EDGE=26;
const WALL=new Set('OEHCVJAWKIX'.split(''));
const PROPS='QDRGphuLjlYMbvUPTk|r^';
const FLOORS='o.=xnsmgf_w';
let SC=null, SCID='', ROWS=[], MW=0, MH=0, OX=0, OY=0, PW=0, PH=0, RUNB=[], RUNL=[], ROAD0=-1, ROAD1=-1;
const bg=document.createElement('canvas');
function cell(x,y){ return (y<0||y>=MH||x<0||x>=MW) ? 'X' : ROWS[y][x]; }
function solidAt(x,y){ const t=cell(x,y); return WALL.has(t) || t==='w' || PROPS.includes(t); }
const isoX=(x,y)=>(x-y)*16+OX, isoY=(x,y,z=0)=>(x+y)*8+OY-z;
function floorOf(tx,ty){ const t=cell(tx,ty); if(FLOORS.includes(t)) return t;
  for(const [dx,dy] of [[-1,0],[0,-1],[1,0],[0,1],[-1,-1],[1,1],[-2,0],[0,-2]]){ const u=cell(tx+dx,ty+dy); if(FLOORS.includes(u) && u!=='w') return u; } return 'n'; }
function runs(str){ const R=[]; for(let i=0;i<str.length;){ let j=i; while(j<str.length&&str[j]===str[i]) j++; for(let k=i;k<j;k++) R[k]={t:str[i],s:i,e:j}; i=j; } return R; }

function setupScene(id){
  SCID=id; SC=CH.scenes[id]; ROWS=SC.rows; MH=ROWS.length; MW=ROWS[0].length;
  OX=MH*16+8; OY=BH+26; PW=(MW+MH)*16+16; PH=(MW+MH)*8+OY+EDGE+8;
  RUNB=runs(ROWS[0]); RUNL=runs(ROWS.map(r=>r[0]).join(''));
  ROAD0=ROAD1=-1; ROWS.forEach((r,y)=>{ if(/^[=x]+$/.test(r.slice(1))){ if(ROAD0<0) ROAD0=y; ROAD1=y; } });
  paintScene(); buildLights();
}

/* ---------- 배경을 픽셀 하나하나 그리기 ---------- */
function paintScene(){
  bg.width=PW; bg.height=PH;
  const g=bg.getContext('2d'), img=g.createImageData(PW,PH), d=img.data;
  for(let py=0; py<PH; py++) for(let px=0; px<PW; px++){
    const i=(py*PW+px)*4, n=hash(px,py);
    const a=(px-OX)/16, b=(py-OY)/8, wx=(a+b)/2, wy=(b-a)/2;
    let col=null;
    if(px>=OX){ const x=a+1, z=(x+1)*8+OY-py; if(x>=1 && x<=MW && z>=0 && z<=BH+4){ const R=RUNB[Math.min(MW-1,Math.floor(x))]; col=wallPix(R.t, x-R.s, R.e-R.s, z, n, x, 0); } }
    else { const y=1-a, z=(1+y)*8+OY-py; if(y>=1 && y<=MH && z>=0 && z<=BH+4){ const R=RUNL[Math.min(MH-1,Math.floor(y))]; col=wallPix(R.t, y-R.s, R.e-R.s, z, n, y, 1); } }
    if(!col && wx>=0 && wy>=0 && wx<MW && wy<MH){ const tx=Math.floor(wx), ty=Math.floor(wy), t=cell(tx,ty); if(!WALL.has(t)) col=floorPix(floorOf(tx,ty),tx,ty,wx-tx,wy-ty,wx,wy,n); }
    if(!col){
      const xL=a+MH, eL=(xL+MH)*8+OY; if(xL>=0 && xL<=MW && py>eL && py<=eL+EDGE) col=edgePix(xL*16, py-eL, 1, n);
      const yR=MW-a, eR=(MW+yR)*8+OY; if(!col && yR>=0 && yR<=MH && py>eR && py<=eR+EDGE) col=edgePix(yR*16, py-eR, 0, n);
    }
    if(!col){ if(py < OY+(MW+MH)*8) col=skyPix(px,py,n); else { d[i+3]=0; continue; } }
    d[i]=col[0]; d[i+1]=col[1]; d[i+2]=col[2]; d[i+3]=255;
  }
  g.putImageData(img,0,0);
}
function skyPix(px,py,n){
  const L=SC.light;
  if(L==='day') return adj(C('#3b3342'), (n*6|0)-3);
  if(L==='dusk'){ const t=Math.min(1,py/(OY*1.6)); let c= t<.5 ? mixc(C('#4b2c86'),C('#e0789e'),t*2) : mixc(C('#e0789e'),C('#ffc48a'),(t-.5)*2); if(n>0.9975) c=C('#fff6ff'); return c; }
  const t=Math.min(1,py/(OY*1.6)); let c=mixc(C('#0f1434'),C('#34307a'),t); if(n>0.996) c=C('#e8ecff'); return c;
}
function edgePix(u,v,left,n){
  const L=SC.light;
  let c = L==='day' ? (left?C('#8a7e84'):C('#766c74')) : L==='dusk' ? (left?C('#6a6594'):C('#555080')) : (left?C('#4a4a7a'):C('#3a3a66'));
  const row=Math.floor(v/7), off=row%2?6:0;
  if(v%7===0 || (Math.floor(u+off))%12===0) c=adj(c,-12); else if(v%7===1) c=adj(c,8);
  c=adj(c,((n*10)|0)-5);
  return mixc(c, C('#1a1430'), Math.min(1, v/EDGE*0.85));
}

/* ---------- 벽 ---------- */
const PASTEL=['#8ecfe0','#f4b8c8','#f6de8a','#a8dcb8','#c8b8f0','#f8c89a'];
function wallPix(t, rx, len, z, n, pos, left){
  const u=rx*16, L=SC.light, lit=(k)=>L!=='day' && k;
  let c;
  if(z>BH){
    if(t==='W'||t==='K'||t==='I') return z>BH+2 ? C('#3a3040') : C('#e6dccb');
    if(t==='A') return (Math.floor(pos*4)%2) ? C('#2f6a78') : C('#23525e');
    return z>BH+2 ? (L==='dusk'?C('#5a4a8a'):C('#2e2a58')) : C('#cfc6dc');
  }
  const fu=rx%1, ti=Math.floor(rx);
  switch(t){
    case 'O': {
      c=mixc(C('#7d95c6'),C('#b9cdea'),Math.min(1,z/BH)*0.6); c=adj(c,((n*8)|0)-4);
      if(((u+z*0.6)%44)<7) c=adj(c,20);
      const fl=Math.floor(z/16);
      if(lit(hash(Math.floor(u/8)+Math.floor(pos*9),fl,21)>0.45) && z>20) c=mixc(C('#ffe2a0'),c,0.25);
      if(u%8<1 || z%16<1.2) c=C('#4a5578');
      if(z<20 && fu>0.2 && fu<0.8 && ti===1){ c=(Math.abs(fu-0.5)<0.03||z>18.5)?C('#3a4260'):mixc(C('#eaf6ff'),C('#9cc0e8'),z/20); }
      break; }
    case 'E': {
      if(z<28){ c=C('#f6fbff'); if(z%7<2) c=C(['#ff8a8a','#8ad4ff','#ffe07a','#a8f0a8','#ffb0e0'][(hash(Math.floor(u/3),Math.floor(z/7),4)*5)|0]);
        if(u%24<1.5 || z<2 || z>26.5) c=C('#4a5a70'); if(ti===0 && fu>0.15 && fu<0.7 && z<24) c = z>22.5||Math.abs(fu-0.42)<0.02 ? C('#4a5a70') : C('#dff4ff'); }
      else if(z<37){ c=C('#fbfbfb'); if(z<30) c=C('#2a8ae0'); if(z>35) c=C('#3cb86a'); }
      else { c=adj(C('#d9ccb8'),((n*10)|0)-5); if(fu>0.25&&fu<0.75&&(z-37)%18>5&&(z-37)%18<14) c=lit(hash(ti,Math.floor(z/18),7)>0.4)?C('#ffe2a8'):C('#6a7a9a'); }
      break; }
    case 'H': {
      if(z<28){ c=C('#ffd890'); if(z%9<1) c=C('#f0b060'); if(u%20<1.5||z<2||z>26.5) c=C('#7a3a1a'); }
      else if(z<37){ c=C('#ffc83a'); if(z<29.5||z>35.5) c=C('#d83a2a'); }
      else { c=adj(C('#a8604e'),((n*12)|0)-6); if(Math.floor(z)%5===0) c=adj(c,-16); if(fu>0.3&&fu<0.7&&(z-37)%18>5&&(z-37)%18<14) c=lit(true)?C('#ffe0a0'):C('#6a6a8a'); }
      break; }
    case 'C': {
      if(z<30){ c=adj(C('#6fc4b4'),((n*10)|0)-5); if(Math.floor(z)%4===0) c=adj(c,-12);
        if(z>=4 && z<=26 && rx>0.4 && rx<len-0.4){ const m=Math.abs(((rx-0.4)*16)%18)<1.2 || Math.abs(z-15)<0.8; c = m ? C('#2f6a62') : mixc(C('#fff0b0'),C('#fff8e0'),(z-4)/22*0.6); } }
      else if(z<36) c = (Math.floor(u/4)%2) ? C('#4ab8a0') : C('#fff6e6');
      else if(z<46){ c=C('#1f5a58'); if(z<37.2||z>44.8||rx<0.5||rx>len-0.5) c=C('#f2c86a'); }
      else { c=adj(C('#f2efe8'),((n*8)|0)-4); if(fu>0.25&&fu<0.75&&(z-46)%18>4&&(z-46)%18<13) c=lit(true)?C('#ffe8b0'):C('#8aa0c0'); if((z-46)%18>2&&(z-46)%18<4&&fu>0.2&&fu<0.8) c=hash(Math.floor(u),3,5)>0.5?C('#ff8ab0'):C('#6ab85a'); }
      break; }
    case 'V': {
      if(z<18 && !left){   // 필로티 주차장
        c=C('#4a4452'); if(fu<0.1) c=C('#b8a8a0'); if(z<2) c=C('#6a6270'); if(z>16) c=C('#8a5a4c');
        if(fu>0.3&&fu<0.7&&z<8&&hash(ti,Math.floor(pos),2)>0.5) c=C(['#e8e8f0','#303848','#b83a3a'][(hash(ti,1,3)*3)|0]);
        break; }
      c=adj(C('#b45e4e'),((n*12)|0)-6); const row=Math.floor(z/5), off=row%2?5:0;
      if(Math.floor(z)%5===0 || Math.floor(u+off)%10===0) c=C('#8a4a3e');
      const fz=(z-18)%18;
      if(fu>0.24&&fu<0.76&&fz>5&&fz<14){
        const on=hash(ti+Math.floor(pos),Math.floor((z-18)/18),31)>0.45; c = lit(on) ? C('#ffe0a0') : (L==='day'?C('#9ab8d8'):C('#4a5078'));
        if(fu<0.28||fu>0.72||fz<5.8||fz>13.2) c=C('#f0ece4');
        else if(Math.floor(u)%3===0) c=C('#e2e2e8');
      }
      if(fz>=1 && fz<3.2 && fu>0.18 && fu<0.82) c = (Math.floor(u)%2) ? C('#5a5a6a') : C('#8a8a9a');
      if(fu>0.8&&fu<0.95&&fz>6&&fz<11&&hash(ti,Math.floor(z/18),9)>0.55){ c=C('#d0d4dc'); if(Math.floor(u)%2&&Math.floor(z)%2) c=C('#9aa0ac'); }
      break; }
    case 'J': {
      if(z<30){ c=adj(C('#6a3a22'),((n*10)|0)-5); if(z>=3&&z<=26&&fu>0.1&&fu<0.9){ c=mixc(C('#ffc070'),C('#ffe2b0'),(z-3)/23*0.5); if(Math.abs(fu-0.5)<0.03||Math.abs(z-15)<0.7) c=C('#4a2414'); } }
      else if(z<46){ c=C('#c8342a'); if(z<31.5||z>44.5||rx<0.3||rx>len-0.3) c=C('#fff0dc'); }
      else { c=adj(C('#9a9490'),((n*10)|0)-5); if(fu>0.3&&fu<0.7&&(z-46)%16>4&&(z-46)%16<12) c=lit(hash(ti,5,5)>0.3)?C('#ffd8a0'):C('#5a5a7a'); }
      break; }
    case 'A': {
      const seg=Math.floor(pos/3), pc=C(PASTEL[(hash(seg,left?7:3,11)*PASTEL.length)|0]);
      c=adj(pc,((n*12)|0)-6); if(z<6) c=mixc(c,C('#7a7488'),0.35);
      const fz=z%24;
      if(fu>0.3&&fu<0.7&&fz>8&&fz<18){ c = lit(hash(Math.floor(pos*2),Math.floor(z/24),13)>0.35) ? C('#ffe4a0') : C('#5a6a9a'); if(fu<0.33||fu>0.67||fz<8.8||fz>17.2) c=C('#2a6ab0'); }
      if(hash(Math.floor(u/2),Math.floor(z/2),41)>0.985) c=C(['#ff8ab0','#ffffff','#ffd060'][(n*3)|0]);
      break; }
    case 'W': {
      if(z<14){ c=adj(C('#9cb89a'),((n*8)|0)-4); if(z>12.5) c=C('#efe6d6'); }
      else if(z<18 || z>60) c=adj(C('#efe6d6'),((n*6)|0)-3);
      else {
        const sky=mixc(C('#9fd0f5'),C('#e2f2ff'),(60-z)/42);
        c=sky; if(z<26) c=mixc(C('#b8c8e0'),sky, hash(Math.floor(u/5)+Math.floor(pos*7),1,2)>0.5?0.2:0.7);
        const bl=hash(Math.floor((u+pos*16)/3),Math.floor(z/3),5); if(z>22&&z<46&&bl>0.5) c = bl>0.8 ? C('#ffe4f0') : bl>0.65 ? C('#ffb8d4') : C('#ff94bc');
        if(fu<0.07||fu>0.93||z<19.5||z>58.5||Math.abs(z-39)<0.7) c=C('#f4efe4');
      }
      break; }
    case 'K': {
      c=C('#f2f2ee'); if(Math.floor(u)%6===0||Math.floor(z)%6===0) c=C('#d8d8d2');
      if(z>=16&&z<40&&rx>0.2&&rx<len-0.2){ c=mixc(C('#3a3a42'),C('#6a5a50'),(z-16)/24); if(hash(Math.floor(u/2),Math.floor(z/2),3)>0.86) c=C('#e8e8ec'); }
      if(z>=44&&z<=64&&rx>0.6&&rx<len-0.6){ c=C('#2f4a3a'); if(z<45.5||z>62.5||rx<0.75||rx>len-0.75) c=C('#8a6a44'); }
      break; }
    case 'I': {
      if(z<14){ c=adj(C('#9cb89a'),((n*8)|0)-4); if(z>12.5) c=C('#efe6d6'); }
      else c=adj(C('#efe6d6'),((n*6)|0)-3);
      if(pos>=3&&pos<6&&z>24&&z<46){ c=C('#c8a070'); if(z<25.5||z>44.5||pos<3.1||pos>5.9) c=C('#8a6a44'); else if(hash(Math.floor(u/4),Math.floor(z/5),7)>0.55) c=C(['#ffffff','#fff2a8','#ffd0e0','#cfe8ff'][(hash(Math.floor(u/4),Math.floor(z/5),8)*4)|0]); }
      if(Math.abs(pos-9)<0.9 && Math.abs(z-52)<7){ const dd=Math.hypot((pos-9)*16,z-52); if(dd<7){ c=dd>5.6?C('#5a4a3a'):C('#fffaf0'); if(dd<1.2) c=C('#3a2a2a'); } }
      if(pos>=10.5&&pos<12.5&&z>22&&z<42){ c=C('#ffe0c8'); if(z>34) c=C('#e05a5a'); if(z<23.2||z>40.8) c=C('#f4f0e8'); }
      break; }
    default: c=C('#777788');
  }
  return left ? adj(c,-10) : c;
}

/* ---------- 바닥 ---------- */
function floorPix(t,tx,ty,fx,fy,wx,wy,n){
  let c;
  switch(t){
    case 'o': {
      const cid=(Math.floor(fx*2)+Math.floor(fy*2)+tx+ty)%2; c = cid ? C('#f3ece0') : C('#e0e8d8');
      if((fx*2)%1<0.05||(fy*2)%1<0.05) c=C('#cbc3b2');
      if(((wx*0.8+wy*0.4)%4)<0.5) c=adj(c,10);
      if(n>0.996) c=C('#ffffff');
      return c; }
    case '.': {
      const r=Math.floor(fy*4), off=r%2?0.25:0, bx=Math.floor((fx+off)*2);
      const pal=[C('#c98f7a'),C('#bcb1b6'),C('#caa29e'),C('#b3a8b0')];
      c=adj(pal[(hash(bx+tx*3,r+ty*5,1)*4)|0], ((n*12)|0)-6);
      if((fy*4)%1<0.1 || ((fx+off)*2)%1<0.05) c=C('#8a7e84');
      if((ty===ROAD0-1 && fy>0.55) || (ty===ROAD1+1 && fy<0.45)){ c=C('#f2c230'); if(Math.hypot((fx*6)%1-0.5,(fy*6)%1-0.5)<0.22) c=C('#ffe070'); }
      if((ty===ROAD0-1 && fy>0.9) || (ty===ROAD1+1 && fy<0.1)) c=C('#dedae2');
      return c; }
    case '=': case 'x': {
      c=adj(C('#5c6078'), ((n*14)|0)-7);
      const mid=(ROAD0+ROAD1+1)/2;
      if(t==='=' && (Math.abs(wy-mid+0.05)<0.03 || Math.abs(wy-mid-0.05)<0.03)) c=C('#ffcf3a');
      if(t==='x' && Math.floor(wx*4)%2===0 && wy>ROAD0+0.1 && wy<ROAD1+0.9) c=C('#f4f4f8');
      if(Math.abs(wy-ROAD0-0.06)<0.03 || Math.abs(wy-ROAD1-0.94)<0.03) c=C('#e8e8ee');
      return c; }
    case 'n': {
      c=adj(C('#bdb4ac'), ((n*16)|0)-8);
      if(hash(tx,ty,4)>0.8){ c=adj(C('#7fb89a'),((n*10)|0)-5); }
      if(hash(Math.floor(wx*10),Math.floor(wy*10),2)>0.93) c=adj(c,-18);
      if(Math.abs((fx*1.3-fy)-(hash(tx,ty,4)-0.3))<0.02 && hash(tx,ty,9)>0.7) c=adj(c,-24);
      return c; }
    case 's': {
      const st=(fy*4)%1; c = st<0.2 ? C('#8a827a') : st<0.3 ? C('#ece4dc') : adj(C('#d0c8c0'),((n*10)|0)-5);
      if(fx<0.08||fx>0.92) c=C('#9a9aa8');
      return c; }
    case 'm': {
      c=adj(C('#ece6f6'), ((n*8)|0)-4);
      if(Math.abs(Math.sin(wx*2.1+wy*3.3)+Math.sin(wx*5-wy))<0.08) c=C('#d0c4e8');
      const d=Math.hypot(wx-5.5,wy-3); if(Math.abs(d-2.4)<0.06 || Math.abs(d-1.6)<0.04) c=C('#a8dcff');
      if(Math.abs(d-2)<0.2 && hash(Math.floor(Math.atan2(wy-3,wx-5.5)*6),1,3)>0.6 && Math.abs(d-2)<0.08) c=C('#e0f4ff');
      return c; }
    case 'g': case 'f': {
      c=mixc(C('#5fc46e'),C('#8ad86a'),hash(tx,ty,2)*0.6); c=adj(c,((n*16)|0)-8);
      if(hash(Math.floor(wx*9),Math.floor(wy*9),5)>0.86) c=C('#b8f08a'); else if(hash(Math.floor(wx*7),Math.floor(wy*7),6)>0.9) c=C('#3f9c5a');
      if(t==='f'){ const k=hash(Math.floor(wx*5),Math.floor(wy*5),8); if(k>0.7){ const q=hash(Math.floor(wx*5),Math.floor(wy*5),9), dd=Math.abs((wx*5)%1-0.5)+Math.abs((wy*5)%1-0.5); if(dd<0.35) c=C(['#ff7fb8','#ffe066','#ffffff','#b58cff','#ff9a5c'][(q*5)|0]); if(dd<0.12) c=C('#fff6c8'); } }
      return c; }
    case '_': {
      c=adj(C('#e0c89a'),((n*14)|0)-7); if(hash(Math.floor(wx*6),Math.floor(wy*6),3)>0.82) c=adj(C('#c8ae80'),((n*10)|0)-5);
      const gr=u=>'gf'.includes(u);
      if(gr(cell(tx-1,ty))&&fx<0.08 || gr(cell(tx+1,ty))&&fx>0.92 || gr(cell(tx,ty-1))&&fy<0.08 || gr(cell(tx,ty+1))&&fy>0.92) c=C('#9acb72');
      if(cell(tx,ty-1)==='w'||cell(tx,ty+1)==='w'){ if(hash(Math.floor(wx*4),Math.floor(wy*4),7)>0.55){ const dd=Math.hypot((wx*4)%1-0.5,(wy*4)%1-0.5); if(dd<0.4) c= dd<0.3?C('#c8c4d0'):C('#8a8698'); } }
      return c; }
    case 'w': {
      const w=u=>u!=='w';
      c=mixc(C('#3fb8e0'),C('#80e0f2'),0.3+0.3*Math.sin(wx*3+wy*5)); c=adj(c,((n*10)|0)-5);
      if(Math.abs(Math.sin(wx*5.2+wy*2.1))<0.06) c=C('#d8fbff');
      if(w(cell(tx-1,ty))&&fx<0.12 || w(cell(tx+1,ty))&&fx>0.88 || w(cell(tx,ty-1))&&fy<0.12 || w(cell(tx,ty+1))&&fy>0.88) c=C('#b8b0c0');
      return c; }
  }
  return adj(C('#bdb4ac'),((n*10)|0)-5);
}

/* ---------------- 도트 소품 ---------------- */
function R(c,x,y,w,h){ l.fillStyle=c; l.fillRect(Math.round(x),Math.round(y),w,h); }
function box(cx,cy,hw,h,top,lef,rig){
  cx=Math.round(cx); cy=Math.round(cy);
  for(let dx=-hw; dx<hw; dx++){ const k=Math.floor((hw-Math.abs(dx+0.5))/2); R(top, cx+dx, cy-h-k, 1, 2*k+1); R(dx<0?lef:rig, cx+dx, cy-h+k, 1, h); }
}
let globalT=0;
function drawProp(t,x,y){
  const sx=isoX(x+0.5,y+0.5)-camX, sy=isoY(x+0.5,y+0.5)-camY;
  switch(t){
    case 'Q': box(sx,sy,16,11,'#dfe4ec','#a4acb8','#bec4ce'); R('#8a929e',sx-16,sy-3,32,1);
      for(let k=0;k<4;k++){ R(['#e85a3a','#6ab85a','#ffd04a','#f4f0e8'][k], sx-9+k*5, sy-17+(k%2), 4, 2); } break;
    case 'D': box(sx,sy,15,9,'#f6f2ea','#c8bfae','#d8d0c0'); R('#e8e0d0',sx-8,sy-13,5,2); R('#cfe0f0',sx+2,sy-12,5,2); R('#a86a3a',sx-2,sy-15,3,1);
      box(sx-10,sy+7,4,5,'#7a8aa0','#5a6a80','#66768c'); box(sx+10,sy-7,4,5,'#7a8aa0','#5a6a80','#66768c'); break;
    case 'R': box(sx,sy,6,24,'#f6f8fb','#c8ccd6','#dde0e8'); R('#6aa8e0',sx-4,sy-30,8,5); R('#bfe4ff',sx-3,sy-29,3,2); R('#3a4a6a',sx-1,sy-14,3,2); break;
    case 'G': box(sx,sy,12,20,'#c8ccd4','#8a909c','#a8aeb8'); for(let k=0;k<5;k++) R('#e8ecf2',sx-10,sy-18+k*3,20,1); break;
    case 'p': box(sx,sy,6,7,'#8a6a5a','#5a4238','#6a4e42'); for(let k=0;k<14;k++){ const a=hash(k,x,y)*6.283, r=hash(y,k,x)*5; R(k%3?'#3f8a3a':'#6fbf4a', sx+Math.cos(a)*r-1, sy-13+Math.sin(a)*r*0.7, 3, 3); } break;
    case 'h': [[-7,2,'#c85a4a'],[3,-2,'#4a8ac8'],[8,4,'#e8c04a']].forEach(([dx,dy,col],k)=>{ box(sx+dx,sy+dy,4,6,col,'#5a4238',col); for(let q=0;q<7;q++){ const a=hash(q,k,x)*6.283; R(q%2?'#3f8a3a':'#8ad06a', sx+dx+Math.cos(a)*3-1, sy+dy-10+Math.sin(a)*2, 2, 2); } if(hash(k,x,y)>0.5) R('#ff7fb0',sx+dx,sy+dy-12,2,2); }); break;
    case 'u': [[-6,1,6],[4,-2,7],[6,5,5]].forEach(([dx,dy,r])=>{ l.fillStyle='#5a3220'; l.beginPath(); l.ellipse(Math.round(sx+dx),Math.round(sy+dy-r),r,r*1.1,0,0,6.283); l.fill(); R('#8a5a3a',sx+dx-r+2,sy+dy-r*1.8,2,r); R('#3a2014',sx+dx-r*0.6,sy+dy-r*2.1,r*1.2,2); }); break;
    case 'L': R('#1e222e',sx-3,sy-2,6,3); R('#3c4254',sx-1,sy-50,3,49); R('#5a6278',sx,sy-50,1,49); R('#3c4254',sx-1,sy-52,10,2); R('#2a2e3a',sx+5,sy-52,6,3); R('#fff4c8',sx+6,sy-49,4,2); break;
    case 'j': R('#8a8680',sx-2,sy-64,4,64); R('#b8b4ae',sx-1,sy-64,1,64); R('#6a6660',sx-11,sy-58,22,2); R('#9a9aa2',sx+3,sy-50,6,9); R('#6a6a72',sx+3,sy-42,6,1); for(let k=0;k<5;k++) R('#d8d4cc',sx-1,sy-30+k*5,3,1); break;
    case 'l': { const b=Math.round(Math.sin(globalT*0.05+x*1.7)*1.5); R('#5a3a24',sx-1,sy-30,2,30); R('#5a3a24',sx-1,sy-31,8,2); R('#3a2414',sx+5,sy-29,1,3);
      R('#2a3aa8',sx+2,sy-26+b,8,3); R('#fff0c0',sx+3,sy-23+b,6,6); R('#ffcf70',sx+4,sy-22+b,4,4); R('#c8283a',sx+2,sy-17+b,8,3); R('#e8c04a',sx+5,sy-14+b,2,2); break; }
    case 'Y': { R('#5a3a2a',sx-2,sy-18,4,18); R('#7a5238',sx-1,sy-18,1,18); const cols=['#ffb8d8','#ff9ac4','#ffd6e8','#ffffff','#f58ab8'];
      for(let k=0;k<70;k++){ const a=hash(k,x,y)*6.283, r=hash(k,y,x)*14; R(cols[(hash(k,3,x)*5)|0], sx+Math.cos(a)*r*1.15-2, sy-31+Math.sin(a)*r*0.8-2, 4, 4); } break; }
    case 'M': { R('#3a2a5a',sx-2,sy-20,4,20); const cols=['#7a5ae0','#9a7aff','#5a8ae8','#b89cff','#6a4ac8'];
      for(let k=0;k<70;k++){ const a=hash(k,x,y)*6.283, r=hash(k,y,x)*14; R(cols[(hash(k,3,x)*5)|0], sx+Math.cos(a)*r*1.1-2, sy-34+Math.sin(a)*r*0.85-2, 4, 4); } break; }
    case 'b': box(sx,sy,9,5,'#9a6a44','#6a4630','#7a5238'); R('#b07a50',sx-9,sy-10,18,1); break;
    case 'v': box(sx,sy,7,28,'#e04448','#a82e32','#c03a3e'); R('#9fe6ff',sx-5,sy-24,5,9); R('#dff8ff',sx-4,sy-23,2,2); R('#fff4e0',sx+1,sy-22,4,12); break;
    case 'U': { R('#4a5068',sx-14,sy-34,2,34); R('#4a5068',sx+14,sy-26,2,26); R('#6a7a9a',sx-16,sy-38,34,4); R('#9aaac8',sx-16,sy-38,34,1);
      l.globalAlpha=0.35; R('#cfe8ff',sx-12,sy-30,24,20); l.globalAlpha=1; R('#2a6ae0',sx-10,sy-28,10,8); R('#ffffff',sx-9,sy-27,4,1); box(sx+2,sy+2,9,4,'#8a8aa0','#5a5a70','#6a6a80'); break; }
    case 'P': { box(sx,sy,6,9,'#f4f0e8','#c8c0b0','#d8d0c0'); R('#8a8a8a',sx,sy-30,1,21); for(let dx=-12; dx<=12; dx++){ const k=Math.floor((12-Math.abs(dx))/3); R(Math.floor((dx+12)/4)%2?'#4ab8a0':'#fff6e6', sx+dx, sy-30-k, 1, 3+k); } break; }
    case 'T': { box(sx,sy,11,8,'#e0463c','#a82a24','#c23830'); R('#ffe0c8',sx-4,sy-12,8,2); R('#d88a5a',sx-3,sy-11,6,2);
      [[-13,3,'#3a6ad8'],[13,-3,'#e0463c'],[-5,8,'#e0463c'],[6,-8,'#3a6ad8']].forEach(([dx,dy,col])=>box(sx+dx,sy+dy,3,5,col,'#2a2a3a',col)); break; }
    case 'k': R('#3a4a6a',sx-5,sy-14,10,14); R('#5a6a8a',sx-4,sy-14,3,14); R('#2a3450',sx-5,sy-8,10,1); R('#6a7a9a',sx-5,sy-15,10,2); break;
    case '|': { const glow = (Math.sin(globalT*0.05+x)+1)/2; R('#d8d2e8',sx-4,sy-50,8,48); R('#f4f0ff',sx-3,sy-50,2,48); R('#b8b0d0',sx+3,sy-50,1,48);
      R('#ece6f8',sx-6,sy-54,12,4); R('#ece6f8',sx-6,sy-4,12,4); for(let k=0;k<4;k++) R(glow>0.5?'#bfe8ff':'#8fc8f0', sx-1, sy-44+k*10, 2, 3); break; }
    case 'r': box(sx,sy+1,8,6,'#b8b4c8','#8a86a0','#9c98b4'); R('#d8d4e8',sx-4,sy-9,5,2); break;
    case '^': { R('#8a8298',sx-12,sy-40,4,40); R('#8a8298',sx+9,sy-40,4,40); R('#a8a0b8',sx-14,sy-44,28,5); R('#cfc8dc',sx-14,sy-44,28,1);
      const g2=(Math.sin(globalT*0.08)+1)/2; R(g2>0.5?'#bfe8ff':'#8fd0ff',sx-6,sy-38,12,4); R('#ffe0a0',sx-2,sy-33,4,4); break; }
  }
}
function drawWires(){
  // 전봇대 전선 · 청사초롱 줄 — 같은 줄의 기둥끼리 늘어진 선으로 이어요
  const lines=[['j',64,'#2a2a34'],['l',31,'#5a3a24']];
  lines.forEach(([ch,z,col])=>{
    for(let y=0;y<MH;y++){ let prev=null;
      for(let x=0;x<MW;x++){ if(cell(x,y)!==ch) continue;
        if(prev!==null && x-prev<=10){ const x1=isoX(prev+0.5,y+0.5)-camX, y1=isoY(prev+0.5,y+0.5,z-4)-camY, x2=isoX(x+0.5,y+0.5)-camX, y2=isoY(x+0.5,y+0.5,z-4)-camY;
          for(let k=0;k<=24;k++){ const f=k/24, px=x1+(x2-x1)*f, py=y1+(y2-y1)*f+Math.sin(f*Math.PI)*(ch==='j'?6:4); R(col,px,py,1,1);
            if(ch==='l' && k%6===3){ const b=Math.round(Math.sin(globalT*0.06+k+x)*1); R('#c8283a',px-1,py+1+b,3,3); R('#ffcf70',px,py+2+b,1,1); } } }
        prev=x; } }
  });
}

/* ---------------- 캐릭터 도트화 ---------------- */
const pxCache=new Map();
function pixelize(key, w, h, draw){
  let c=pxCache.get(key); if(c) return c;
  c=document.createElement('canvas'); c.width=w; c.height=h;
  const g=c.getContext('2d'); draw(g);
  const id=g.getImageData(0,0,w,h), d=id.data, op=new Uint8Array(w*h);
  for(let i=0;i<w*h;i++){ if(d[i*4+3]>120){ op[i]=1; d[i*4+3]=255; } else d[i*4+3]=0; }
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){ const i=y*w+x; if(op[i]) continue;
    if((x>0&&op[i-1])||(x<w-1&&op[i+1])||(y>0&&op[i-w])||(y<h-1&&op[i+w])){ d[i*4]=22; d[i*4+1]=16; d[i*4+2]=28; d[i*4+3]=255; } }
  g.putImageData(id,0,0); pxCache.set(key,c); return c;
}
const CHW=56, CHH=68, CHS=0.52;
function charSprite(palKey, pose, frame, gearKey){
  return pixelize(`${palKey}|${pose}|${frame}|${gearKey}`, CHW, CHH, g=>{
    const pal={...PALETTES[palKey], eye:PALETTES[palKey].eye||'#3a2418'};
    const o={ seed:0, facingRight:true, gear: gearKey==='bow'?{weapon:'eros_bow'}:{} };
    if(pose==='walk'){ o.moving=true; o.t=frame*3.27+0.5; } else if(pose==='blink'){ o.t=231; }
    else if(pose==='aim'){ o.t=1; o.aim=10; } else if(pose==='hurt'){ o.t=1; o.hurt=true; } else o.t=1+frame*40;
    AV.draw(g, CHW/2, CHH-4, pal, o, CHS);
  });
}
function mobSprite(look, frame, flash){ return pixelize(`mob|${look}|${frame}|${flash?1:0}`, 40, 44, g=>{ g.translate(20,39); g.scale(0.52,0.52); AV.mob(g, look, frame*18, flash, true, false); }); }
function sphinxSprite(frame){
  return pixelize('sphinx|'+frame, 96, 70, g=>{
    const OL='#3a2530', t=frame*20, br=Math.sin(t*0.04)*1.2;
    g.translate(56,66); g.scale(-0.55,0.55); g.lineJoin='round'; g.lineCap='round';
    const rr=(x,y,w,h,r)=>{ g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); };
    g.strokeStyle=OL; g.lineWidth=6; g.beginPath(); g.moveTo(-52,-16); g.quadraticCurveTo(-74,-24,-70,-50); g.stroke(); g.strokeStyle='#caa35a'; g.lineWidth=3.5; g.stroke();
    g.save(); g.translate(-6,-44+br*0.5); g.rotate(-0.25);
    g.beginPath(); g.moveTo(0,0); g.bezierCurveTo(-8,-40,-40,-62,-66,-58); g.bezierCurveTo(-58,-46,-60,-34,-48,-26); g.bezierCurveTo(-44,-14,-26,-4,0,4); g.closePath(); g.fillStyle='#f4e6c4'; g.fill(); g.lineWidth=2; g.strokeStyle=OL; g.stroke(); g.restore();
    g.lineWidth=2.2; g.strokeStyle=OL;
    g.beginPath(); g.ellipse(-14,-26,46,24,0,0,Math.PI*2); g.fillStyle='#dcb66c'; g.fill(); g.stroke();
    g.beginPath(); g.ellipse(-40,-16,18,15,0,0,Math.PI*2); g.fillStyle='#d2aa5e'; g.fill(); g.stroke();
    [16,30].forEach(lx=>{ rr(lx,-30,11,28,5); g.fillStyle='#dcb66c'; g.fill(); g.stroke(); });
    g.beginPath(); g.ellipse(24,-44,17,21,0,0,Math.PI*2); g.fillStyle='#e2bf78'; g.fill(); g.stroke();
    g.beginPath(); g.moveTo(14,-92); g.bezierCurveTo(-6,-88,-2,-54,8,-40); g.lineTo(22,-48); g.bezierCurveTo(30,-64,34,-84,14,-92); g.closePath(); g.fillStyle='#6b4022'; g.fill(); g.stroke();
    g.beginPath(); g.arc(30,-74,14,0,Math.PI*2); g.fillStyle='#f3d2ad'; g.fill(); g.stroke();
    g.strokeStyle='#f2c66d'; g.lineWidth=2.4; g.beginPath(); g.arc(30,-74,15.5,-2.6,-0.5); g.stroke();
    g.strokeStyle='#3a2a2a'; g.lineWidth=1.8; g.beginPath(); g.arc(34,-74,2.4,0.25*Math.PI,0.8*Math.PI); g.stroke();
  });
}
function drawChar(spr, sx, sy, flip){
  const x=Math.round(sx-CHW/2), y=Math.round(sy-CHH+4);
  if(flip){ l.save(); l.translate(Math.round(sx)*2,0); l.scale(-1,1); l.drawImage(spr,x,y); l.restore(); } else l.drawImage(spr,x,y);
}
function shadowAt(sx,sy,w){ l.fillStyle='rgba(20,10,40,.3)'; l.beginPath(); l.ellipse(Math.round(sx),Math.round(sy),w,w*0.42,0,0,Math.PI*2); l.fill(); }

/* ---------------- 조명 ---------------- */
let LIGHTS=[];
function buildLights(){
  LIGHTS=[];
  for(let y=0;y<MH;y++) for(let x=0;x<MW;x++){ const t=cell(x,y);
    if(t==='L') LIGHTS.push({x:x+0.8,y:y+0.5,z:48,r:110,c:'255,196,120',a:0.95,flick:1});
    if(t==='l') LIGHTS.push({x:x+0.7,y:y+0.5,z:22,r:62,c:'255,150,90',a:0.9,flick:1});
    if(t==='M') LIGHTS.push({x:x+0.5,y:y+0.5,z:30,r:46,c:'170,140,255',a:0.55});
    if(t==='|') LIGHTS.push({x:x+0.5,y:y+0.5,z:30,r:44,c:'150,210,255',a:0.6});
    if(t==='^') LIGHTS.push({x:x+0.5,y:y+0.5,z:30,r:70,c:'140,220,255',a:0.9});
    if(t==='v') LIGHTS.push({x:x+0.5,y:y+0.5,z:18,r:40,c:'130,220,255',a:0.6});
  }
  // 가게·창문 불빛: 뒤쪽 벽을 따라
  for(let i=1;i<MW;i++){ const R=RUNB[i]; if(!R || R.s!==i) continue; const cx=(R.s+R.e)/2;
    if('EHCJ'.includes(R.t)) LIGHTS.push({x:cx,y:1.05,z:14,r:40+(R.e-R.s)*14,c:{E:'220,245,255',H:'255,210,120',C:'255,236,170',J:'255,170,110'}[R.t],a:0.9});
    if(R.t==='W') for(let k=R.s;k<R.e;k+=2) LIGHTS.push({x:k+1,y:1.2,z:30,r:70,c:'255,246,220',a:0.55});
    if(R.t==='O' && SC.light!=='day') LIGHTS.push({x:cx,y:1.05,z:16,r:60,c:'200,220,255',a:0.5});
  }
  (SC.signs||[]).forEach(sg=>LIGHTS.push({x:sg.x,y:1.02,z:sg.z,r:34,c:sg.glow,a:0.55}));
}

/* ---------------- 상태 ---------------- */
const P={ x:0, y:0, face:1, t:0, hp:100, maxHp:100, hurt:0, atkCD:0, aim:0, skillCD:0, armed:false, moving:false, dead:false };
let actors=[], objects=[], mobs=[], shots=[], fx=[], nums=[], drops=[], parts=[], motes=[];
let mode='intro', near=null, shake=0, hostile=false, effects={timestop:false, thread:false}, MI=-1, mission=null, kills=0, kills0=0, talkedTo=new Set(), notesFound=new Set();
const SAVE_KEY='odysseia_ch1_saga_v1';
function saveProg(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify({mi:MI, armed:P.armed, notes:[...notesFound]})); }catch(e){} }
function loadProg(){ try{ return JSON.parse(localStorage.getItem(SAVE_KEY)||'null'); }catch(e){ return null; } }
for(let i=0;i<46;i++) motes.push({x:Math.random(),y:Math.random(),s:0.3+Math.random()*0.7,p:Math.random()*6});

function spawnActors(){
  actors=Object.entries(SC.place||{}).map(([id,[x,y]])=>({ id, ...CH.actors[id], x, y, vis:true, tx:null, ty:null, face:1, t:Math.random()*100 }));
  objects=(SC.objects||[]).map(o=>({...o, used:false}));
  mobs=[]; shots=[]; drops=[]; nums=[]; fx=[];
}
function spawnMobs(list){
  list.forEach(([look,x,y],i)=>mobs.push({ look, x, y, sx:x, sy:y, hp:look==='shadow'?60:34, maxHp:look==='shadow'?60:34, atk:look==='shadow'?10:7, spd:look==='shadow'?0.02:0.015,
    flash:0, hpShow:0, dead:0, gone:false, cd:0, t:i*17, wanderA:hash(i,3,mobs.length)*6.28, kb:[0,0], fade:30 }));
}

/* ---------------- 입력 ---------------- */
const K={}, J={x:0,y:0,on:false};
let atkHeld=false, atkQ=false, skillQ=false, talkQ=false;
addEventListener('keydown',e=>{
  const k=e.key.toLowerCase(); K[k]=true;
  if(mode==='dlg'){ if(/^[1-3]$/.test(k) && curChoices){ pick(+k-1); return; } if(k===' '||k==='enter'||k==='z'){ e.preventDefault(); advance(); } return; }
  if(k==='f'||k==='j'){ atkQ=true; atkHeld=true; }
  if(k==='g'||k==='k') skillQ=true;
  if(k==='enter'||k===' '||k==='z'){ e.preventDefault(); talkQ=true; }
});
addEventListener('keyup',e=>{ const k=e.key.toLowerCase(); K[k]=false; if(k==='f'||k==='j') atkHeld=false; });
const joy=$('joy'), knob=$('knob'); let jid=null;
function joyMove(e){ const r=joy.getBoundingClientRect(); let dx=e.clientX-(r.left+r.width/2), dy=e.clientY-(r.top+r.height/2); const m=Math.hypot(dx,dy), Rr=r.width/2-10;
  if(m>Rr){ dx=dx/m*Rr; dy=dy/m*Rr; } knob.style.transform=`translate(${dx}px,${dy}px)`; J.x=dx/Rr; J.y=dy/Rr; J.on=true; }
joy.addEventListener('pointerdown',e=>{ jid=e.pointerId; joy.setPointerCapture(jid); joyMove(e); });
joy.addEventListener('pointermove',e=>{ if(e.pointerId===jid) joyMove(e); });
['pointerup','pointercancel'].forEach(ev=>joy.addEventListener(ev,e=>{ if(e.pointerId!==jid) return; jid=null; J.x=J.y=0; J.on=false; knob.style.transform=''; }));
function hold(el, down, up){ el.addEventListener('pointerdown',e=>{ e.preventDefault(); down(); }); ['pointerup','pointercancel','pointerleave'].forEach(ev=>el.addEventListener(ev,()=>up&&up())); }
hold($('bAtk'), ()=>{ atkQ=true; atkHeld=true; }, ()=>{ atkHeld=false; });
hold($('bSkill'), ()=>{ skillQ=true; });
hold($('bTalk'), ()=>{ talkQ=true; });
$('menuBtn').onclick=()=>{ location.href='index.html'; };

/* ---------------- 소리 ---------------- */
let AC=null;
function beep(f,d,type='sine',v=0.1,delay=0){ try{ AC=AC||new (window.AudioContext||window.webkitAudioContext)(); const t=AC.currentTime+delay, o=AC.createOscillator(), g=AC.createGain(); o.type=type; o.frequency.setValueAtTime(f,t); g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(0.0001,t+d); o.connect(g).connect(AC.destination); o.start(t); o.stop(t+d+0.02); }catch(e){} }
const sfx={ shoot:()=>{ beep(900,0.05,'triangle',0.08); beep(560,0.07,'triangle',0.06,0.03); }, hit:()=>beep(170,0.07,'square',0.08), pop:()=>{ beep(620,0.07); beep(930,0.1,'sine',0.09,0.05); },
  hurt:()=>beep(220,0.12,'sawtooth',0.07), talk:()=>beep(880,0.05,'sine',0.05), skill:()=>[660,880,1100,1320].forEach((f,i)=>beep(f,0.12,'triangle',0.09,i*0.05)),
  get:()=>[784,988,1318].forEach((f,i)=>beep(f,0.1,'sine',0.08,i*0.06)), done:()=>[523,659,784,1046].forEach((f,i)=>beep(f,0.18,'triangle',0.1,i*0.09)),
  right:()=>[659,880,1175].forEach((f,i)=>beep(f,0.14,'triangle',0.12,i*0.08)), wrong:()=>beep(180,0.2,'sawtooth',0.06), chime:()=>[1318,1568,2093].forEach((f,i)=>beep(f,0.3,'sine',0.06,i*0.12)) };

/* ---------------- 알림 · 미션 창 ---------------- */
let toastT=null;
function toast(t,ms=2400){ const el=$('toast'); el.textContent=t; el.classList.add('on'); clearTimeout(toastT); toastT=setTimeout(()=>el.classList.remove('on'),ms); }
let bannerT=null;
function banner(t){ $('bannerT').textContent=t; const b=$('banner'); b.classList.add('on'); clearTimeout(bannerT); bannerT=setTimeout(()=>b.classList.remove('on'),1500); }
function updateHud(){
  $('uHp').style.width=(P.hp/P.maxHp*100)+'%'; $('uHpT').textContent=`${Math.ceil(P.hp)}/${P.maxHp}`;
  $('mapName').textContent=SC ? SC.name : '';
  const q=$('quest');
  if(mission && mode!=='intro'){
    let prog='';
    if(mission.goal.kill) prog=` <em>${Math.min(kills-kills0,mission.goal.kill)}/${mission.goal.kill}</em>`;
    q.innerHTML=`<small>미션 ${MI+1} / ${CH.missions.length}</small><b>${mission.title}</b>${mission.desc?`<span>${mission.desc}${prog}</span>`:''}`;
    q.classList.add('on');
  } else q.classList.remove('on');
  const armed=P.armed && hostile;
  $('bAtk').classList.toggle('off', !P.armed); $('bSkill').classList.toggle('off', !P.armed);
  $('app').classList.toggle('armed', P.armed);
}
function drawFace(){ const c=$('uFace').getContext('2d'); c.imageSmoothingEnabled=false; c.clearRect(0,0,40,40); c.fillStyle='#2a3044'; c.fillRect(0,0,40,40);
  c.drawImage(charSprite('dad','idle',0,''), CHW/2-14, Math.round(CHH-4-77*CHS)-3, 28, 28, 0, 1, 40, 40); }

/* ---------------- 대화 (양피지 말풍선 · 선택지) ---------------- */
let dq=[], dRes=null, typing=null, full='', curSide='left', curLine=null, curChoices=null;
function portraitEl(key){
  const p=PORTRAITS[key]||{};
  if(p.img){ const im=new Image(); im.src=p.img; return im; }
  const palKey={coworker_f:'apron', coworker_m:'suit', friend_of_mom:'casual', jokbal_owner:'chef'}[key] || key;
  if(key==='sphinx'){ const c=document.createElement('canvas'); c.width=60; c.height=60; const g=c.getContext('2d'); g.imageSmoothingEnabled=false; g.drawImage(sphinxSprite(0), 18, 2, 44, 44, 2, 4, 56, 56); return c; }
  if(PALETTES[palKey]){ const c=document.createElement('canvas'); c.width=46; c.height=46; const g=c.getContext('2d'); g.imageSmoothingEnabled=false;
    g.drawImage(charSprite(palKey,'idle',0,''), CHW/2-20, Math.round(CHH-4-73*CHS)-(PALETTES[palKey].float?14:4), 40, 40, 3, 6, 40, 40); return c; }
  const s=document.createElement('div'); s.textContent=p.emoji||'✦'; s.style.cssText='position:absolute;bottom:20px;left:50%;transform:translateX(-50%);font-size:56px'; return s;
}
function speakerName(k){ return (PORTRAITS[k] && PORTRAITS[k].name) || k; }
function fmt(t){ return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/《(.+?)》/g,'<b>$1</b>').replace(/\n/g,'<br>'); }
function say(lines){ return new Promise(res=>{ dq=lines.slice(); dRes=res; mode='dlg'; $('dlg').style.display='block'; $('app').classList.add('cut'); nextLine(); }); }
function nextLine(){
  if(!dq.length){ $('dlg').style.display='none'; $('dlg').innerHTML=''; curLine=null; curChoices=null; const f=dRes; dRes=null; mode=cutDepth>0?'cut':'play'; if(mode==='play') $('app').classList.remove('cut'); f&&f(); return; }
  const ln=dq.shift(); curLine=ln; curChoices=null;
  const side = (ln.speaker==='dad'||ln.speaker==='dad_young') ? 'right' : (ln.speaker==='muse' ? (curSide==='left'?'right':'left') : 'left'); curSide=side;
  const box=document.createElement('div'); box.className='bubble '+side+(ln.speaker==='muse'?' muse':'');
  const port=document.createElement('div'); port.className='port'; port.appendChild(portraitEl(ln.speaker));
  box.innerHTML=`<div class="nm">${speakerName(ln.speaker)}</div>${ln.label?`<div class="lb">${ln.label}</div>`:''}<div class="tx"></div><div class="nx">⌄</div>`;
  box.appendChild(port);
  $('dlg').innerHTML=''; $('dlg').appendChild(box);
  full=fmt(ln.text); let shown=0; const plain=ln.text.replace(/《|》/g,'');
  clearInterval(typing); const tx=box.querySelector('.tx');
  const finish=()=>{ clearInterval(typing); typing=null; tx.innerHTML=full; if(ln.choices) showChoices(ln); };
  typing=setInterval(()=>{ shown+=2; if(shown>=plain.length){ finish(); return; } tx.textContent=plain.slice(0,shown); if(shown%6===0) sfx.talk(); }, 26);
  box._finish=finish;
}
function showChoices(ln){
  curChoices=ln; const wrap=document.createElement('div'); wrap.className='choices';
  ln.choices.forEach((c,i)=>{ const b=document.createElement('button'); b.innerHTML=`<i>${i+1}</i>${c}`; b.addEventListener('pointerdown',e=>{ e.stopPropagation(); e.preventDefault(); pick(i); }); wrap.appendChild(b); });
  $('dlg').appendChild(wrap); const nx=document.querySelector('#dlg .nx'); if(nx) nx.style.display='none';
}
function pick(i){
  const ln=curChoices; if(!ln) return; curChoices=null;
  if(i===ln.answer){ sfx.right(); dq.unshift({speaker:ln.speaker, text:ln.right}); }
  else { sfx.wrong(); shake=4; dq.unshift({speaker:ln.speaker, text:ln.wrong}, ln); }
  nextLine();
}
function advance(){ if(curChoices) return; const b=document.querySelector('#dlg .bubble'); if(typing){ b && b._finish(); } else if(!(curLine && curLine.choices)) nextLine(); }
$('dlg').addEventListener('pointerdown',e=>{ if(e.target.closest('.choices')) return; e.preventDefault(); advance(); });

/* ---------------- 연출: 전환 · 제목 ---------------- */
function fade(on, ms=450){ const f=$('fade'); f.style.transitionDuration=ms+'ms'; f.classList.toggle('on', on); return sleep(ms+30); }
async function titleCard(t, sub){
  const el=$('title'); $('titleT').textContent=t; $('titleS').textContent=sub||''; el.classList.add('on'); sfx.chime();
  await sleep(2100); el.classList.remove('on'); await sleep(500);
}
function snapCam(){ const px=isoX(P.x,P.y), py=isoY(P.x,P.y); camX = PW<=LW ? (PW-LW)/2 : Math.max(0,Math.min(PW-LW, px-LW/2)); camY = PH<=LH ? (PH-LH)/2 : Math.max(0,Math.min(PH-LH, py-LH*0.55)); }
async function changeScene(id, at){
  await fade(true, 500);
  setupScene(id); spawnActors(); hostile=false; effects.thread=false;
  const sp=at||SC.spawn; P.x=sp[0]; P.y=sp[1]; P.hurt=0; snapCam(); parts=[];
  updateHud(); await sleep(150); await fade(false, 600);
}

/* ---------------- 대본 실행 ---------------- */
let cutDepth=0;
function actorById(id){ return actors.find(a=>a.id===id); }
async function run(steps){
  cutDepth++; mode='cut'; $('app').classList.add('cut');
  try{ for(const st of steps||[]) await step(st); }
  finally{ cutDepth--; if(cutDepth===0){ mode='play'; $('app').classList.remove('cut'); updateHud(); } }
}
async function step(st){
  if(st.say) await say(st.say);
  else if(st.title) await titleCard(st.title, st.sub);
  else if(st.wait) await sleep(st.wait);
  else if(st.walk){ const a=actorById(st.walk); if(a){ a.tx=st.to[0]; a.ty=st.to[1]; while(a.tx!==null) await sleep(50); } }
  else if(st.show){ let a=actorById(st.show); if(!a){ a={ id:st.show, ...CH.actors[st.show], x:st.at[0], y:st.at[1], vis:true, tx:null, ty:null, face:1, t:0 }; actors.push(a); }
    a.vis=true; a.x=st.at[0]; a.y=st.at[1]; for(let k=0;k<30;k++) fx.push({type:'spark', x:a.x, y:a.y, z:30, vx:(Math.random()-.5)*3, vy:(Math.random()-.5)*3-1, t:0, life:34, col:'#ffc8e0'}); sfx.chime(); shake=3; await sleep(500); }
  else if(st.hide){ const a=actorById(st.hide); if(a){ for(let k=0;k<24;k++) fx.push({type:'spark', x:a.x, y:a.y, z:30, vx:(Math.random()-.5)*3, vy:(Math.random()-.5)*3-1, t:0, life:30, col:'#ffe8f4'}); a.vis=false; } await sleep(300); }
  else if(st.effect){ effects[st.effect]=st.on; if(st.on) sfx.chime(); await sleep(400); }
  else if(st.mobs){ spawnMobs(st.mobs); await sleep(300); }
  else if('hostile' in st){ hostile=st.hostile; if(hostile && SC.mobs && !mobs.length) spawnMobs(SC.mobs); updateHud(); }
  else if(st.give) give(st.give);
  else if(st.scene) await changeScene(st.scene, st.at);
  else if(st.thread){ effects.thread=true; sfx.chime(); await sleep(300); }
  else if(st.toast) toast(st.toast, 3600);
  else if(st.end){ await sleep(600); showOutro(); }
}
function give(id){
  if(id==='bow'){ P.armed=true; drawFace(); banner('에로스의 활'); sfx.get(); updateHud(); saveProg(); return; }
  const e=(typeof EQUIPS!=='undefined' && EQUIPS[id]) || (typeof ITEMS!=='undefined' && ITEMS[id]);
  if(e){ banner(`${e.icon} ${e.name}`); toast(`획득 — ${e.icon} ${e.name}`, 2600); sfx.get(); }
}

/* ---------------- 미션 ---------------- */
async function startMission(i){
  MI=i; mission=CH.missions[i]; kills0=kills; talkedTo=new Set(); saveProg();
  if(mission.scene!==SCID) await changeScene(mission.scene);
  updateHud();
  if(mission.start) await run(mission.start);
  updateHud();
  if(mission.goal.auto) completeMission();
}
let completing=false;
async function completeMission(){
  if(completing || !mission) return; completing=true;
  const m=mission;
  if(!m.goal.auto){ sfx.done(); banner('미션 완료 — '+m.title); await sleep(700); }
  if(m.done) await run(m.done);
  completing=false;
  if(MI+1<CH.missions.length) startMission(MI+1);
}
function goalTarget(){
  if(!mission) return null; const g=mission.goal;
  if(g.talk){ const a=actorById(g.talk); return a && a.vis ? {x:a.x,y:a.y,z:(a.look==='sphinx'?70:52)} : null; }
  if(g.use || g.reach){ const o=objects.find(o=>o.id===(g.use||g.reach)); return o ? {x:o.x,y:o.y,z:20} : null; }
  if(g.kill){ let best=null, bd=1e9; mobs.forEach(m=>{ if(m.gone||m.dead) return; const d=Math.hypot(m.x-P.x,m.y-P.y); if(d<bd){ bd=d; best=m; } }); return best && bd>4 ? {x:best.x,y:best.y,z:36} : null; }
  return null;
}
function checkGoals(){
  if(!mission || completing || mode!=='play') return;
  const g=mission.goal;
  if(g.kill && kills-kills0>=g.kill) completeMission();
  if(g.reach){ const o=objects.find(o=>o.id===g.reach); if(o && Math.hypot(P.x-o.x,P.y-o.y)<(g.r||1.6)) completeMission(); }
}
async function interact(t){
  if(t.kind==='actor'){
    const a=t.o; const g=mission && mission.goal;
    if(g && g.talk===a.id){ await run([{say:mission.talk||[]}]); completeMission(); return; }
    const extra=mission && mission.extra && mission.extra[a.id];
    if(extra){ await run([{say:extra}]); talkedTo.add(a.id); return; }
    const chat=CH.chatter && CH.chatter[a.id]; if(chat) await run([{say:chat}]);
    return;
  }
  const o=t.o;
  if(o.note){ if(!notesFound.has(o.id)){ notesFound.add(o.id); sfx.get(); saveProg(); } o.used=true; await run([{say:CH.notes[o.id]}]); toast(`✦ 뮤즈의 쪽지 ${notesFound.size} / ${Object.keys(CH.notes).length}`); return; }
  const g=mission && mission.goal;
  if(g && g.use===o.id){
    if(mission.needTalk && !talkedTo.has(mission.needTalk)){ toast('먼저 '+(CH.actors[mission.needTalk]||{}).name+'께 인사해요'); return; }
    o.used=true; sfx.get(); completeMission(); return;
  }
}

/* ---------------- 이동 · 충돌 ---------------- */
function walkable(x,y){ const r=0.22; for(const [dx,dy] of [[-r,-r],[r,-r],[-r,r],[r,r]]){ if(solidAt(Math.floor(x+dx),Math.floor(y+dy))) return false; } return true; }
function screenToWorld(dx,dy){ return [ (dx/16+dy/8)/2, (dy/8-dx/16)/2 ]; }
function tryMove(o, mx, my){ if(walkable(o.x+mx,o.y)) o.x+=mx; if(walkable(o.x,o.y+my)) o.y+=my; }

/* ---------------- 전투 ---------------- */
function nearestMob(maxD){ let best=null, bd=maxD; mobs.forEach(m=>{ if(m.gone||m.dead) return; const d=Math.hypot(m.x-P.x,m.y-P.y); if(d<bd){ bd=d; best=m; } }); return best; }
function shoot(){
  if(!P.armed){ if(atkQ) toast('🏹 아직 무기가 없어요'); return; }
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
  setTimeout(()=>{ mobs.forEach(m=>{ if(m.gone||m.dead) return; if(Math.hypot(m.x-tgt.x,m.y-tgt.y)<1.9) damage(m, 28+Math.random()*8); }); }, 380);
  fx.push({type:'ring', x:tgt.x, y:tgt.y, t:0, life:40});
}
function damage(m, base){
  const crit=Math.random()<0.14, dmg=Math.round(base*(crit?1.6:1));
  m.hp-=dmg; m.flash=8; m.hpShow=180;
  const dx=m.x-P.x, dy=m.y-P.y, d=Math.hypot(dx,dy)||1; m.kb=[dx/d*0.12, dy/d*0.12];
  nums.push({x:m.x,y:m.y,z:34,v:dmg,crit,t:0});
  for(let k=0;k<8;k++) fx.push({type:'spark', x:m.x, y:m.y, z:22, vx:(Math.random()-.5)*2.4, vy:(Math.random()-.5)*2.4-1, t:0, life:18, col:crit?'#ff8fb8':'#ffd27a'});
  sfx.hit(); if(crit) shake=Math.max(shake,4);
  if(m.hp<=0){ m.dead=30; sfx.pop(); for(let k=0;k<22;k++) fx.push({type:'spark', x:m.x, y:m.y, z:18, vx:(Math.random()-.5)*3, vy:(Math.random()-.5)*3-1.5, t:0, life:30, col:'#fff2b0'}); drops.push({x:m.x,y:m.y,t:0}); }
}
function hurtPlayer(n, from){
  if(P.hurt>0 || P.dead) return;
  P.hp=Math.max(0,P.hp-n); P.hurt=60; shake=5; sfx.hurt();
  nums.push({x:P.x,y:P.y,z:46,v:n,crit:false,t:0,me:true});
  const dx=P.x-from.x, dy=P.y-from.y, d=Math.hypot(dx,dy)||1; tryMove(P, dx/d*0.35, dy/d*0.35);
  updateHud();
  if(P.hp<=0){ P.dead=true; toast('잠시 쉬어갔어요 — 다시 힘을 내요', 2000); setTimeout(()=>{ P.x=SC.spawn[0]; P.y=SC.spawn[1]; P.hp=P.maxHp; P.dead=false; P.hurt=90; updateHud(); }, 1200); }
}

/* ---------------- 갱신 ---------------- */
function update(){
  globalT++; P.t++;
  if(shake>0) shake*=0.85; if(shake<0.3) shake=0;
  actors.forEach(a=>{ a.t++; if(a.tx!==null){ const dx=a.tx-a.x, dy=a.ty-a.y, d=Math.hypot(dx,dy); if(d<0.06){ a.x=a.tx; a.y=a.ty; a.tx=a.ty=null; a.moving=false; } else { a.x+=dx/d*0.045; a.y+=dy/d*0.045; a.moving=true; const sd=dx-dy; if(Math.abs(sd)>0.02) a.face=sd>0?1:-1; } } });
  // 입자: 꽃잎 · 반딧불
  const fxs=SC.fx||[];
  if(fxs.includes('petals') && parts.length<60 && Math.random()<0.35) parts.push({k:'petal', x:camX+Math.random()*LW, y:camY-10, vx:0.2+Math.random()*0.35, vy:0.25+Math.random()*0.3, t:0, p:Math.random()*6});
  if(fxs.includes('fireflies') && parts.length<40 && Math.random()<0.2) parts.push({k:'fly', x:camX+Math.random()*LW, y:camY+LH*0.3+Math.random()*LH*0.7, vx:(Math.random()-.5)*0.2, vy:-0.1-Math.random()*0.15, t:0, p:Math.random()*6, life:200+Math.random()*200});
  parts.forEach(p=>{ p.t++; p.x+=p.vx+(p.k==='petal'?Math.sin(p.t*0.05+p.p)*0.3:Math.sin(p.t*0.03+p.p)*0.2); p.y+=p.vy; });
  parts=parts.filter(p=> p.k==='petal' ? p.y<camY+LH+10 : p.t<p.life);
  fx.forEach(f=>{ f.t++; if(f.type==='spark'){ f.vy+=0.08; } }); fx=fx.filter(f=>f.t<f.life);
  nums.forEach(n=>n.t++); nums=nums.filter(n=>n.t<50);
  if(mode!=='play'){ K['arrowleft']=K['arrowright']=K['arrowup']=K['arrowdown']=false; return; }

  // 이동 (속도 80%)
  let jx=J.x, jy=J.y;
  if(K['arrowleft']||K['a']) jx-=1; if(K['arrowright']||K['d']) jx+=1; if(K['arrowup']||K['w']) jy-=1; if(K['arrowdown']||K['s']) jy+=1;
  const m=Math.hypot(jx,jy); P.moving = m>0.15 && !P.dead;
  if(P.moving){ const sp=1.0*Math.min(1,m); const w=screenToWorld(jx/m*sp, jy/m*sp); tryMove(P,w[0],w[1]); if(Math.abs(jx)>0.15) P.face=jx>0?1:-1; }
  if(P.hurt>0) P.hurt--; if(P.atkCD>0) P.atkCD--; if(P.aim>0) P.aim--; if(P.skillCD>0) P.skillCD--;
  if((atkQ||atkHeld) && P.atkCD<=0 && !P.dead) shoot();
  if(skillQ && !P.dead) skill();
  atkQ=false; skillQ=false;
  $('bSkill').style.setProperty('--cd', (P.skillCD/360*360)+'deg');
  $('bAtk').style.setProperty('--cd', (P.atkCD/20*360)+'deg');

  // 가까운 대상
  near=null; let nd=1.35;
  actors.forEach(a=>{ if(!a.vis) return; const d=Math.hypot(a.x-P.x,a.y-P.y), rr=a.look==='sphinx'?2.6:1.35; if(d<rr && d<nd+ (a.look==='sphinx'?1.3:0)){ nd=d; near={kind:'actor', o:a}; } });
  objects.forEach(o=>{ if(o.hidden || (o.used && !o.note)) return; const d=Math.hypot(o.x-P.x,o.y-P.y); if(d<1.3 && d<nd){ nd=d; near={kind:'obj', o}; } });
  $('bTalk').style.display = near ? 'flex' : 'none';
  if(talkQ){ talkQ=false; if(near) interact(near); }

  // 화살
  shots.forEach(s=>{ s.x+=s.vx; s.y+=s.vy; s.life--;
    if(solidAt(Math.floor(s.x),Math.floor(s.y)) && WALL.has(cell(Math.floor(s.x),Math.floor(s.y)))) s.life=0;
    mobs.forEach(mb=>{ if(s.life<=0||mb.gone||mb.dead) return; if(Math.hypot(mb.x-s.x,mb.y-s.y)<0.55){ s.life=0; damage(mb, 13+Math.random()*6); } }); });
  shots=shots.filter(s=>s.life>0);
  // 몬스터
  mobs.forEach(mb=>{
    if(mb.gone) return; mb.t++; if(mb.fade>0) mb.fade--;
    if(mb.dead>0){ if(--mb.dead===0){ mb.gone=true; kills++; updateHud(); } return; }
    if(mb.flash>0) mb.flash--; if(mb.hpShow>0) mb.hpShow--; if(mb.cd>0) mb.cd--;
    const dx=P.x-mb.x, dy=P.y-mb.y, d=Math.hypot(dx,dy);
    if(hostile && (d<4.2 || (mb.hpShow>0 && d<7)) && !P.dead){ tryMove(mb, dx/d*mb.spd*1.6, dy/d*mb.spd*1.6);
      if(d<0.6 && mb.cd<=0){ hurtPlayer(mb.atk, mb); mb.cd=50; } }
    else { mb.wanderA+=(hash(mb.t>>5,3)-.5)*0.2; const wx=Math.cos(mb.wanderA)*mb.spd*0.5, wy=Math.sin(mb.wanderA)*mb.spd*0.5;
      if(Math.hypot(mb.x+wx-mb.sx,mb.y+wy-mb.sy)<2.2) tryMove(mb,wx,wy); else mb.wanderA+=Math.PI; }
    if(mb.kb[0]||mb.kb[1]){ tryMove(mb,mb.kb[0],mb.kb[1]); mb.kb=[mb.kb[0]*0.7,mb.kb[1]*0.7]; if(Math.abs(mb.kb[0])+Math.abs(mb.kb[1])<0.005) mb.kb=[0,0]; }
  });
  drops.forEach(dp=>{ dp.t++; const dd=Math.hypot(P.x-dp.x,P.y-dp.y); if(dp.t>20 && dd<2.4){ dp.x+=(P.x-dp.x)*0.12; dp.y+=(P.y-dp.y)*0.12; } if(dd<0.4){ dp.got=true; sfx.get(); nums.push({x:P.x,y:P.y,z:50,v:'+용기',t:0,exp:true}); } });
  drops=drops.filter(dp=>!dp.got);
  checkGoals();
}

/* ---------------- 그리기 ---------------- */
function toScreen(x,y,z=0){ return [ (isoX(x,y)-camX)*S, (isoY(x,y,z)-camY)*S ]; }
function draw(){
  const px=isoX(P.x,P.y), py=isoY(P.x,P.y);
  const tx = PW<=LW ? (PW-LW)/2 : Math.max(0, Math.min(PW-LW, px-LW/2));
  const ty = PH<=LH ? (PH-LH)/2 : Math.max(0, Math.min(PH-LH, py-LH*0.55));
  camX+=(tx-camX)*0.12; camY+=(ty-camY)*0.12;
  const sk = shake ? [(Math.random()-.5)*shake, (Math.random()-.5)*shake] : [0,0];
  const saveX=camX, saveY=camY; camX=Math.round(camX+sk[0]); camY=Math.round(camY+sk[1]);

  l.fillStyle= SC.light==='day' ? '#2a2430' : SC.light==='dusk' ? '#2a1a4a' : '#0a0c20'; l.fillRect(0,0,LW,LH);
  l.drawImage(bg, -camX, -camY);
  const items=[];
  for(let y=0;y<MH;y++) for(let x=0;x<MW;x++){ const t=cell(x,y); if(PROPS.includes(t)) items.push({d:x+y+1, f:()=>drawProp(t,x,y)}); }
  objects.forEach(o=>{ if(!o.note || o.hidden) return; items.push({d:o.x+o.y, f:()=>{ const sx=isoX(o.x,o.y)-camX, sy=isoY(o.x,o.y)-camY, b=Math.round(Math.sin(globalT*0.06+o.x)*2);
    shadowAt(sx,sy,4); R('#f6e6b8',sx-5,sy-17+b,10,7); R('#fffaf0',sx-4,sy-16+b,8,5); R('#c9a15a',sx-6,sy-18+b,2,9); R('#c9a15a',sx+4,sy-18+b,2,9); R('#8a6a3a',sx-3,sy-15+b,6,1); R('#e05a7a',sx-1,sy-11+b,2,3); }}); });
  actors.forEach(a=>{ if(!a.vis) return; items.push({d:a.x+a.y, f:()=>{
    const sx=isoX(a.x,a.y)-camX, sy=isoY(a.x,a.y)-camY;
    if(a.look==='sphinx'){ shadowAt(sx,sy,22); l.drawImage(sphinxSprite(Math.floor(globalT/30)%2), Math.round(sx-50), Math.round(sy-66)); return; }
    const pal=PALETTES[a.pal]||{}; shadowAt(sx,sy,7);
    const lift = pal.float ? 14+Math.round(Math.sin(globalT*0.07)*3) : 0;
    const pose = a.moving ? 'walk' : (Math.floor((globalT+a.x*37)/7)%40===39 ? 'blink' : 'idle');
    const face = a.moving ? a.face<0 : (P.x-P.y < a.x-a.y);
    drawChar(charSprite(a.pal, pose, pose==='walk'?Math.floor(a.t/5)%6:0, ''), sx, sy-lift, face);
  }}); });
  mobs.forEach(mb=>{ if(mb.gone) return; items.push({d:mb.x+mb.y, f:()=>{
    const sx=isoX(mb.x,mb.y)-camX, sy=isoY(mb.x,mb.y)-camY; shadowAt(sx,sy,8);
    l.save(); l.globalAlpha = mb.dead>0 ? mb.dead/30 : (1-mb.fade/30);
    l.drawImage(mobSprite(mb.look, Math.floor(mb.t/10)%4, mb.flash>0), Math.round(sx-20), Math.round(sy-40-(mb.dead>0?(30-mb.dead)*0.5:0))); l.restore(); }}); });
  items.push({d:P.x+P.y, f:()=>{
    const sx=isoX(P.x,P.y)-camX, sy=isoY(P.x,P.y)-camY; shadowAt(sx,sy,7);
    if(P.hurt>0 && Math.floor(P.hurt/4)%2===0 && !P.dead) return;
    const pose = P.aim>0 ? 'aim' : P.moving ? 'walk' : (Math.floor(P.t/7)%45===44 ? 'blink' : 'idle');
    drawChar(charSprite('dad',pose,pose==='walk'?Math.floor(P.t/5)%6:0,P.armed?'bow':''), sx, sy, P.face<0);
  }});
  drops.forEach(dp=>items.push({d:dp.x+dp.y, f:()=>{ const sx=isoX(dp.x,dp.y)-camX, sy=isoY(dp.x,dp.y)-camY-6-Math.sin(dp.t*0.15)*2; R('#ffc8e0',sx-1,sy-2,3,5); R('#ffc8e0',sx-2,sy-1,5,3); R('#ffffff',sx,sy-1,1,1); }}));
  items.sort((a,b)=>a.d-b.d).forEach(it=>it.f());
  drawWires();
  // 꽃잎 · 화살 · 스킬
  parts.forEach(p=>{ if(p.k==='petal'){ R(Math.floor(p.t/8+p.p)%2?'#ffc0d8':'#ff9ac0', p.x-camX, p.y-camY, 2, 1); } });
  shots.forEach(s=>{ const x=isoX(s.x,s.y)-camX, y=isoY(s.x,s.y,20)-camY, ex=isoX(s.x-s.vx*3,s.y-s.vy*3)-camX, ey=isoY(s.x-s.vx*3,s.y-s.vy*3,20)-camY;
    l.strokeStyle='#f3dca0'; l.lineWidth=1; l.beginPath(); l.moveTo(Math.round(ex)+.5,Math.round(ey)+.5); l.lineTo(Math.round(x)+.5,Math.round(y)+.5); l.stroke(); R('#ff6f9f',x-1,y-1,3,3); });
  fx.forEach(f=>{ if(f.type==='rain' && f.t>0){ const k=f.t/f.life, x=isoX(f.x,f.y)-camX, y=isoY(f.x,f.y,(1-k)*90)-camY; R('#ffd8e8',x,y-6,1,6); R('#ff6f9f',x-1,y,3,2); }
    if(f.type==='spark'){ const x=isoX(f.x,f.y)-camX+f.vx*f.t, y=isoY(f.x,f.y,f.z)-camY+f.vy*f.t+0.04*f.t*f.t; R(f.col, x, y, 2, 2); } });

  vc.setTransform(1,0,0,1,0,0); vc.imageSmoothingEnabled=false;
  vc.drawImage(lc, 0, 0, LW*S*DPR, LH*S*DPR);
  vc.setTransform(DPR,0,0,DPR,0,0);

  // 달 (밤 장면)
  if((SC.fx||[]).includes('moon')){ const mx=SW*0.78-(camX*0.08)*S, my=SH*0.14; const g=vc.createRadialGradient(mx,my,0,mx,my,90*S/3); g.addColorStop(0,'rgba(255,250,230,1)'); g.addColorStop(0.35,'rgba(255,246,220,.95)'); g.addColorStop(0.36,'rgba(255,240,210,.35)'); g.addColorStop(1,'rgba(255,240,210,0)');
    vc.globalCompositeOperation='screen'; vc.fillStyle=g; vc.fillRect(mx-120*S/3*3,my-120*S/3*3,240*S,240*S); vc.globalCompositeOperation='source-over'; }

  // 조명 (곱하기) + 빛 번짐 (더하기)
  const LS=lightC.width/SW;
  lg.globalCompositeOperation='source-over'; lg.fillStyle=SC.ambient; lg.fillRect(0,0,lightC.width,lightC.height);
  lg.globalCompositeOperation='lighter';
  const all=LIGHTS.slice();
  all.push({x:P.x,y:P.y,z:24,r:64,c:'200,200,255',a:0.45});
  actors.forEach(a=>{ if(a.vis && a.pal==='eros') all.push({x:a.x,y:a.y,z:40,r:70,c:'255,200,230',a:0.9}); if(a.vis && a.look==='sphinx') all.push({x:a.x,y:a.y,z:40,r:80,c:'255,220,150',a:0.7}); });
  objects.forEach(o=>{ if(o.note && !notesFound.has(o.id)) all.push({x:o.x,y:o.y,z:14,r:34,c:'255,240,190',a:0.9}); });
  shots.forEach(s=>all.push({x:s.x,y:s.y,z:20,r:22,c:'255,150,200',a:0.8}));
  fx.forEach(f=>{ if(f.type==='ring') all.push({x:f.x,y:f.y,z:4,r:70*(1-f.t/f.life)+20,c:'255,140,200',a:1-f.t/f.life}); });
  mobs.forEach(mb=>{ if(!mb.gone && mb.look==='shadow') all.push({x:mb.x,y:mb.y,z:24,r:30,c:'150,120,255',a:0.45}); });
  all.forEach(Lt=>{ const [sx,sy]=toScreen(Lt.x,Lt.y,Lt.z); const fl = Lt.flick ? 0.93+Math.sin(globalT*0.3+Lt.x*7)*0.04+Math.random()*0.03 : 1;
    const r=Lt.r*S*fl*LS, X=sx*LS, Y=sy*LS; const g=lg.createRadialGradient(X,Y,0,X,Y,r); g.addColorStop(0,`rgba(${Lt.c},${Lt.a})`); g.addColorStop(0.45,`rgba(${Lt.c},${Lt.a*0.45})`); g.addColorStop(1,`rgba(${Lt.c},0)`);
    lg.fillStyle=g; lg.fillRect(X-r,Y-r,r*2,r*2); });
  vc.globalCompositeOperation='multiply'; vc.imageSmoothingEnabled=true; vc.drawImage(lightC, 0, 0, SW, SH);
  vc.globalCompositeOperation='lighter';
  all.forEach(Lt=>{ if(!Lt.flick && Lt.r>40) return; const [sx,sy]=toScreen(Lt.x,Lt.y,Lt.z); const r=(Lt.flick?16:Lt.r*0.5)*S;
    const g=vc.createRadialGradient(sx,sy,0,sx,sy,r); g.addColorStop(0,`rgba(${Lt.c},${Lt.flick?0.5:0.35})`); g.addColorStop(1,`rgba(${Lt.c},0)`); vc.fillStyle=g; vc.fillRect(sx-r,sy-r,r*2,r*2); });
  // 창문 햇살 (식당)
  if((SC.fx||[]).includes('beams')){ vc.globalCompositeOperation='screen';
    for(let k=0;k<5;k++){ const [x1,y1]=toScreen(7+k*2.4,1,60), [x2,y2]=toScreen(7+k*2.4+3,4.5,0); const w=26*S; vc.fillStyle=`rgba(255,244,210,${0.07+0.03*Math.sin(globalT*0.02+k)})`;
      vc.beginPath(); vc.moveTo(x1,y1); vc.lineTo(x1+w,y1); vc.lineTo(x2+w*1.6,y2); vc.lineTo(x2,y2); vc.closePath(); vc.fill(); } }
  // 반딧불
  vc.globalCompositeOperation='lighter';
  parts.forEach(p=>{ if(p.k!=='fly') return; const a=Math.min(1,p.t/30,(p.life-p.t)/30)*(0.6+0.4*Math.sin(p.t*0.1+p.p)); const x=(p.x-camX)*S, y=(p.y-camY)*S;
    const g=vc.createRadialGradient(x,y,0,x,y,6*S/2); g.addColorStop(0,`rgba(255,250,170,${a})`); g.addColorStop(1,'rgba(255,250,170,0)'); vc.fillStyle=g; vc.fillRect(x-8*S,y-8*S,16*S,16*S); });
  motes.forEach(mo=>{ const x=((mo.x*SW + globalT*0.15*mo.s)%SW), y=(mo.y*SH + Math.sin(globalT*0.01+mo.p)*20); vc.fillStyle=`rgba(255,230,210,${0.12+0.12*Math.sin(globalT*0.03+mo.p)})`; vc.fillRect(x,y,1.5*mo.s+0.5,1.5*mo.s+0.5); });
  vc.globalCompositeOperation='source-over';
  // 레테의 안개
  if((SC.fx||[]).includes('mist')){
    for(let k=0;k<7;k++){ const wx=(k*5.3+globalT*0.004*(k%2?1:-1))%MW, wy=(k*3.7)%MH+2; const [sx,sy]=toScreen(wx,wy,4);
      const r=(110+40*Math.sin(globalT*0.01+k))*S/2.2; const g=vc.createRadialGradient(sx,sy,0,sx,sy,r); g.addColorStop(0,'rgba(210,190,255,.22)'); g.addColorStop(1,'rgba(210,190,255,0)');
      vc.fillStyle=g; vc.save(); vc.translate(sx,sy); vc.scale(1.8,0.6); vc.translate(-sx,-sy); vc.fillRect(sx-r,sy-r,r*2,r*2); vc.restore(); }
  }
  // 멈춘 시간 (에로스)
  if(effects.timestop){ vc.globalCompositeOperation='saturation'; vc.fillStyle='rgb(128,128,128)'; vc.fillRect(0,0,SW,SH);
    vc.globalCompositeOperation='source-over'; const g=vc.createRadialGradient(SW/2,SH/2,SH*0.2,SW/2,SH/2,SH*0.9); g.addColorStop(0,'rgba(255,170,210,0)'); g.addColorStop(1,'rgba(255,150,200,.35)'); vc.fillStyle=g; vc.fillRect(0,0,SW,SH);
    actors.forEach(a=>{ if(a.vis && a.pal==='eros'){ const [sx,sy]=toScreen(a.x,a.y,40); const g2=vc.createRadialGradient(sx,sy,0,sx,sy,80*S/2); g2.addColorStop(0,'rgba(255,190,225,.55)'); g2.addColorStop(1,'rgba(255,190,225,0)'); vc.globalCompositeOperation='lighter'; vc.fillStyle=g2; vc.fillRect(sx-80*S,sy-80*S,160*S,160*S); vc.globalCompositeOperation='source-over'; } }); }
  // 운명의 실 (클로토)
  if(effects.thread){ const a=actors.find(x=>x.id==='seeunC'); if(a){ const [x1,y1]=toScreen(P.x,P.y,30), [x2,y2]=toScreen(a.x,a.y,30);
    vc.globalCompositeOperation='lighter'; vc.strokeStyle='rgba(255,220,140,.9)'; vc.lineWidth=2.2; vc.shadowColor='rgba(255,200,120,1)'; vc.shadowBlur=14; vc.beginPath();
    const mx=(x1+x2)/2, my=Math.min(y1,y2)-40-Math.sin(globalT*0.05)*6; vc.moveTo(x1,y1); vc.quadraticCurveTo(mx,my,x2,y2); vc.stroke(); vc.shadowBlur=0; vc.globalCompositeOperation='source-over';
    for(let k=0;k<3;k++){ const f=((globalT*0.01)+k/3)%1, qx=(1-f)*(1-f)*x1+2*(1-f)*f*mx+f*f*x2, qy=(1-f)*(1-f)*y1+2*(1-f)*f*my+f*f*y2; vc.fillStyle='rgba(255,250,220,.95)'; vc.beginPath(); vc.arc(qx,qy,2.5,0,6.283); vc.fill(); } } }
  // 가장자리
  const vg=vc.createRadialGradient(SW/2,SH/2,Math.min(SW,SH)*0.35,SW/2,SH/2,Math.max(SW,SH)*0.72); vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,`rgba(30,16,60,${SC.vignette||0.3})`); vc.fillStyle=vg; vc.fillRect(0,0,SW,SH);

  // 간판 글씨
  (SC.signs||[]).forEach(sg=>{ const [sx,sy]=toScreen(sg.x,1.02,sg.z); vc.save(); vc.font=`700 ${Math.round(6*S)}px "Gowun Batang", serif`; vc.textAlign='center'; vc.fillStyle=sg.color; vc.shadowColor=`rgba(${sg.glow},.9)`; vc.shadowBlur=8; vc.fillText(sg.text, sx, sy+2*S); vc.restore(); });
  // 미션 표시 (대상 위 금빛 마름모 · 화면 밖이면 가장자리 화살표)
  const tg=goalTarget();
  if(tg && mode==='play'){ const [sx,sy]=toScreen(tg.x,tg.y,tg.z); const b=Math.sin(globalT*0.1)*3;
    if(sx>20 && sx<SW-20 && sy>40 && sy<SH-20){ vc.save(); vc.translate(sx,sy-8+b); vc.rotate(Math.PI/4); vc.fillStyle='#f2d48a'; vc.shadowColor='rgba(255,210,120,.9)'; vc.shadowBlur=10; vc.fillRect(-6,-6,12,12); vc.shadowBlur=0; vc.strokeStyle='#5a4420'; vc.lineWidth=1.5; vc.strokeRect(-6,-6,12,12); vc.restore(); }
    else { const cx=SW/2, cy=SH/2, ang=Math.atan2(sy-cy,sx-cx), ex=cx+Math.cos(ang)*Math.min(SW*0.44,SH*0.9), ey=cy+Math.sin(ang)*Math.min(SW*0.44,SH*0.38);
      vc.save(); vc.translate(Math.max(28,Math.min(SW-28,ex)),Math.max(70,Math.min(SH-40,ey))); vc.rotate(ang); vc.fillStyle='rgba(242,212,138,.95)'; vc.shadowColor='rgba(0,0,0,.5)'; vc.shadowBlur=6;
      vc.beginPath(); vc.moveTo(14,0); vc.lineTo(-6,-9); vc.lineTo(-2,0); vc.lineTo(-6,9); vc.closePath(); vc.fill(); vc.restore(); } }
  // 이름 · 체력바 · 숫자
  if(near && mode==='play'){ const o=near.o, [sx,sy]=toScreen(o.x,o.y,-6); label(near.kind==='actor'?o.name:o.label, sx, sy); }
  mobs.forEach(mb=>{ if(mb.gone||mb.dead||!(mb.hpShow>0||(hostile && Math.hypot(mb.x-P.x,mb.y-P.y)<5))) return; const [sx,sy]=toScreen(mb.x,mb.y,40); const w=30;
    vc.fillStyle='rgba(10,12,20,.8)'; vc.fillRect(sx-w/2-1,sy-1,w+2,6); vc.fillStyle= mb.look==='shadow'?'#c46a8a':'#d77a7a'; vc.fillRect(sx-w/2,sy,w*Math.max(0,mb.hp/mb.maxHp),4); });
  nums.forEach(n=>{ const [sx,sy]=toScreen(n.x,n.y,n.z+n.t*0.5); const a=Math.min(1,(50-n.t)/15);
    vc.save(); vc.globalAlpha=a; vc.textAlign='center'; const sz = n.exp?13 : n.crit?26:20; vc.font=`900 ${sz}px "Noto Sans KR", system-ui`;
    vc.lineWidth=4; vc.strokeStyle='rgba(20,10,10,.9)'; vc.strokeText(String(n.v), sx, sy);
    const g=vc.createLinearGradient(0,sy-sz,0,sy); if(n.me){ g.addColorStop(0,'#e8e0ff'); g.addColorStop(1,'#9a8cff'); } else if(n.exp){ g.addColorStop(0,'#fff0f6'); g.addColorStop(1,'#ff9ac4'); } else if(n.crit){ g.addColorStop(0,'#fff0f6'); g.addColorStop(1,'#ff5c95'); } else { g.addColorStop(0,'#fff6d0'); g.addColorStop(1,'#ffb347'); }
    vc.fillStyle=g; vc.fillText(String(n.v), sx, sy); vc.restore(); });
  camX=saveX; camY=saveY;
}
function label(t, sx, sy){ vc.save(); vc.font='700 12px "Noto Sans KR"'; vc.textAlign='center'; const w=vc.measureText(t).width+16; vc.fillStyle='rgba(30,34,48,.88)'; vc.fillRect(sx-w/2,sy,w,20); vc.strokeStyle='rgba(201,168,106,.7)'; vc.strokeRect(sx-w/2+.5,sy+.5,w-1,19); vc.fillStyle='#f4ecd8'; vc.fillText(t,sx,sy+14); vc.restore(); }

/* ---------------- 시작 · 끝 ---------------- */
function showOutro(){ const c=$('endCard'); $('endSmall').textContent=CH.outro.small; $('endTitle').textContent=CH.outro.title; $('endText').textContent=CH.outro.text; c.style.display='flex'; sfx.done(); try{ localStorage.removeItem(SAVE_KEY); }catch(e){} }
$('replayBtn').onclick=e=>{ e.stopPropagation(); try{ localStorage.removeItem(SAVE_KEY); }catch(er){} location.reload(); };
$('homeBtn').onclick=e=>{ e.stopPropagation(); location.href='index.html'; };
function begin(fromMi){
  $('introCard').style.display='none'; mode='cut';
  const m=CH.missions[fromMi]; setupScene(m.scene); spawnActors(); P.x=SC.spawn[0]; P.y=SC.spawn[1]; snapCam();
  if(fromMi>0){ for(let i=0;i<fromMi;i++){ const mm=CH.missions[i]; (mm.done||[]).concat(mm.start||[]).forEach(s=>{ if(s.give==='bow') P.armed=true; }); } }
  drawFace(); updateHud(); fade(false, 500); startMission(fromMi);
}
(function initIntro(){
  $('introSmall').textContent=CH.intro.small; $('introTitle').textContent=CH.intro.title; $('introText').textContent=CH.intro.text;
  const sv=loadProg();
  if(sv && sv.mi>0 && sv.mi<CH.missions.length){ $('resumeBtn').style.display=''; $('resumeBtn').textContent=`이어하기 — 미션 ${sv.mi+1}. ${CH.missions[sv.mi].title}`;
    $('resumeBtn').onclick=e=>{ e.stopPropagation(); (sv.notes||[]).forEach(n=>notesFound.add(n)); begin(sv.mi); }; }
  $('startBtn').onclick=e=>{ e.stopPropagation(); try{ localStorage.removeItem(SAVE_KEY); }catch(er){} begin(0); };
  setupScene(CH.missions[0].scene); spawnActors(); P.x=SC.spawn[0]; P.y=SC.spawn[1]; snapCam(); drawFace();
})();
function loop(){ update(); draw(); requestAnimationFrame(loop); }
loop();
if(/[?&]debug/.test(location.search)) window.__saga={ get P(){return P;}, get SC(){return SC;}, get SCID(){return SCID;}, get mode(){return mode;}, get MI(){return MI;}, get mission(){return mission;}, get actors(){return actors;}, get objects(){return objects;}, get mobs(){return mobs;}, get kills(){return kills;}, get near(){return near;}, tp(x,y){ P.x=x; P.y=y; }, startMission };

})();

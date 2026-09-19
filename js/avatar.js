/* ============================================================
   AVATAR — 메이플풍 2등신 캐릭터 · 몬스터 그림 (모두 코드로 직접 그린 오리지널)
   - 발끝 가운데가 (0,0), 오른쪽을 보는 모습이 기본
   - 옷 종류(outfit)·머리(hairStyle)·눈 색(eye) 은 story.js 의 PALETTES 에서 정해요
   - 장착한 장비(모자·망토·신발·활)는 캐릭터 위에 실제로 그려져요
   ============================================================ */
const AV = (function(){
'use strict';
const OL = '#3a2530';
const memo = new Map();
function rgb(h){ h=h.replace('#',''); if(h.length===3) h=h.split('').map(x=>x+x).join(''); const n=parseInt(h,16); return [n>>16&255, n>>8&255, n&255]; }
function mix(a, b, f){ const k=a+b+f; let v=memo.get(k); if(v) return v; const A=rgb(a), B=rgb(b); v='#'+A.map((x,i)=>Math.round(x+(B[i]-x)*f).toString(16).padStart(2,'0')).join(''); memo.set(k,v); return v; }
const lt=(h,f)=>mix(h,'#ffffff',f), dk=(h,f)=>mix(h,'#1c1018',f);
const PI=Math.PI;

function ell(c,x,y,rx,ry,rot=0){ c.beginPath(); c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),rot,0,PI*2); }
function line(c,x1,y1,x2,y2){ c.beginPath(); c.moveTo(x1,y1); c.lineTo(x2,y2); c.stroke(); }
function fs(c, fill, lw=1.5){ c.fillStyle=fill; c.fill(); c.lineWidth=lw; c.strokeStyle=OL; c.stroke(); }
function vgrad(c, y1, y2, c1, c2){ const g=c.createLinearGradient(0,y1,0,y2); g.addColorStop(0,c1); g.addColorStop(1,c2); return g; }

/* ---------- 옷 종류별 색 ---------- */
function outfitOf(p){
  const o=p.outfit||'shirt';
  const base={ kind:o, top:p.cloth, sleeve:p.cloth, pants:p.cloth2, bare:!!p.skirt, skirt:p.skirt?p.cloth2:null, shoe:p.shoe||dk(p.cloth2||'#444',.35), long:false };
  if(o==='dress'){ base.skirt=p.cloth; base.bare=true; base.shoe=p.shoe||'#8a4f6c'; }
  if(o==='robe'){ base.skirt=p.cloth; base.long=true; base.bare=true; base.shoe='#d9b46a'; }
  if(o==='tunic'){ base.skirt=p.cloth; base.bare=true; base.shoe='#d9b46a'; }
  if(o==='doctor'){ base.sleeve=p.cloth; }
  if(o==='nurse'){ base.skirt=p.cloth; base.bare=true; base.shoe='#f4f4f4'; }
  if(o==='apron'){ base.skirt=p.cloth2; base.bare=true; }
  return base;
}

/* ---------- 부위 ---------- */
function arm(c, sx, sy, ex, ey, sleeve, skin){
  c.lineCap='round';
  c.strokeStyle=OL; c.lineWidth=7.6; line(c,sx,sy,ex,ey);
  c.strokeStyle=sleeve; c.lineWidth=5.1; line(c,sx,sy,ex,ey);
  c.strokeStyle=lt(sleeve,.28); c.lineWidth=1.4; line(c,sx+.6,sy-1.2,(sx+ex)/2+.6,(sy+ey)/2-1.2);
  ell(c,ex,ey,2.9,2.9); fs(c,skin,1.3);
}
function leg(c, hx, hy, fx, fy, col, shoe, facing){
  c.lineCap='round';
  c.strokeStyle=OL; c.lineWidth=7.8; line(c,hx,hy,fx,fy-2.4);
  c.strokeStyle=col; c.lineWidth=5.4; line(c,hx,hy,fx,fy-2.4);
  // 신발 (앞코가 보는 방향)
  c.beginPath(); c.moveTo(fx-3.4,fy); c.lineTo(fx-3.6,fy-3.3); c.quadraticCurveTo(fx-2.6,fy-5.2,fx+.4,fy-4.8);
  c.quadraticCurveTo(fx+5.6,fy-4.2,fx+5.9,fy-1.3); c.quadraticCurveTo(fx+5.9,fy,fx+4.2,fy); c.closePath();
  fs(c, shoe, 1.3);
  c.fillStyle=lt(shoe,.55); c.fillRect(fx-3.2, fy-1.25, 8.6, 1.05);
  c.fillStyle=lt(shoe,.3); ell(c,fx+1.2,fy-3.4,1.8,.8); c.fill();
}
function torsoPath(c, wide){
  const w=wide?11.4:10.6;
  c.beginPath(); c.moveTo(-7.5,-34.6); c.quadraticCurveTo(-w,-34.2,-w,-30.4); c.lineTo(-9.3,-15);
  c.quadraticCurveTo(0,-13.3,9.3,-15); c.lineTo(w,-30.4); c.quadraticCurveTo(w,-34.2,7.5,-34.6); c.closePath();
}
function shadeTorso(c){
  c.save(); torsoPath(c); c.clip();
  c.fillStyle='rgba(30,10,40,.16)'; c.fillRect(-12,-36,6,24);
  c.fillStyle='rgba(255,255,255,.16)'; c.fillRect(4.5,-36,3,24);
  c.restore();
}
function torso(c, p, of){
  const k=of.kind;
  torsoPath(c, k==='doctor'||k==='chef'); fs(c, of.top, 1.6);
  shadeTorso(c);
  c.lineCap='round';
  if(k==='shirt'){
    c.fillStyle='#f6f2ea'; c.beginPath(); c.moveTo(-4.4,-34.5); c.lineTo(0,-30.6); c.lineTo(-1.2,-34.8); c.closePath(); c.fill(); c.strokeStyle=OL; c.lineWidth=1; c.stroke();
    c.beginPath(); c.moveTo(4.4,-34.5); c.lineTo(.2,-30.6); c.lineTo(1.4,-34.8); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle=dk(of.top,.25); c.lineWidth=1; line(c,.2,-30.5,.2,-17.5);
    c.fillStyle=lt(of.top,.6); [-27.5,-23.5,-19.8].forEach(y=>{ ell(c,1.3,y,.75,.75); c.fill(); });
    c.fillStyle='#3a2a28'; c.fillRect(-9.2,-17.8,18.4,2.6); c.fillStyle='#e9c46a'; c.fillRect(-.9,-18.1,3.4,3.2);
  } else if(k==='suit'){
    c.fillStyle='#f6f4f0'; c.beginPath(); c.moveTo(-3.8,-34.6); c.lineTo(0,-24); c.lineTo(3.8,-34.6); c.closePath(); c.fill();
    c.fillStyle='#c4475c'; c.beginPath(); c.moveTo(-1.1,-33.2); c.lineTo(1.1,-33.2); c.lineTo(1.5,-26.4); c.lineTo(0,-24.4); c.lineTo(-1.5,-26.4); c.closePath(); c.fill();
    c.strokeStyle=dk(of.top,.45); c.lineWidth=1.2; c.beginPath(); c.moveTo(-3.8,-34.6); c.lineTo(-.4,-23); c.lineTo(-.4,-15); c.moveTo(3.8,-34.6); c.lineTo(.4,-23); c.stroke();
    c.fillStyle=lt(of.top,.3); ell(c,-5.6,-20,.8,.8); c.fill(); ell(c,-5.6,-23.5,.8,.8); c.fill();
  } else if(k==='tee'){
    c.strokeStyle=dk(of.top,.3); c.lineWidth=1.1; c.beginPath(); c.arc(0,-35,4.2,.15*PI,.85*PI); c.stroke();
    c.fillStyle=lt(of.top,.55); c.beginPath(); c.moveTo(2,-25); c.bezierCurveTo(-1,-28,-2.5,-24,2,-21); c.bezierCurveTo(6.5,-24,5,-28,2,-25); c.fill();
  } else if(k==='chef'){
    c.fillStyle='#d8485a'; c.beginPath(); c.moveTo(-5,-34.6); c.lineTo(5,-34.6); c.lineTo(0,-29.5); c.closePath(); c.fill(); c.strokeStyle=OL; c.lineWidth=1; c.stroke();
    c.fillStyle='#c9c4bb'; [[-3,-26],[-3,-21.5],[4,-26],[4,-21.5]].forEach(([x,y])=>{ ell(c,x,y,1,1); c.fill(); });
  } else if(k==='doctor'){
    c.fillStyle=p.cloth2; c.beginPath(); c.moveTo(-4,-34.6); c.lineTo(0,-22); c.lineTo(4,-34.6); c.closePath(); c.fill();
    c.strokeStyle=dk(of.top,.3); c.lineWidth=1.2; c.beginPath(); c.moveTo(-4,-34.6); c.lineTo(-.6,-21); c.lineTo(-.6,-14.5); c.moveTo(4,-34.6); c.lineTo(.6,-21); c.stroke();
    c.strokeStyle='#6f7c8a'; c.lineWidth=1.3; c.beginPath(); c.moveTo(-3.2,-33); c.quadraticCurveTo(-4.5,-24,1,-22.5); c.quadraticCurveTo(6,-24,4.4,-33); c.stroke();
    ell(c,1,-22,1.5,1.5); c.fillStyle='#c9d3de'; c.fill(); c.strokeStyle=OL; c.lineWidth=.8; c.stroke();
    c.strokeStyle=dk(of.top,.25); c.lineWidth=1; c.strokeRect(4,-22,4,3.6);
  } else if(k==='nurse'){
    c.fillStyle=p.cloth2; c.fillRect(-9.2,-19,18.4,2.4);
    c.strokeStyle=dk(p.cloth2,.2); c.lineWidth=1; c.beginPath(); c.arc(0,-35,4,.15*PI,.85*PI); c.stroke();
  } else if(k==='dress'){
    c.strokeStyle=lt(of.top,.5); c.lineWidth=1.1; c.beginPath(); c.arc(0,-35.4,4.6,.12*PI,.88*PI); c.stroke();
    c.fillStyle=dk(of.top,.28); c.fillRect(-9.2,-19.6,18.4,2.6);
    c.fillStyle=lt(of.top,.7); ell(c,3.5,-18.3,2.4,1.6); c.fill(); c.strokeStyle=OL; c.lineWidth=.8; c.stroke();
  } else if(k==='apron'){
    c.fillStyle='#fffaf0'; c.beginPath(); c.moveTo(-5.4,-30); c.lineTo(5.4,-30); c.lineTo(6.2,-17); c.lineTo(-6.2,-17); c.closePath(); c.fill(); c.strokeStyle=OL; c.lineWidth=1; c.stroke();
    c.strokeStyle='#e8dcc2'; c.lineWidth=1; line(c,-4.8,-30,-7,-34.4); line(c,4.8,-30,7,-34.4);
    c.strokeRect(-2.6,-25,5.2,3.6);
  } else if(k==='cardigan'){
    c.fillStyle='#f4ecde'; c.beginPath(); c.moveTo(-3.6,-34.6); c.lineTo(0,-26); c.lineTo(3.6,-34.6); c.closePath(); c.fill();
    c.strokeStyle=dk(of.top,.35); c.lineWidth=1.1; line(c,0,-26,0,-15.5);
    c.fillStyle=lt(of.top,.55); [-23.5,-19.8].forEach(y=>{ ell(c,1.7,y,.9,.9); c.fill(); });
  } else if(k==='vest'){
    c.save(); torsoPath(c); c.clip(); c.fillStyle='#f1ebdf'; c.fillRect(-12,-36,24,24); c.restore();
    c.fillStyle=of.top; c.beginPath(); c.moveTo(-9.8,-33); c.lineTo(-2.8,-33.5); c.lineTo(0,-22); c.lineTo(-.6,-15); c.lineTo(-9.3,-15); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(9.8,-33); c.lineTo(2.8,-33.5); c.lineTo(0,-22); c.lineTo(.6,-15); c.lineTo(9.3,-15); c.closePath(); c.fill();
    torsoPath(c); c.strokeStyle=OL; c.lineWidth=1.6; c.stroke();
    c.fillStyle=lt(of.top,.4); [-20,-17].forEach(y=>{ ell(c,-1.8,y,.8,.8); c.fill(); });
  } else if(k==='robe' || k==='tunic'){
    c.fillStyle='#e9c46a'; c.beginPath(); c.moveTo(-8,-34.5); c.lineTo(-4.8,-34.8); c.lineTo(9.2,-17.5); c.lineTo(6.6,-15.8); c.closePath(); c.fill();
    c.strokeStyle=dk('#e9c46a',.35); c.lineWidth=.9; c.stroke();
    c.fillStyle='#d9a94a'; c.fillRect(-9.2,-18.4,18.4,2.2);
    ell(c,-6.4,-33.4,1.9,1.9); c.fillStyle='#fff3c4'; c.fill(); c.strokeStyle=OL; c.lineWidth=.8; c.stroke();
  }
}
function skirt(c, of, sway){
  if(!of.skirt) return;
  const hem = of.long ? -2.2 : of.kind==='tunic' ? -10 : -7;
  const flare = of.long ? 13.5 : 12.5;
  c.beginPath(); c.moveTo(-9,-19.4); c.lineTo(9,-19.4);
  c.quadraticCurveTo(flare-1,-12, flare+sway, hem);
  c.quadraticCurveTo(6+sway*.5, hem+1.6, 0, hem+.6);
  c.quadraticCurveTo(-6+sway*.5, hem+1.6, -flare+sway, hem);
  c.quadraticCurveTo(-flare+1,-12,-9,-19.4); c.closePath();
  c.fillStyle=vgrad(c,-20,hem,lt(of.skirt,.12),dk(of.skirt,.12)); c.fill(); c.lineWidth=1.5; c.strokeStyle=OL; c.stroke();
  c.strokeStyle=dk(of.skirt,.22); c.lineWidth=.9;
  line(c,-3.5,-17,-5+sway*.6,hem-.4); line(c,3.8,-17,5.2+sway*.6,hem-.4);
  if(of.kind==='robe'||of.kind==='tunic'){ c.strokeStyle='#e0b95c'; c.lineWidth=1.5; c.beginPath(); c.moveTo(-flare+sway+1,hem-1.4); c.quadraticCurveTo(0,hem+.2,flare+sway-1,hem-1.4); c.stroke(); }
  if(of.kind==='apron'){ c.fillStyle='#fffaf0'; c.beginPath(); c.moveTo(-6.2,-17.5); c.lineTo(6.2,-17.5); c.lineTo(7.4+sway*.5,hem+.2); c.lineTo(-7.4+sway*.5,hem+.2); c.closePath(); c.fill(); c.strokeStyle=OL; c.lineWidth=1; c.stroke(); }
}

/* ---------- 머리카락 ---------- */
function hairFill(c, p){ return vgrad(c,-74,-38,lt(p.hair,.22),dk(p.hair,.08)); }
function hairBack(c, p, t, walkSway){
  const s=p.hairStyle||'short', H=dk(p.hair,.14);
  c.lineJoin='round';
  if(s==='long'){
    c.beginPath(); c.moveTo(-14,-64); c.quadraticCurveTo(-23,-44,-19,-23+walkSway); c.quadraticCurveTo(-14,-19,-9,-22);
    c.lineTo(-6,-30); c.lineTo(10,-31); c.quadraticCurveTo(15,-26,19,-28); c.quadraticCurveTo(20,-46,15,-64); c.closePath();
    fs(c, vgrad(c,-64,-20,H,dk(p.hair,.3)), 1.6);
    c.strokeStyle=dk(p.hair,.35); c.lineWidth=.9; line(c,-15,-46,-16,-27); line(c,-10,-40,-11,-24);
  } else if(s==='bun'){
    ell(c,-10.5,-66.5,7.2,7); fs(c, hairFill(c,p), 1.6);
    c.strokeStyle=lt(p.hair,.35); c.lineWidth=1.1; c.beginPath(); c.arc(-10.5,-66.5,4.4,1.1*PI,1.7*PI); c.stroke();
  } else if(s==='pony'){
    c.save(); c.translate(-14,-59); c.rotate(.42+Math.sin(t*.12)*.12+walkSway*.03);
    c.beginPath(); c.moveTo(-3,0); c.quadraticCurveTo(-9,12,-4,25); c.quadraticCurveTo(1,19,3.8,11); c.quadraticCurveTo(4.5,4,3,0); c.closePath();
    fs(c, vgrad(c,0,25,p.hair,dk(p.hair,.25)), 1.5);
    c.fillStyle='#e0607a'; c.fillRect(-3.4,-1.2,6.6,2.8); c.restore();
  } else {
    c.beginPath(); c.moveTo(-15.5,-44); c.quadraticCurveTo(-19.5,-56,-12,-65); c.lineTo(-4,-60); c.lineTo(-11,-41); c.closePath();
    fs(c, H, 1.5);
  }
}
function hairFront(c, p){
  const s=p.hairStyle||'short';
  c.lineJoin='round';
  c.beginPath();
  if(s==='long'||s==='bun'||s==='pony'){
    const low = s==='long' ? -36 : -45;
    c.moveTo(-16,-42);
    c.quadraticCurveTo(-19.5,-61,-9,-67);
    c.quadraticCurveTo(3,-73.5,13.4,-66);
    c.quadraticCurveTo(19.5,-58,18.4,-46);
    c.quadraticCurveTo(18,low+3,16,low);
    c.quadraticCurveTo(14.4,-45,13.8,-51);
    c.quadraticCurveTo(10,-51.5,6.2,-57);
    c.quadraticCurveTo(1.5,-51,-4,-56);
    c.quadraticCurveTo(-8.5,-52.5,-11.6,-51.5);
    c.quadraticCurveTo(-12.6,-46,-13.4,low+4);
    c.closePath();
  } else if(s==='curly'){
    c.moveTo(-15.5,-45);
    c.quadraticCurveTo(-19,-61,-9,-67); c.quadraticCurveTo(2,-73,13,-66); c.quadraticCurveTo(19,-59,17.3,-50);
    c.lineTo(14,-53); c.lineTo(10,-50.5); c.lineTo(7,-55); c.lineTo(3,-52); c.lineTo(-.5,-56); c.lineTo(-5,-53); c.lineTo(-9,-56); c.lineTo(-12,-50);
    c.closePath();
  } else {
    c.moveTo(-15.6,-45);
    c.quadraticCurveTo(-19,-61,-9,-67);
    c.quadraticCurveTo(2,-73,12.8,-66);
    c.quadraticCurveTo(18.8,-60,17.3,-49);
    c.lineTo(15.4,-52.6); c.lineTo(13.3,-50.2); c.lineTo(11.4,-55.3); c.lineTo(8,-52.4); c.lineTo(6,-56.8);
    c.lineTo(2.2,-53.6); c.lineTo(0,-57.8); c.lineTo(-3.8,-55); c.lineTo(-6.2,-58.6); c.lineTo(-9.6,-54.6);
    c.lineTo(-11.9,-51.2); c.lineTo(-12.9,-46);
    c.closePath();
  }
  fs(c, hairFill(c,p), 1.6);
  if(s==='curly'){
    [[-13,-60],[-7,-66],[0,-69],[7,-68],[13,-63],[16,-56],[-15,-52]].forEach(([x,y])=>{ ell(c,x,y,4.4,4.2); fs(c, hairFill(c,p), 1.3); });
  }
  // 윤기
  c.strokeStyle=lt(p.hair,.5); c.lineWidth=1.7; c.lineCap='round';
  c.beginPath(); c.moveTo(-9,-63.5); c.quadraticCurveTo(-1,-68.5,8,-65); c.stroke();
  c.strokeStyle=lt(p.hair,.3); c.lineWidth=1; c.beginPath(); c.moveTo(-5,-61.3); c.quadraticCurveTo(0,-63.6,4.5,-62.5); c.stroke();
}
function backHead(c, p){
  ell(c,-15,-50,2.6,3.5); fs(c,p.skin,1.2); ell(c,17,-50,2.6,3.5); fs(c,p.skin,1.2);
  ell(c,1,-52,16.4,16.2); fs(c, hairFill(c,p), 1.6);
  c.strokeStyle=lt(p.hair,.45); c.lineWidth=1.5; c.beginPath(); c.arc(1,-54,10,1.15*PI,1.75*PI); c.stroke();
  if(p.hairStyle==='bun'){ ell(c,1,-66,6.6,6.2); fs(c, hairFill(c,p), 1.5); }
  if(p.hairStyle==='long'){ c.beginPath(); c.moveTo(-15,-52); c.quadraticCurveTo(-17,-32,-12,-24); c.lineTo(14,-24); c.quadraticCurveTo(19,-32,17,-52); c.closePath(); fs(c, hairFill(c,p), 1.5); }
}

/* ---------- 얼굴 ---------- */
function eye(c, x, y, w, h, p, near, fem, mode){
  c.lineCap='round';
  if(mode==='blink' || mode==='smile'){
    c.strokeStyle=OL; c.lineWidth=1.8; c.beginPath();
    if(mode==='smile'){ c.moveTo(x-w,y+1); c.quadraticCurveTo(x,y-h*.7,x+w,y+1); }
    else { c.moveTo(x-w,y+.6); c.quadraticCurveTo(x,y+2.1,x+w,y+.6); }
    c.stroke(); return;
  }
  ell(c,x,y,w,h); c.fillStyle='#ffffff'; c.fill();
  const ix=x+(near?.55:.35);
  ell(c,ix,y+.5,w*.8,h*.86); c.fillStyle=vgrad(c,y-h,y+h,dk(p.eye,.6),lt(p.eye,.3)); c.fill();
  ell(c,ix,y+.8,w*.36,h*.4); c.fillStyle=dk(p.eye,.8); c.fill();
  c.fillStyle='#ffffff'; ell(c,ix-w*.32,y-h*.36,w*.34,h*.25); c.fill(); ell(c,ix+w*.32,y+h*.42,w*.17,h*.12); c.fill();
  c.strokeStyle=OL; c.lineWidth=2; c.beginPath(); c.moveTo(x-w*1.08,y-h*.22); c.quadraticCurveTo(x-w*.2,y-h*1.25,x+w*1.12,y-h*.42); c.stroke();
  if(fem){ c.lineWidth=1.3; line(c,x+w*1.02,y-h*.44,x+w*1.62,y-h*.78); if(near) line(c,x+w*.62,y-h*.86,x+w*1.02,y-h*1.2); }
  c.strokeStyle='rgba(58,37,48,.32)'; c.lineWidth=.9; c.beginPath(); c.moveTo(x-w*.55,y+h*.98); c.quadraticCurveTo(x,y+h*1.13,x+w*.55,y+h*.98); c.stroke();
}
function face(c, p, o){
  const fem=!!p.fem, eyes=p.eyes||'normal';
  const blink = o.t>0 && (Math.floor(((o.t||0)+(o.seed||0)*13)/7)%34)===33;
  const mode = eyes==='smile' ? 'smile' : o.hurt ? 'hurt' : blink ? 'blink' : 'open';
  // 볼터치
  let g=c.createRadialGradient(-5.8,-43.6,0,-5.8,-43.6,4); g.addColorStop(0,'rgba(255,120,150,.42)'); g.addColorStop(1,'rgba(255,120,150,0)'); c.fillStyle=g; ell(c,-5.8,-43.2,4.2,3); c.fill();
  g=c.createRadialGradient(11.2,-43.6,0,11.2,-43.6,3.6); g.addColorStop(0,'rgba(255,120,150,.42)'); g.addColorStop(1,'rgba(255,120,150,0)'); c.fillStyle=g; ell(c,11.2,-43.6,3.8,2.8); c.fill();
  if(mode==='hurt'){
    c.strokeStyle=OL; c.lineWidth=1.7; c.lineCap='round';
    [[-3.2,-49.5],[7,-49.5]].forEach(([x,y])=>{ c.beginPath(); c.moveTo(x-2.4,y-2.2); c.lineTo(x+1.6,y); c.lineTo(x-2.4,y+2.2); c.stroke(); });
  } else {
    eye(c,-3.6,-48.8,3.25,5.1,p,false,fem,mode);
    eye(c, 7.2,-48.8,3.7, 5.5,p,true, fem,mode);
  }
  // 눈썹
  c.strokeStyle=dk(p.hair,.25); c.lineWidth=1.3; c.lineCap='round';
  const bw = eyes==='smile' ? .8 : 0;
  c.beginPath(); c.moveTo(4.2,-56.8+bw); c.quadraticCurveTo(7.2,-58.2+bw,10.6,-56.9+bw); c.stroke();
  c.beginPath(); c.moveTo(-6.4,-56.4+bw); c.quadraticCurveTo(-3.6,-57.6+bw,-.9,-56.9+bw); c.stroke();
  if(p.old){ c.strokeStyle='rgba(120,70,60,.35)'; c.lineWidth=.8; line(c,12.2,-47,13.6,-45.8); line(c,-7.8,-47,-9,-45.8); }
  // 코
  c.fillStyle=dk(p.skin,.22); ell(c,5.4,-44.2,.8,.55); c.fill();
  // 입
  if(o.hurt){ ell(c,3.6,-40.8,1.6,1.2); c.fillStyle='#8c3f4a'; c.fill(); }
  else if(p.mouth==='open' || o.talk){
    c.beginPath(); c.moveTo(1.4,-41.6); c.quadraticCurveTo(3.9,-41,6.4,-41.6); c.quadraticCurveTo(3.9,-37.6,1.4,-41.6); c.closePath();
    c.fillStyle='#b8475a'; c.fill(); c.strokeStyle=OL; c.lineWidth=.9; c.stroke();
    ell(c,3.9,-39.6,1.2,.7); c.fillStyle='#ff9aa8'; c.fill();
  } else { c.strokeStyle='#9a4452'; c.lineWidth=1.3; c.beginPath(); c.moveTo(2,-41.4); c.quadraticCurveTo(3.9,-39.9,5.8,-41.4); c.stroke(); }
}
function head(c, p, o){
  ell(c,-14.3,-48.4,2.7,3.7); fs(c,p.skin,1.3);
  ell(c,-14.2,-48.3,1.1,2); c.fillStyle=dk(p.skin,.2); c.fill();
  c.fillStyle=p.skin; c.fillRect(-3,-38,6,4.6);
  ell(c,1,-51,15.6,14.9); fs(c,p.skin,1.6);
  c.save(); ell(c,1,-51,15.6,14.9); c.clip();
  c.fillStyle=dk(p.skin,.12); c.globalAlpha=.6; ell(c,1,-66,18,9.5); c.fill();
  c.globalAlpha=.35; ell(c,-12,-46,5,10); c.fill();
  c.restore(); c.globalAlpha=1;
  face(c,p,o);
}

/* ---------- 모자 · 장비 ---------- */
function hat(c, kind){
  if(kind==='chef'){
    c.beginPath(); c.moveTo(-9,-66); c.lineTo(11,-66); c.lineTo(11,-71); c.lineTo(-9,-71); c.closePath(); fs(c,'#ffffff',1.4);
    [[-5,-76,7],[3.5,-79.5,8.2],[9.5,-74.5,6]].forEach(([x,y,r])=>{ ell(c,x,y,r,r); fs(c,'#ffffff',1.4); });
    c.fillStyle='#ffffff'; c.fillRect(-8.4,-73,18.8,4);
    c.strokeStyle='#e5e1da'; c.lineWidth=1; line(c,-8.5,-68.4,10.5,-68.4);
  } else if(kind==='nurse'){
    c.beginPath(); c.moveTo(-7,-64.5); c.lineTo(10.5,-64.5); c.lineTo(8.5,-71); c.lineTo(-5,-71); c.closePath(); fs(c,'#ffffff',1.3);
    c.fillStyle='#e0607a'; c.fillRect(1,-70,2.6,4.6); c.fillRect(-.1,-68.9,4.8,2.4);
  } else if(kind==='laurel'){
    c.lineWidth=1.8; c.strokeStyle='#a88230'; c.beginPath(); c.ellipse(1,-60.5,16.4,4.4,0,.05*PI,.95*PI,true); c.stroke();
    for(let i=0;i<9;i++){
      const a=PI*(1.05+i*.1), x=1+Math.cos(a)*16.4, y=-60.5+Math.sin(a)*4.4;
      c.save(); c.translate(x,y); c.rotate(a+PI/2+(i<4?-.5:.5));
      ell(c,0,-3,1.8,3.6); c.fillStyle=i%2?'#f2d072':'#dcb04a'; c.fill(); c.strokeStyle='#8a6420'; c.lineWidth=.8; c.stroke();
      c.restore();
    }
    ell(c,15.5,-59.5,1.8,1.8); c.fillStyle='#fff3c4'; c.fill();
  } else if(kind==='halo'){
    c.lineWidth=2.6; c.strokeStyle='rgba(255,226,140,.95)'; c.beginPath(); c.ellipse(1,-78,11,3.2,0,0,PI*2); c.stroke();
    c.lineWidth=1; c.strokeStyle='#fff8dc'; c.stroke();
  }
}
function cape(c, t, walk){
  const w=Math.sin(t*.18)*1.4+walk*2;
  c.beginPath(); c.moveTo(-8,-34); c.lineTo(8.5,-34);
  c.quadraticCurveTo(10,-20,6+w*.5,-6); c.quadraticCurveTo(0,-4.2+w*.4,-6,-5.6+w*.3);
  c.quadraticCurveTo(-13-w,-5+w*.4,-17-w,-7.4); c.quadraticCurveTo(-12,-22,-8,-34); c.closePath();
  fs(c, vgrad(c,-34,-6,'#6c4ca8','#2f2152'), 1.6);
  c.strokeStyle='rgba(190,160,255,.45)'; c.lineWidth=1; line(c,-6,-30,-12-w*.6,-9); line(c,1,-30,-1+w*.3,-7);
}
function clasp(c){ ell(c,5.5,-33.4,2,2); c.fillStyle='#f2d072'; c.fill(); c.strokeStyle=OL; c.lineWidth=.9; c.stroke(); }
function bow(c, hx, hy, aim){
  const R=11.5, a=1.08, cx=hx-5.6;
  c.lineCap='round';
  c.strokeStyle=OL; c.lineWidth=4.6; c.beginPath(); c.arc(cx,hy,R,-a,a); c.stroke();
  c.strokeStyle='#e8bf5f'; c.lineWidth=2.7; c.stroke();
  c.strokeStyle='#fff2c2'; c.lineWidth=.9; c.beginPath(); c.arc(cx,hy,R,-a*.8,-a*.2); c.stroke();
  const ex=cx+R*Math.cos(a), ey=R*Math.sin(a), pull=aim>6 ? -9.5 : -2.5;
  c.strokeStyle='rgba(255,252,240,.95)'; c.lineWidth=1; c.beginPath(); c.moveTo(ex,hy-ey); c.lineTo(hx+pull,hy); c.lineTo(ex,hy+ey); c.stroke();
  ell(c,ex,hy-ey,1.5,1.5); c.fillStyle='#ff8fb1'; c.fill(); ell(c,ex,hy+ey,1.5,1.5); c.fill();
  if(aim>6){
    c.strokeStyle='#f0d69a'; c.lineWidth=1.7; line(c,hx+pull,hy,hx+13,hy);
    c.fillStyle='#ff6f9f'; c.beginPath(); c.moveTo(hx+17,hy); c.bezierCurveTo(hx+14,hy-3.4,hx+11.5,hy-.8,hx+13.6,hy); c.bezierCurveTo(hx+11.5,hy+.8,hx+14,hy+3.4,hx+17,hy); c.fill();
  }
  c.fillStyle='#ff8fb1'; c.fillRect(hx-1.6,hy-2.4,3.2,4.8);
}
function wings(c, t, x){
  const fl=Math.sin(t*.22+x)*.3;
  [[-0.12,.82,'#efe6ff'],[0.12,1,'#ffffff']].forEach(([off,sc,col])=>{
    c.save(); c.translate(-4,-30); c.rotate(-.35+off-fl); c.scale(sc,sc);
    c.beginPath(); c.moveTo(0,0); c.bezierCurveTo(-10,-27,-36,-30,-40,-15); c.bezierCurveTo(-31,-13,-33,-5,-23,-2.5); c.bezierCurveTo(-21,3,-11,6,0,4); c.closePath();
    c.fillStyle=vgrad(c,-28,4,col,'#dcd0f4'); c.fill(); c.lineWidth=1.6; c.strokeStyle=OL; c.stroke();
    c.strokeStyle='rgba(140,120,190,.55)'; c.lineWidth=1; line(c,-8,-6,-30,-15); line(c,-6,-1,-24,-4.5); line(c,-10,-12,-26,-22);
    c.restore();
  });
}

/* ---------- 전체 ---------- */
function height(p){ return (p.hat==='chef'?86 : p.hat==='nurse'?76 : 73) + (p.float?20:0); }
function draw(c, x, footY, p, o={}, S=1){
  const t=o.t||0, of=outfitOf(p);
  const moving=!!o.moving, air=!!o.air, climb=!!o.climb, aim=o.aim||0;
  const gear=o.gear||{};
  const ph=t*.32, sw=moving?Math.sin(ph):0;
  const bob = moving ? Math.abs(Math.sin(ph))*1.8 : Math.sin(t*.05+x)*.6;
  const lift = p.float ? 16+Math.sin(t*.07+x)*4 : 0;
  // 그림자
  c.fillStyle='rgba(0,0,0,.22)'; ell(c,x,footY+1,(p.float?11:14)*S,4.2*S); c.fill();
  c.save(); c.translate(x, footY-(climb?0:bob)-lift); c.scale((o.facingRight===false?-1:1)*S, S);
  c.lineJoin='round';
  if(p.glow){ const g=c.createRadialGradient(0,-40,4,0,-40,58); g.addColorStop(0,'rgba(255,244,210,.7)'); g.addColorStop(1,'rgba(255,244,210,0)'); c.fillStyle=g; ell(c,0,-40,58,58); c.fill(); }
  const P2={...p};
  if(gear.shoes==='heart_shoes'){ of.shoe='#ff8fb1'; }
  if(climb){
    const k=Math.sin((o.climbY||0)*.18);
    if(gear.clothes==='aidos_cloak') cape(c,t,0);
    leg(c,-3.4,-15,-3.6,-1+k*3,of.bare?p.skin:of.pants,of.shoe);
    leg(c, 3.4,-15, 3.6,-1-k*3,of.bare?p.skin:of.pants,of.shoe);
    skirt(c,of,0);
    torsoPath(c); fs(c,of.top,1.6); shadeTorso(c);
    arm(c,-7,-31,-3,-60+k*4,of.sleeve,p.skin);
    arm(c, 7,-31, 3,-62-k*4,of.sleeve,p.skin);
    backHead(c,P2);
    if(gear.hat==='laurel'||p.hat==='laurel') hat(c,'laurel');
    c.restore(); return;
  }
  if(p.wings) wings(c,t,x);
  if(gear.clothes==='aidos_cloak') cape(c,t,sw);
  hairBack(c,P2,t,sw);
  // 뒷팔
  let bhx=-8.6-sw*4.6, bhy=-19.2+Math.abs(sw)*.6;
  if(air){ bhx=-12.5; bhy=-36; }
  if(!(aim>0 && gear.weapon)) arm(c,-7,-31,bhx,bhy,dk(of.sleeve,.1),p.skin);
  // 다리
  const legCol=of.bare?p.skin:of.pants;
  let bf=[-3.6-sw*4.6, -Math.max(0,-Math.cos(ph))*1.8*(moving?1:0)], ff=[3.2+sw*4.6, -Math.max(0,Math.cos(ph))*1.8*(moving?1:0)];
  if(air){ bf=[-5.2,-1.2]; ff=[6.2,-6]; }
  if(!of.long){ leg(c,-3.3,-15,bf[0],bf[1],dk(legCol,.08),dk(of.shoe,.08)); leg(c,3.1,-15,ff[0],ff[1],legCol,of.shoe); }
  else { leg(c,-3.3,-12,bf[0]*.6,bf[1],p.skin,of.shoe); leg(c,3.1,-12,ff[0]*.6,ff[1],p.skin,of.shoe); }
  torso(c,P2,of);
  skirt(c,of,-sw*1.2);
  if(gear.clothes==='aidos_cloak') clasp(c);
  // 앞팔 (+활)
  if(gear.weapon){
    let hx=8.8+sw*4.6, hy=-19.4;
    if(air){ hx=13; hy=-30; }
    if(aim>0){ hx=18.5; hy=-31; }
    if(aim>0) arm(c,-5.5,-31,aim>6?9:13,-31,of.sleeve,p.skin);
    arm(c,7,-31,hx,hy,of.sleeve,p.skin);
    bow(c,hx,hy,aim);
  } else {
    let hx=8.7+sw*4.6, hy=-19.2+Math.abs(sw)*.6;
    if(air){ hx=13.5; hy=-37; }
    arm(c,7,-31,hx,hy,of.sleeve,p.skin);
  }
  head(c,P2,o);
  hairFront(c,P2);
  if(p.hat) hat(c,p.hat);
  if(gear.hat==='laurel') hat(c,'laurel');
  if(p.halo) hat(c,'halo');
  c.restore();
}

/* ---------- 몬스터 ---------- */
function mob(c, look, t, flash, moving, hurt){
  c.lineJoin='round'; c.lineCap='round';
  if(look==='cloud'){
    const b=Math.sin(t*.08)*2.4-9, sq=moving?Math.sin(t*.3)*.05:0;
    c.save(); c.translate(0,b); c.scale(1+sq,1-sq);
    const body=()=>{ c.beginPath(); c.arc(-12.5,-15,12.5,PI*.55,PI*1.62); c.arc(1.5,-23.5,15.5,PI*1.12,PI*1.93); c.arc(14.5,-14,11.5,PI*1.4,PI*.45); c.quadraticCurveTo(1,-1,-12.5,-2.6); c.closePath(); };
    body(); c.fillStyle=flash?'#ffffff':vgrad(c,-39,-2,'#fdfbff','#b4a8d8'); c.fill(); c.lineWidth=1.9; c.strokeStyle='#4a3a6a'; c.stroke();
    c.save(); body(); c.clip();
    c.fillStyle='rgba(255,255,255,.75)'; ell(c,-4,-33,9,4.5,-.2); c.fill(); ell(c,-15,-22,4,2.4,-.5); c.fill();
    c.fillStyle='rgba(120,100,170,.22)'; ell(c,2,-3,22,5); c.fill();
    c.restore();
    // 얼굴
    const ey=-16;
    if(hurt){ c.strokeStyle='#3a2a55'; c.lineWidth=1.7; [[0,ey],[10,ey]].forEach(([x,y])=>{ c.beginPath(); c.moveTo(x-2.2,y-2); c.lineTo(x+1.6,y); c.lineTo(x-2.2,y+2); c.stroke(); }); }
    else {
      [[0,ey],[10.5,ey]].forEach(([x,y],i)=>{ ell(c,x,y,2.6,3.4); c.fillStyle='#2e2244'; c.fill(); c.fillStyle='#fff'; ell(c,x-.8,y-1.3,1,1.1); c.fill(); ell(c,x+.8,y+1.1,.45,.45); c.fill(); });
      c.strokeStyle='#3a2a55'; c.lineWidth=1.4; line(c,-3,ey-6,1.6,ey-4.6); line(c,13.4,ey-6,8.8,ey-4.6);
    }
    c.strokeStyle='#3a2a55'; c.lineWidth=1.2; c.beginPath(); c.moveTo(2.6,ey+6); c.quadraticCurveTo(4.2,ey+4.6,5.4,ey+6); c.quadraticCurveTo(6.6,ey+7.2,8,ey+6); c.stroke();
    c.fillStyle='rgba(255,140,170,.4)'; ell(c,-4.2,ey+4,2.8,1.7); c.fill(); ell(c,14.4,ey+4,2.4,1.6); c.fill();
    if(t%150<90){ const dy=(t%150)*.06; c.fillStyle='rgba(150,205,255,.95)'; c.beginPath(); c.moveTo(19,-30+dy); c.quadraticCurveTo(23,-24+dy,19,-22.6+dy); c.quadraticCurveTo(15,-24+dy,19,-30+dy); c.fill(); c.strokeStyle='#4a6a9a'; c.lineWidth=.8; c.stroke(); }
    c.restore();
  } else {
    const b=Math.sin(t*.1)*2, w=moving?Math.sin(t*.25)*2.2:Math.sin(t*.12)*1.2;
    const aura=c.createRadialGradient(1,-28,4,1,-28,34); aura.addColorStop(0,'rgba(170,140,255,.28)'); aura.addColorStop(1,'rgba(170,140,255,0)');
    c.fillStyle=aura; ell(c,1,-28,34,32); c.fill();
    c.beginPath(); c.moveTo(-15.5,-1);
    c.bezierCurveTo(-20,-24+b,-14,-48+b,1,-49+b); c.bezierCurveTo(16,-48+b,21,-24+b,16.5,-1);
    for(let i=0;i<4;i++){ const xx=16.5-i*8; c.quadraticCurveTo(xx-4, 5+(i%2?w:-w), xx-8, -1); }
    c.closePath();
    c.fillStyle=flash?'#ffffff':vgrad(c,-49,4,'#7a62c0','#2a1f4c'); c.globalAlpha*=.96; c.fill(); c.globalAlpha/=.96;
    c.lineWidth=1.9; c.strokeStyle='#1c1230'; c.stroke();
    c.fillStyle='rgba(255,255,255,.22)'; ell(c,-6,-38+b,5,8,-.4); c.fill();
    // 눈 (빼꼼)
    const ey=-31+b;
    if(hurt){ c.strokeStyle='#ffd8f4'; c.lineWidth=1.7; [[0,ey],[10,ey]].forEach(([x,y])=>{ c.beginPath(); c.moveTo(x-2.2,y-2); c.lineTo(x+1.6,y); c.lineTo(x-2.2,y+2); c.stroke(); }); }
    else [[0.5,ey],[10.5,ey]].forEach(([x,y])=>{ const g=c.createRadialGradient(x,y,0,x,y,5); g.addColorStop(0,'rgba(255,190,240,.6)'); g.addColorStop(1,'rgba(255,190,240,0)'); c.fillStyle=g; ell(c,x,y,5,5); c.fill(); ell(c,x,y,2.5,3.4); c.fillStyle='#ffe4f8'; c.fill(); ell(c,x+.4,y+.4,1.2,1.7); c.fillStyle='#6a2a7a'; c.fill(); c.fillStyle='#fff'; ell(c,x-.6,y-1.2,.7,.8); c.fill(); });
    // 볼을 가린 두 손 (수줍음)
    c.fillStyle='rgba(255,130,190,.6)'; ell(c,-3.8,-24.5+b,3.4,2); c.fill(); ell(c,14.6,-24.5+b,3,1.8); c.fill();
    [[-5.6,-22.4+b],[16.2,-22.6+b]].forEach(([x,y])=>{ ell(c,x,y,3.6,3.1); c.fillStyle=flash?'#fff':'#8d76d0'; c.fill(); c.strokeStyle='#1c1230'; c.lineWidth=1.3; c.stroke(); });
  }
}

return { draw, height, mob, lt, dk };
})();

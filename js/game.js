/* ============================================================
   ODYSSEIA 게임 엔진 (이야기 데이터는 js/story.js)
   ============================================================ */
(function(){
'use strict';
const $ = id => document.getElementById(id);

/* ---------------- 저장 ---------------- */
const SAVE_KEY = 'ian_odysseia_save_v2';
let save = { talked:{}, cleared:[], muted:false };
try{ const s = JSON.parse(localStorage.getItem(SAVE_KEY)||'null'); if(s) save = Object.assign(save, s); }catch(e){}
function persist(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(save)); }catch(e){} }

/* ---------------- 공통 ---------------- */
const BG_IMAGES = { outdoor:'images/bg_outdoor.webp', indoor:'images/bg_indoor.webp', jokbal:'images/chapter1_bg.webp' };
const VH = 400;                 // 논리 화면 높이 (가로폭은 화면 비율에 맞춰 변함)
let VW = 720;
const FIELD_GROUND_Y = 336;
const CH_SCALE = 1.22;          // 필드 캐릭터 크기

function escapeHtml(s){ return s.replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function toast(msg, ms=2000){ const t=$('toast'); t.textContent=msg; t.style.opacity=1; clearTimeout(toast._t); toast._t=setTimeout(()=>t.style.opacity=0, ms); }
function showScreen(id){ document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('active', s.id===id)); }
function isPortrait(){ return window.innerHeight > window.innerWidth; }

$('dday').textContent = (()=>{ const d=Math.floor((Date.now()-new Date(BIRTH.date+'T00:00:00+09:00').getTime())/86400000); return d>=0?d:0; })();
$('birthTitle').textContent = BIRTH.title;
$('birthBody').textContent = BIRTH.body;
$('birthBtn').textContent = BIRTH.button;

(function initStars(){
  const scr = $('screen-title');
  for(let i=0;i<50;i++){
    const s=document.createElement('div'); s.className='star';
    const size=1+Math.random()*2;
    s.style.cssText=`width:${size}px;height:${size}px;left:${Math.random()*100}%;top:${Math.random()*100}%;animation-delay:${Math.random()*3}s`;
    scr.appendChild(s);
  }
})();

/* ---------------- 이미지 미리 불러오기 ---------------- */
(function preload(){
  const list = [...new Set([...Object.values(PORTRAITS).map(p=>p.img).filter(Boolean), ...Object.values(BG_IMAGES)])];
  let done=0; const btn=$('startBtn');
  const ready=()=>{ if(btn.disabled){ btn.disabled=false; btn.textContent='📜 서사시를 펼치다'; $('loadbar').style.opacity=0; } };
  list.forEach(src=>{
    const im=new Image();
    im.onload=im.onerror=()=>{ done++; $('loadFill').style.width=(done/list.length*100)+'%'; if(done>=list.length) ready(); };
    im.src=src;
  });
  setTimeout(ready, 9000);
})();

/* ---------------- 사운드 ---------------- */
let audioCtx=null;
function ensureAudio(){ if(!audioCtx){ try{ audioCtx=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } if(audioCtx && audioCtx.state==='suspended') audioCtx.resume(); }
function beep(freq=440, dur=0.1, type='sine', vol=0.2, delay=0){
  if(save.muted || !audioCtx) return;
  const t0=audioCtx.currentTime+delay, o=audioCtx.createOscillator(), g=audioCtx.createGain();
  o.type=type; o.frequency.value=freq; g.gain.value=vol;
  o.connect(g); g.connect(audioCtx.destination);
  o.start(t0); g.gain.exponentialRampToValueAtTime(0.001, t0+dur); o.stop(t0+dur);
}
const sfx = {
  jump:()=>beep(620,0.12,'square',0.12),
  collect:()=>{ beep(880,0.08,'triangle',0.2); beep(1300,0.1,'triangle',0.15,0.08); },
  interact:()=>beep(520,0.09,'sine',0.15),
  clear:()=>[523,659,784,1046].forEach((f,i)=>beep(f,0.18,'triangle',0.2,i*0.13)),
  step:()=>beep(220+Math.random()*30,0.03,'square',0.035),
  hit:()=>beep(160,0.15,'sawtooth',0.1),
  type:()=>beep(1000+Math.random()*200,0.02,'square',0.025),
  tap:()=>beep(700,0.08,'sine',0.14),
  no:()=>beep(300,0.1,'sine',0.12)
};
function syncMute(){ $('muteBtn').textContent = save.muted?'🔇':'🔊'; }
syncMute();
$('muteBtn').addEventListener('click', ()=>{ save.muted=!save.muted; persist(); syncMute(); ensureAudio(); sfx.tap(); });

/* ---------------- 화면 전환 ---------------- */
$('startBtn').addEventListener('click', ()=>{
  ensureAudio(); sfx.tap();
  try{ const el=document.documentElement; if(el.requestFullscreen && /Android/i.test(navigator.userAgent)) el.requestFullscreen().catch(()=>{}); }catch(e){}
  showScreen('screen-map'); renderWorldMap();
});
$('mapBackBtn').addEventListener('click', ()=>showScreen('screen-title'));
$('backToMap').addEventListener('click', backToMap);
function backToMap(){ mode=null; closeDialogueSilently(); showScreen('screen-map'); renderWorldMap(); }

/* ---------------- 여정의 지도 ---------------- */
const MAP_POS = {
  wide:[{x:11,y:74},{x:30,y:36},{x:50,y:68},{x:70,y:32},{x:89,y:62}],
  tall:[{x:28,y:9},{x:72,y:28},{x:28,y:47},{x:72,y:66},{x:36,y:86}]
};
function renderWorldMap(){
  const area=$('worldMapArea'); area.innerHTML='';
  const wide = area.clientWidth >= area.clientHeight;
  const pos = wide ? MAP_POS.wide : MAP_POS.tall;
  for(let i=0;i<4;i++){
    const c=document.createElement('div'); c.className='cloud'; c.textContent='☁️';
    c.style.top=(6+i*22)+'%'; c.style.animationDelay=(-i*7)+'s'; c.style.animationDuration=(28+i*6)+'s';
    area.appendChild(c);
  }
  const svgNS='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(svgNS,'svg'); svg.setAttribute('class','mapSvg'); svg.setAttribute('viewBox','0 0 100 100'); svg.setAttribute('preserveAspectRatio','none');
  const path=document.createElementNS(svgNS,'path');
  path.setAttribute('d','M '+pos.map(p=>`${p.x} ${p.y}`).join(' L '));
  svg.appendChild(path); area.appendChild(svg);
  CHAPTERS.forEach((ch,i)=>{
    const p=pos[i]||{x:50,y:50};
    const cleared = save.cleared.includes(ch.id);
    const node=document.createElement('button');
    node.className='node'+(ch.status==='soon'?' soon':'')+(cleared?' cleared':'');
    node.style.left=p.x+'%'; node.style.top=p.y+'%';
    node.innerHTML=`<div class="node-circle">${ch.icon}${cleared?'<span class="badge">✓</span>':''}</div>`+
      `<div class="node-label">${String(i+1).padStart(2,'0')} · ${escapeHtml(ch.title)}</div>`+
      `<div class="node-sub">${ch.status==='soon'?'곧 노래됩니다':escapeHtml(ch.subtitle)}</div>`;
    node.addEventListener('click', ()=>{
      ensureAudio();
      if(ch.status==='soon'){ sfx.no(); toast('✨ 다음 서사시는 곧 노래됩니다'); return; }
      sfx.tap(); launchChapter(ch);
    });
    area.appendChild(node);
  });
  const playable = CHAPTERS.filter(c=>c.status==='playable');
  $('mapProgress').textContent = `✦ ${playable.filter(c=>save.cleared.includes(c.id)).length}/${playable.length} 완료`;
}

function launchChapter(ch){
  currentChapterId = ch.id;
  showScreen('screen-game');
  requestAnimationFrame(fitStage);
  showChapterIntro(ch, ()=>{
    if(ch.launch==='womb') startWomb(); else startField(ch.launch);
    if(isPortrait() && !sessionStorage.getItem('rotTip')){ sessionStorage.setItem('rotTip','1'); setTimeout(()=>toast('📱 가로로 돌리면 더 넓게 볼 수 있어요', 2600), 600); }
  });
}
function showChapterIntro(ch, cb){
  const el=$('chapterIntro');
  $('ciNum').textContent='CHAPTER '+String(ch.id).padStart(2,'0');
  $('ciTitle').textContent=ch.title;
  $('ciMyth').textContent=ch.myth||ch.subtitle;
  el.querySelectorAll('.ci-ornament,.ci-num,.ci-title,.ci-myth').forEach(n=>{ n.style.animation='none'; void n.offsetWidth; n.style.animation=''; });
  el.style.display='flex';
  let finished=false;
  const finish=()=>{ if(finished) return; finished=true; clearTimeout(timer); el.style.display='none'; el.onclick=null; cb(); };
  const timer=setTimeout(finish, 3500);
  setTimeout(()=>{ el.onclick=finish; }, 400);
}

/* ---------------- 스테이지 크기 (화면 비율 대응 + 선명한 고해상도) ---------------- */
const canvas=$('game'), ctx=canvas.getContext('2d');
const gameWrap=$('gameWrap'), stage=$('stage'), parallaxImg=$('parallaxImg'), ambient=$('ambient');
let stageW=720, stageH=400, panRange=0, curBg={type:'none'};
function fitStage(){
  const r=gameWrap.getBoundingClientRect();
  const aw=r.width-8, ah=r.height-8;
  if(aw<=0||ah<=0) return;
  VW=Math.round(Math.max(440, Math.min(800, VH*aw/ah)));
  const scale=Math.min(aw/VW, ah/VH);
  stageW=Math.floor(VW*scale); stageH=Math.floor(VH*scale);
  stage.style.width=stageW+'px'; stage.style.height=stageH+'px';
  const dpr=Math.min(window.devicePixelRatio||1, 2.5);
  canvas.width=Math.round(stageW*dpr); canvas.height=Math.round(stageH*dpr);
  ctx.setTransform(canvas.width/VW,0,0,canvas.height/VH,0,0);
  sizeParallax();
}
function sizeParallax(){
  if(curBg.type!=='img') return;
  const ar=(parallaxImg.naturalWidth/parallaxImg.naturalHeight)||1.79;
  const h=Math.max(stageH*1.12, stageW*1.06/ar), w=h*ar;
  parallaxImg.style.height=h+'px'; parallaxImg.style.width=w+'px';
  panRange=Math.max(0, w-stageW);
}
function panParallax(frac){
  if(curBg.type!=='img') return;
  const x=-panRange*Math.max(0,Math.min(1,frac));
  parallaxImg.style.transform=`translateX(${x}px)`+(curBg.flip?' scaleX(-1)':'');
}
function setBackground(field){
  const key=field.bg;
  if(!BG_IMAGES[key]){
    curBg={type:key||'none'};
    parallaxImg.style.display='none';
    $('parallaxBg').style.background='transparent';
    ambient.style.backgroundImage = key==='sea' ? 'linear-gradient(#ffc9a8,#8fb6e0 60%,#e8cf9f)' : 'radial-gradient(circle,#c9578f,#3a1235)';
    ambient.style.filter='blur(26px) brightness(.45)';
    return;
  }
  const src=BG_IMAGES[key];
  curBg={type:'img', flip:!!field.flip};
  $('parallaxBg').style.background='#2a2340';
  parallaxImg.style.display='block';
  parallaxImg.style.filter=field.filter||'none';
  if(parallaxImg.getAttribute('src')!==src){
    parallaxImg.style.opacity='0';
    parallaxImg.onload=()=>{ sizeParallax(); parallaxImg.style.opacity='1'; };
    parallaxImg.src=src;
  }
  ambient.style.backgroundImage=`url(${src})`;
  ambient.style.filter=`blur(26px) brightness(.4) saturate(1.2) ${field.filter||''}`;
  sizeParallax();
}
let resizeT=null;
function onResize(){
  clearTimeout(resizeT);
  resizeT=setTimeout(()=>{
    if($('screen-game').classList.contains('active')) fitStage();
    if($('screen-map').classList.contains('active')) renderWorldMap();
  }, 120);
}
window.addEventListener('resize', onResize);
window.addEventListener('orientationchange', ()=>setTimeout(onResize, 250));

/* ---------------- 이펙트 ---------------- */
function shakeScreen(){ stage.classList.remove('shakeFx'); void stage.offsetWidth; stage.classList.add('shakeFx'); }
function screenPulse(){ const el=$('screenFlash'); el.classList.remove('flashPulse'); void el.offsetWidth; el.classList.add('flashPulse'); }
let fx=[], dust=[], petals=[];
function spawnBurst(x,y,color='#ffe27a',count=12){
  for(let i=0;i<count;i++){ const a=Math.random()*Math.PI*2, s=1+Math.random()*3.2; fx.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-1.5,life:30,color}); }
}
function updateFx(){ fx.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.15;p.life--;}); fx=fx.filter(p=>p.life>0); dust.forEach(d=>{d.life--;d.y-=0.3;}); dust=dust.filter(d=>d.life>0); }
function drawFx(camX){
  fx.forEach(p=>{ ctx.globalAlpha=Math.max(0,p.life/30); ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x-camX,p.y,3.2,0,Math.PI*2); ctx.fill(); });
  dust.forEach(d=>{ ctx.globalAlpha=d.life/18*0.45; ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(d.x-camX,d.y,d.r,0,Math.PI*2); ctx.fill(); });
  ctx.globalAlpha=1;
}
let floatT=null;
function spawnFloatMsg(msg){
  const el=$('floatMsg'); el.textContent='✦ '+msg; el.classList.add('show');
  clearTimeout(floatT); floatT=setTimeout(()=>el.classList.remove('show'), 2800);
}

/* ---------------- 입력 (◀ ▶ 버튼 · 드래그 · 키보드) ---------------- */
let btnDir=0, dragDir=0, keyDir=0, mode=null;
function moveDir(){ return btnDir || keyDir || dragDir; }
function bindHold(el, dir){
  const down=e=>{ e.preventDefault(); ensureAudio(); btnDir=dir; el.classList.add('pressed'); try{ el.setPointerCapture(e.pointerId); }catch(_){} };
  const up=()=>{ if(btnDir===dir) btnDir=0; el.classList.remove('pressed'); };
  el.addEventListener('pointerdown', down);
  ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>el.addEventListener(ev, up));
  el.addEventListener('contextmenu', e=>e.preventDefault());
}
bindHold($('btnLeft'), -1);
bindHold($('btnRight'), 1);
const mainBtn=$('mainBtn');
mainBtn.addEventListener('pointerdown', e=>{ e.preventDefault(); ensureAudio(); mainBtn.classList.add('pressed'); pressMain(); });
['pointerup','pointercancel','pointerleave'].forEach(ev=>mainBtn.addEventListener(ev, ()=>mainBtn.classList.remove('pressed')));
mainBtn.addEventListener('contextmenu', e=>e.preventDefault());

let mainState={key:''};
function setMain(key, icon, label, cls){
  if(mainState.key===key) return; mainState.key=key;
  $('mainIcon').textContent=icon; $('mainLabel').textContent=label;
  mainBtn.className='ctl main '+cls;
}
function pressMain(){
  if(dialogueOpen) { advanceDialogue(); return; }
  if(pendingAction){ pendingAction(); return; }
  if(mode==='platform'){ jumpQueued=true; }
}

let drag={active:false,id:null,x0:0,y0:0,jcd:0};
gameWrap.addEventListener('pointerdown', e=>{ ensureAudio(); drag={active:true,id:e.pointerId,x0:e.clientX,y0:e.clientY,jcd:0}; try{ gameWrap.setPointerCapture(e.pointerId); }catch(_){} });
gameWrap.addEventListener('pointermove', e=>{
  if(!drag.active||e.pointerId!==drag.id) return;
  const dx=e.clientX-drag.x0, dy=e.clientY-drag.y0;
  dragDir = dx<-16?-1:dx>16?1:0;
  if(mode==='platform' && dy<-50 && drag.jcd<=0){ jumpQueued=true; drag.jcd=20; }
  if(drag.jcd>0) drag.jcd--;
});
function endDrag(e){ if(e && e.pointerId!==drag.id) return; drag.active=false; dragDir=0; }
['pointerup','pointercancel'].forEach(ev=>gameWrap.addEventListener(ev, endDrag));

window.addEventListener('keydown', e=>{
  const k=e.key.toLowerCase();
  if($('chapterIntro').style.display==='flex'){ $('chapterIntro').onclick && $('chapterIntro').onclick(); return; }
  if(dialogueOpen){ if([' ','enter','arrowdown','arrowright'].includes(k)){ e.preventDefault(); advanceDialogue(); } return; }
  if(k==='arrowleft'||k==='a') keyDir=-1;
  if(k==='arrowright'||k==='d') keyDir=1;
  if(k===' '||k==='enter'||k==='arrowup'||k==='w'){ e.preventDefault(); pressMain(); }
});
window.addEventListener('keyup', e=>{
  const k=e.key.toLowerCase();
  if((k==='arrowleft'||k==='a') && keyDir===-1) keyDir=0;
  if((k==='arrowright'||k==='d') && keyDir===1) keyDir=0;
});

/* ---------------- 대화 시스템 ---------------- */
let dialogueOpen=false, dlgQueue=[], dlgTotal=0, dlgIdx=0, dlgDone=null;
let typing=false, typeTimer=null, segs=[], segLen=0, shown=0;
function parseSegs(text){ const out=[]; text.replace(/《([^》]+)》|([^《]+)/g,(m,em,plain)=>{ out.push({t:em||plain, em:!!em}); return m; }); return out; }
function renderSegs(n){
  let html='', left=n;
  for(const s of segs){ if(left<=0) break; const part=s.t.slice(0,left); left-=part.length; html+= s.em?`<span class="em">${escapeHtml(part)}</span>`:escapeHtml(part); }
  $('dialogueText').innerHTML=html;
}
function showDialogue(lines, onDone){
  dlgQueue=lines.slice(); dlgTotal=lines.length; dlgIdx=0; dlgDone=onDone;
  dialogueOpen=true; $('dialogueOverlay').style.display='flex';
  btnDir=0; dragDir=0; keyDir=0;
  playNextDialogue();
}
function playNextDialogue(){
  if(!dlgQueue.length){ dialogueOpen=false; $('dialogueOverlay').style.display='none'; const cb=dlgDone; dlgDone=null; cb && cb(); return; }
  const line=dlgQueue.shift(); dlgIdx++;
  const p=PORTRAITS[line.speaker]||{emoji:'💬', name:line.speaker, img:''};
  let name=p.name, sub='';
  if(line.label){ if(line.label.includes(p.name)) name=line.label; else sub=line.label; }
  $('speakerName').innerHTML=`<b>${escapeHtml(name)}</b>`+(sub?`<small>${escapeHtml(sub)}</small>`:'');
  $('dialogueCount').textContent = dlgTotal>1 ? `${dlgIdx}/${dlgTotal}` : '';
  const card=$('portraitCard'), img=$('portraitImg'), fb=$('portraitFallback');
  card.style.animation='none'; void card.offsetWidth; card.style.animation='';
  card.classList.remove('breathe');
  card.classList.toggle('glow', line.speaker==='muse'||line.speaker==='grandpa_tribute');
  if(p.img){
    img.style.display='block'; fb.style.display='none'; img.src=p.img;
    img.onerror=()=>{ img.style.display='none'; fb.style.display='flex'; fb.textContent=p.emoji; };
    setTimeout(()=>card.classList.add('breathe'), 500);
  } else { img.style.display='none'; fb.style.display='flex'; fb.textContent=p.emoji; }
  segs=parseSegs(line.text); segLen=segs.reduce((s,x)=>s+x.t.length,0); shown=0;
  $('dialogueBox').scrollTop=0;
  typing=true; clearInterval(typeTimer);
  typeTimer=setInterval(()=>{
    shown+=1; renderSegs(shown); if(shown%3===0) sfx.type();
    if(shown>=segLen){ clearInterval(typeTimer); typing=false; }
  }, 26);
}
function advanceDialogue(){
  if(typing){ clearInterval(typeTimer); typing=false; shown=segLen; renderSegs(shown); }
  else playNextDialogue();
}
function closeDialogueSilently(){ clearInterval(typeTimer); typing=false; dialogueOpen=false; dlgQueue=[]; dlgDone=null; $('dialogueOverlay').style.display='none'; }
$('dialogueOverlay').addEventListener('click', advanceDialogue);

/* ---------------- 캐릭터 그리기 ---------------- */
const OL='rgba(45,28,48,.9)';
function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
function fillStroke(fill, lw=2){ ctx.fillStyle=fill; ctx.fill(); ctx.lineWidth=lw; ctx.strokeStyle=OL; ctx.stroke(); }
function limb(x1,y1,x2,y2,color,w){ ctx.lineCap='round'; ctx.strokeStyle=OL; ctx.lineWidth=w+3; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); ctx.strokeStyle=color; ctx.lineWidth=w; ctx.stroke(); }
function shadow(x,y,rx=15){ ctx.fillStyle='rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(x,y,rx,4.5,0,0,Math.PI*2); ctx.fill(); }

function drawChibi(x, footY, pal, o){
  const t=o.t||0, walk=o.moving?Math.sin(t*0.32):0;
  const bob=o.moving?Math.abs(Math.sin(t*0.32))*2.2:Math.sin(t*0.05+x)*0.8;
  const blink=(Math.floor((t+x)/46)%8===0);
  shadow(x, footY+1, 15*CH_SCALE);
  ctx.save(); ctx.translate(x, footY-bob); ctx.scale(o.facingRight===false?-CH_SCALE:CH_SCALE, CH_SCALE);
  ctx.lineJoin='round';
  if(pal.glow){
    const g=ctx.createRadialGradient(0,-36,4,0,-36,56); g.addColorStop(0,'rgba(255,244,210,.75)'); g.addColorStop(1,'rgba(255,244,210,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,-36,56,0,Math.PI*2); ctx.fill();
  }
  // 뒷머리
  ctx.lineWidth=2;
  if(pal.hairStyle==='long'){ rr(-17,-56,32,40,12); fillStroke(pal.hair); }
  if(pal.hairStyle==='bun'){ ctx.beginPath(); ctx.arc(-11,-60,7.5,0,Math.PI*2); fillStroke(pal.hair); }
  if(pal.hairStyle==='pony'){ ctx.save(); ctx.translate(-16,-48); ctx.rotate(0.5+Math.sin(t*0.1)*0.08); ctx.beginPath(); ctx.ellipse(0,8,6,12,0,0,Math.PI*2); fillStroke(pal.hair); ctx.restore(); }
  // 뒷팔
  limb(-7,-27,-7-walk*5,-15,pal.cloth,5); ctx.fillStyle=pal.skin; ctx.beginPath(); ctx.arc(-7-walk*5,-14,2.8,0,Math.PI*2); ctx.fill();
  // 다리
  const legC = pal.skirt ? pal.skin : pal.cloth2;
  rr(-7+walk*3,-13,6.5,12,3); fillStroke(legC);
  rr(1-walk*3,-13,6.5,12,3); fillStroke(legC);
  ctx.fillStyle='#3a2a2a'; ctx.beginPath(); ctx.ellipse(-3.8+walk*3,-1,4.6,2.4,0,0,Math.PI*2); ctx.ellipse(4.2-walk*3,-1,4.6,2.4,0,0,Math.PI*2); ctx.fill();
  // 몸통
  rr(-10.5,-32,21,20,6); fillStroke(pal.cloth);
  if(pal.skirt){ ctx.beginPath(); ctx.moveTo(-10,-17); ctx.lineTo(10,-17); ctx.lineTo(14,-7); ctx.lineTo(-14,-7); ctx.closePath(); fillStroke(pal.cloth2); }
  else { rr(-10.5,-17,21,6,2); fillStroke(pal.cloth2); }
  if(pal===PALETTES.apron){ rr(-6,-26,12,15,3); fillStroke('#fff8ea',1.5); }
  if(pal===PALETTES.doctor){ ctx.strokeStyle='#8aa6c0'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(0,-31); ctx.lineTo(0,-13); ctx.stroke(); }
  // 앞팔
  limb(7,-27,7+walk*5,-15,pal.cloth,5); ctx.fillStyle=pal.skin; ctx.beginPath(); ctx.arc(7+walk*5,-14,2.8,0,Math.PI*2); ctx.fill();
  // 머리
  ctx.beginPath(); ctx.arc(0,-46,15,0,Math.PI*2); fillStroke(pal.skin);
  // 앞머리
  ctx.beginPath(); ctx.moveTo(-16,-41);
  ctx.bezierCurveTo(-19,-63,18,-68,16.5,-43);
  ctx.lineTo(13,-47); ctx.lineTo(9,-44); ctx.lineTo(4,-49); ctx.lineTo(-2,-45); ctx.lineTo(-7,-49); ctx.lineTo(-12,-45);
  ctx.closePath(); fillStroke(pal.hair);
  if(pal.hat==='chef'){ ctx.beginPath(); ctx.arc(-5,-66,7,0,Math.PI*2); ctx.arc(4,-68,8,0,Math.PI*2); ctx.arc(0,-62,8,0,Math.PI*2); fillStroke('#fff'); rr(-10,-62,20,6,2); fillStroke('#fff'); }
  if(pal.hat==='nurse'){ rr(-8,-64,16,6,2); fillStroke('#fff',1.5); ctx.fillStyle='#e0607a'; ctx.fillRect(-1.2,-63,2.4,4); }
  // 얼굴
  ctx.fillStyle='rgba(255,140,160,.45)'; ctx.beginPath(); ctx.arc(-6,-39,2.8,0,Math.PI*2); ctx.arc(11,-39,2.8,0,Math.PI*2); ctx.fill();
  if(blink){ ctx.strokeStyle='#2d2233'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(-4.5,-43); ctx.lineTo(-0.5,-43); ctx.moveTo(5.5,-43); ctx.lineTo(9.5,-43); ctx.stroke(); }
  else {
    ctx.fillStyle='#2d2233'; ctx.beginPath(); ctx.ellipse(-2.5,-43.5,2.1,2.8,0,0,Math.PI*2); ctx.ellipse(7.5,-43.5,2.1,2.8,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(-1.8,-44.6,0.9,0,Math.PI*2); ctx.arc(8.2,-44.6,0.9,0,Math.PI*2); ctx.fill();
  }
  ctx.strokeStyle='#8a4a4a'; ctx.lineWidth=1.3; ctx.beginPath(); ctx.arc(3,-38.5,2.2,0.15*Math.PI,0.85*Math.PI); ctx.stroke();
  ctx.restore();
}

function drawBaby(x, y, t, moving, facingRight=true, sc=1){
  const bob=Math.sin(t*0.08)*4, wig=moving?Math.sin(t*0.3)*6:Math.sin(t*0.05)*2;
  const blink=(Math.floor(t/52)%7===0);
  ctx.save(); ctx.translate(x, y+bob); ctx.scale(facingRight?sc:-sc, sc);
  const g=ctx.createRadialGradient(0,0,4,0,0,34); g.addColorStop(0,'rgba(255,244,210,.75)'); g.addColorStop(1,'rgba(255,244,210,0)');
  ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,34,0,Math.PI*2); ctx.fill();
  ctx.lineWidth=2; ctx.lineJoin='round';
  ctx.beginPath(); ctx.ellipse(0,8,14,15,0,0,Math.PI*2); fillStroke('#fff4e4');
  ctx.strokeStyle='rgba(242,198,109,.8)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(-12,4); ctx.quadraticCurveTo(0,12,12,4); ctx.stroke();
  ctx.lineWidth=2;
  ctx.beginPath(); ctx.arc(-12+wig*0.3,3,4.6,0,Math.PI*2); fillStroke('#ffe3c4');
  ctx.beginPath(); ctx.arc(12-wig*0.3,3,4.6,0,Math.PI*2); fillStroke('#ffe3c4');
  ctx.beginPath(); ctx.arc(0,-13,13,0,Math.PI*2); fillStroke('#ffe3c4');
  ctx.fillStyle='#6b4a3a'; ctx.beginPath(); ctx.arc(1,-25,3.2,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='rgba(255,140,160,.5)'; ctx.beginPath(); ctx.arc(-6,-9,2.6,0,Math.PI*2); ctx.arc(8,-9,2.6,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#4a3f55'; ctx.lineWidth=1.6; ctx.lineCap='round';
  if(blink){ ctx.beginPath(); ctx.moveTo(-5,-14); ctx.lineTo(-1.5,-14); ctx.moveTo(4,-14); ctx.lineTo(7.5,-14); ctx.stroke(); }
  else { ctx.beginPath(); ctx.arc(-3,-14,2.2,0.2,Math.PI-0.2); ctx.stroke(); ctx.beginPath(); ctx.arc(6,-14,2.2,0.2,Math.PI-0.2); ctx.stroke(); }
  ctx.restore();
}

function drawObject(x, footY, emoji, t){
  shadow(x, footY+1, 18);
  const g=ctx.createRadialGradient(x,footY-30,2,x,footY-30,36); g.addColorStop(0,'rgba(255,240,200,.8)'); g.addColorStop(1,'rgba(255,240,200,0)');
  ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,footY-30,36,0,Math.PI*2); ctx.fill();
  ctx.font='32px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(emoji, x, footY-30+Math.sin(t*0.06)*3);
}

function drawMarker(x, topY, t, done, near, label){
  const sc=near&&!done ? 1.25+Math.sin(t*0.2)*0.08 : 1;
  const y=topY+Math.sin(t*0.08)*3;
  ctx.save(); ctx.translate(x,y); ctx.scale(sc,sc);
  ctx.fillStyle=done?'rgba(127,209,185,.95)':'rgba(255,224,120,.97)';
  ctx.strokeStyle='rgba(45,28,48,.8)'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.arc(0,0,11,0,Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.fillStyle=done?'#12302a':'#5a4010'; ctx.font='bold 15px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(done?'✓':'!',0,1);
  ctx.restore();
  if(near && label){
    ctx.font='bold 12px "Noto Sans KR", sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    const w=ctx.measureText(label).width+16;
    ctx.fillStyle='rgba(18,13,38,.82)'; rr(x-w/2, topY-36, w, 20, 10); ctx.fill();
    ctx.fillStyle='#ffe9b0'; ctx.fillText(label, x, topY-26);
  }
}

/* ---------------- 절차적 배경 (바다 / 꽃잎 / 빛줄기) ---------------- */
function drawSeaBg(camX, t){
  let g=ctx.createLinearGradient(0,0,0,VH);
  g.addColorStop(0,'#ffd4ae'); g.addColorStop(0.35,'#ffb9a6'); g.addColorStop(0.62,'#cfa9d6'); g.addColorStop(1,'#cfa9d6');
  ctx.fillStyle=g; ctx.fillRect(0,0,VW,VH);
  const sx=VW*0.7-camX*0.04;
  g=ctx.createRadialGradient(sx,196,8,sx,196,110); g.addColorStop(0,'rgba(255,250,225,.95)'); g.addColorStop(0.3,'rgba(255,228,170,.6)'); g.addColorStop(1,'rgba(255,228,170,0)');
  ctx.fillStyle=g; ctx.beginPath(); ctx.arc(sx,196,110,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#fff6dc'; ctx.beginPath(); ctx.arc(sx,200,26,0,Math.PI*2); ctx.fill();
  const mx=-camX*0.12;
  ctx.fillStyle='rgba(120,92,150,.55)';
  ctx.beginPath(); ctx.moveTo(mx-80,250); ctx.quadraticCurveTo(mx+120,150,mx+300,190); ctx.quadraticCurveTo(mx+420,215,mx+560,250); ctx.closePath(); ctx.fill();
  g=ctx.createLinearGradient(0,238,0,306); g.addColorStop(0,'#86b4dc'); g.addColorStop(1,'#4b7fb8');
  ctx.fillStyle=g; ctx.fillRect(0,238,VW,70);
  ctx.strokeStyle='rgba(255,248,230,.7)'; ctx.lineWidth=1.5;
  for(let i=0;i<22;i++){ const x=((i*97 - camX*0.3 + t*0.4)%(VW+60)+VW+60)%(VW+60)-30, y=248+(i*37%52); ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+10+(i%3)*4,y); ctx.stroke(); }
  g=ctx.createLinearGradient(0,300,0,VH); g.addColorStop(0,'#f6e2b8'); g.addColorStop(1,'#e2bf88');
  ctx.fillStyle=g; ctx.fillRect(0,302,VW,VH-302);
  ctx.strokeStyle='rgba(255,255,255,.85)'; ctx.lineWidth=3; ctx.beginPath();
  for(let x=0;x<=VW;x+=12){ const y=304+Math.sin((x+camX)*0.04+t*0.05)*3; x===0?ctx.moveTo(x,y):ctx.lineTo(x,y); }
  ctx.stroke();
}
function updatePetals(){
  if(petals.length<26 && Math.random()<0.3) petals.push({x:Math.random()*VW, y:-10, vx:0.3+Math.random()*0.6, vy:0.6+Math.random()*0.8, r:Math.random()*6, c:Math.random()<0.5?'#ffb3cf':'#fff0f5'});
  petals.forEach(p=>{ p.x+=p.vx+Math.sin(p.y*0.03)*0.4; p.y+=p.vy; p.r+=0.05; }); petals=petals.filter(p=>p.y<VH+10);
}
function drawPetals(){ petals.forEach(p=>{ ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.r); ctx.fillStyle=p.c; ctx.globalAlpha=.85; ctx.beginPath(); ctx.ellipse(0,0,4.5,2.4,0,0,Math.PI*2); ctx.fill(); ctx.restore(); }); ctx.globalAlpha=1; }
function drawLightBeam(t, strong){
  const a=(strong?0.34:0.16)+Math.sin(t*0.03)*0.05;
  const g=ctx.createLinearGradient(0,0,0,VH); g.addColorStop(0,`rgba(255,250,220,${a})`); g.addColorStop(1,'rgba(255,250,220,0)');
  ctx.fillStyle=g; ctx.beginPath(); ctx.moveTo(VW*0.4,0); ctx.lineTo(VW*0.6,0); ctx.lineTo(VW*0.78,VH); ctx.lineTo(VW*0.22,VH); ctx.closePath(); ctx.fill();
}
function groundShade(){
  const g=ctx.createLinearGradient(0,280,0,VH); g.addColorStop(0,'rgba(15,8,25,0)'); g.addColorStop(1,'rgba(15,8,25,.28)');
  ctx.fillStyle=g; ctx.fillRect(0,280,VW,VH-280);
}

/* =========================================================
   필드 (사이드뷰 탐험)
   ========================================================= */
let currentChapterId=null, chapterKey=null, fieldId=null, fs=null, talked=[], pendingAction=null, globalT=0;
const HOSPITAL_BIRTH_ID = ()=>{ for(const f of Object.values(CHAPTER_FIELDS[chapterKey].fields)) for(const n of f.npcs) if(n.event==='birth') return n.id; return null; };
function isBorn(){ const id=HOSPITAL_BIRTH_ID(); return id ? talked.includes(id) : false; }
function playerKind(){ const ch=CHAPTER_FIELDS[chapterKey]; return (ch.playerAfterBirth && isBorn()) ? ch.playerAfterBirth : ch.player; }
function npcVisible(n){ return !(n.afterBirth && !isBorn()); }
function totalNpc(){ const ch=CHAPTER_FIELDS[chapterKey]; return ch.order.reduce((s,f)=>s+ch.fields[f].npcs.length,0); }

function startField(key, fid, spawnSide){
  mode='field'; chapterKey=key; pendingAction=null;
  const ch=CHAPTER_FIELDS[key];
  fieldId=fid||ch.order[0];
  const field=ch.fields[fieldId];
  talked=(save.talked[key]||[]).slice();
  fitStage(); setBackground(field);
  fs={ x: spawnSide==='right'? field.width-70 : 70, t:0, moving:false, facingRight: spawnSide!=='right', nearId:null, blockToastT:0 };
  fx=[]; dust=[]; petals=[];
  $('missionList').style.display='flex';
  updateFieldUI();
  screenPulse();
}
function updateFieldUI(){
  const ch=CHAPTER_FIELDS[chapterKey], field=ch.fields[fieldId], total=totalNpc();
  $('hudTitle').textContent=`${ch.icon} ${field.name}  ·  ${talked.length}/${total}`;
  $('hudFill').style.width=(talked.length/total*100)+'%';
  $('missionList').innerHTML=field.npcs.map(n=>{
    if(!npcVisible(n)) return `<span class="m-tag">🔒 ???</span>`;
    const d=talked.includes(n.id); return `<span class="m-tag ${d?'done':''}">${d?'✓':'◇'} ${escapeHtml(n.label)}</span>`;
  }).join('');
  let hint='◀ ▶ 로 걷고, ❗ 가 뜨면 대화 버튼을 눌러요';
  if(ch.playerAfterBirth) hint = isBorn() ? '<b style="color:#ffe27a">[이안이의 시점]</b> 가족들을 만나보세요' : '<b style="color:#ffe27a">[아버지의 시점]</b> 그날 아침으로 돌아가요';
  $('hint').innerHTML=hint;
}
function fieldUpdate(){
  const ch=CHAPTER_FIELDS[chapterKey], field=ch.fields[fieldId];
  globalT++; fs.t++;
  const dir=moveDir(), speed=chapterKey==='hospital'?2.4:3.0;
  fs.moving=dir!==0;
  if(dir<0) fs.facingRight=false; else if(dir>0) fs.facingRight=true;
  fs.x=Math.max(20, Math.min(field.width-20, fs.x+dir*speed));
  if(fs.moving && fs.t%12===0){ dust.push({x:fs.x-(fs.facingRight?8:-8), y:FIELD_GROUND_Y-2, life:18, r:3+Math.random()*2}); if(playerKind()!=='baby') sfx.step(); }
  updateFx(); if(field.petals) updatePetals();
  if(fs.blockToastT>0) fs.blockToastT--;

  if(field.exitRight && fs.x>=field.width-25){
    if(field.exitRightNeedsBirth && !isBorn()){ fs.x=field.width-26; if(fs.blockToastT<=0){ toast('🚪 아직 문이 열리지 않았어요 — 「탄생의 순간」을 먼저 만나보세요'); sfx.no(); fs.blockToastT=150; } }
    else { startField(chapterKey, field.exitRight, 'left'); return; }
  }
  if(field.exitLeft && fs.x<=25){ startField(chapterKey, field.exitLeft, 'right'); return; }

  let near=null, nd=9999;
  field.npcs.forEach(n=>{ if(!npcVisible(n)) return; const d=Math.abs(fs.x-n.x); if(d<56 && d<nd){ nd=d; near=n; } });
  fs.nearId=near?near.id:null;
  if(near){ pendingAction=()=>tryTalk(near); setMain('talk:'+near.id,'❗','대화','ready'); }
  else { pendingAction=null; setMain('idle','❗','대화','idle'); }
}
let lastCamX=0;
function fieldDraw(){
  const ch=CHAPTER_FIELDS[chapterKey], field=ch.fields[fieldId];
  const maxCam=Math.max(0, field.width-VW);
  const camX=Math.max(0, Math.min(fs.x-VW*0.42, maxCam)); lastCamX=camX;
  ctx.clearRect(0,0,VW,VH);
  if(curBg.type==='sea') drawSeaBg(camX, globalT);
  panParallax(maxCam>0?camX/maxCam:0.5);
  groundShade();
  if(field.lightBeam) drawLightBeam(globalT, isBorn());
  // 출구 안내
  ctx.font='bold 12px "Noto Sans KR", sans-serif'; ctx.textBaseline='middle';
  if(field.exitLeft){ const sx=Math.max(8, 14-camX); if(sx<VW){ const nm='◀ '+ch.fields[field.exitLeft].name.split(' · ')[0]; exitPill(nm, sx, 'left'); } }
  if(field.exitRight){ const sx=Math.min(VW-8, field.width-14-camX); if(sx>0){ const locked=field.exitRightNeedsBirth&&!isBorn(); const nm=(locked?'🔒 ':'')+ch.fields[field.exitRight].name.split(' · ')[0]+' ▶'; exitPill(nm, sx, 'right'); } }
  // NPC
  field.npcs.forEach(n=>{
    if(!npcVisible(n)) return;
    const sx=n.x-camX; if(sx<-80||sx>VW+80) return;
    const done=talked.includes(n.id), near=fs.nearId===n.id;
    if(n.object) drawObject(sx, FIELD_GROUND_Y, n.object, globalT);
    else drawChibi(sx, FIELD_GROUND_Y, PALETTES[n.palette]||PALETTES.suit, {t:globalT, moving:false, facingRight: fs.x>n.x});
    drawMarker(sx, FIELD_GROUND_Y-(n.object?84:((n.palette==='chef'||n.palette==='nurse'?72:66)*CH_SCALE+20)), globalT, done, near, n.label);
  });
  drawFx(camX);
  const px=fs.x-camX;
  if(playerKind()==='baby') { shadow(px, FIELD_GROUND_Y+1, 12); drawBaby(px, FIELD_GROUND_Y-34, fs.t, fs.moving, fs.facingRight, 1.2); }
  else drawChibi(px, FIELD_GROUND_Y+6, PALETTES.dad, {t:fs.t, moving:fs.moving, facingRight:fs.facingRight});
  if(field.petals) drawPetals();
}
function exitPill(text, x, side){
  const w=ctx.measureText(text).width+18, y=170;
  const bx = side==='left' ? x : x-w;
  ctx.fillStyle='rgba(18,13,38,.6)'; rr(bx, y-12, w, 24, 12); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.95)'; ctx.textAlign='center'; ctx.fillText(text, bx+w/2, y+1);
}
function tryTalk(npc){
  sfx.interact(); pendingAction=null;
  spawnBurst(fs.x-lastCamX, FIELD_GROUND_Y-50, '#ffe27a', 16);
  screenPulse();
  showDialogue(npc.lines, ()=>onNpcDone(npc));
}
function onNpcDone(npc){
  const first=!talked.includes(npc.id);
  if(first){
    talked.push(npc.id); save.talked[chapterKey]=talked.slice(); persist(); sfx.collect();
    spawnBurst(fs.x-lastCamX, FIELD_GROUND_Y-50, '#7fd1b9', 18);
  }
  updateFieldUI();
  if(npc.event==='birth' && first){ triggerBirth(()=>{ updateFieldUI(); toast('👶 이제 이안이의 눈으로 세상을 봐요', 2400); checkFieldClear(); }); return; }
  checkFieldClear();
}
function checkFieldClear(){
  if(talked.length>=totalNpc()){
    const reward=CHAPTER_FIELDS[chapterKey].cardReward;
    save.talked[chapterKey]=[];
    completeChapter(reward);
  }
}

/* ---------------- 탄생 연출 ---------------- */
function triggerBirth(after){
  sfx.clear(); shakeScreen();
  $('birthFlash').style.opacity=1;
  setTimeout(()=>{ $('birthText').style.display='flex'; }, 900);
  $('birthBtn').onclick=()=>{
    $('birthText').style.display='none'; $('birthFlash').style.opacity=0;
    after && after();
  };
}

/* ---------------- 챕터 클리어 ---------------- */
function completeChapter(reward){
  if(!save.cleared.includes(currentChapterId)) save.cleared.push(currentChapterId);
  persist();
  sfx.clear(); shakeScreen();
  $('cardIcon').textContent=reward.icon; $('cardName').textContent=reward.name; $('cardEpithet').textContent=reward.epithet||'';
  const cs=$('cardScreen');
  cs.querySelectorAll('.memory-card,.stars span,p.desc,button').forEach(n=>{ n.style.animation='none'; void n.offsetWidth; n.style.animation=''; });
  setTimeout(()=>{ cs.style.display='flex'; }, 500);
  mode=null;
}
$('cardCloseBtn').addEventListener('click', ()=>{ $('cardScreen').style.display='none'; backToMap(); });

/* =========================================================
   태초의 바다 (점프 플랫포머)
   ========================================================= */
const GRAVITY=0.7, JUMP_FORCE=-13, MOVE_SPEED=3.2;
let pf=null, jumpQueued=false, bubbles=[], wombBlocks=[], wombEnemies=[];
function startWomb(){
  mode='platform'; pendingAction=null; chapterKey=null;
  fitStage(); setBackground({bg:'womb'});
  $('missionList').style.display='none';
  $('hint').innerHTML='◀ ▶ 로 헤엄치고 ▲ 로 점프 — <b style="color:#ffe27a">?</b> 구슬에 닿으면 기억이 열려요';
  pf={ worldX:60, y:WOMB.groundY, vy:0, grounded:true, facingRight:true, t:0, score:0, hurt:0 };
  wombBlocks=WOMB.blocks.map(b=>({...b, used:false}));
  wombEnemies=WOMB.enemies.map(e=>({...e, alive:true}));
  fx=[]; dust=[];
  bubbles=Array.from({length:22},()=>({x:Math.random()*800,y:Math.random()*VH,r:2+Math.random()*4,s:0.3+Math.random()*0.6}));
  setMain('jump','▲','점프','');
  updateWombHud();
}
function updateWombHud(){
  const pct=Math.min(100, Math.round(pf.worldX/WOMB.length*100));
  $('hudTitle').textContent=`🌊 태초의 바다  ·  기억 ${pf.score}/${wombBlocks.length}`;
  $('hudFill').style.width=pct+'%';
}
function pfUpdate(){
  pf.t++; globalT++;
  const dir=moveDir();
  if(dir) pf.facingRight=dir>0;
  pf.worldX=Math.max(20, Math.min(WOMB.length+40, pf.worldX+dir*MOVE_SPEED));
  if(jumpQueued && pf.grounded){ pf.vy=JUMP_FORCE; pf.grounded=false; sfx.jump(); }
  jumpQueued=false;
  pf.vy+=GRAVITY; pf.y+=pf.vy;
  if(pf.y>=WOMB.groundY){ pf.y=WOMB.groundY; pf.vy=0; pf.grounded=true; }
  if(pf.hurt>0) pf.hurt--;
  const blockY=WOMB.groundY-130;
  wombBlocks.forEach(b=>{
    if(b.used) return;
    if(Math.abs(pf.worldX-b.x)<26 && pf.vy<0 && Math.abs((pf.y-24)-blockY)<18){
      b.used=true; pf.vy=2; pf.score++;
      spawnFloatMsg(b.msg); sfx.collect(); spawnBurst(b.x, blockY, '#ffe27a', 16); screenPulse();
    }
  });
  wombEnemies.forEach(e=>{
    if(!e.alive) return;
    e.curX=e.x+Math.sin(pf.t*0.02+e.x)*e.range;
    const dx=pf.worldX-e.curX;
    if(Math.abs(dx)<22){
      if(pf.vy>0 && pf.y<WOMB.groundY-2){ e.alive=false; pf.vy=JUMP_FORCE*0.5; spawnFloatMsg(WOMB.enemyMsg); sfx.collect(); spawnBurst(e.curX, WOMB.groundY, '#a8d8ff', 10); }
      else if(pf.hurt<=0){ pf.worldX+=Math.sign(dx||-1)*28; pf.hurt=40; sfx.hit(); shakeScreen(); }
    }
  });
  updateFx();
  bubbles.forEach(b=>{ b.y-=b.s; if(b.y<-10){ b.y=VH+10; b.x=Math.random()*VW; } });
  if(pf.t%6===0) updateWombHud();
  if(pf.worldX>=WOMB.length-10){
    pendingAction=()=>{ pendingAction=null; finishWomb(); };
    setMain('gate','🌟','세상으로','ready');
  } else { pendingAction=null; setMain('jump','▲','점프',''); }
}
function finishWomb(){
  sfx.clear(); shakeScreen();
  const f=$('birthFlash'); f.style.opacity=1;
  setTimeout(()=>{ f.style.opacity=0; completeChapter(WOMB.cardReward); }, 900);
}
function pfDraw(){
  const camX=Math.max(0, Math.min(pf.worldX-VW*0.32, WOMB.length+160-VW));
  ctx.clearRect(0,0,VW,VH);
  let g=ctx.createRadialGradient(VW/2,VH/2,40,VW/2,VH/2,Math.max(VW,VH)*0.75);
  g.addColorStop(0,'#ffa6cf'); g.addColorStop(0.55,'#c9578f'); g.addColorStop(1,'#4a1840');
  ctx.fillStyle=g; ctx.fillRect(0,0,VW,VH);
  // 심장 박동처럼 번지는 빛
  const beat=Math.max(0, Math.sin(globalT*0.09))**8;
  ctx.fillStyle=`rgba(255,220,235,${0.08+beat*0.12})`; ctx.fillRect(0,0,VW,VH);
  bubbles.forEach(b=>{ ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2); ctx.fillStyle='rgba(255,255,255,.35)'; ctx.fill(); });
  const gy=WOMB.groundY+22;
  ctx.fillStyle='rgba(190,70,115,.6)'; ctx.fillRect(0,gy,VW,VH-gy);
  ctx.strokeStyle='rgba(255,255,255,.35)'; ctx.lineWidth=3; ctx.beginPath();
  for(let x=0;x<=VW;x+=16){ const y=gy+Math.sin((x+camX)*0.05)*4; x===0?ctx.moveTo(x,y):ctx.lineTo(x,y); } ctx.stroke();
  const blockY=WOMB.groundY-130;
  wombBlocks.forEach(b=>{
    const sx=b.x-camX, by=blockY+Math.sin((globalT+b.x)*0.05)*3;
    if(sx<-40||sx>VW+40) return;
    if(!b.used){ const gg=ctx.createRadialGradient(sx,by,4,sx,by,30); gg.addColorStop(0,'rgba(255,230,140,.7)'); gg.addColorStop(1,'rgba(255,230,140,0)'); ctx.fillStyle=gg; ctx.beginPath(); ctx.arc(sx,by,30,0,Math.PI*2); ctx.fill(); }
    ctx.fillStyle=b.used?'rgba(255,255,255,.18)':'#ffe27a'; ctx.beginPath(); ctx.arc(sx,by,17,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.7)'; ctx.lineWidth=2; ctx.stroke();
    ctx.fillStyle=b.used?'rgba(255,255,255,.5)':'#8a4a10'; ctx.font='bold 16px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(b.used?'✦':'?', sx, by+1);
  });
  wombEnemies.forEach(e=>{
    if(!e.alive) return;
    const ex=(e.curX??e.x)-camX; if(ex<-30||ex>VW+30) return;
    ctx.fillStyle='rgba(180,140,220,.85)'; ctx.strokeStyle='rgba(70,40,90,.7)'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(ex,WOMB.groundY+14,16,Math.PI,0); ctx.lineTo(ex+16,WOMB.groundY+24); ctx.lineTo(ex-16,WOMB.groundY+24); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#3a2a45'; ctx.beginPath(); ctx.arc(ex-5,WOMB.groundY+10,2,0,Math.PI*2); ctx.arc(ex+5,WOMB.groundY+10,2,0,Math.PI*2); ctx.fill();
  });
  const gateX=WOMB.length-camX;
  if(gateX<VW+170){
    g=ctx.createRadialGradient(gateX,190,10,gateX,190,170); g.addColorStop(0,'rgba(255,255,255,.95)'); g.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=g; ctx.fillRect(gateX-170,0,340,VH);
    ctx.strokeStyle='rgba(255,255,255,.85)'; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(gateX,WOMB.groundY-20,56,Math.PI,0); ctx.stroke();
  }
  drawFx(camX);
  if(!(pf.hurt>0 && Math.floor(pf.hurt/4)%2===0)) drawBaby(pf.worldX-camX, pf.y-18, pf.t, moveDir()!==0, pf.facingRight);
}

/* ---------------- 메인 루프 (고정 60fps 스텝 — 120Hz 화면에서도 같은 속도) ---------------- */
let last=performance.now(), acc=0;
function loop(now){
  acc+=Math.min(100, now-last); last=now;
  const paused = dialogueOpen || $('birthText').style.display==='flex' || $('cardScreen').style.display==='flex' || $('chapterIntro').style.display==='flex';
  while(acc>=16.67){
    acc-=16.67;
    if(paused) continue;
    if(mode==='platform') pfUpdate(); else if(mode==='field') fieldUpdate();
  }
  if(mode==='platform') pfDraw(); else if(mode==='field' && fs) fieldDraw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
})();

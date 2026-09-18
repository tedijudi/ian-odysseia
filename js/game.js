/* ============================================================
   ODYSSEIA 게임 엔진 — 메이플식 사이드뷰 (이야기·맵 데이터는 js/story.js)
   ============================================================ */
(function(){
'use strict';
const $ = id => document.getElementById(id);

/* ---------------- 저장 ---------------- */
const SAVE_KEY = 'ian_odysseia_save_v3';
let save = { talked:{}, picked:{}, cleared:[], muted:false, exp:0, items:[], everTalked:[], everPicked:[], tutorial:0 };
try{
  const s=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');
  if(s) save=Object.assign(save, s);
  else { const o=JSON.parse(localStorage.getItem('ian_odysseia_save_v2')||'null'); if(o){ save.cleared=o.cleared||[]; save.muted=!!o.muted; } }
}catch(e){}
function persist(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(save)); }catch(e){} }

/* ---------------- 공통 ---------------- */
const BG_IMAGES = { outdoor:'images/bg_outdoor.webp', indoor:'images/bg_indoor.webp', jokbal:'images/chapter1_bg.webp' };
const VH = 400;          // 논리 화면 높이 (가로폭은 화면 비율에 맞춰 변함)
let VW = 720;
const CH_SCALE = 1.1;    // 필드 캐릭터 크기

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
  no:()=>beep(300,0.1,'sine',0.12),
  portal:()=>{ beep(420,0.12,'sine',0.14); beep(840,0.2,'sine',0.1,0.08); },
  pick:()=>beep(1180,0.07,'triangle',0.16),
  levelup:()=>[523,659,784,1046,1318].forEach((f,i)=>beep(f,0.24,'triangle',0.2,i*0.09))
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
function backToMap(){ mode=null; map=null; run=null; transitioning=false; closeDialogueSilently(); closeWin(); clearInput(); $('fade').classList.remove('on'); showScreen('screen-map'); renderWorldMap(); }

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
    startChapter(ch.launch);
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


/* ---------------- 스테이지 크기 · 화면 배치 ---------------- */
const screenGame=$('screen-game'), stageWrap=$('stageWrap'), stage=$('stage');
const canvas=$('game'), ctx=canvas.getContext('2d');
const parallaxImg=$('parallaxImg'), ambient=$('ambient');
const miniCanvas=$('miniCanvas'), mctx=miniCanvas.getContext('2d');
let stageW=720, stageH=400, curBg={type:'none'}, panX=0, panY=0;
const SANS='"Noto Sans KR", system-ui, sans-serif';
const TOUCH = matchMedia('(hover: none), (pointer: coarse)').matches;
document.body.classList.toggle('touch', TOUCH);

function portraitLayout(){ return window.innerHeight > window.innerWidth*1.05; }
function placePanels(){
  const p=portraitLayout();
  screenGame.classList.toggle('portrait', p);
  const dock=$('dock'), qh=$('questHelper'), cl=$('chatLog'), ctl=$('controls');
  if(p){
    if(qh.parentElement!==dock){ dock.appendChild(qh); dock.appendChild(cl); }
    if(ctl.previousElementSibling!==dock) dock.after(ctl);
  } else {
    if(qh.parentElement!==stageWrap){ stageWrap.appendChild(qh); stageWrap.appendChild(cl); }
    if(ctl.parentElement!==stageWrap) stageWrap.appendChild(ctl);
  }
}
function fitStage(){
  placePanels();
  let aw, ah;
  if(portraitLayout()){
    aw=Math.max(200, stageWrap.clientWidth-8);
    ah=Math.min(window.innerHeight*0.53, aw*VH/360);
    VW=Math.round(Math.max(360, Math.min(900, VH*aw/ah)));
    stageWrap.style.height=Math.round(ah+8)+'px';
  } else {
    stageWrap.style.height='';
    const r=stageWrap.getBoundingClientRect(); aw=r.width-8; ah=r.height-8;
    if(aw<=0||ah<=0) return;
    VW=Math.round(Math.max(440, Math.min(900, VH*aw/ah)));
  }
  const scale=Math.min(aw/VW, ah/VH);
  stageW=Math.floor(VW*scale); stageH=Math.floor(VH*scale);
  stage.style.width=stageW+'px'; stage.style.height=stageH+'px';
  const dpr=Math.min(window.devicePixelRatio||1, 2.5);
  canvas.width=Math.round(stageW*dpr); canvas.height=Math.round(stageH*dpr);
  ctx.setTransform(canvas.width/VW,0,0,canvas.height/VH,0,0);
  sizeParallax(); sizeMinimap(); placeChat();
  if(map) updateCam(true);
}
function placeChat(){
  const cl=$('chatLog');
  if(portraitLayout()){ cl.style.left=''; cl.style.top=''; return; }
  cl.style.left=(stage.offsetLeft+6)+'px';
  cl.style.top=(stage.offsetTop+$('minimap').offsetHeight+12)+'px';
}
function sizeParallax(){
  if(curBg.type!=='img') return;
  const ar=(parallaxImg.naturalWidth/parallaxImg.naturalHeight)||1.79;
  const h=Math.max(stageH*1.16, stageW*1.08/ar), w=h*ar;
  parallaxImg.style.height=h+'px'; parallaxImg.style.width=w+'px';
  panX=Math.max(0,w-stageW); panY=Math.max(0,h-stageH);
}
const clamp01=v=>Math.max(0,Math.min(1,v));
function panParallax(fx,fy){
  if(curBg.type!=='img') return;
  parallaxImg.style.transform=`translate(${(-panX*clamp01(fx)).toFixed(1)}px,${(-panY*clamp01(fy)).toFixed(1)}px)`+(curBg.flip?' scaleX(-1)':'');
}
function setBackground(m){
  const key=m.bg;
  if(!BG_IMAGES[key]){
    curBg={type:key||'none'};
    parallaxImg.style.display='none';
    $('parallaxBg').style.background='transparent';
    ambient.style.backgroundImage = key==='sea' ? 'linear-gradient(#ffc9a8,#8fb6e0 60%,#e8cf9f)' : 'radial-gradient(circle,#c9578f,#3a1235)';
    ambient.style.filter='blur(26px) brightness(.45)';
    return;
  }
  const src=BG_IMAGES[key];
  curBg={type:'img', flip:!!m.flip};
  $('parallaxBg').style.background='#2a2340';
  parallaxImg.style.display='block';
  parallaxImg.style.filter=m.filter||'none';
  if(parallaxImg.getAttribute('src')!==src){
    parallaxImg.style.opacity='0';
    parallaxImg.onload=()=>{ sizeParallax(); parallaxImg.style.opacity='1'; };
    parallaxImg.src=src;
  }
  ambient.style.backgroundImage=`url(${src})`;
  ambient.style.filter=`blur(26px) brightness(.4) saturate(1.2) ${m.filter||''}`;
  sizeParallax();
}
let resizeT=null;
function onResize(){
  clearTimeout(resizeT);
  resizeT=setTimeout(()=>{
    if(screenGame.classList.contains('active')) fitStage();
    if($('screen-map').classList.contains('active')) renderWorldMap();
  }, 120);
}
window.addEventListener('resize', onResize);
window.addEventListener('orientationchange', ()=>setTimeout(onResize, 250));

/* ---------------- 레벨 · 경험치 ---------------- */
const QUEST_EXP=20, SPARKLE_EXP=3, ORB_EXP=10, MOB_EXP=5, CLEAR_EXP=50;
function needFor(lv){ return 40+(lv-1)*20; }
function levelInfo(exp){ let lv=1, e=exp; while(e>=needFor(lv)){ e-=needFor(lv); lv++; } return {lv, cur:e, need:needFor(lv)}; }

/* ---------------- 이펙트 ---------------- */
function shakeScreen(){ stage.classList.remove('shakeFx'); void stage.offsetWidth; stage.classList.add('shakeFx'); }
function screenPulse(){ const el=$('screenFlash'); el.classList.remove('flashPulse'); void el.offsetWidth; el.classList.add('flashPulse'); }
let fx=[], dust=[], petals=[], floaters=[], lvFx=null;
function spawnBurst(x,y,color='#ffe27a',count=12){
  for(let i=0;i<count;i++){ const a=Math.random()*Math.PI*2, s=1+Math.random()*3.2; fx.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-1.5,life:30,color}); }
}
function updateFx(){
  fx.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.15;p.life--;}); fx=fx.filter(p=>p.life>0);
  dust.forEach(d=>{d.life--;d.y-=0.3;}); dust=dust.filter(d=>d.life>0);
  floaters.forEach(f=>{ f.y+=f.vy; f.vy*=0.97; f.life--; }); floaters=floaters.filter(f=>f.life>0);
  if(lvFx){ lvFx.t++; if(lvFx.t>120) lvFx=null; }
}
function drawFx(){
  fx.forEach(p=>{ ctx.globalAlpha=Math.max(0,p.life/30); ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,3.2,0,Math.PI*2); ctx.fill(); });
  dust.forEach(d=>{ ctx.globalAlpha=d.life/18*0.45; ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(d.x,d.y,d.r,0,Math.PI*2); ctx.fill(); });
  ctx.globalAlpha=1;
}
function addFloater(x,y,text,color='#ffe27a',size=15){ floaters.push({x,y,text,color,size,vy:-1.3,life:70}); }
function drawFloaters(){
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.lineJoin='round';
  floaters.forEach(f=>{
    ctx.globalAlpha=Math.min(1,f.life/20);
    ctx.font=`900 ${f.size}px ${SANS}`;
    ctx.lineWidth=4; ctx.strokeStyle='rgba(40,20,50,.9)'; ctx.strokeText(f.text,f.x,f.y);
    ctx.fillStyle=f.color; ctx.fillText(f.text,f.x,f.y);
  });
  ctx.globalAlpha=1;
}
function drawLevelUp(){
  if(!lvFx) return;
  const t=lvFx.t, x=P.x, y=P.y, a=t<90?1:(120-t)/30;
  const h=Math.min(1,t/12)*240;
  let g=ctx.createLinearGradient(0,y-h,0,y);
  g.addColorStop(0,'rgba(255,240,170,0)'); g.addColorStop(0.5,`rgba(255,236,150,${0.45*a})`); g.addColorStop(1,`rgba(255,250,220,${0.8*a})`);
  ctx.fillStyle=g; ctx.fillRect(x-34,y-h,68,h);
  ctx.fillStyle=`rgba(255,250,220,${0.7*a})`; ctx.beginPath(); ctx.ellipse(x,y,46,10,0,0,Math.PI*2); ctx.fill();
  for(let i=0;i<10;i++){ const py=y-((t*3+i*29)%200), px=x+Math.sin(i*1.7+t*0.1)*28; ctx.fillStyle=`rgba(255,226,122,${a})`; ctx.beginPath(); ctx.arc(px,py,2.2,0,Math.PI*2); ctx.fill(); }
  const ty=y-120-Math.min(t,30)*0.8, sc=t<10?0.6+t*0.05:1.1;
  ctx.save(); ctx.translate(x,ty); ctx.scale(sc,sc); ctx.globalAlpha=a;
  ctx.font=`900 26px ${SANS}`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.lineJoin='round';
  ctx.lineWidth=6; ctx.strokeStyle='#5a2d78'; ctx.strokeText('LEVEL UP!',0,0);
  const tg=ctx.createLinearGradient(0,-14,0,14); tg.addColorStop(0,'#fff6c0'); tg.addColorStop(1,'#f2b43c');
  ctx.fillStyle=tg; ctx.fillText('LEVEL UP!',0,0);
  ctx.restore(); ctx.globalAlpha=1;
}
let floatT=null;
function spawnFloatMsg(msg){
  const el=$('floatMsg'); el.textContent='✦ '+msg; el.classList.add('show');
  clearTimeout(floatT); floatT=setTimeout(()=>el.classList.remove('show'), 3000);
}
let bannerT=null;
function showMapBanner(text){
  const el=$('mapBanner'); el.textContent=text; el.classList.add('show');
  clearTimeout(bannerT); bannerT=setTimeout(()=>el.classList.remove('show'), 2200);
}
function chat(text, cls){
  const box=$('chatLog'), el=document.createElement('div');
  el.className='cl '+(cls||''); el.textContent=text; box.appendChild(el);
  while(box.children.length>(portraitLayout()?6:4)) box.firstChild.remove();
  setTimeout(()=>el.classList.add('old'), 6000);
}

/* ---------------- 입력 (조이스틱 · 버튼 · 키보드 · 탭) ---------------- */
const K={l:false,r:false,u:false,d:false}, J={l:false,r:false,u:false,d:false};
const input={ jumpQ:false, jumpHeld:false, actQ:false, upQ:false };
function clearInput(){ K.l=K.r=K.u=K.d=false; J.l=J.r=J.u=J.d=false; input.jumpQ=input.jumpHeld=input.actQ=input.upQ=false; $('joyKnob').style.transform=''; }

const joy=$('joy'), knob=$('joyKnob'); let joyId=null, joyC=null;
function joyMove(e){
  let dx=e.clientX-joyC.x, dy=e.clientY-joyC.y; const R=joyC.R*0.62, d=Math.hypot(dx,dy);
  if(d>R){ dx*=R/d; dy*=R/d; }
  knob.style.transform=`translate(${dx}px,${dy}px)`;
  const nx=dx/R, ny=dy/R, wasU=J.u;
  J.l=nx<-0.35; J.r=nx>0.35; J.u=ny<-0.55; J.d=ny>0.6;
  if(J.u && !wasU) input.upQ=true;
}
joy.addEventListener('pointerdown', e=>{
  e.preventDefault(); ensureAudio(); joyId=e.pointerId; knob.classList.remove('back');
  try{ joy.setPointerCapture(e.pointerId); }catch(_){}
  const r=joy.getBoundingClientRect(); joyC={x:r.left+r.width/2, y:r.top+r.height/2, R:r.width/2}; joyMove(e);
});
joy.addEventListener('pointermove', e=>{ if(e.pointerId===joyId) joyMove(e); });
['pointerup','pointercancel','lostpointercapture'].forEach(ev=>joy.addEventListener(ev, e=>{
  if(e.pointerId!==joyId) return; joyId=null; J.l=J.r=J.u=J.d=false; knob.classList.add('back'); knob.style.transform='';
}));
joy.addEventListener('contextmenu', e=>e.preventDefault());

function bindBtn(el, down, up){
  el.addEventListener('pointerdown', e=>{ e.preventDefault(); ensureAudio(); el.classList.add('pressed'); down(); try{ el.setPointerCapture(e.pointerId); }catch(_){} });
  ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>el.addEventListener(ev, ()=>{ el.classList.remove('pressed'); up&&up(); }));
  el.addEventListener('contextmenu', e=>e.preventDefault());
}
bindBtn($('btnJump'), ()=>{ input.jumpQ=true; input.jumpHeld=true; }, ()=>{ input.jumpHeld=false; });
bindBtn($('btnAct'), ()=>{ input.actQ=true; });

window.addEventListener('keydown', e=>{
  const k=e.key, low=k.length===1?k.toLowerCase():k;
  if($('chapterIntro').style.display==='flex'){ $('chapterIntro').onclick && $('chapterIntro').onclick(); return; }
  if(dialogueOpen){
    if([' ','Enter','ArrowDown','ArrowRight','z'].includes(low)){ e.preventDefault(); if(!e.repeat) advanceDialogue(); }
    if(k==='Escape') stopDialogue();
    return;
  }
  if(winOpen){ if(k==='Escape'||low==='q'||low==='i'||low==='p') closeWin(); return; }
  if(!screenGame.classList.contains('active')) return;
  if(k==='ArrowLeft'||low==='a') K.l=true;
  if(k==='ArrowRight'||low==='d') K.r=true;
  if(k==='ArrowUp'||low==='w'){ e.preventDefault(); if(!K.u) input.upQ=true; K.u=true; }
  if(k==='ArrowDown'||low==='s'){ e.preventDefault(); K.d=true; }
  if(k===' '||k==='Alt'||low==='c'||low==='x'){ e.preventDefault(); if(!e.repeat) input.jumpQ=true; input.jumpHeld=true; }
  if(k==='Enter'||low==='z'||low==='e'||low==='y'){ e.preventDefault(); if(!e.repeat) input.actQ=true; }
  if(low==='q') openWin('quest');
  if(low==='i') openWin('bag');
  if(low==='p') openWin('profile');
});
window.addEventListener('keyup', e=>{
  const k=e.key, low=k.length===1?k.toLowerCase():k;
  if(k==='ArrowLeft'||low==='a') K.l=false;
  if(k==='ArrowRight'||low==='d') K.r=false;
  if(k==='ArrowUp'||low==='w') K.u=false;
  if(k==='ArrowDown'||low==='s') K.d=false;
  if(k===' '||k==='Alt'||low==='c'||low==='x') input.jumpHeld=false;
});
window.addEventListener('blur', clearInput);

stage.addEventListener('pointerdown', e=>{
  if(!map || paused()) return;
  ensureAudio();
  const r=stage.getBoundingClientRect();
  const wx=(e.clientX-r.left)/r.width*VW+cam.x, wy=(e.clientY-r.top)/r.height*VH+cam.y;
  const n=map.npcs.find(n=>npcVisible(n) && Math.abs(wx-n.x)<28 && wy<n.y+12 && wy>n.y-96);
  if(!n) return;
  if(Math.abs(P.x-n.x)<170 && Math.abs(P.y-n.y)<110) tryTalk(n);
  else toast('조금 더 가까이 가서 말을 걸어요');
});

/* ---------------- 대화창 ---------------- */
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
  clearInput();
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
  $('dlgNext').textContent = dlgQueue.length ? '다음 ▸' : '확인';
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
function stopDialogue(){ closeDialogueSilently(); chat('대화를 그만두었어요 — 다시 말을 걸면 이어서 들을 수 있어요','sys'); }
$('dialogueOverlay').addEventListener('click', e=>{ if(e.target.closest('#dlgBtns')) return; advanceDialogue(); });
$('dlgNext').addEventListener('click', e=>{ e.stopPropagation(); advanceDialogue(); });
$('dlgStop').addEventListener('click', e=>{ e.stopPropagation(); stopDialogue(); });

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
   메이플식 맵 · 플레이어
   ========================================================= */
const GRAV=0.55, JUMP_V=-9.7, MAX_FALL=10, CLIMB_V=2.2;
let run=null, map=null, P=null, currentChapterId=null, mode=null, globalT=0, transitioning=false;
const cam={x:0,y:0};

const TILES={
  street:  {top:'#f3dcb4', face:'#b68b63', edge:'#6d4c34'},
  alley:   {top:'#e6d2b2', face:'#907257', edge:'#56402f'},
  jokbal:  {top:'#ecc792', face:'#9c6642', edge:'#5e3a24'},
  sea:     {top:'#f8e8c4', face:'#d8b27c', edge:'#9c7a4c'},
  marble:  {top:'#fffaf2', face:'#eadfcc', edge:'#b89c6c', gold:true},
  hospital:{top:'#f6fbfc', face:'#d3e6ea', edge:'#7fa8b2'},
  womb:    {top:'#ffd3e5', face:'#e07aa8', edge:'#a8457a', soft:true}
};

function fieldOf(key,id){ return CHAPTER_FIELDS[key].fields[id]; }
function buildFieldMap(key, id){
  const f=fieldOf(key,id), ch=CHAPTER_FIELDS[key];
  const W=f.width, H=f.height||440, G=H-50;
  const plats=(f.platforms||[]).map(p=>({...p}));
  const surf=i=> (i!=null && plats[i]) ? plats[i].y : G;
  const m={ key, id, name:f.name, W, H, G, tiles:f.tiles||'street', bg:f.bg, flip:f.flip, filter:f.filter, petals:f.petals, lightBeam:f.lightBeam,
    platforms:plats, ropes:(f.ropes||[]).map(r=>({...r})), portals:[], npcs:[], pickups:[], mobs:[], gate:null };
  if(f.exitLeft) m.portals.push({x:44, y:G, to:f.exitLeft, side:'left', label:ch.fields[f.exitLeft].name.split(' · ')[0]});
  if(f.exitRight) m.portals.push({x:W-44, y:G, to:f.exitRight, side:'right', label:ch.fields[f.exitRight].name.split(' · ')[0], needsBirth:!!f.exitRightNeedsBirth});
  f.npcs.forEach(n=>m.npcs.push(Object.assign({}, n, {y:surf(n.plat)})));
  (f.sparkles||[]).forEach((s,i)=>{
    const id2=`${id}:${i}`; if(run.picked.includes(id2)) return;
    m.pickups.push({id:id2, x:s.x, y:surf(s.plat)-30, kind:'sparkle'});
  });
  return m;
}
function buildWombMap(){
  const W=WOMB.length, H=WOMB.height||460, G=H-50;
  const plats=WOMB.platforms.map(p=>({...p}));
  const m={ key:'womb', id:'womb', name:'태초의 바다', W, H, G, tiles:'womb', bg:'womb',
    platforms:plats, ropes:(WOMB.ropes||[]).map(r=>({...r})), portals:[], npcs:[], pickups:[], mobs:[], gate:{x:W-110, y:G} };
  WOMB.blocks.forEach((b,i)=>{
    const id='womb:'+i; if(run.picked.includes(id)) return;
    const p=plats.find(p=>b.x>=p.x1+10 && b.x<=p.x2-10);
    m.pickups.push({id, x:b.x, y:p?p.y-40:G-112, kind:'orb', msg:b.msg});
  });
  WOMB.enemies.forEach(e=>m.mobs.push({base:e.x, x:e.x, range:e.range, y:G, alive:true}));
  return m;
}

function birthNpcId(){ if(!run || run.key==='womb') return null; for(const f of Object.values(CHAPTER_FIELDS[run.key].fields)) for(const n of f.npcs) if(n.event==='birth') return n.id; return null; }
function isBorn(){ const id=birthNpcId(); return id ? run.talked.includes(id) : false; }
function playerKind(){ if(run.key==='womb') return 'baby'; const ch=CHAPTER_FIELDS[run.key]; return (ch.playerAfterBirth && isBorn()) ? ch.playerAfterBirth : ch.player; }
function playerName(){ if(run.key==='womb') return WOMB.playerName||PROFILE.nickname; const ch=CHAPTER_FIELDS[run.key]; return (ch.playerNameAfterBirth && isBorn()) ? ch.playerNameAfterBirth : (ch.playerName||PROFILE.name); }
function npcVisible(n){ return !(n.afterBirth && !isBorn()); }
function chapterTitle(){ return run.key==='womb' ? '태초의 바다' : CHAPTER_FIELDS[run.key].title; }
function totalNpc(){ if(run.key==='womb') return 0; const ch=CHAPTER_FIELDS[run.key]; return ch.order.reduce((s,f)=>s+ch.fields[f].npcs.length,0); }
function totalPickups(){ if(run.key==='womb') return WOMB.blocks.length; const ch=CHAPTER_FIELDS[run.key]; return ch.order.reduce((s,f)=>s+(ch.fields[f].sparkles||[]).length,0); }

function startChapter(key){
  run={ key, chapterId:currentChapterId, talked:(save.talked[key]||[]).slice(), picked:(save.picked[key]||[]).slice() };
  mode='play'; clearInput();
  $('chatLog').innerHTML='';
  if(key==='womb') loadMap(buildWombMap(), null);
  else loadMap(buildFieldMap(key, CHAPTER_FIELDS[key].order[0]), null);
  chat(`「${chapterTitle()}」에 들어왔어요`, 'sys');
  if(!save.tutorial){
    save.tutorial=1; persist();
    chat(TOUCH ? '왼쪽 조이스틱으로 걷고, ▲ 버튼으로 점프해요' : '← → 이동 · Space 점프 · Enter 대화', 'sys');
    chat(TOUCH ? '로프 앞에서 조이스틱을 위로 — 올라가요' : '로프·포탈 앞에서 ↑ · 발판에서 ↓+점프로 내려가요', 'sys');
  }
}
function loadMap(m, spawnSide){
  map=m; setBackground(m);
  let sx=80, sy=m.G;
  if(spawnSide){ const pt=m.portals.find(p=>p.side===spawnSide); if(pt){ sx=pt.x+(spawnSide==='left'?46:-46); sy=pt.y; } }
  P={ x:sx, y:sy, vx:0, vy:0, onGround:true, plat:-1, rope:null, ropeCD:0, facing:spawnSide==='right'?-1:1, t:0, hurt:0, dropT:0, dropPlat:-1, moving:false };
  fx=[]; dust=[]; petals=[]; floaters=[]; lvFx=null;
  $('mmTitle').textContent=`${m.key==='womb'?'🌊':CHAPTER_FIELDS[m.key].icon} ${m.name}`;
  fitStage(); updateCam(true); updateUI(); showMapBanner(m.name.split(' · ')[0]);
  screenPulse();
}
function usePortal(pt){
  if(transitioning) return;
  if(pt.needsBirth && !isBorn()){ toast('🚪 아직 문이 열리지 않았어요 — 「탄생의 순간」을 먼저 만나보세요'); sfx.no(); return; }
  transitioning=true; sfx.portal(); clearInput();
  $('fade').classList.add('on');
  setTimeout(()=>{
    loadMap(buildFieldMap(run.key, pt.to), pt.side==='right'?'left':'right');
    $('fade').classList.remove('on'); transitioning=false;
  }, 280);
}

function platAt(x,y){ return map.platforms.findIndex(p=>Math.abs(p.y-y)<1 && x>=p.x1-4 && x<=p.x2+4); }
function grabRope(r){ P.rope=r; P.x=r.x; P.y=Math.min(P.y, r.y2); P.vx=0; P.vy=0; P.onGround=false; }

let near=null;
function update(){
  globalT++; P.t++;
  const L=K.l||J.l, R=K.r||J.r, U=K.u||J.u, D=K.d||J.d;
  const ix=(R?1:0)-(L?1:0);
  const kind=playerKind(), speed=kind==='baby'?2.3:2.6;
  const jumpNow=input.jumpQ || input.jumpHeld; input.jumpQ=false;
  if(P.dropT>0) P.dropT--;
  if(P.hurt>0) P.hurt--;
  if(P.ropeCD>0) P.ropeCD--;

  if(P.rope){
    const r=P.rope; P.moving=false;
    if(U){ P.y-=CLIMB_V; P.moving=true; } else if(D){ P.y+=CLIMB_V; P.moving=true; }
    if(P.y<=r.y1){ P.y=r.y1; P.rope=null; P.onGround=true; P.plat=platAt(P.x,P.y); P.ropeCD=10; }
    else if(P.y>=r.y2+10){ P.rope=null; P.onGround=false; P.ropeCD=10; }
    else if(jumpNow && ix!==0){ P.rope=null; P.vy=-5.5; P.vx=ix*2.4; P.facing=ix; P.ropeCD=16; sfx.jump(); }
  }
  if(!P.rope){
    if(ix) P.facing=ix;
    if(P.onGround) P.vx=ix*speed; else P.vx+=(ix*speed-P.vx)*0.12;
    if(U && P.ropeCD<=0){ const r=map.ropes.find(r=>Math.abs(P.x-r.x)<14 && P.y>r.y1+4 && P.y<=r.y2+16); if(r) grabRope(r); }
    if(!P.rope && D && P.onGround && P.plat>=0 && P.ropeCD<=0){ const r=map.ropes.find(r=>Math.abs(P.x-r.x)<14 && Math.abs(P.y-r.y1)<3); if(r){ grabRope(r); P.y+=4; } }
  }
  if(!P.rope){
    if(jumpNow && P.onGround){
      if(D && P.plat>=0){ P.dropT=14; P.dropPlat=P.plat; P.onGround=false; P.vy=1.5; }
      else { P.vy=JUMP_V; P.onGround=false; sfx.jump(); }
    }
    const prevY=P.y, was=P.onGround;
    P.vy=Math.min(P.vy+GRAV, MAX_FALL);
    P.x=Math.max(14, Math.min(map.W-14, P.x+P.vx)); P.y+=P.vy;
    P.onGround=false;
    if(P.vy>=0){
      for(let i=0;i<map.platforms.length;i++){
        const p=map.platforms[i];
        if(P.dropT>0 && i===P.dropPlat) continue;
        if(P.x>=p.x1-4 && P.x<=p.x2+4 && prevY<=p.y+0.01 && P.y>=p.y){ P.y=p.y; P.vy=0; P.onGround=true; P.plat=i; break; }
      }
      if(!P.onGround && P.y>=map.G){ P.y=map.G; P.vy=0; P.onGround=true; P.plat=-1; }
    }
    if(P.onGround && !was && prevY<P.y-4){ for(let i=0;i<3;i++) dust.push({x:P.x+(i-1)*8, y:P.y-2, life:16, r:2+Math.random()*2}); }
    P.moving = P.onGround && ix!==0;
    if(P.moving && P.t%12===0){ dust.push({x:P.x-P.facing*8, y:P.y-2, life:18, r:3+Math.random()*2}); if(kind!=='baby') sfx.step(); }
  }

  // 몬스터 (태초의 바다 잔물결)
  map.mobs.forEach(e=>{
    if(!e.alive) return;
    e.x=e.base+Math.sin(globalT*0.02+e.base)*e.range;
    if(Math.abs(P.x-e.x)<24 && P.y>e.y-30 && P.y-60<e.y){
      if(P.vy>0 && P.y<e.y-8){
        e.alive=false; P.vy=JUMP_V*0.55; spawnFloatMsg(WOMB.enemyMsg); sfx.collect(); spawnBurst(e.x, e.y-10, '#a8d8ff', 12);
        grantOnce('mob:'+e.base, MOB_EXP);
      } else if(P.hurt<=0){
        P.hurt=50; P.x+= P.x<e.x?-30:30; P.vy=-4; P.onGround=false; P.rope=null; sfx.hit(); shakeScreen();
        addFloater(P.x, P.y-80, '앗!', '#ffb3cf', 13);
      }
    }
  });
  // 줍기
  map.pickups.forEach(pk=>{
    if(pk.got) return;
    if(Math.abs(P.x-pk.x)<22 && pk.y>P.y-74 && pk.y<P.y+8) collect(pk);
  });
  // 가까운 대상
  near=null; let nd=1e9;
  const floor=y=>!P.rope && Math.abs(P.y-y)<6;
  map.npcs.forEach(n=>{ if(!npcVisible(n)||!floor(n.y)) return; const d=Math.abs(P.x-n.x); if(d<52 && d<nd){ nd=d; near={type:'npc', o:n}; } });
  map.portals.forEach(pt=>{ if(!floor(pt.y)) return; const d=Math.abs(P.x-pt.x); if(d<32 && d<nd){ nd=d; near={type:'portal', o:pt}; } });
  if(map.gate && Math.abs(P.x-map.gate.x)<56 && floor(map.gate.y)) near={type:'gate', o:map.gate};

  if(input.actQ || (input.upQ && near && near.type!=='npc')) doAction();
  input.actQ=false; input.upQ=false;
  updateActBtn();
  updateFx(); if(map.petals) updatePetals();
  updateCam(false);
}
function doAction(){
  if(!near) return;
  if(near.type==='npc') tryTalk(near.o);
  else if(near.type==='portal') usePortal(near.o);
  else if(near.type==='gate'){ near=null; finishWomb(); }
}
let actKey='';
function updateActBtn(){
  let key='idle', icon='💬', label='대화', cls='idle';
  if(near){
    if(near.type==='npc'){ key='npc'; cls=''; }
    else if(near.type==='portal'){ key='portal'; icon='🌀'; label='이동'; cls=''; }
    else { key='gate'; icon='🌟'; label='세상으로'; cls='ready'; }
  }
  if(key===actKey) return; actKey=key;
  $('actIcon').textContent=icon; $('actLabel').textContent=label;
  $('btnAct').className='ctl '+cls;
}
function updateCam(snap){
  const tx = map.W<=VW ? (map.W-VW)/2 : Math.max(0, Math.min(P.x-VW*0.5, map.W-VW));
  const ty = map.H<=VH ? map.H-VH : Math.max(0, Math.min(P.y-VH*0.64, map.H-VH));
  if(snap){ cam.x=tx; cam.y=ty; } else { cam.x+=(tx-cam.x)*0.14; cam.y+=(ty-cam.y)*0.1; }
}

/* ---------------- 보상 ---------------- */
function grantOnce(id, exp){
  if(save.everPicked.includes(id)) return false;
  save.everPicked.push(id); gainExp(exp); return true;
}
function gainExp(n){
  const before=levelInfo(save.exp).lv;
  save.exp+=n; persist();
  const after=levelInfo(save.exp).lv;
  if(P && map) addFloater(P.x, P.y-92, `+${n} 추억`, '#ffe27a');
  chat(`추억을 얻었어요 (+${n})`, 'exp');
  if(after>before){
    lvFx={t:0}; sfx.levelup(); screenPulse();
    chat(`[레벨 업] ${PROFILE.name}의 서사시가 Lv.${after}이 되었어요!`, 'lv');
    const b=$('sbLv'); b.parentElement.classList.remove('flash'); void b.offsetWidth; b.parentElement.classList.add('flash');
  }
  updateStatus();
}
function giveItem(id){
  const it=ITEMS[id]; if(!it) return;
  if(!save.items.includes(id)){ save.items.push(id); persist(); }
  chat(`[획득] ${it.icon} ${it.name}`, 'item');
  toast(`${it.icon} ${it.name} 획득 — 🎒 가방에서 볼 수 있어요`, 2600);
  const b=$('mBag'); b.classList.remove('flash'); void b.offsetWidth; b.classList.add('flash');
}
function collect(pk){
  pk.got=true; run.picked.push(pk.id); save.picked[run.key]=run.picked.slice(); persist();
  sfx.pick(); spawnBurst(pk.x, pk.y, pk.kind==='orb'?'#ffe27a':'#fff2b0', pk.kind==='orb'?16:8);
  if(pk.kind==='orb'){ spawnFloatMsg(pk.msg); screenPulse(); }
  if(!grantOnce(pk.id, pk.kind==='orb'?ORB_EXP:SPARKLE_EXP)) addFloater(pk.x, pk.y-14, pk.kind==='orb'?'기억':'✦', '#fff2b0', 12);
  updateUI();
}

/* ---------------- NPC 대화 ---------------- */
function tryTalk(npc){
  sfx.interact(); spawnBurst(npc.x, npc.y-50, '#ffe27a', 12);
  if(npc.x!==P.x) P.facing = npc.x>P.x?1:-1;
  showDialogue(npc.lines, ()=>onNpcDone(npc));
}
function onNpcDone(npc){
  const first=!run.talked.includes(npc.id);
  if(first){ run.talked.push(npc.id); save.talked[run.key]=run.talked.slice(); persist(); }
  if(!save.everTalked.includes(npc.id)){
    save.everTalked.push(npc.id); persist();
    chat(`[퀘스트 완료] ${npc.label}`, 'quest'); sfx.collect(); spawnBurst(P.x, P.y-50, '#7fd1b9', 18);
    gainExp(QUEST_EXP);
    (npc.reward||[]).forEach(giveItem);
  }
  updateUI();
  if(npc.event==='birth' && first){ triggerBirth(()=>{ updateUI(); chat(`이제 ${PROFILE.name}이의 눈으로 세상을 봐요`, 'sys'); checkClear(); }); return; }
  checkClear();
}
function checkClear(){
  if(run.key==='womb') return;
  if(run.talked.length>=totalNpc()) completeChapter(CHAPTER_FIELDS[run.key].cardReward);
}

/* ---------------- 탄생 · 클리어 ---------------- */
function triggerBirth(after){
  sfx.clear(); shakeScreen();
  $('birthFlash').style.opacity=1;
  setTimeout(()=>{ $('birthText').style.display='flex'; }, 900);
  $('birthBtn').onclick=()=>{ $('birthText').style.display='none'; $('birthFlash').style.opacity=0; after && after(); };
}
function finishWomb(){
  if(run.ending) return; run.ending=true; transitioning=true;
  sfx.clear(); shakeScreen();
  const f=$('birthFlash'); f.style.opacity=1;
  setTimeout(()=>{ f.style.opacity=0; transitioning=false; completeChapter(WOMB.cardReward); }, 900);
}
function completeChapter(reward){
  const firstClear=!save.cleared.includes(currentChapterId);
  if(firstClear) save.cleared.push(currentChapterId);
  save.talked[run.key]=[]; save.picked[run.key]=[];
  persist();
  if(firstClear) gainExp(CLEAR_EXP);
  sfx.clear(); shakeScreen();
  $('cardIcon').textContent=reward.icon; $('cardName').textContent=reward.name; $('cardEpithet').textContent=reward.epithet||'';
  const cs=$('cardScreen');
  cs.querySelectorAll('.memory-card,.stars span,p.desc,button').forEach(n=>{ n.style.animation='none'; void n.offsetWidth; n.style.animation=''; });
  setTimeout(()=>{ cs.style.display='flex'; }, 600);
}
$('cardCloseBtn').addEventListener('click', ()=>{ $('cardScreen').style.display='none'; backToMap(); });

/* ---------------- 상태바 · 퀘스트 알림 · 미니맵 ---------------- */
function updateStatus(){
  const li=levelInfo(save.exp), pct=li.cur/li.need*100;
  $('sbLv').textContent=li.lv; $('sbName').textContent=PROFILE.name; $('sbTitle').textContent=PROFILE.title;
  $('expFill').style.width=pct+'%';
  $('expText').textContent=`EXP ${li.cur} / ${li.need}  [${pct.toFixed(2)}%]`;
  if(!run) return;
  if(run.key==='womb'){
    const n=run.picked.length, t=WOMB.blocks.length;
    $('hpLabel').textContent='기억'; $('hpFill').style.width=(n/t*100)+'%'; $('hpText').textContent=`${n} / ${t}`;
    const prog=P?Math.round(P.x/WOMB.length*100):0;
    $('mpLabel').textContent='여정'; $('mpFill').style.width=prog+'%'; $('mpText').textContent=`${prog}%`;
  } else {
    const a=run.talked.length, b=totalNpc(), c=run.picked.length, d=totalPickups();
    $('hpLabel').textContent='이야기'; $('hpFill').style.width=(a/b*100)+'%'; $('hpText').textContent=`${a} / ${b}`;
    $('mpLabel').textContent='조각'; $('mpFill').style.width=(d?c/d*100:0)+'%'; $('mpText').textContent=`${c} / ${d}`;
  }
}
function updateQuestHelper(){
  const box=$('questHelper');
  let html=`<div class="qh-title">📜 ${escapeHtml(chapterTitle())} <span>▾</span></div>`;
  if(run.key==='womb'){
    html+=`<div class="qh-item ${run.picked.length>=WOMB.blocks.length?'done':''}">${run.picked.length>=WOMB.blocks.length?'✓':'◇'} 기억 구슬 ${run.picked.length}/${WOMB.blocks.length}</div>`;
    html+=`<div class="qh-item">◇ 빛의 문까지 헤엄치기</div>`;
  } else {
    map.npcs.forEach(n=>{
      if(!npcVisible(n)){ html+=`<div class="qh-item lock">🔒 ???</div>`; return; }
      const d=run.talked.includes(n.id);
      html+=`<div class="qh-item ${d?'done':''}">${d?'✓':'◇'} ${escapeHtml(n.label)}</div>`;
    });
    const ch=CHAPTER_FIELDS[run.key];
    const rest=ch.order.filter(id=>id!==map.id).reduce((s,id)=>s+ch.fields[id].npcs.filter(n=>!run.talked.includes(n.id)).length,0);
    if(rest) html+=`<div class="qh-more">다른 장소에 이야기 ${rest}개가 더 있어요</div>`;
  }
  box.innerHTML=html;
}
$('questHelper').addEventListener('click', e=>{ if(e.target.closest('.qh-title')) $('questHelper').classList.toggle('collapsed'); });
function updateUI(){ updateStatus(); if(run && map) updateQuestHelper(); }

let mmW=150, mmH=52;
function sizeMinimap(){
  if(!map) return;
  mmW = portraitLayout() ? 118 : 150;
  mmH = Math.round(Math.max(34, Math.min(64, mmW*map.H/map.W*1.6)));
  const dpr=Math.min(window.devicePixelRatio||1,2);
  miniCanvas.style.width=mmW+'px'; miniCanvas.style.height=mmH+'px';
  miniCanvas.width=mmW*dpr; miniCanvas.height=mmH*dpr; mctx.setTransform(dpr,0,0,dpr,0,0);
}
function drawMinimap(){
  const m=map; if(!m) return;
  const sx=(mmW-8)/m.W, sy=(mmH-8)/m.H, ox=4, oy=4;
  mctx.clearRect(0,0,mmW,mmH);
  mctx.strokeStyle='rgba(203,184,232,.9)'; mctx.lineWidth=1.5;
  mctx.beginPath(); mctx.moveTo(ox, oy+m.G*sy); mctx.lineTo(ox+m.W*sx, oy+m.G*sy);
  m.platforms.forEach(p=>{ mctx.moveTo(ox+p.x1*sx, oy+p.y*sy); mctx.lineTo(ox+p.x2*sx, oy+p.y*sy); });
  mctx.stroke();
  mctx.strokeStyle='rgba(203,184,232,.55)'; mctx.lineWidth=1; mctx.beginPath();
  m.ropes.forEach(r=>{ mctx.moveTo(ox+r.x*sx, oy+r.y1*sy); mctx.lineTo(ox+r.x*sx, oy+r.y2*sy); }); mctx.stroke();
  const dot=(x,y,c,r=2.4)=>{ mctx.fillStyle=c; mctx.beginPath(); mctx.arc(ox+x*sx, oy+y*sy-2, r, 0, Math.PI*2); mctx.fill(); };
  m.portals.forEach(p=>dot(p.x,p.y,(p.needsBirth&&!isBorn())?'#888':'#6fc3ff',2.8));
  if(m.gate) dot(m.gate.x, m.gate.y, '#fff', 3.2);
  m.npcs.forEach(n=>{ if(npcVisible(n)) dot(n.x, n.y, run.talked.includes(n.id)?'#7fd1b9':'#ffd23f'); });
  dot(P.x, P.y, '#fff', 3.6); dot(P.x, P.y, '#ffb800', 2.6);
}

/* ---------------- 창 (퀘스트 · 가방 · 프로필) ---------------- */
let winOpen=false, bagSel=null;
function openWin(kind){
  if(dialogueOpen) return;
  sfx.tap(); clearInput();
  winOpen=kind; $('win').style.display='flex';
  renderWin();
}
function closeWin(){ winOpen=false; $('win').style.display='none'; }
$('winClose').addEventListener('click', closeWin);
$('win').addEventListener('click', e=>{ if(e.target.id==='win') closeWin(); });
$('mQuest').addEventListener('click', ()=>openWin('quest'));
$('mBag').addEventListener('click', ()=>openWin('bag'));
$('mProfile').addEventListener('click', ()=>openWin('profile'));
function allBagItems(){
  const list=save.items.filter(id=>ITEMS[id]).map(id=>({id, ...ITEMS[id]}));
  CHAPTERS.forEach(ch=>{
    if(!save.cleared.includes(ch.id)) return;
    const r = ch.launch==='womb' ? WOMB.cardReward : CHAPTER_FIELDS[ch.launch]?.cardReward;
    if(r) list.push({id:'card'+ch.id, icon:r.icon, name:`메모리 카드 · ${r.name}`, desc:`${r.epithet}\n— CHAPTER ${String(ch.id).padStart(2,'0')} 「${ch.title}」 클리어`});
  });
  return list;
}
function renderWin(){
  const body=$('winBody');
  if(winOpen==='bag'){
    $('winTitle').textContent='🎒 가방';
    const items=allBagItems(), slots=Math.max(15, Math.ceil(items.length/5)*5);
    if(bagSel && !items.find(i=>i.id===bagSel)) bagSel=null;
    let g='<div class="bag-grid">';
    for(let i=0;i<slots;i++){ const it=items[i]; g+= it ? `<button class="slot ${bagSel===it.id?'sel':''}" data-id="${it.id}" aria-label="${escapeHtml(it.name)}">${it.icon}</button>` : `<div class="slot empty"></div>`; }
    g+='</div>';
    const sel=items.find(i=>i.id===bagSel);
    g+= `<div class="item-detail">${sel ? `<b>${sel.icon} ${escapeHtml(sel.name)}</b>\n${escapeHtml(sel.desc)}` : (items.length?'아이템을 눌러 추억을 꺼내보세요.':'아직 비어 있어요. 이야기를 듣고 챕터를 마치면 추억이 쌓여요.')}</div>`;
    body.innerHTML=g;
    body.querySelectorAll('.slot[data-id]').forEach(b=>b.addEventListener('click', ()=>{ bagSel=b.dataset.id; sfx.tap(); renderWin(); }));
  } else if(winOpen==='quest'){
    $('winTitle').textContent='📜 퀘스트';
    let h='';
    CHAPTERS.forEach(ch=>{
      const cleared=save.cleared.includes(ch.id);
      const state = ch.status==='soon' ? '<span class="q-soon">곧 열려요</span>' : cleared ? '<span class="q-done">완료</span>' : '<span class="q-prog">진행 중</span>';
      h+=`<div class="q-ch"><div class="q-head"><b>${ch.icon} ${String(ch.id).padStart(2,'0')} · ${escapeHtml(ch.title)}</b>${state}</div>`;
      if(ch.status!=='soon' && ch.launch!=='womb'){
        const cf=CHAPTER_FIELDS[ch.launch], talked = (run && run.key===ch.launch) ? run.talked : (save.talked[ch.launch]||[]);
        cf.order.forEach(fid=>{ cf.fields[fid].npcs.forEach(n=>{
          const ever=save.everTalked.includes(n.id), done=talked.includes(n.id)||ever;
          const hidden = n.afterBirth && !ever && !done;
          h+=`<div class="q-row ${done?'done':''}"><span>${done?'✓':'◇'} ${hidden?'???':escapeHtml(n.label)}</span><small>${escapeHtml(cf.fields[fid].name.split(' · ')[0])}</small></div>`;
        }); });
      } else if(ch.launch==='womb'){
        const got=(run && run.key==='womb') ? run.picked.length : (save.picked.womb||[]).length;
        h+=`<div class="q-row"><span>◇ 기억 구슬 모으기</span><small>${cleared&&!got?'완료':got+' / '+WOMB.blocks.length}</small></div><div class="q-row"><span>◇ 빛의 문까지 헤엄치기</span><small>${cleared?'완료':''}</small></div>`;
      } else h+=`<div class="q-row"><span>${escapeHtml(ch.subtitle)}</span></div>`;
      h+='</div>';
    });
    body.innerHTML=h;
  } else if(winOpen==='profile'){
    $('winTitle').textContent='👶 프로필';
    const li=levelInfo(save.exp), days=$('dday').textContent;
    body.innerHTML=`<div class="pf-top"><div class="pf-orb"><img src="images/ian.webp" alt=""></div>
      <div><div class="pf-name">${escapeHtml(PROFILE.name)} <small>${escapeHtml(PROFILE.english)}</small></div>
      <div class="pf-sub">Lv.${li.lv} · ${escapeHtml(PROFILE.title)} · D+${days}</div></div></div>
      <table class="pf-table">
        <tr><th>태어난 날</th><td>${escapeHtml(PROFILE.birth)}</td></tr>
        <tr><th>태어난 곳</th><td>${escapeHtml(PROFILE.place)}</td></tr>
        <tr><th>몸무게 · 키</th><td>${escapeHtml(PROFILE.weight)} · ${escapeHtml(PROFILE.height)}</td></tr>
        <tr><th>태명</th><td>${escapeHtml(PROFILE.nickname)}</td></tr>
        <tr><th>이름의 뜻</th><td>${escapeHtml(PROFILE.meaning)}</td></tr>
        <tr><th>모은 추억</th><td>${save.exp} · 아이템 ${allBagItems().length}개</td></tr>
      </table>`;
  }
}

/* =========================================================
   그리기
   ========================================================= */
function tileset(){ return TILES[map.tiles]||TILES.street; }
function drawPlatform(p){
  const T=tileset(), x=p.x1, w=p.x2-p.x1, y=p.y;
  if(p.cloud){
    ctx.fillStyle='rgba(255,255,255,.18)'; ctx.beginPath(); ctx.ellipse(x+w/2, y+14, w/2+10, 18, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle='#fffdf6'; ctx.strokeStyle='rgba(200,180,140,.8)'; ctx.lineWidth=1.5;
    ctx.beginPath();
    for(let i=0;i<=5;i++){ const cx=x+i*w/5, r=13+(i%2)*5; ctx.moveTo(cx+r,y+8); ctx.arc(cx,y+8,r,0,Math.PI*2); }
    ctx.fill(); ctx.stroke();
    ctx.fillStyle='#fffdf6'; ctx.fillRect(x-2,y+2,w+4,12);
    return;
  }
  ctx.fillStyle='rgba(20,10,30,.18)'; rr(x+6,y+18,w-12,9,4); ctx.fill();
  if(T.soft){
    ctx.fillStyle=T.face; rr(x,y-2,w,22,11); ctx.fill();
    ctx.fillStyle=T.top; rr(x+4,y-2,w-8,8,4); ctx.fill();
    ctx.strokeStyle=T.edge; ctx.lineWidth=1.5; rr(x,y-2,w,22,11); ctx.stroke();
    return;
  }
  ctx.fillStyle=T.face; rr(x,y-2,w,22,5); ctx.fill();
  ctx.strokeStyle=T.edge; ctx.globalAlpha=.3; ctx.lineWidth=1; ctx.beginPath();
  for(let sx=x+26; sx<x+w-6; sx+=26){ ctx.moveTo(sx,y+7); ctx.lineTo(sx,y+19); }
  ctx.stroke(); ctx.globalAlpha=1;
  ctx.fillStyle=T.top; rr(x,y-2,w,8,4); ctx.fill();
  if(T.gold){ ctx.strokeStyle='#e3c07a'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x+4,y+8); ctx.lineTo(x+w-4,y+8); ctx.stroke(); }
  ctx.strokeStyle=T.edge; ctx.lineWidth=1.5; rr(x,y-2,w,22,5); ctx.stroke();
}
function drawGround(){
  const T=tileset(), G=map.G, W=map.W, bot=map.H+80;
  if(T.soft){
    ctx.fillStyle='rgba(200,80,125,.7)'; ctx.beginPath(); ctx.moveTo(-20,bot);
    for(let x=-20;x<=W+20;x+=16) ctx.lineTo(x, G+2+Math.sin(x*0.05+globalT*0.04)*3);
    ctx.lineTo(W+20,bot); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.45)'; ctx.lineWidth=3; ctx.beginPath();
    for(let x=-20;x<=W+20;x+=16){ const y=G+2+Math.sin(x*0.05+globalT*0.04)*3; x===-20?ctx.moveTo(x,y):ctx.lineTo(x,y); }
    ctx.stroke(); return;
  }
  ctx.fillStyle=T.face; ctx.fillRect(-20,G,W+40,bot-G);
  ctx.strokeStyle=T.edge; ctx.globalAlpha=.22; ctx.lineWidth=1; ctx.beginPath();
  for(let x=0;x<W;x+=36){ ctx.moveTo(x,G+8); ctx.lineTo(x,G+26); ctx.moveTo(x+18,G+27); ctx.lineTo(x+18,G+48); }
  ctx.moveTo(-20,G+27); ctx.lineTo(W+20,G+27);
  ctx.stroke(); ctx.globalAlpha=1;
  ctx.fillStyle=T.top; ctx.fillRect(-20,G-2,W+40,9);
  if(T.gold){ ctx.fillStyle='#e3c07a'; ctx.fillRect(-20,G+7,W+40,2); }
  ctx.fillStyle=T.edge; ctx.fillRect(-20,G-3,W+40,1.5);
}
function drawRope(r){
  if(r.cord){
    ctx.lineCap='round'; ctx.strokeStyle='#b8507e'; ctx.lineWidth=7; ctx.beginPath();
    for(let y=r.y1; y<=r.y2; y+=6){ const x=r.x+Math.sin(y*0.06+globalT*0.05)*3; y===r.y1?ctx.moveTo(x,y):ctx.lineTo(x,y); } ctx.stroke();
    ctx.strokeStyle='#ffb6d2'; ctx.lineWidth=3; ctx.stroke();
    return;
  }
  ctx.lineCap='round'; ctx.strokeStyle='#6d4c34'; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(r.x,r.y1+4); ctx.lineTo(r.x,r.y2); ctx.stroke();
  ctx.strokeStyle='#c49a64'; ctx.lineWidth=3; ctx.stroke();
  ctx.fillStyle='#8a6440'; for(let y=r.y1+14; y<r.y2; y+=14){ ctx.beginPath(); ctx.ellipse(r.x,y,3.4,2.2,0,0,Math.PI*2); ctx.fill(); }
}
function pillLabel(text, x, y, bg='rgba(18,13,38,.78)', fg='#fff'){
  ctx.font=`bold 11px ${SANS}`; ctx.textAlign='center'; ctx.textBaseline='middle';
  const w=ctx.measureText(text).width+14;
  ctx.fillStyle=bg; rr(x-w/2, y-9, w, 18, 9); ctx.fill();
  ctx.fillStyle=fg; ctx.fillText(text, x, y+0.5);
}
function drawPortal(pt){
  const locked=pt.needsBirth && !isBorn(), cx=pt.x, cy=pt.y-40, t=globalT;
  const g=ctx.createRadialGradient(cx,cy,4,cx,cy,44);
  g.addColorStop(0, locked?'rgba(210,210,220,.55)':'rgba(210,244,255,.9)'); g.addColorStop(1,'rgba(120,180,255,0)');
  ctx.fillStyle=g; ctx.beginPath(); ctx.ellipse(cx,cy,28,44,0,0,Math.PI*2); ctx.fill();
  for(let i=0;i<3;i++){
    const ph=t*0.07*(i%2?1:-1)+i*2.1, rx=18-i*4, ry=36-i*8;
    ctx.strokeStyle = locked ? 'rgba(230,230,240,.5)' : (i===1?'rgba(255,236,170,.95)':'rgba(190,236,255,.95)');
    ctx.lineWidth=2.2; ctx.beginPath(); ctx.ellipse(cx,cy,rx,ry,0,ph,ph+Math.PI*1.3); ctx.stroke();
  }
  if(!locked) for(let i=0;i<4;i++){ const a=t*0.05+i*1.57, px=cx+Math.cos(a)*14, py=cy+Math.sin(a)*30; ctx.fillStyle='rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(px,py,1.8,0,Math.PI*2); ctx.fill(); }
  const txt=(locked?'🔒 ':'')+(pt.side==='left'?'◀ ':'')+pt.label+(pt.side==='right'?' ▶':'');
  pillLabel(txt, cx + (pt.side==='left'?20:-20), cy-56);
}
function drawGate(g0){
  const x=g0.x, y=g0.y;
  const g=ctx.createRadialGradient(x,y-90,10,x,y-90,170); g.addColorStop(0,'rgba(255,255,255,.95)'); g.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=g; ctx.fillRect(x-170,y-260,340,300);
  ctx.strokeStyle='rgba(255,255,255,.9)'; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(x,y-20,58,Math.PI,0); ctx.moveTo(x-58,y-20); ctx.lineTo(x-58,y); ctx.moveTo(x+58,y-20); ctx.lineTo(x+58,y); ctx.stroke();
  pillLabel('🌟 빛의 문', x, y-100, 'rgba(120,40,90,.75)', '#fff6d8');
}
function drawPickup(pk){
  if(pk.got) return;
  const b=Math.sin((globalT+pk.x)*0.07)*3, x=pk.x, y=pk.y+b;
  if(pk.kind==='orb'){
    const g=ctx.createRadialGradient(x,y,3,x,y,30); g.addColorStop(0,'rgba(255,230,140,.75)'); g.addColorStop(1,'rgba(255,230,140,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,30,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ffe27a'; ctx.beginPath(); ctx.arc(x,y,15,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.8)'; ctx.lineWidth=2; ctx.stroke();
    ctx.fillStyle='#8a4a10'; ctx.font=`bold 15px ${SANS}`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('?', x, y+1);
    return;
  }
  const s=6+Math.sin(globalT*0.12+pk.x)*1.5;
  const g=ctx.createRadialGradient(x,y,1,x,y,16); g.addColorStop(0,'rgba(255,246,200,.9)'); g.addColorStop(1,'rgba(255,230,140,0)');
  ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,16,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#fff6c8'; ctx.beginPath();
  ctx.moveTo(x,y-s*1.6); ctx.quadraticCurveTo(x+1.5,y-1.5,x+s*1.6,y); ctx.quadraticCurveTo(x+1.5,y+1.5,x,y+s*1.6);
  ctx.quadraticCurveTo(x-1.5,y+1.5,x-s*1.6,y); ctx.quadraticCurveTo(x-1.5,y-1.5,x,y-s*1.6); ctx.fill();
}
function drawMob(e){
  if(!e.alive) return;
  const x=e.x, y=e.y, sq=Math.sin(globalT*0.15+e.base)*1.5;
  ctx.fillStyle='rgba(180,140,220,.9)'; ctx.strokeStyle='rgba(70,40,90,.75)'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(x-18,y); ctx.quadraticCurveTo(x-18,y-24-sq,x,y-24-sq); ctx.quadraticCurveTo(x+18,y-24-sq,x+18,y); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#3a2a45'; ctx.beginPath(); ctx.arc(x-5,y-12,2,0,Math.PI*2); ctx.arc(x+5,y-12,2,0,Math.PI*2); ctx.fill();
  pillLabel('잔물결', x, y+12, 'rgba(18,13,38,.6)', '#e8dcff');
}
function nameTag(x, y, text, player){
  ctx.font=`bold 11px ${SANS}`; ctx.textAlign='center'; ctx.textBaseline='middle';
  const w=ctx.measureText(text).width+12;
  ctx.fillStyle= player ? 'rgba(12,10,30,.85)' : 'rgba(12,10,30,.66)'; rr(x-w/2, y+3, w, 16, 3); ctx.fill();
  if(player){ ctx.strokeStyle='rgba(242,198,109,.8)'; ctx.lineWidth=1; rr(x-w/2, y+3, w, 16, 3); ctx.stroke(); }
  ctx.fillStyle= player ? '#ffffff' : '#ffe27a'; ctx.fillText(text, x, y+11.5);
}
function drawNpc(n){
  if(!npcVisible(n)) return;
  const sx=n.x-cam.x; if(sx<-90||sx>VW+90) return;
  const done=run.talked.includes(n.id), isNear=near && near.o===n;
  if(n.object) drawObject(n.x, n.y, n.object, globalT);
  else drawChibi(n.x, n.y, PALETTES[n.palette]||PALETTES.suit, {t:globalT, moving:false, facingRight:P.x>n.x});
  const head = n.object ? n.y-84 : n.y-((n.palette==='chef'||n.palette==='nurse'?78:70)*CH_SCALE+14);
  drawMarker(n.x, head, globalT, done, isNear, null);
  nameTag(n.x, n.y, n.label, false);
}
function drawPlayer(){
  const k=playerKind(), blink=P.hurt>0 && Math.floor(P.hurt/4)%2===0;
  if(!blink){
    if(k==='baby'){ if(P.onGround) shadow(P.x, P.y+1, 12); drawBaby(P.x, P.y-30, P.t, P.moving||!!P.rope, P.facing>0, 1.1); }
    else drawChibi(P.x, P.y, PALETTES.dad, {t:P.t, moving:P.moving, facingRight:P.facing>0});
  }
  nameTag(P.x, P.y, playerName(), true);
}
function drawWombBg(camX){
  let g=ctx.createRadialGradient(VW/2,VH/2,40,VW/2,VH/2,Math.max(VW,VH)*0.75);
  g.addColorStop(0,'#ffa6cf'); g.addColorStop(0.55,'#c9578f'); g.addColorStop(1,'#4a1840');
  ctx.fillStyle=g; ctx.fillRect(0,0,VW,VH);
  const beat=Math.max(0, Math.sin(globalT*0.09))**8;
  ctx.fillStyle=`rgba(255,220,235,${0.08+beat*0.12})`; ctx.fillRect(0,0,VW,VH);
  for(let i=0;i<24;i++){
    const x=((i*137 - camX*0.3)%(VW+40)+VW+40)%(VW+40)-20, y=VH-((globalT*(0.3+(i%5)*0.12)+i*53)%(VH+20));
    ctx.fillStyle='rgba(255,255,255,.33)'; ctx.beginPath(); ctx.arc(x,y,2+(i%4),0,Math.PI*2); ctx.fill();
  }
}
function draw(){
  ctx.clearRect(0,0,VW,VH);
  const cx=cam.x, cy=cam.y;
  if(map.bg==='sea') drawSeaBg(cx, globalT);
  else if(map.bg==='womb') drawWombBg(cx);
  panParallax(map.W>VW ? cx/(map.W-VW) : 0.5, map.H>VH ? cy/(map.H-VH) : 1);
  if(map.lightBeam) drawLightBeam(globalT, isBorn());
  ctx.save(); ctx.translate(-cx,-cy);
  map.ropes.forEach(drawRope);
  map.platforms.forEach(drawPlatform);
  drawGround();
  map.portals.forEach(drawPortal);
  if(map.gate) drawGate(map.gate);
  map.pickups.forEach(drawPickup);
  map.npcs.forEach(drawNpc);
  map.mobs.forEach(drawMob);
  drawLevelUp();
  drawPlayer();
  drawFx(); drawFloaters();
  ctx.restore();
  if(map.petals) drawPetals();
}

/* ---------------- 메인 루프 (고정 60fps 스텝) ---------------- */
function paused(){ return dialogueOpen || winOpen || transitioning || $('birthFlash').style.opacity==='1' || $('birthText').style.display==='flex' || $('cardScreen').style.display==='flex' || $('chapterIntro').style.display==='flex'; }
let last=performance.now(), acc=0, frame=0;
function loop(now){
  acc+=Math.min(100, now-last); last=now;
  while(acc>=16.67){
    acc-=16.67;
    if(mode==='play' && map && !paused()) update();
  }
  if(mode==='play' && map){
    draw(); frame++;
    if(frame%4===0) drawMinimap();
    if(frame%10===0 && run.key==='womb') updateStatus();
  }
  requestAnimationFrame(loop);
}
updateStatus();
requestAnimationFrame(loop);
if(/[?&]debug/.test(location.search)) window.__dbg={ get P(){return P;}, get map(){return map;}, get run(){return run;}, get near(){return near;}, get save(){return save;}, tp(x,y){ P.x=x; P.y=y; P.vy=0; P.onGround=true; P.rope=null; P.plat=platAt(x,y); updateCam(true); } };

})();

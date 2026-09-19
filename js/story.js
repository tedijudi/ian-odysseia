/* ============================================================
   ✏️ STORY — 이야기·인물·장소 데이터 (대사 수정은 이 파일만 고치면 됩니다)
   - 《단어》 로 감싸면 금색 강조
   - \n 은 줄바꿈, \n\n 은 한 줄 띄우기
   - 맵 좌표: x 는 왼쪽부터 px, platforms 의 y 는 발판 윗면 높이(작을수록 위)
   - npc 의 plat:숫자 → 그 번호 발판 위에 서 있음 (없으면 땅)
   - reward:['아이템id'] → 대화를 끝내면 가방에 들어가는 아이템 (ITEMS 추억 · EQUIPS 장비)
   - mobs:[{type:'cloud', x, plat, range}] → 몬스터 (MONSTERS 참고, 쓰러뜨리면 다시 나타나요)
   - riddle 줄: choices:[...], answer:정답번호(0부터), right/wrong: 맞췄을 때·틀렸을 때 대사
   ============================================================ */

/* 이안이 프로필 (프로필 창) */
const PROFILE = {
  name:"이안", english:"Ian", title:"작은 영웅", nickname:"찰떡이",
  birth:"2026년 3월 11일 오전 10시 15분", weight:"3.36kg", height:"47.5cm",
  place:"안산우성여성병원", meaning:"기쁘고 평안하라"
};

/* 가방 아이템 */
const ITEMS = {
  plate:  { icon:"🍽️", name:"작은 접시", desc:"'저... 이거 좀 드세요.'\n족발집에서 조심스레 건네받은 접시 하나.\n두 사람의 오디세이아가 시작된 증표." },
  jeju:   { icon:"🚗", name:"제주 해안도로 사진", desc:"지붕을 활짝 연 오픈카 위로 쏟아지던 햇살.\n매년 서로의 생일마다 반복된, 두 사람만의 작은 의식." },
  halla:  { icon:"⛰️", name:"한라산 정상 사진", desc:"함께 내려다본 구름바다.\n숨이 턱까지 차올라도 손을 놓지 않았던 날." },
  surf:   { icon:"🏄", name:"강원도 파도의 기억", desc:"서투른 몸짓으로 파도를 타던 날들.\n넘어지고 물을 먹으면서도 마주 보며 웃었다." },
  album:  { icon:"📱", name:"휴대폰 사진첩", desc:"어느새 가득 쌓인 두 사람의 사진.\n'우리, 진짜 많이도 웃었다.'" },
  oracle: { icon:"📜", name:"이름의 신탁", desc:"이안 — 기쁘고 평안하라.\n영문으로는 Ian.\n세상에서 유일한 존재가 된 날 받은 이름." }
};

/* 재료 (몬스터가 떨어뜨리는 것, 개수로 쌓여요) */
const MATS = {
  courage: { icon:"💗", name:"용기 조각", desc:"레테의 안개가 걷히며 남긴 작은 용기.\n모아두면 이타카 마을 대장간에서 쓸 수 있어요 (곧 열려요)." }
};

/* 장비 — slot: weapon 무기 · hat 모자 · clothes 옷 · shoes 신발 · acc 장신구
   stats: atk 공격력 · def 방어력 · hp 최대 HP · speed 이동속도(%) */
const EQUIPS = {
  eros_bow:    { slot:'weapon',  icon:"🏹", name:"에로스의 활",          stats:{atk:10},        desc:"심장에 박혔던 사랑의 화살이 활이 되었다.\n망설임을 꿰뚫는 첫 번째 무기." },
  war_note:    { slot:'acc',     icon:"📝", name:"오디세우스의 작전 노트", stats:{atk:3},         desc:"트로이의 목마를 설계하듯 치밀하게 적은 작전.\n첫 줄: '오늘, 다 같이 족발이나 어때요?'" },
  heart_shoes: { slot:'shoes',   icon:"👟", name:"두근두근 운동화",       stats:{speed:12},      desc:"'잘 좀 해봐, 총각.'\n응원을 들은 발걸음이 저절로 빨라진다." },
  laurel:      { slot:'hat',     icon:"🌿", name:"스핑크스의 월계관",     stats:{def:3, hp:20},  desc:"세 개의 수수께끼를 푼 자에게 주어지는 관.\n망설임을 고개에 두고 온 증표." },
  aidos_cloak: { slot:'clothes', icon:"🧥", name:"아이도스의 망토",       stats:{def:2, hp:10},  desc:"수줍음의 정령이 벗어두고 간 망토.\n가끔 아이도스의 그림자가 떨어뜨려요." }
};

/* 몬스터 — 레테의 안개가 추억을 삼켜 만든 것들. 쓰러뜨리면 추억 조각으로 돌아와요.
   hp 체력 · atk 부딪혔을 때 피해 · exp 추억 · speed 걷는 속도 · drop 떨어뜨리는 것(rate 확률) */
const MONSTERS = {
  cloud:  { name:"망설임 구름",     look:'cloud',  hp:30, atk:6, exp:6,  speed:0.55,
            drops:[{mat:'courage', rate:0.4}] },
  shadow: { name:"아이도스의 그림자", look:'shadow', hp:55, atk:9, exp:10, speed:0.8,
            drops:[{mat:'courage', rate:0.55}, {equip:'aidos_cloak', rate:0.1}] }
};

const BIRTH = {
  date: "2026-03-11",
  title: "✨ 생명의 여신이 문을 열다 ✨",
  body: "2026년 3월 11일, 오전 10시 15분.\n3.36kg, 47.5cm — 작은 영웅이 마침내 인간의 세계에 첫발을 디뎠다.\n\n그의 첫 울음은 두려움이 아닌, 존재의 선언이었다.",
  button: "이안이의 눈으로 세상 보기 →"
};

/* 대화창 초상화 (img 가 없으면 emoji 로 표시) */
const PORTRAITS = {
  muse:      { img:"images/muse.webp",      emoji:"🌟", name:"뮤즈" },
  mom:       { img:"images/mom.webp",       emoji:"👩", name:"어머니 장세은" },
  dad:       { img:"images/dad.webp",       emoji:"🧑", name:"아버지 전시현" },
  dad_young: { img:"images/dad_young.webp", emoji:"🧑", name:"아버지 전시현" },
  ian:       { img:"images/ian.webp",       emoji:"👶", name:"이안" },

  coworker_f:     { img:"", emoji:"👩‍🍳", name:"식당 이모님" },
  coworker_m:     { img:"", emoji:"🧑‍💼", name:"회사 동료" },
  friend_of_mom:  { img:"", emoji:"👧", name:"엄마의 단짝" },
  jokbal_owner:   { img:"", emoji:"👨‍🍳", name:"족발집 사장님" },
  receptionist:   { img:"", emoji:"👩‍⚕️", name:"접수처 간호사" },
  doctor:         { img:"", emoji:"🩺", name:"담당 의사 선생님" },
  nurse:          { img:"", emoji:"👩‍⚕️", name:"간호사" },
  grandma_p:      { img:"", emoji:"👵", name:"할머니 유윤재" },
  grandpa_m:      { img:"", emoji:"👴", name:"외할아버지 장건식" },
  grandma_m:      { img:"", emoji:"👵", name:"외할머니 유재순" },
  grandpa_tribute:{ img:"", emoji:"🕊️", name:"할아버지 전용식 (하늘에서)" },

  eros:           { img:"", emoji:"💘", name:"사랑의 신 에로스" },
  sphinx:         { img:"", emoji:"🦁", name:"스핑크스" }
};

/* 필드 캐릭터 색/머리 모양 (hair: short | long | bun | pony) */
const PALETTES = {
  apron:  {skin:'#f6cfa8', hair:'#4a3524', cloth:'#f0c060', cloth2:'#6a5438', hairStyle:'bun',  skirt:true},
  suit:   {skin:'#f6cfa8', hair:'#2a2a2a', cloth:'#3f5478', cloth2:'#232b40', hairStyle:'short'},
  casual: {skin:'#f6cfa8', hair:'#3a2a20', cloth:'#ec95a8', cloth2:'#7a4a55', hairStyle:'pony', skirt:true},
  chef:   {skin:'#f6cfa8', hair:'#2a2a2a', cloth:'#ffffff', cloth2:'#3a3a3a', hairStyle:'short', hat:'chef'},
  mom:    {skin:'#f8d4b0', hair:'#2e211b', cloth:'#d3a0e0', cloth2:'#6a4a75', hairStyle:'long', skirt:true},
  dad:    {skin:'#f3c9a0', hair:'#231c1c', cloth:'#4a6f95', cloth2:'#26364a', hairStyle:'short'},
  nurse:  {skin:'#f6cfa8', hair:'#2a2a2a', cloth:'#ffffff', cloth2:'#8ec9e0', hairStyle:'bun', hat:'nurse', skirt:true},
  doctor: {skin:'#f6cfa8', hair:'#2a2a2a', cloth:'#eef4fa', cloth2:'#3a5a7a', hairStyle:'short'},
  grandma:{skin:'#f2cdae', hair:'#d8d8d8', cloth:'#b06282', cloth2:'#5a2c3c', hairStyle:'bun', skirt:true},
  grandpa:{skin:'#f2cdae', hair:'#c8c8c8', cloth:'#667a52', cloth2:'#30351f', hairStyle:'short'},
  tribute:{skin:'#fff9ea', hair:'#ffffff', cloth:'#ffe9b0', cloth2:'#fff4d8', hairStyle:'short', glow:true},
  muse:   {skin:'#ffe9d8', hair:'#f2c66d', cloth:'#e6dcf6', cloth2:'#b8a2dc', hairStyle:'long', glow:true, skirt:true},
  eros:   {skin:'#ffe6d2', hair:'#f0c060', cloth:'#ffffff', cloth2:'#f6d6e4', hairStyle:'short', glow:true, wings:true, float:true}
};

/* 여정의 지도 — status: playable | soon */
const CHAPTERS = [
  { id:0, title:"올림포스", subtitle:"뮤즈가 노래를 시작하다", icon:"🏛️", status:"soon" },
  { id:1, title:"에로스의 화살", subtitle:"두 사람이 만나다", icon:"🏹", status:"playable", launch:"chapter1",
    myth:"사랑의 신 에로스가 활시위를 당겼다.\n화살은 어김없이, 한 남자의 심장을 꿰뚫었다.\n\n그러나 망각의 강 레테에서 번진 안개가\n망설임이 되어 그의 길을 막아섰다." },
  { id:2, title:"아이올로스의 바람", subtitle:"함께 떠난 계절들", icon:"🌬️", status:"playable", launch:"chapter2",
    myth:"바람의 신 아이올로스가 주머니를 풀었다.\n연인이 된 두 사람의 돛에, 순풍이 가득 찼다." },
  { id:3, title:"헤라의 서약", subtitle:"두 집안이 하나로", icon:"💐", status:"playable", launch:"chapter3",
    myth:"결혼의 여신 헤라가 두 사람의 손을 포갰다.\n올림포스가 증인이 된 서약이었다." },
  { id:4, title:"모이라이의 실타래", subtitle:"찰떡이가 찾아오다", icon:"🧵", status:"soon" },
  { id:5, title:"페르세포네의 항해", subtitle:"열 달의 여정", icon:"🌊", status:"playable", launch:"womb",
    myth:"봄을 데려오는 여신 페르세포네처럼,\n작은 생명은 따뜻한 바다 속에서 열 달을 건넜다." },
  { id:6, title:"에일레이티이아의 문", subtitle:"탄생의 관문", icon:"🌅", status:"playable", launch:"hospital",
    myth:"출산의 여신 에일레이티이아가 손을 내밀었다.\n마침내, 문이 열릴 시간이었다." },
  { id:7, title:"이타카의 아침", subtitle:"첫 나날들", icon:"🌱", status:"soon" },
  { id:8, title:"레테의 강", subtitle:"망각에 맞서다", icon:"🌫️", status:"soon" }
];

/* 배경: bg = outdoor | indoor | jokbal | sea   (flip:true 좌우반전, filter: CSS 필터로 분위기 바꾸기) */
const CHAPTER_FIELDS = {
  chapter1: {
    title:"에로스의 화살", icon:"🏹", player:"dad", playerName:"전시현", combat:true,
    order:['street1','alley1','pass','foodstreet'],
    cardReward:{ icon:"🏹", name:"에로스의 화살", epithet:"운명이 시작된 순간의 증표" },
    fields:{
      street1:{
        name:"회사 앞 거리", width:1400, height:460, bg:'outdoor', tiles:'street',
        platforms:[{x1:330,x2:560,y:340},{x1:610,x2:860,y:268},{x1:1010,x2:1210,y:336}],
        ropes:[{x:836,y1:268,y2:396},{x:1036,y1:336,y2:396}],
        sparkles:[{x:400,plat:0},{x:490,plat:0},{x:650,plat:1},{x:1110,plat:2}],
        exitRight:'alley1', mist:true,
        mobs:[{type:'cloud', x:760, x1:640, x2:980}, {type:'cloud', x:1180, x1:1060, x2:1300}, {type:'cloud', x:1110, plat:2}],
        npcs:[
          { id:'cw_f1', x:210, label:"식당 이모님", palette:'apron', lines:[
            {speaker:'muse', label:'뮤즈의 노래', text:"신들의 궁전 올림포스, 짓궂은 사랑의 신 《에로스》가 활시위를 당겼다.\n\n그 화살이 향한 곳은, 회사 식당에서 묵묵히 일하던 한 여인을 몰래 훔쳐보던 어느 남자의 심장이었다."},
            {speaker:'coworker_f', text:"'아니 총각, 오늘도 밥 먹으면서 세은 씨 쪽만 힐끔힐끔 보네?'\n\n'그, 그런거 아니에요...!'\n\n애써 부인했지만, 귀는 이미 새빨갛게 물들어 있었다."}
          ]},
          { id:'eros1', x:470, plat:0, label:"사랑의 신 에로스", palette:'eros', reward:['eros_bow'], lines:[
            {speaker:'eros', text:"'쉿 — 방금 내가 쏜 화살, 제대로 박혔지?'\n\n날개 달린 소년이 킥킥 웃으며 발판 위에 내려앉았다. 사랑의 신 《에로스》였다."},
            {speaker:'eros', text:"'그런데 큰일이야. 망각의 강 《레테》에서 안개가 번지고 있어.\n\n안개에 닿은 마음은 《망설임》과 《수줍음》이 되어, 그림자처럼 길을 막아서지.'"},
            {speaker:'eros', text:"'자, 이 활을 받아. 네 심장에 박힌 그 화살이 너의 무기가 될 거야.\n\n망설임을 쏘아 넘기고 — 그녀에게 가.'"}
          ]},
          { id:'cw_m1', x:720, plat:1, label:"회사 동료", palette:'suit', reward:['war_note'], lines:[
            {speaker:'coworker_m', text:"'야, 너 요즘 왜 그렇게 넋을 놓고 다니냐?'\n\n'심장이... 이상해.'\n\n그는 그날 저녁, 마치 《오디세우스가 트로이의 목마를 설계하듯》 치밀한 작전을 세우기 시작했다."},
            {speaker:'dad_young', label:'운명에 사로잡힌 자', text:"'오늘, 다 같이 족발이나 어때요?'\n\n너무나 자연스러운 척, 그러나 필사적인 첫 수였다."}
          ]}
        ]
      },
      alley1:{
        name:"골목길", width:1200, height:460, bg:'outdoor', tiles:'alley', flip:true,
        platforms:[{x1:230,x2:430,y:338},{x1:490,x2:730,y:268},{x1:790,x2:990,y:338}],
        ropes:[{x:510,y1:268,y2:396}],
        sparkles:[{x:310,plat:0},{x:600,plat:1},{x:700,plat:1},{x:890,plat:2}], filter:'brightness(.82) saturate(.9) sepia(.25) hue-rotate(-12deg)',
        exitLeft:'street1', exitRight:'pass', mist:true,
        mobs:[{type:'shadow', x:540, x1:470, x2:640}, {type:'shadow', x:900, x1:760, x2:1100}, {type:'shadow', x:880, plat:2}, {type:'cloud', x:330, plat:0}],
        npcs:[
          { id:'fom1', x:130, label:"엄마의 단짝", palette:'casual', lines:[
            {speaker:'friend_of_mom', text:"'세은아, 그 회사 그... 자꾸 너 챙기는 남자 있잖아. 어때?'\n\n'몰라, 그냥... 좀 웃기고, 은근히 다정해.'\n\n부인하듯 말했지만, 입가에는 옅은 미소가 걸려 있었다."}
          ]},
          { id:'cw_f2', x:610, plat:1, label:"식당 이모님", palette:'apron', reward:['heart_shoes'], lines:[
            {speaker:'coworker_f', text:"'오늘 저녁에 다 같이 족발 먹으러 간다며? 잘 좀 해봐, 총각.'\n\n지혜의 여신 《아테나》조차 감탄할 위장술이었지만, 정작 본인은 이미 전쟁터에 나서는 병사처럼 심장이 요동치고 있었다."}
          ]}
        ]
      },
      pass:{
        name:"망설임의 고개", width:1400, height:460, bg:'pass', tiles:'stone', mist:true,
        platforms:[{x1:280,x2:480,y:340},{x1:520,x2:760,y:270},{x1:820,x2:1000,y:334}],
        ropes:[{x:545,y1:270,y2:396}],
        sparkles:[{x:380,plat:0},{x:640,plat:1},{x:910,plat:2},{x:1120}],
        exitLeft:'alley1', exitRight:'foodstreet', exitRightNeeds:'sphinx1',
        mobs:[{type:'shadow', x:520, x1:180, x2:700}, {type:'shadow', x:900, x1:760, x2:1080}, {type:'cloud', x:640, plat:1}, {type:'shadow', x:900, plat:2}, {type:'cloud', x:380, plat:0}],
        npcs:[
          { id:'sphinx1', x:1215, look:'sphinx', label:"스핑크스", reward:['laurel'], lines:[
            {speaker:'sphinx', text:"고개 마루에 거대한 그림자가 앉아 있었다. 사자의 몸, 사람의 얼굴 — 테바이의 《스핑크스》였다.\n\n'멈춰라, 인간이여. 이 고개는 망설이는 자를 지나보내지 않는다.'"},
            {speaker:'sphinx', text:"'세 개의 수수께끼를 풀어라.\n네 마음이 진짜라면, 답은 이미 네 안에 있을 터.'"},
            {speaker:'sphinx', label:'첫 번째 수수께끼', text:"'아침에는 네 발, 낮에는 두 발, 저녁에는 세 발로 걷는 것은 무엇이냐?'",
              choices:["사람","고양이","시계"], answer:0,
              right:"'…옛날 오이디푸스와 같은 답이로군. 좋다.'", wrong:"'틀렸다. 태어나서 늙을 때까지를 떠올려 보아라.'"},
            {speaker:'sphinx', label:'두 번째 수수께끼', text:"'매일 점심, 식당에서 네 눈이 밥보다 먼저 찾던 것은 무엇이냐?'",
              choices:["오늘의 반찬","그녀","창밖 풍경"], answer:1,
              right:"'귀가 붉어지는구나. 정답이다.'", wrong:"'거짓말. 식당 이모님이 다 보셨다더군.'"},
            {speaker:'sphinx', label:'세 번째 수수께끼', text:"'트로이의 목마처럼 꾸민 너의 작전. 그 목마의 이름은?'",
              choices:["치킨","족발","영화 한 편"], answer:1,
              right:"'…하하하! 고작 족발이라니.\n그러나 세상의 위대한 작전은 모두 소박하게 시작하는 법.'", wrong:"'아니다. 네가 동료들 앞에서 무어라 말했는지 떠올려 보아라.'"},
            {speaker:'sphinx', text:"'가라, 인간이여. 망설임은 이 고개에 두고.\n\n고개 너머, 등불 켜진 거리에서 — 그녀가 기다린다.'"}
          ]}
        ]
      },
      foodstreet:{
        name:"족발집 거리", width:1300, height:460, bg:'jokbal', tiles:'jokbal',
        platforms:[{x1:150,x2:360,y:338},{x1:860,x2:1080,y:338},{x1:940,x2:1160,y:266}],
        ropes:[{x:1060,y1:266,y2:326}],
        sparkles:[{x:250,plat:0},{x:900,plat:1},{x:1010,plat:2},{x:1110,plat:2}],
        exitLeft:'pass',
        npcs:[
          { id:'jok1', x:470, label:"족발집 사장님", palette:'chef', lines:[
            {speaker:'jokbal_owner', text:"'어서와요! 몇 분이세요?'\n\n우연을 가장한 자리가 마련되었다. 동료들 틈에 섞여 앉았지만, 두 사람의 시선은 자꾸만 서로를 향했다."}
          ]},
          { id:'mom_d1', x:720, reward:['plate'], label:"어머니와의 첫 대화", palette:'mom', lines:[
            {speaker:'mom', text:"'저... 이거 좀 드세요.'\n\n작은 접시 하나를 조심스레 건넸다. 별것 아닌 그 손짓 하나에, 그의 심장은 완전히 무너져 내렸다."},
            {speaker:'muse', label:'운명이 맺어지다', text:"2018년 4월 13일.\n\n모이라이 세 여신 중 《클로토》가 새로운 실 하나를 자아냈다.\n두 개의 운명이, 마침내 하나로 엮이기 시작한 순간이었다.\n\n이렇게, 두 사람의 오디세이아가 시작되었다."}
          ]}
        ]
      }
    }
  },

  /* 챕터2 — 아이올로스의 바람 (여행) · 곧 제주 바람의 섬 · 한라산 동굴 맵이 더해질 자리 */
  chapter2: {
    title:"아이올로스의 바람", icon:"🌬️", player:"dad", playerName:"전시현",
    order:['travels'],
    cardReward:{ icon:"🌬️", name:"아이올로스의 바람", epithet:"함께 떠난 계절들의 증표" },
    note:"이 항해는 아직 짧아요 — 곧 바람의 섬과 한라산 동굴이 더해져요",
    fields:{
      travels:{
        name:"우리의 여행", width:1300, height:460, bg:'sea', tiles:'sea',
        platforms:[{x1:250,x2:450,y:340},{x1:520,x2:740,y:270},{x1:900,x2:1120,y:336}],
        ropes:[{x:540,y1:270,y2:396}],
        sparkles:[{x:320,plat:0},{x:410,plat:0},{x:1070,plat:2}],
        
        npcs:[
          { id:'muse_t1', x:640, plat:1, reward:['jeju','halla','surf'], label:"우리의 여행 이야기", palette:'muse', lines:[
            {speaker:'muse', label:'바람의 기억', text:"연인이 된 두 사람은, 계절이 바뀔 때마다 함께 길을 떠났다.\n\n제주도의 푸른 해안도로, 지붕을 활짝 연 오픈카 위로 쏟아지던 햇살 — 그것은 매년 돌아오는 서로의 생일마다 반복된, 그들만의 작은 의식이었다."},
            {speaker:'muse', label:'한라의 정상', text:"한라산 정상에 올라 함께 내려다본 구름바다.\n\n숨이 턱까지 차올랐지만, 손을 놓지 않고 끝까지 함께 걸었다 — 그것이 두 사람이 사랑하는 방식이었다."},
            {speaker:'muse', label:'파도 위에서', text:"강원도의 차가운 바다 위, 서투른 몸짓으로 파도를 타던 날들.\n\n몇 번이고 넘어지고 물을 먹으면서도, 두 사람은 마주 보며 웃음을 터뜨렸다."}
          ]},
          { id:'photo1', x:990, plat:2, reward:['album'], label:"사진첩", object:'📖', lines:[
            {speaker:'dad_young', label:'사진첩', text:"휴대폰 속에는 어느새 두 사람의 사진이 가득 쌓여 있었다.\n\n'우리, 진짜 많이도 웃었다.'\n\n그 모든 순간들이 모여, 하나의 서사시를 이루고 있었다."}
          ]}
        ]
      }
    }
  },

  /* 챕터3 — 헤라의 서약 (결혼) · 곧 불화의 여신 에리스가 찾아올 자리 */
  chapter3: {
    title:"헤라의 서약", icon:"💐", player:"dad", playerName:"전시현",
    order:['wedding'],
    cardReward:{ icon:"💐", name:"헤라의 서약", epithet:"두 집안을 하나로 이은 실" },
    note:"이 항해는 아직 짧아요 — 곧 불화의 여신 에리스가 찾아와요",
    fields:{
      wedding:{
        name:"결혼식장", width:1100, height:460, bg:'indoor', tiles:'marble',
        platforms:[{x1:170,x2:370,y:338},{x1:730,x2:930,y:338}],
        sparkles:[{x:230,plat:0},{x:310,plat:0},{x:790,plat:1},{x:870,plat:1},{x:550}], filter:'brightness(1.05) saturate(1.1)', petals:true,
        
        npcs:[
          { id:'gma_p1', x:460, label:"할머니의 축복", palette:'grandma', lines:[
            {speaker:'grandma_p', text:"'우리 아들, 이렇게 좋은 사람을 만났구나.'\n\n주름진 눈가에 눈물이 맺혔다. 아들의 손을 꼭 잡으며, 오래도록 바라던 순간이 왔음을 느꼈다."}
          ]},
          { id:'gpa_m1', x:650, label:"외조부모님의 축복", palette:'grandpa', lines:[
            {speaker:'grandpa_m', label:'외할아버지 장건식 & 외할머니 유재순', text:"'우리 딸, 행복하게 살아라.'\n\n두 사람은 나란히 서서, 딸의 새로운 시작을 축복했다.\n\n모이라이의 실타래는 이렇게 두 집안을 하나로 이었다."}
          ]}
        ]
      }
    }
  },

  /* 챕터4 — 탄생 전에는 아버지 시점, '탄생의 순간' 이후부터 이안이 시점 */
  hospital:{
    title:"에일레이티이아의 문", icon:"🌅", player:"dad", playerAfterBirth:"baby", playerName:"전시현", playerNameAfterBirth:"이안",
    order:['lobby','corridor','delivery','nursery'],
    cardReward:{ icon:"👶", name:"탄생의 증표", epithet:"에일레이티이아의 문을 통과한 자" },
    fields:{
      lobby:{
        name:"병원 로비 · 안산우성여성병원", width:1000, height:440, bg:'indoor', tiles:'hospital', sparkles:[{x:440}], filter:'hue-rotate(150deg) saturate(.55) brightness(1.08)',
        exitRight:'corridor',
        npcs:[
          { id:'mom_w1', x:260, label:"어머니의 마음", palette:'mom', lines:[
            {speaker:'mom', text:"열 달을 함께한 작은 생명이, 이제 곧 세상 밖으로 나온다.\n\n두려움보다 더 큰 것은, 마침내 만날 수 있다는 벅찬 기대였다."}
          ]},
          { id:'recep1', x:600, label:"접수처", palette:'nurse', lines:[
            {speaker:'receptionist', text:"'장세은 산모님, 39주 1일차 예정된 제왕절개 맞으실까요?'\n\n'네, 맞아요...' 어머니의 목소리에는 설렘과 긴장이 함께 묻어났다."}
          ]}
        ]
      },
      corridor:{
        name:"수술 준비실 복도", width:1000, height:440, bg:'indoor', tiles:'hospital', sparkles:[{x:560}], flip:true, filter:'hue-rotate(150deg) saturate(.45) brightness(1.0)',
        exitLeft:'lobby', exitRight:'delivery',
        npcs:[
          { id:'doc1', x:380, label:"담당 의사 선생님", palette:'doctor', lines:[
            {speaker:'doctor', text:"'수술 잘 될 거예요, 걱정 마세요.'\n\n출산의 여신 《에일레이티이아》를 대신하듯, 노련한 손길이 산모를 안심시켰다."}
          ]},
          { id:'dad_p1', x:700, label:"아버지의 초조함", object:'💭', lines:[
            {speaker:'dad', text:"복도를 서성이는 발걸음이 점점 빨라졌다.\n\n'괜찮을 거야, 괜찮을 거야...'\n\n스스로에게 되뇌었지만, 심장은 좀처럼 진정되지 않았다."}
          ]}
        ]
      },
      delivery:{
        name:"분만실 · 탄생의 순간", width:1000, height:440, bg:'indoor', tiles:'hospital', filter:'brightness(1.12) saturate(.8)', lightBeam:true,
        exitLeft:'corridor', exitRight:'nursery', exitRightNeedsBirth:true,
        npcs:[
          { id:'nurse_b1', x:460, label:"탄생의 순간", palette:'nurse', event:'birth', lines:[
            {speaker:'muse', label:'세상의 첫 빛', text:"수술실의 불빛 아래, 모두가 숨을 죽였다.\n\n그리고 — 출산의 여신 《에일레이티이아》가 마침내 문을 활짝 열었다."}
          ]},
          { id:'dad_h1', x:740, label:"처음 안아본 순간", palette:'dad', afterBirth:true, lines:[
            {speaker:'dad', label:'처음 안아본 순간', text:"손끝이 떨렸다.\n\n세상의 그 어떤 트로피도, 그 어떤 승리도 — 이 작은 무게보다 무겁지 않았다.\n\n'세상을 다 가진 기분이란 게, 이런 거구나.'"}
          ]}
        ]
      },
      nursery:{
        name:"신생아실 · 가족의 축복", width:1200, height:440, bg:'indoor', tiles:'hospital',
        platforms:[{x1:680,x2:860,y:322,cloud:true}], sparkles:[{x:320},{x:960}],
        exitLeft:'delivery',
        npcs:[
          { id:'gma_p2', x:230, label:"할머니의 눈물", palette:'grandma', lines:[
            {speaker:'grandma_p', text:"'아이고, 우리 강아지...'\n\n작은 손가락을 조심스레 만지며, 할머니의 눈시울이 붉어졌다."}
          ]},
          { id:'gpa_m2', x:480, label:"외조부모님의 방문", palette:'grandpa', lines:[
            {speaker:'grandpa_m', label:'외할아버지 장건식 & 외할머니 유재순', text:"'우리 손주 태어났다는 소식에 한걸음에 달려왔단다.'\n\n두 분의 얼굴에는 이루 말할 수 없는 기쁨이 가득했다."}
          ]},
          { id:'gpa_trib1', x:770, plat:0, label:"하늘의 할아버지", palette:'tribute', lines:[
            {speaker:'grandpa_tribute', text:"비록 이 자리에 함께하지 못했지만, 어딘가 높은 곳에서 따뜻한 눈으로 지켜보고 있었다.\n\n'우리 손주, 건강하게만 자라다오.'\n\n보이지 않는 곳에서도, 사랑은 늘 함께였다."}
          ]},
          { id:'name1', x:1060, reward:['oracle'], label:"이름을 얻다", palette:'muse', lines:[
            {speaker:'muse', label:'이름을 얻는 신탁', text:"두 사람이 아이를 내려다보며 속삭였다.\n\n'이안아.'\n\n《기쁘고 평안하라》는 뜻을 담은 이름 — 영문으로는 《Ian》.\n\n신탁처럼 내려진 그 이름과 함께, 작은 영웅은 세상에서 유일한 존재가 되었다."}
          ]}
        ]
      }
    }
  }
};

/* 챕터3 — 엄마 뱃속 '태초의 바다' (점프 플랫포머) */
const WOMB = {
  length: 3000, height: 460, playerName:"찰떡이",
  platforms:[{x1:420,x2:620,y:336},{x1:960,x2:1180,y:330},{x1:1260,x2:1460,y:262},{x1:1780,x2:1990,y:336},{x1:2240,x2:2460,y:322}],
  ropes:[{x:1280,y1:262,y2:396,cord:true}],   /* 탯줄 로프 */
  cardReward:{ icon:"🌊", name:"열 달의 항해", epithet:"태초의 바다를 건넌 자" },
  enemies:[
    {x:300,range:60},{x:700,range:50},{x:1100,range:70},
    {x:1500,range:60},{x:1900,range:50},{x:2300,range:60},{x:2700,range:55}
  ],
  blocks:[
    {x:250,  msg:"덜컥 찾아온 입덧, 그래도 매일 감사했던 열 달의 시작."},
    {x:550,  msg:"콩닥콩닥, 어머니의 심장 소리는 태초의 북소리처럼 늘 함께했다."},
    {x:850,  msg:"작은 초음파 사진 속, 꼬물거리는 손과 발을 처음 만났다."},
    {x:1150, msg:"'찰떡이'라 불리며, 태어나기도 전에 이미 사랑받고 있었다."},
    {x:1450, msg:"톡, 톡 — 태동이 느껴질 때마다 온 가족이 배에 손을 얹었다."},
    {x:1750, msg:"머나먼 후쿠오카, 함께 걸었던 태교여행의 바닷바람을 기억한다."},
    {x:2050, msg:"아버지의 목소리가 물결 너머로 다정하게 들려왔다."},
    {x:2350, msg:"평온한 열 달, 폭풍 없는 항해였다 — 이제 곧 항구에 닿는다."},
    {x:2650, msg:"드디어, 태초의 바다를 벗어날 시간이다."}
  ],
  enemyMsg:"포세이돈의 잔물결을 사뿐히 넘었다 💧"
};

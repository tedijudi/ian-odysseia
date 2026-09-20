/* ============================================================
   1장 · 에로스의 화살 — 장면 · 미션 · 연출 대본
   이 파일만 고치면 1장의 이야기가 바뀌어요.

   ▸ 장면(scenes): 한 글자 = 한 칸
     맨 윗줄 = 뒤쪽 벽 · 맨 왼쪽 줄 = 왼쪽 벽
       벽: O 회사 빌딩 · E 편의점 · H 치킨집 · C 단짝 카페 · V 빨간 벽돌 빌라 · J 족발집
           A 달동네 집 · W 식당 창문 벽 · K 배식대 벽 · I 식당 안쪽 벽
     바닥: o 식당 타일 · . 보도블록 · = 도로 · x 횡단보도 · n 골목 시멘트 · s 계단 · m 달빛 대리석
           g 풀밭 · f 꽃밭 · _ 산책로 · w 개천
     소품: Q 배식 카운터 · D 식당 테이블 · R 정수기 · G 식판 반납대 · p 화분 · h 달동네 화분 · u 장독대
           L 가로등 · j 전봇대(전선) · l 청사초롱 · Y 벚꽃나무 · M 신비한 나무 · b 벤치 · v 자판기
           U 버스정류장 · P 카페 파라솔 · T 빨간 플라스틱 테이블 · k 드럼통 · | 달빛 신전 기둥 · r 바위
   ▸ 대사 표시: [실제] 가족이 들려준 말 그대로 · [신화] 게임을 위해 지어낸 연출
   ▸ 대본(script) 명령: say · title · fade · walk · wait · cam · show · hide · effect · mobs · give · scene · hostile · thread · note
   ============================================================ */
const CH1 = {
  id:1, title:'에로스의 화살',
  intro:{ small:'CHAPTER 01', title:'에로스의 화살', text:"뮤즈여, 노래하소서.\n신들이 아닌, 한 평범한 회사원의 가장 용감했던 하루를.\n\n2018년 4월 13일, 서울의 봄." },
  outro:{ small:'CHAPTER 01 CLEAR', title:'작은 접시', text:"2018년 4월 13일.\n두 개의 실이 처음으로 한 가닥이 된 날.\n\n— 2장 「아이올로스의 바람」으로 이어집니다" },

  /* 등장인물 — pal: 모습(story.js 의 PALETTES) */
  actors:{
    seeun:   { pal:'mom_work', name:'세은' },
    imo:     { pal:'apron',    name:'식당 이모님' },
    coworker:{ pal:'suit',     name:'회사 동료' },
    eros:    { pal:'eros',     name:'에로스' },
    friend:  { pal:'casual',   name:'엄마의 단짝' },
    seeunC:  { pal:'mom',      name:'세은' },
    boss:    { pal:'chef',     name:'족발집 사장님' },
    team1:   { pal:'suit',     name:'회사 동료' },
    team2:   { pal:'casual',   name:'회사 동료' },
    sphinx:  { look:'sphinx',  name:'스핑크스' }
  },

  scenes:{
    /* ---------- 1. 사원 식당 — 점심, 창밖엔 벚꽃 ---------- */
    cafeteria:{
      name:'사원 식당', time:'2018년 4월 13일 · 점심시간', light:'day',
      ambient:'rgb(246,238,232)', vignette:.18, fx:['petals','beams'],
      rows:[
        'IKKKKKWWWWWWWWWWWW',
        'Ioooooop....oooooo',
        'IQQQQQoooooooooooo',
        'Iooooooooooooooooo',
        'IooooooDDooooDDooo',
        'Iooooooooooooooooo',
        'Iooooooooooooooooo',
        'IooooooDDooooDDooo',
        'IRoooooooooooooooo',
        'Iooooooooooooooooo',
        'IooooooDDooooDDooo',
        'Iooooooooooooooooo',
        'IGoooooooooooooooo',
        'Iooooooooooooooop.'
      ].map(r=>r.replace(/\./g,'o')),
      spawn:[9.5, 12.5],
      place:{ seeun:[2.5,1.4], imo:[4.6,1.4], coworker:[13.6,8.3] },
      objects:[
        { id:'counter', x:3.5, y:3.1, label:'배식대' },
        { id:'seat',    x:14.4, y:5.3, label:'창가 자리' }
      ],
      signs:[ { x:3.5, wall:'back', z:44, text:'오늘의 메뉴 · 제육볶음', color:'#fff4d8', glow:'255,210,150' } ]
    },

    /* ---------- 2. 벚꽃 퇴근길 — 같은 날 저녁, 개천 산책로 ---------- */
    street:{
      name:'벚꽃 퇴근길', time:'같은 날 · 저녁 6시 반', light:'dusk',
      ambient:'rgb(214,176,214)', vignette:.26, fx:['petals','mist'],
      rows:[
        'VOOOOOEEEEHHHCCCCCCVVVVVVVVVVV',
        'V....v.......P..P......U......',
        'V.............................',
        'V...j.......j.......j.......j.',
        'V==========xx=================',
        'V==========xx=================',
        'V........L.........L.......L..',
        'VgggYggggggggYgggggggggYgggggg',
        'Vggggggggggggggggggggggggggggg',
        'Vgg_______________________gggg',
        'Vg__ggllgggggglggggggl_____ggg',
        'Vg_wwwwwwwwwwwwwwwwwwwwwwww_gg',
        'V_wwwwwww__wwwwwwwwwwwww__ww_g',
        'V_wwwwwww__wwwwwwwwwwwww__ww_g',
        'Vg_wwwwwwwwwwwwwwwwwwwwwwwww_g',
        'Vgg___________________________',
        'VggggYgggglgggggYgggglgggggYgg',
        'Vgffggggggggbgggggggggggffgggg',
        'Vgfffggggggggggggfffggggfffggg',
        'Vggfgggggggggggggfffgggggfgggg',
        'Vgggggggggggggggggggggggggggg^',
        'Vggggggggggggggggggggggggggggg'
      ],
      spawn:[3.5, 2.4],
      place:{ friend:[14.2,1.9], seeunC:[16.8,1.9], imo:[23.6,2.7] },
      objects:[
        { id:'terrace', x:15.5, y:2.9, label:'단짝 카페 테라스', hidden:true },
        { id:'gate',    x:28.6, y:19.6, label:'달빛 계단 입구' },
        { id:'note1',   x:12.5, y:18.5, note:true, label:'뮤즈의 쪽지' }
      ],
      mobs:[ ['cloud',5.5,8.5],['cloud',12.5,8.8],['cloud',19.5,8.5],['cloud',25.5,9.4],['cloud',4.5,17.5],
             ['cloud',10.5,19.5],['cloud',16.5,17.8],['cloud',22.5,19.5],['cloud',27.5,16.8] ],
      signs:[
        { x:8,  wall:'back', z:42, text:'편의점',   color:'#ffffff', glow:'120,220,255' },
        { x:11.5, wall:'back', z:42, text:'치킨',     color:'#fff6c0', glow:'255,200,80' },
        { x:16, wall:'back', z:42, text:'단짝 카페', color:'#fff4dc', glow:'120,255,220' }
      ]
    },

    /* ---------- 3. 달빛 계단 — 망설임의 고개 ---------- */
    stairs:{
      name:'달빛 계단 · 망설임의 고개', time:'같은 날 · 저녁 7시', light:'night',
      ambient:'rgb(150,150,214)', vignette:.34, fx:['fireflies','mist','moon'],
      rows:[
        'AAAAAAAAAAAAAAAAAAAA',
        'Ammmmmmmmmnnnuhnnnnn',
        'Am|mmmmm|mnnnnnnnlnn',
        'Ammmmmmmmmnhnnnnnnnn',
        'Am|mmmmm|mnnnnnnunnn',
        'Annnssssnnnnnnnnnnnn',
        'Annnssssnnnnlnnnnhnn',
        'Ahnnssssnnnnnnnnnnnn',
        'Annnnnnnnnnnnnnnnnnn',
        'Aunnnnnnnnnnnnnnhnnn',
        'Annnnnnnssssnnnnnnnn',
        'Annlnnnnssssnnnnnunn',
        'Annnnnnnssssnnnnnnnn',
        'Ahnnnnnnssssnnnnlnnn',
        'Annnnnnnnnnnnnnnnnnn',
        'Annnunnnnnnnnnnnnnnn',
        'Annnnnnnnnnnnnssssnn',
        'Annnnnhnnnnnnnssssnn',
        'Annlnnnnnnnnnnssssnn',
        'Annnnnnnnnnnnnssssnn',
        'Ahnnnnnnnnnnnnnnnnnn',
        'Annnnnnnnnlnnnnnnnnn',
        'Annnnnnunnnnnnnnnnnn',
        'Annnnnnnnnnnnnnnnnnn'
      ],
      spawn:[16.5, 22.5],
      place:{ sphinx:[5.5, 2.6] },
      objects:[ { id:'note2', x:15.5, y:12.5, note:true, label:'뮤즈의 쪽지' } ],
      mobs:[ ['shadow',15.5,18.5],['shadow',10.5,14.5],['shadow',6.5,11.5],['shadow',13.5,8.5],['shadow',5.5,7.5] ]
    },

    /* ---------- 4. 족발집 골목 — 청사초롱 아래 ---------- */
    jokbal:{
      name:'족발집 골목', time:'같은 날 · 저녁 7시 반', light:'night',
      ambient:'rgb(190,164,210)', vignette:.3, fx:['petals','lanterns'],
      rows:[
        'VVVVJJJJJJJJVVVVVVVV',
        'Vnnnnnnnnnnnnkpnnnnn',
        'Vnnnnnnnnnnnnnnnnnnn',
        'Vnnlnnnnnnnnlnnnnnnn',
        'VnnnnnTnnnnnnnYnnnnn',
        'VnnnnnnnnTTnnnnnnnnn',
        'Vnnnnnnnnnnnnnnnnkkn',
        'VnnnnnTnnnnnnnnnnnnn',
        'Vnnlnnnnnnnnlnnnnnnn',
        'Vnnnnnnnnnnnnnnnnnnn',
        'Vnnnnnnnnnnnnnnnnnnn',
        'VYnnnnnnnnnnnnnnnnnn',
        'Vnnnnnnnnnnnnnnnnnnn',
        'Vnnnnnnnnnnnnnnnnnnn'
      ],
      spawn:[16.5, 12.3],
      place:{ boss:[7.6,2.3], team1:[9.5,4.3], team2:[10.6,6.4], seeunC:[9.4,6.4] },
      objects:[
        { id:'seat2', x:10.5, y:4.4, label:'빈자리' },
        { id:'note3', x:16.5, y:9.5, note:true, label:'뮤즈의 쪽지' }
      ],
      signs:[ { x:8, wall:'back', z:44, text:'원조 족발', color:'#fff0c8', glow:'255,120,90' } ]
    }
  },

  /* 평소 대화 — 미션과 상관없이 말을 걸면 나오는 짧은 대사 [신화] */
  chatter:{
    seeun:   [{speaker:'muse', text:"그녀는 묵묵히 국을 푸고 있었다.\n\n눈이 마주칠까 봐, 그는 괜히 식판만 내려다봤다."}],
    imo:     [{speaker:'coworker_f', text:"'밥 더 줄까, 총각? 오늘은 유난히 얼굴이 빨갛네.'"}],
    coworker:[{speaker:'coworker_m', text:"'오늘 제육 괜찮다. 근데 너 표정이 왜 그래?'"}],
    friend:  [{speaker:'muse', text:"테라스의 두 사람은 이야기에 빠져 있었다.\n\n지금 끼어들 수는 없다. 조금 더 가까이 가서 들어볼까?"}],
    seeunC:  [{speaker:'muse', text:"그녀가 살짝 고개를 돌렸다.\n\n그는 황급히 딴 곳을 보는 척했다."}],
    team1:   [{speaker:'coworker_m', text:"'왔냐? 빨리 앉아, 족발 식는다.'"}],
    team2:   [{speaker:'muse', text:"동료가 눈짓으로 빈자리를 가리켰다.\n\n바로 — 그녀의 맞은편이었다."}]
  },

  /* 뮤즈의 쪽지 — 찾으면 뒷이야기가 열려요 [신화] */
  notes:{
    note1:[{speaker:'muse', label:'뮤즈의 쪽지 ①', text:"에로스는 사실 그날, 화살을 두 발 쐈다.\n\n한 발은 식당의 한 남자에게. 그렇다면 — 나머지 한 발은, 누구의 심장으로 갔을까?"}],
    note2:[{speaker:'muse', label:'뮤즈의 쪽지 ②', text:"이 계단의 안개는 원래 저녁밥 냄새였다.\n\n레테의 안개가 닿자 설렘은 《망설임》이 되고, 두근거림은 《수줍음》이 되었다. 안개를 걷어내면 — 집집마다 불이 다시 켜진다."}],
    note3:[{speaker:'muse', label:'뮤즈의 쪽지 ③', text:"스핑크스는 원래 길을 막는 괴물이었다.\n\n그러나 이 도시의 스핑크스는 조금 달랐다. 그는 오직 한 가지만 물었다 — 네 마음이 진짜냐고."}]
  },

  /* ---------- 미션 ----------
     goal: use(물건) · talk(사람) · reach(장소) · kill(몬스터 수) · auto(대본만)
     start: 미션이 시작될 때 대본 · done: 끝났을 때 대본 */
  missions:[
    { id:'m1', scene:'cafeteria', title:'점심시간', desc:'배식대에서 식판을 받자', goal:{use:'counter'},
      start:[
        {title:'사원 식당', sub:'2018년 4월 13일 · 점심시간'},
        {say:[{speaker:'muse', label:'뮤즈의 노래', text:"뮤즈여, 노래하소서.\n\n올림포스의 신들도, 트로이의 영웅도 아닌 — 한 평범한 회사원의 가장 용감했던 하루를."}]}  // [신화]
      ],
      done:[
        {say:[{speaker:'muse', text:"국자를 든 손이 잠깐 멈칫했다.\n\n식판 위로 반찬이 조심스레 담기는 동안, 그는 고개를 들 수가 없었다."}]}  // [신화]
      ] },

    { id:'m2', scene:'cafeteria', title:'창가 자리', desc:'창가 자리에 앉자', goal:{use:'seat'},
      done:[
        {walk:'imo', to:[13.2,5.6]},
        {say:[{speaker:'coworker_f', text:"'아니 총각, 오늘도 밥 먹으면서 세은 씨 쪽만 힐끔힐끔 보네?'\n\n'그, 그런거 아니에요...!'\n\n애써 부인했지만, 귀는 이미 새빨갛게 물들어 있었다."}]},   // [실제]
        {walk:'imo', to:[4.6,1.4]}
      ] },

    { id:'m3', scene:'cafeteria', title:'멈춰버린 시간', desc:'망설임 구름 3마리를 쏘아 넘기자', goal:{kill:3},
      start:[
        {effect:'timestop', on:true},
        {say:[{speaker:'muse', label:'뮤즈의 노래', text:"그 순간, 식당의 시간이 멈췄다.\n\n신들의 궁전 올림포스에서, 짓궂은 사랑의 신 《에로스》가 활시위를 당긴 것이다."}]},   // [실제+신화]
        {show:'eros', at:[12.4,6.6]},
        {say:[
          {speaker:'eros', text:"'쉿 — 방금 내가 쏜 화살, 제대로 박혔지?'\n\n날개 달린 소년이 킥킥 웃으며 식판 옆에 내려앉았다. 사랑의 신 《에로스》였다."},
          {speaker:'eros', text:"'그런데 큰일이야. 망각의 강 《레테》에서 안개가 번지고 있어.\n\n안개에 닿은 마음은 《망설임》과 《수줍음》이 되어, 그림자처럼 길을 막아서지.'"},
          {speaker:'eros', text:"'자, 이 활을 받아. 네 심장에 박힌 그 화살이 너의 무기가 될 거야.\n\n봐 — 벌써 창문 틈으로 안개가 스며들고 있잖아.'"}
        ]},
        {give:'bow'},
        {hide:'eros'},
        {effect:'timestop', on:false},
        {mobs:[['cloud',15.5,10.4],['cloud',16.2,6.4],['cloud',11.5,12.2]]},
        {hostile:true},
        {toast:'🏹 공격 버튼(F)으로 사랑의 화살을 쏴요 — 가까운 안개를 자동으로 겨눠요'}
      ] },

    { id:'m4', scene:'cafeteria', title:'트로이의 목마 작전', desc:'회사 동료와 이야기하자', goal:{talk:'coworker'},
      start:[ {hostile:false} ],
      talk:[
        {speaker:'coworker_m', text:"'야, 너 요즘 왜 그렇게 넋을 놓고 다니냐?'\n\n'심장이... 이상해.'\n\n그는 그날 저녁, 마치 《오디세우스가 트로이의 목마를 설계하듯》 치밀한 작전을 세우기 시작했다."},
        {speaker:'dad_young', label:'운명에 사로잡힌 자', text:"'오늘, 다 같이 족발이나 어때요?'\n\n너무나 자연스러운 척, 그러나 필사적인 첫 수였다."}
      ],   // [실제]
      done:[ {give:'war_note'}, {scene:'street'} ] },

    { id:'m5', scene:'street', title:'안개 낀 퇴근길', desc:'개천 산책로의 망설임 구름 6마리를 걷어내자', goal:{kill:6},
      start:[
        {title:'벚꽃 퇴근길', sub:'같은 날 · 저녁 6시 반'},
        {say:[{speaker:'muse', text:"퇴근길 개천에 이상한 안개가 내려앉았다.\n\n약속 시간까지 한 시간. 그런데 발걸음이 자꾸만 무거워진다 — 《망설임》이 길을 막고 있었다."}]},   // [신화]
        {hostile:true}
      ] },

    { id:'m6', scene:'street', title:'단짝의 귀띔', desc:'단짝 카페 테라스 쪽으로 가 보자', goal:{reach:'terrace', r:2.4},
      start:[ {hostile:false} ],
      done:[
        {say:[{speaker:'muse', text:"카페 테라스 너머로, 익숙한 목소리가 들렸다.\n\n그는 저도 모르게 화분 뒤에 몸을 숨겼다."}]},   // [신화]
        {say:[{speaker:'friend_of_mom', text:"'세은아, 그 회사 그... 자꾸 너 챙기는 남자 있잖아. 어때?'\n\n'몰라, 그냥... 좀 웃기고, 은근히 다정해.'\n\n부인하듯 말했지만, 입가에는 옅은 미소가 걸려 있었다."}]}   // [실제]
      ] },

    { id:'m7', scene:'street', title:'이모님의 응원', desc:'버스정류장의 식당 이모님께 가 보자', goal:{talk:'imo'},
      talk:[
        {speaker:'coworker_f', text:"'오늘 저녁에 다 같이 족발 먹으러 간다며? 잘 좀 해봐, 총각.'\n\n지혜의 여신 《아테나》조차 감탄할 위장술이었지만, 정작 본인은 이미 전쟁터에 나서는 병사처럼 심장이 요동치고 있었다."},   // [실제]
        {speaker:'coworker_f', text:"'족발집은 저 개천 끝, 달동네 계단 넘어가면 바로야. 얼른 가 봐!'"}   // [신화]
      ],
      done:[ {give:'heart_shoes'} ] },

    { id:'m8', scene:'street', title:'달빛 계단으로', desc:'개천 끝 계단 입구로 가자', goal:{reach:'gate', r:1.8},
      done:[ {scene:'stairs'} ] },

    { id:'m9', scene:'stairs', title:'수줍음을 넘어서', desc:'계단의 수줍음 그림자 4마리를 걷어내자', goal:{kill:4},
      start:[
        {title:'달빛 계단', sub:'망설임의 고개 · 저녁 7시'},
        {say:[{speaker:'muse', text:"달동네 계단 위로 커다란 달이 떴다.\n\n한 칸 오를 때마다 마음속에서 목소리가 들렸다. '괜히 이상하게 보이면 어떡하지…' 그 목소리들이 그림자가 되어 계단을 막아섰다."}]},   // [신화]
        {hostile:true}
      ] },

    { id:'m10', scene:'stairs', title:'세 개의 수수께끼', desc:'계단 꼭대기의 스핑크스를 만나자', goal:{talk:'sphinx'},
      start:[ {hostile:false} ],
      talk:[
        {speaker:'sphinx', text:"달빛 신전 기둥 사이에, 거대한 그림자가 앉아 있었다. 사자의 몸, 사람의 얼굴 — 테바이의 《스핑크스》였다.\n\n'멈춰라, 인간이여. 이 고개는 망설이는 자를 지나보내지 않는다.'"},
        {speaker:'sphinx', label:'첫 번째 수수께끼', text:"'아침에는 네 발, 낮에는 두 발, 저녁에는 세 발로 걷는 것은 무엇이냐?'",
          choices:["사람","고양이","시계"], answer:0,
          right:"'…옛날 오이디푸스와 같은 답이로군. 좋다.'", wrong:"'틀렸다. 태어나서 늙을 때까지를 떠올려 보아라.'"},
        {speaker:'sphinx', label:'두 번째 수수께끼', text:"'매일 점심, 식당에서 네 눈이 밥보다 먼저 찾던 것은 무엇이냐?'",
          choices:["오늘의 반찬","그녀","창밖 벚꽃"], answer:1,
          right:"'귀가 붉어지는구나. 정답이다.'", wrong:"'거짓말. 식당 이모님이 다 보셨다더군.'"},
        {speaker:'sphinx', label:'세 번째 수수께끼', text:"'트로이의 목마처럼 꾸민 너의 작전. 그 목마의 이름은?'",
          choices:["치킨","족발","영화 한 편"], answer:1,
          right:"'…하하하! 고작 족발이라니.\n그러나 세상의 위대한 작전은 모두 소박하게 시작하는 법.'", wrong:"'아니다. 네가 동료에게 무어라 말했는지 떠올려 보아라.'"},
        {speaker:'sphinx', text:"'가라, 인간이여. 망설임은 이 고개에 두고.\n\n고개 너머, 등불 켜진 골목에서 — 그녀가 기다린다.'"}
      ],   // [신화]
      done:[ {give:'laurel'}, {scene:'jokbal'} ] },

    { id:'m11', scene:'jokbal', title:'우연을 가장한 자리', desc:'족발집 사장님께 인사하고 빈자리에 앉자', goal:{use:'seat2'},
      start:[
        {title:'족발집 골목', sub:'같은 날 · 저녁 7시 반'},
        {say:[{speaker:'muse', text:"청사초롱이 흔들리는 골목. 플라스틱 테이블 위로 김이 올랐다.\n\n동료들 사이에 — 그녀가 앉아 있었다."}]}   // [신화]
      ],
      needTalk:'boss',
      extra:{ boss:[
        {speaker:'jokbal_owner', text:"'어서와요! 몇 분이세요?'\n\n우연을 가장한 자리가 마련되었다. 동료들 틈에 섞여 앉았지만, 두 사람의 시선은 자꾸만 서로를 향했다."}   // [실제]
      ] } },

    { id:'m12', scene:'jokbal', title:'작은 접시', desc:'', goal:{auto:true},
      start:[
        {wait:600},
        {say:[{speaker:'mom', text:"'저... 이거 좀 드세요.'\n\n작은 접시 하나를 조심스레 건넸다. 별것 아닌 그 손짓 하나에, 그의 심장은 완전히 무너져 내렸다."}]},   // [실제]
        {give:'plate'},
        {thread:true},
        {wait:1400},
        {say:[{speaker:'muse', label:'운명이 맺어지다', text:"2018년 4월 13일.\n\n모이라이 세 여신 중 《클로토》가 새로운 실 하나를 자아냈다.\n두 개의 운명이, 마침내 하나로 엮이기 시작한 순간이었다.\n\n이렇게, 두 사람의 오디세이아가 시작되었다."}]},   // [실제]
        {end:true}
      ] }
  ]
};

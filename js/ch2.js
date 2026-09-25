/* ============================================================
   2장 · 아이올로스의 바람 — 장면 · 미션 · 연출 대본
   연인이 된 두 사람이 함께 떠난 여행들을, 바람의 왕 아이올로스의 시험으로 다시 건너요.
   (지도 글자 설명은 js/ch1.js 맨 위 참고 · 2장에서 새로 쓰는 글자)
     벽: N 벽 없음(하늘·바다가 보임) · Z 현무암 절벽(동굴) · F 사진 벽
     바닥: y 유채꽃밭 · q 현무암 땅 · a 모래사장 · r 얕은 파도 · e 나무 마루
     소품: S 돌담 · d 돌하르방 · i 풍력발전기 · c 빨간 오픈카 · z 철쭉 · # 정상 표지석 · t 테트라포드 · B 서핑보드
   ▸ 대사 표시: [실제] 가족이 들려준 말 그대로 · [신화] 게임을 위해 지어낸 연출
   ============================================================ */
const CH2 = {
  id:2, title:'아이올로스의 바람',
  intro:{ small:'CHAPTER 02', title:'아이올로스의 바람', text:"바람의 신 아이올로스가 주머니를 풀었다.\n연인이 된 두 사람의 돛에, 순풍이 가득 찼다.\n\n제주의 해안도로, 한라의 정상, 강원의 파도." },
  outro:{ small:'CHAPTER 02 CLEAR', title:'진짜 많이도 웃었다', text:"함께 떠난 계절들이 한 권의 사진첩이 되었다.\n\n— 3장 「헤라의 서약」으로 이어집니다" },
  companion:'seeunC',       // 이 장에서는 세은이 늘 곁에서 함께 걸어요

  actors:{
    seeunC:  { pal:'mom',    name:'세은' },
    aeolus:  { pal:'aeolus', name:'아이올로스' },
    siren:   { pal:'siren',  name:'세이렌' }
  },

  scenes:{
    /* ---------- 1. 바람의 섬 — 제주 해안도로 ---------- */
    jeju:{
      name:'바람의 섬 · 제주 해안도로', time:'어느 해, 생일', grade:'rgba(180,240,255,.12)', light:'day', sky:'sea', edge:'sea', water:'#23a6d8',
      ambient:'rgb(255,250,244)', vignette:.14, fx:['wind'],
      rows:[
        'NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN',
        'Nwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww',
        'Nqqrqqqqqrqqqqqqqrqqqqqqqqrqqqqqqqqrqqqq',
        'N==c===================================.',
        'N======================================.',
        'NSSSS.SSSSSSS.SSSSSSSSS.SSSSSSS.SSSSSS..',
        'Nyyyyggyyyyyyggyyyyyyyggyyyyyyyggyyyyyy.',
        'Nyyiyggyydyyyggyyyiyyyggyyyydyyggyyiyyy.',
        'Nyyyyggyyyyyyggyyyyyyyggyyyyyyyggyyyyyy.',
        'Ngggg__gggggg__ggggggg__ggggggg__gggggg.',
        'Nggdg__gggigg__ggggdgg__gggiggg__gdggig.',
        'Nyyyy__yyyyyy__yyyyyyy__yyyyyyy__yyyyyy.',
        'Nyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy.',
        'Nyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy.'
      ],
      spawn:[2.6, 4.2],
      place:{ seeunC:[2.2,5.0] },
      objects:[
        { id:'car',  x:3.4, y:3.9, label:'빨간 오픈카' },
        { id:'goal', x:38.3, y:3.9, label:'해안도로 끝', hidden:true },
        { id:'orb1', x:8.5,  y:3.5, kind:'orb' }, { id:'orb2', x:14.5, y:4.4, kind:'orb' }, { id:'orb3', x:20.5, y:3.4, kind:'orb' },
        { id:'orb4', x:26.5, y:4.5, kind:'orb' }, { id:'orb5', x:31.5, y:3.5, kind:'orb' }, { id:'orb6', x:36.5, y:4.4, kind:'orb' },
        { id:'noteA', x:10.5, y:10.5, note:true, label:'뮤즈의 쪽지' }
      ],
      mobs:[ ['wind',8.5,8.5],['wind',16.5,10.5],['wind',22.5,7.5],['wind',29.5,10.5],['wind',35.5,8.5],['wind',12.5,11.8] ]
    },

    /* ---------- 2. 한라의 정상 — 구름바다 위 새벽 ---------- */
    halla:{
      name:'한라의 정상', time:'새벽 5시 · 해 뜨기 전', grade:'rgba(255,190,220,.12)', light:'dusk', sky:'dawn', edge:'cloud', water:'#5fb8d8', cave:12.5,
      ambient:'rgb(236,210,232)', vignette:.22, fx:['motes'],
      rows:[
        'ZZZZZZZZZZZZZZZZZZZZZZZZZZ',
        'Zqqqqqqqqqqqqqqqqqqqqqqqqq',
        'Zqqqqqqqqqqqqqqqqqqqqqqqqq',
        'Zqzqqqqqqqqqqqqqqqqqqqzqqq',
        'Zqqqqqqqqqqqqqqqqqqqqqqqqq',
        'Zqqqqgggwwwwwwwgggqqqqqqqq',
        'Zqqqggwwwwwwwwwwwggqqqqzqq',
        'Zqzqggwwwwwwwwwwwggqqqqqqq',
        'Zqqqqggwwwwwwwwwggqqqqqqqq',
        'Zqqqqqggggg_gggggqqqq#qqqq',
        'Zqqqqqqqqqq_qqqqqqqqqqqqqq',
        'Zqqzqqqqqqq_qqqqqqqzqqqqqq',
        'Zqqqqqqqqqq__qqqqqqqqqqqqq',
        'Zggqqqqqqqqq_qqqqqqqqqqggg',
        'Zgzggqqqqqqq__qqqqqqqqgzgg',
        'Zgggggqqqqqqq_qqqqqqqggggg',
        'Zggzggggqqqqq_qqqqqggggzgg',
        'Zgggggggggggg_gggggggggggg',
        'Zggggzggggggg_gggggggzgggg',
        'Zgggggggggggg_gggggggggggg'
      ],
      spawn:[13.5, 18.6],
      place:{ seeunC:[12.8, 19.2] },
      objects:[
        { id:'summit', x:21.5, y:10.5, label:'한라산 정상 표지석' },
        { id:'noteB', x:3.5, y:15.5, note:true, label:'뮤즈의 쪽지' }
      ],
      mobs:[ ['cloud',8.5,14.5],['cloud',18.5,13.5],['cloud',6.5,11.5],['cloud',20.5,16.5] ]
    },

    /* ---------- 3. 파도의 해변 — 강원도 ---------- */
    beach:{
      name:'파도의 해변 · 강원도', time:'늦은 오후 · 해질녘', grade:'rgba(255,170,120,.14)', light:'dusk', sky:'sunset', edge:'sand', water:'#2386c8',
      ambient:'rgb(255,214,196)', vignette:.22, fx:['motes'],
      rows:[
        'NNNNNNNNNNNNNNNNNNNNNNNNNNNNNN',
        'Nwwwwwwwwwwwwwwwwwwwwwwwwwwwww',
        'Nwwwwwwwwwwwwwwwwwwwwwwwwwwwww',
        'Nwwwwwwwwwwwwwwwwwwwwwwrrwwwww',
        'Nwwwwwwwwwwwwwwwwwwwwwwrrwwwww',
        'Nrrrrrrrrrrrrrrrrrrrrrrrrrrrtt',
        'Nrrrrrrrrrrrrrrrrrrrrrrrrrrttt',
        'Naaaaaaaaaaaaaaaaaaaaaaaaaaatt',
        'NaaaaPaaaaaaaaaPaaaaaaaaaaaaat',
        'NaaaaaaaaBaaaaaaaaaaaBaaaaaaaa',
        'NaaaaaaaaaaaaaaaaaaaaaaaaaaaPa',
        'NaaPaaaaaaaaaaPaaaaaaaaaaaaaaa',
        'Naaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        'Naaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        'Naaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
      ],
      spawn:[4.5, 12.5],
      place:{ seeunC:[5.2, 12.9] },
      objects:[
        { id:'board1', x:9.5, y:10.1, label:'서핑보드' },
        { id:'board2', x:21.5, y:10.1, label:'서핑보드' },
        { id:'noteC', x:26.5, y:13.2, note:true, label:'뮤즈의 쪽지' }
      ],
      mobs:[ ['wave',6.5,6.4],['wave',12.5,7.2],['wave',17.5,6.3],['wave',22.5,7.4],['wave',27.5,9.5] ]
    },

    /* ---------- 4. 사진첩의 방 ---------- */
    album:{
      name:'사진첩의 방', time:'그리고, 지금', grade:'rgba(200,190,255,.12)', light:'day', sky:'stars', edge:'stone',
      ambient:'rgb(236,226,246)', vignette:.26, fx:['motes'],
      rows:[
        'FFFFFFFFFFFFFFFF',
        'Feeeeeeeeeeeeeee',
        'Feeeeeeeeeeeeeee',
        'Feeeeeeeeeeeeeee',
        'Feeeeeeeeeeeeeee',
        'Feeeeeeeeeeeeeee',
        'Feeeeeeeeeeeeeee',
        'Feeeeeeeeeeeeeee',
        'Feeeeeeeeeeeeeee',
        'Feeeeeeeeeeeeeee',
        'Feeeeeeeeeeeeeee',
        'Feeeeeeeeeeeeeee'
      ],
      spawn:[8, 10.4],
      place:{ seeunC:[7.3, 10.8] },
      objects:[
        { id:'ph1', x:3.5,  y:3.5, kind:'photo', label:'제주 해안도로' },
        { id:'ph2', x:12.5, y:2.5, kind:'photo', label:'한라산 정상' },
        { id:'ph3', x:13.5, y:8.5, kind:'photo', label:'강원도 파도' },
        { id:'ph4', x:2.5,  y:9.5, kind:'photo', label:'생일 케이크' },
        { id:'ph5', x:8.5,  y:5.5, kind:'photo', label:'우리 둘' }
      ]
    }
  },

  chatter:{
    seeunC:[{speaker:'muse', text:"그녀가 바람에 날리는 머리를 쓸어 넘기며 웃었다.\n\n어디든, 둘이면 여행이었다."}],
    aeolus:[{speaker:'aeolus', text:"'허허, 바람은 붙잡는 게 아니야, 젊은이. 같이 타는 거지.'"}]
  },

  notes:{
    noteA:[{speaker:'muse', label:'뮤즈의 쪽지 ①', text:"아이올로스의 주머니에는 세상의 모든 바람이 들어 있다.\n\n단 하나, 두 사람이 함께 웃을 때 부는 바람만은 — 그도 담지 못했다."}],
    noteB:[{speaker:'muse', label:'뮤즈의 쪽지 ②', text:"폴리페모스는 원래 양을 치던 순한 거인이었다.\n\n레테의 안개가 그의 하나뿐인 눈을 덮자, 그는 구름바다가 얼마나 아름다운지 잊어버렸다."}],
    noteC:[{speaker:'muse', label:'뮤즈의 쪽지 ③', text:"세이렌의 노래는 달콤하다. '다 잊고, 여기 머물러.'\n\n그러나 이름을 불러주는 목소리보다 더 강한 노래는 없다."}]
  },

  missions:[
    { id:'m1', scene:'jeju', title:'바람의 섬', desc:'세은과 함께 빨간 오픈카로 가자', goal:{use:'car'},
      start:[
        {title:'바람의 섬', sub:'제주 해안도로 · 어느 해, 생일'},
        {say:[{speaker:'muse', label:'바람의 기억', text:"연인이 된 두 사람은, 계절이 바뀔 때마다 함께 길을 떠났다.\n\n제주도의 푸른 해안도로, 지붕을 활짝 연 오픈카 위로 쏟아지던 햇살 — 그것은 매년 돌아오는 서로의 생일마다 반복된, 그들만의 작은 의식이었다."}]}   // [실제]
      ] },

    { id:'m2', scene:'jeju', title:'아이올로스의 내기', desc:'오픈카로 해안도로를 달리며 바람 조각 6개를 모으자', goal:{collect:'orb', n:6, time:48, finish:'goal', resetAt:[3.4,3.9]},
      start:[
        {wind:true},
        {show:'aeolus', at:[6.5,2.6]},
        {say:[
          {speaker:'aeolus', text:"'허허허! 이 섬의 바람이 모두 너희 둘을 쳐다보고 있구나.'\n\n구름 위에 걸터앉은 노인이 수염을 쓸었다. 바람의 왕 《아이올로스》였다."},
          {speaker:'aeolus', text:"'내기 하나 하지. 해안도로 끝까지, 내 바람 조각 여섯 개를 모으며 달려 보거라.\n\n바람보다 빨리 도착하면 — 내 주머니를 주마.'"}
        ]},   // [신화]
        {hide:'aeolus'},
        {car:true},
        {toast:'🚗 조이스틱으로 운전해요 — 제한 시간 안에 바람 조각 6개를 모아 끝까지!'}
      ],
      fail:[ {say:[{speaker:'aeolus', text:"'허허, 바람이 조금 더 빨랐구나. 한 번 더!'"}]} ],
      done:[
        {car:false},
        {show:'aeolus', at:[36.6,2.8]},
        {say:[{speaker:'aeolus', text:"'하하하! 바람보다 빨랐다! 약속대로 주머니를 주마.\n\n...어이쿠, 이런. 주머니 끈이 풀렸네?'"}]},   // [신화]
        {give:'aeolus_bag'},
        {hide:'aeolus'}
      ] },

    { id:'m3', scene:'jeju', title:'풀려난 바람', desc:'유채꽃밭에 흩어진 바람 정령 5마리를 달래자', goal:{kill:5},
      start:[ {say:[{speaker:'muse', text:"주머니에서 빠져나온 장난꾸러기 바람들이 유채꽃밭으로 흩어졌다.\n\n그중 몇은 레테의 안개를 머금어 사납게 변해 있었다."}]}, {hostile:true} ],   // [신화]
      done:[ {give:'jeju'}, {scene:'halla'} ] },

    { id:'m4', scene:'halla', title:'숨이 턱까지', desc:'세은과 함께 한라산 정상 표지석까지 오르자', goal:{use:'summit'},
      start:[
        {title:'한라의 정상', sub:'새벽 5시 · 해 뜨기 전'},
        {say:[{speaker:'muse', text:"해가 뜨기 전, 두 사람은 한라산을 올랐다.\n\n안개가 발목을 붙잡았다. '조금만 쉬었다 갈까…' — 그 목소리마저 안개였다."}]},   // [신화]
        {hostile:true}
      ],
      done:[
        {hostile:false},
        {say:[{speaker:'muse', label:'한라의 정상', text:"한라산 정상에 올라 함께 내려다본 구름바다.\n\n숨이 턱까지 차올랐지만, 손을 놓지 않고 끝까지 함께 걸었다 — 그것이 두 사람이 사랑하는 방식이었다."}]}   // [실제]
      ] },

    { id:'m5', scene:'halla', title:'외눈의 거인', desc:'폴리페모스의 눈을 덮은 안개를 걷어내자', goal:{boss:true},
      start:[
        {shake:true},
        {say:[{speaker:'muse', text:"그때, 백록담 너머 동굴에서 땅이 울렸다.\n\n안개로 한쪽 눈이 가려진 거인 — 《폴리페모스》가 걸어 나왔다."}]},   // [신화]
        {boss:'cyclops', at:[12.5, 3.2]},
        {say:[{speaker:'cyclops', text:"'누구냐... 내 산을 밟는 게. 아무것도 안 보여. 아무것도... 기억이 안 나!'"}]},   // [신화]
        {toast:'⚠ 바닥에 빨간 원이 뜨면 피하세요 — 바위가 떨어져요'}
      ],
      done:[
        {say:[
          {speaker:'cyclops', text:"'...아. 보인다.\n\n구름바다가... 이렇게 예뻤던가.'"},
          {speaker:'muse', text:"안개가 걷힌 거인은 한참 동안 해 뜨는 구름바다를 바라보다가, 조용히 길을 비켜 주었다."}
        ]},   // [신화]
        {give:'halla'}, {scene:'beach'}
      ] },

    { id:'m6', scene:'beach', title:'서투른 파도타기', desc:'해변의 서핑보드 두 개를 챙기자', goal:{useAll:['board1','board2']},
      start:[ {title:'파도의 해변', sub:'강원도 · 늦은 오후'} ],
      done:[ {say:[{speaker:'muse', label:'파도 위에서', text:"강원도의 차가운 바다 위, 서투른 몸짓으로 파도를 타던 날들.\n\n몇 번이고 넘어지고 물을 먹으면서도, 두 사람은 마주 보며 웃음을 터뜨렸다."}]} ] },   // [실제]

    { id:'m7', scene:'beach', title:'세이렌의 노래', desc:'바다로 걸어가는 세은을 붙잡자 — 가까이 가서 이름을 불러요', goal:{rescue:'seeunC', to:[23.5,6.2], spd:0.011},
      start:[
        {show:'siren', at:[23.6,3.8]},
        {say:[{speaker:'siren', text:"'라, 라라... 다 잊고, 여기 머물러.\n\n차가운 물도, 넘어진 기억도, 전부 파도에 씻어 줄게...'"}]},   // [신화]
        {say:[{speaker:'muse', text:"노래를 들은 세은이 멍하니 바다 쪽으로 걸어가기 시작했다."}]}
      ],
      fail:[ {say:[{speaker:'muse', text:"파도가 발목까지 차올랐다. — 조금만 더 빨리!"}]} ],
      done:[
        {say:[
          {speaker:'dad_young', text:"'세은아!'"},
          {speaker:'muse', text:"이름을 부르는 목소리에 그녀가 돌아보았다. 세이렌의 노래가 파도 속으로 흩어졌다.\n\n서로의 이름을 부르면, 어떤 노래도 두 사람을 갈라놓지 못했다."}
        ]},   // [신화]
        {hide:'siren'}
      ] },

    { id:'m8', scene:'beach', title:'성난 파도', desc:'세이렌이 남긴 파도 정령 5마리를 잠재우자', goal:{kill:5},
      start:[ {hostile:true} ],
      done:[ {give:'surf'}, {scene:'album'} ] },

    { id:'m9', scene:'album', title:'흩어진 사진', desc:'방 안에 떠다니는 사진 5장을 모으자', goal:{collect:'photo', n:5},
      start:[
        {title:'사진첩의 방', sub:'그리고, 지금'},
        {say:[{speaker:'muse', text:"여행이 끝나고, 두 사람의 휴대폰 속에 사진들이 쌓여 갔다.\n\n레테의 바람이 그 사진들을 방 안에 흩어 놓았다."}]}   // [신화]
      ] },

    { id:'m10', scene:'album', title:'진짜 많이도 웃었다', desc:'', goal:{auto:true},
      start:[
        {wait:500},
        {say:[{speaker:'dad_young', label:'사진첩', text:"휴대폰 속에는 어느새 두 사람의 사진이 가득 쌓여 있었다.\n\n'우리, 진짜 많이도 웃었다.'\n\n그 모든 순간들이 모여, 하나의 서사시를 이루고 있었다."}]},   // [실제]
        {give:'album'},
        {wait:600},
        {end:true}
      ] }
  ]
};

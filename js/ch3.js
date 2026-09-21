/* ============================================================
   3장 · 헤라의 서약 — 장면 · 미션 · 연출 대본
   두 집안이 하나가 되던 날. 불화의 여신 에리스가 황금사과를 던지지만,
   양가 어른들의 축복이 그 불화를 이겨내요.
   (3장에서 새로 쓰는 글자)
     벽: G 예식장 벽 · 7 스테인드글라스
     바닥: 1 대리석 · 2 버진로드(붉은 카펫)
     소품: & 축의금 접수대 · + 화환 · % 장미 아치 · @ 하객 의자
   ▸ [실제] 가족이 들려준 말 그대로 · [신화] 게임을 위해 지어낸 연출
   ============================================================ */
const CH3 = {
  id:3, title:'헤라의 서약', threadWith:'bride',
  intro:{ small:'CHAPTER 03', title:'헤라의 서약', text:"결혼의 여신 헤라가 두 사람의 손을 포갰다.\n올림포스가 증인이 된 서약이었다.\n\n그러나 초대받지 못한 여신이 하나 있었다." },
  outro:{ small:'CHAPTER 03 CLEAR', title:'두 집안이 하나로', text:"두 집안의 축복이 불화를 이겼다.\n\n— 4장 「모이라이의 실타래」로 이어집니다" },

  actors:{
    bride:   { pal:'bride',    name:'신부 세은' },
    grandma: { pal:'hanbok_g', name:'할머니 유윤재' },
    gpaM:    { pal:'grandpa',  name:'외할아버지 장건식' },
    gmaM:    { pal:'hanbok_m', name:'외할머니 유재순' },
    guest1:  { pal:'suit',     name:'회사 동료' },
    guest2:  { pal:'casual',   name:'엄마의 단짝' },
    imo:     { pal:'apron',    name:'식당 이모님' },
    hera:    { pal:'hera',     name:'헤라' },
    eris:    { pal:'eris',     name:'에리스' }
  },

  scenes:{
    /* ---------- 1. 예식장 로비 ---------- */
    lobby:{
      name:'헤라의 정원 · 예식장 로비', time:'예식 30분 전', light:'day', edge:'stone',
      ambient:'rgb(252,244,236)', vignette:.18, fx:['petals','motes'],
      rows:[
        'GGGGGGGGGGGGGGGGGGGG',
        'G+1111&&11D11111+111',
        'G111111111111111111%',
        'G1111111111111111111',
        'G1b111111111111111b1',
        'G1111111111111111111',
        'G111111111111111111%',
        'G1111111111111111111',
        'G+11111111111111+111',
        'G1111111111111111111',
        'G1111111111111111111',
        'G1b11111111111111111'
      ],
      spawn:[10.5, 9.5],
      place:{ bride:[3.2,4.6], grandma:[13.5,3.5], guest1:[8.5,6.5], guest2:[15.5,7.5], imo:[6.5,8.5] },
      objects:[
        { id:'guestbook', x:10.4, y:1.9, label:'방명록' },
        { id:'archway',   x:18.6, y:6.4, label:'서약의 홀로' },
        { id:'noteA',     x:4.5, y:10.5, note:true, label:'뮤즈의 쪽지' }
      ],
      mobs:[ ['mask',6.5,4.5],['mask',13.5,6.5],['mask',9.5,8.5],['mask',16.5,3.5],['mask',4.5,7.5],['mask',12.5,10.5] ],
      signs:[ { x:10, wall:'back', z:46, text:'전시현 · 장세은', color:'#fff6e6', glow:'255,210,170' } ]
    },

    /* ---------- 2. 서약의 홀 ---------- */
    hall:{
      name:'서약의 홀', time:'예식 시작', light:'day', edge:'stone',
      ambient:'rgb(246,236,246)', vignette:.24, fx:['petals','motes'],
      rows:[
        '7777777777777777777777',
        'G11111111122111111111G',
        'G11+1111112211111+1111',
        'G111111111221111111111',
        'G1@@@@@1112211@@@@@111',
        'G111111111221111111111',
        'G1@@@@@1112211@@@@@111',
        'G111111111221111111111',
        'G1@@@@@1112211@@@@@111',
        'G111111111221111111111',
        'G1@@@@@1112211@@@@@111',
        'G111111111221111111111',
        'G1+11111112211111+1111',
        'G111111111221111111111',
        'G111111111111111111111'
      ],
      spawn:[10.5, 13.5],
      place:{ hera:[10.5,1.6], grandma:[7.5,5.4], gpaM:[13.5,5.4], gmaM:[14.6,5.4], bride:[10.8,11.5] },
      objects:[ { id:'altar', x:10.5, y:2.6, label:'서약의 단' }, { id:'noteB', x:19.5, y:12.5, note:true, label:'뮤즈의 쪽지' } ]
    }
  },

  chatter:{
    guest1:[{speaker:'coworker_m', text:"'야, 그때 족발집 그 자리가 여기까지 왔네. 축하한다!'"}],
    guest2:[{speaker:'friend_of_mom', text:"'세은이 오늘 진짜 예쁘다. 울면 안 되는데...'"}],
    imo:[{speaker:'coworker_f', text:"'내가 이럴 줄 알았지! 총각, 아니 신랑! 잘 살아요.'"}],
    bride:[{speaker:'muse', text:"면사포 너머로 눈이 마주쳤다.\n\n식당에서 힐끔거리던 그날처럼, 심장이 똑같이 뛰었다."}],
    hera:[{speaker:'hera', text:"'서약은 말이 아니라, 앞으로의 날들로 지키는 것이다.'"}]
  },

  notes:{
    noteA:[{speaker:'muse', label:'뮤즈의 쪽지 ①', text:"올림포스의 결혼식에도 초대장은 늘 한 장이 모자랐다.\n\n불화의 여신 에리스. 그녀가 던진 황금사과 하나가 트로이 전쟁을 일으켰다 — 그러니 오늘, 조심할 것."}],
    noteB:[{speaker:'muse', label:'뮤즈의 쪽지 ②', text:"헤라는 결혼의 여신이지만, 사랑을 만들어 주지는 않는다.\n\n그녀가 하는 일은 단 하나 — 두 사람이 서로에게 한 약속을, 잊지 않게 지켜보는 것."}]
  },

  missions:[
    { id:'m1', scene:'lobby', title:'하객 맞이', desc:'방명록에 두 사람의 이름을 적자', goal:{use:'guestbook'},
      start:[
        {title:'헤라의 정원', sub:'예식장 로비 · 예식 30분 전'},
        {say:[{speaker:'muse', label:'뮤즈의 노래', text:"족발집 테이블에서 시작된 이야기가, 마침내 흰 장미 아치 앞에 닿았다.\n\n오늘, 두 집안이 하나가 된다."}]}   // [신화]
      ],
      done:[ {say:[{speaker:'muse', text:"방명록에 두 사람의 이름이 나란히 적혔다.\n\n— 전시현, 장세은."}]} ] },   // [실제 이름]

    { id:'m2', scene:'lobby', title:'신부대기실', desc:'신부 세은에게 인사하러 가자', goal:{talk:'bride'},
      talk:[
        {speaker:'muse', text:"흰 드레스를 입은 그녀가 고개를 들었다.\n\n무슨 말을 하려다, 결국 둘 다 웃고 말았다."},   // [신화]
        {speaker:'dad_young', text:"'...오늘 잘 부탁해요.'"}   // [신화]
      ] },

    { id:'m3', scene:'lobby', title:'굴러온 황금사과', desc:'다투기 시작한 하객 6명을 진정시키자', goal:{kill:6},
      start:[
        {show:'eris', at:[16.5,2.5]},
        {say:[
          {speaker:'eris', text:"'초대장이 한 장 모자랐나 봐? 괜찮아 — 선물은 가져왔거든.'\n\n보랏빛 드레스의 여신이 황금사과 하나를 바닥에 굴렸다."},
          {speaker:'eris', text:"'가장 아름다운 자에게. 자, 누구 거지?'"}
        ]},   // [신화]
        {hide:'eris'},
        {say:[{speaker:'muse', text:"황금사과를 본 하객들의 눈에 안개가 끼었다.\n\n서로를 흘겨보며 웅성거리기 시작한다 — 사과를 두고 다툼이 벌어지려 한다."}]},
        {hostile:true},
        {toast:'🏹 사랑의 화살로 안개를 걷어 하객들을 진정시켜요'}
      ] },

    { id:'m4', scene:'lobby', title:'서약의 홀로', desc:'장미 아치를 지나 서약의 홀로 가자', goal:{reach:'archway', r:1.8},
      start:[ {hostile:false} ],
      done:[ {scene:'hall'} ] },

    { id:'m5', scene:'hall', title:'할머니의 축복', desc:'할머니 유윤재께 인사드리자', goal:{talk:'grandma'},
      start:[
        {title:'서약의 홀', sub:'예식 시작'},
        {say:[{speaker:'muse', text:"스테인드글라스를 통과한 빛이 붉은 길 위로 쏟아졌다.\n\n양가 어른들이 앞자리에 앉아 계셨다."}]}   // [신화]
      ],
      talk:[
        {speaker:'grandma_p', text:"'우리 아들, 이렇게 좋은 사람을 만났구나.'\n\n할머니 유윤재는 아들의 손을 오래 잡고 계셨다."}   // [실제]
      ] },

    { id:'m6', scene:'hall', title:'외조부모님의 축복', desc:'외할아버지 장건식·외할머니 유재순께 인사드리자', goal:{talk:'gpaM'},
      talk:[
        {speaker:'grandpa_m', text:"'우리 딸, 행복하게 살아라.'\n\n외할아버지 장건식과 외할머니 유재순은 딸의 손을 꼭 쥐었다가, 그 손을 사위에게 건네주셨다."}   // [실제]
      ] },

    { id:'m7', scene:'hall', title:'불화의 여신', desc:'에리스의 황금사과를 멈추자', goal:{boss:true},
      start:[
        {shake:true},
        {say:[{speaker:'eris', text:"'축복이라니, 지루해. 나는 이런 날이 제일 재미없더라.'\n\n황금사과가 공중으로 떠올랐다."}]},   // [신화]
        {boss:'eris', at:[10.5, 4.5]},
        {toast:'⚠ 바닥에 원이 뜨면 피하세요 — 황금사과가 떨어져요'}
      ],
      done:[
        {say:[{speaker:'eris', text:"'...뭐야. 왜 안 싸워. 다들.'\n\n사과의 빛이 사그라들자, 여신은 어깨를 으쓱하고는 사과를 툭 떨어뜨렸다."}]}
      ] },

    { id:'m8', scene:'hall', title:'서약', desc:'서약의 단에서 헤라 앞에 서자', goal:{use:'altar'},
      done:[
        {say:[{speaker:'hera', text:"'황금사과를 어찌할 테냐. 부수어 없앨 수도, 주인에게 돌려줄 수도 있다.'"}]},
        {say:[{speaker:'hera', label:'선택', text:"'무엇을 택하겠느냐?'",
          choices:["사과를 깨뜨린다","에리스에게 돌려준다"], choose:'apple',
          results:[
            "사과는 산산이 부서졌다. 불화의 빛도 함께 흩어졌다.\n\n'현명하군. 다시는 이 집안에 굴러들지 못하리라.'",
            "그는 사과를 주워, 여신에게 돌려주었다.\n\n에리스는 잠시 그를 빤히 보더니 — 처음으로, 웃었다.\n'…이상한 인간이네. 기억해 둘게.'"
          ]}]},   // [신화]
        {say:[
          {speaker:'hera', text:"'그러면 이제, 서약을 하라.'\n\n두 사람의 손이 포개졌다."},
          {speaker:'muse', label:'서약', text:"두 집안이 하나가 되었다.\n\n올림포스의 모든 신들이 증인이 된 그날 — 두 사람은 서로의 이타카가 되기로 약속했다."}
        ]},   // [신화]
        {thread:true},
        {wait:1200},
        {end:true}
      ] }
  ]
};

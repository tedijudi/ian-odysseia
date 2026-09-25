/* ============================================================
   4장 · 모이라이의 실타래 — 찰떡이의 열 달
   실제 이야기: 태명 '찰떡이'(배 속에 찰떡처럼 단단히 붙어 있으라는 뜻),
                입덧을 지극정성으로 지켜준 시간, 초음파로 처음 본 꼬물거리는 손발,
                배 위로 톡톡 전해져 온 첫 태동, 세 식구의 첫 해외여행(후쿠오카 태교여행).
   새 글자 — 벽: $ 운명의 신전 · ? 초음파실 · ! 일본 밤거리 상점
            소품: 6 거대한 물레 · 3 모래시계 기둥 · 4 야타이 포장마차 · 5 진료 침대
   ▸ [실제] 가족이 들려준 말 그대로 · [신화] 게임을 위해 지어낸 연출
   ============================================================ */
const CH4 = {
  id:4, title:'모이라이의 실타래',
  intro:{ small:'CHAPTER 04', title:'모이라이의 실타래', text:"운명을 잣는 세 여신이,\n두 사람의 실 옆에 아주 작고 단단한 세 번째 실을 잣기 시작했다.\n\n열 달의 항해가 시작된다." },
  outro:{ small:'CHAPTER 04 CLEAR', title:'열 달의 실', text:"찰떡처럼 단단히 붙어, 열 달을 함께 건너온 작은 실.\n\n— 5장 「에일레이티이아의 문」으로 이어집니다" },
  companion:'seeunC',

  actors:{
    seeunC:  { pal:'mom',    name:'세은' },
    klotho:  { pal:'muse',   name:'클로토' },
    lachesis:{ pal:'moira2', name:'라케시스' },
    atropos: { pal:'moira3', name:'아트로포스' }
  },

  scenes:{
    fate:{
      name:'운명의 물레방', time:'열 달의 시작', grade:'rgba(190,180,255,.14)', light:'night', sky:'stars', edge:'stone',
      ambient:'rgb(196,186,236)', vignette:.3, fx:['motes'],
      rows:[
        '$$$$$$$$$$$$$$$$$$',
        '$mmmmmmmmmmmmmmmmm',
        '$mm|mmmmm6mmmmm|mm',
        '$mmmmmmmmmmmmmmmmm',
        '$mmmmmmmmmmmmmmmmm',
        '$mm|mmmmmmmmmmm|mm',
        '$mmmmmmmmmmmmmmmmm',
        '$mmmmmmmmmmmmmmmmm',
        '$mm|mmmmmmmmmmm|mm',
        '$mmmmmmmmmmmmmmmmm',
        '$mmmmmmmmmmmmmmmmm'
      ],
      spawn:[9, 9.2],
      place:{ seeunC:[8.2,9.6], klotho:[9.5,3.6], lachesis:[5.5,5.6], atropos:[13.5,5.6] },
      objects:[ { id:'noteA', x:3.5, y:8.5, note:true, label:'뮤즈의 쪽지' } ]
    },

    sand:{
      name:'기다림의 모래바다', time:'열 달 중 가장 긴 두 달', grade:'rgba(255,215,170,.12)', light:'dusk', sky:'dawn', edge:'sand', water:'#c8a86a',
      ambient:'rgb(250,224,206)', vignette:.24, fx:['motes'],
      rows:[
        'NNNNNNNNNNNNNNNNNNNNNNNNNN',
        'Naaaaaaaaaaaaaaaaaaaaaaaaa',
        'Naaaaa3aaaaaaaaaaa3aaaaaaa',
        'Naaaaaaaaaaaaaaaaaaaaaaaaa',
        'Naaaaaaaaaaaaaaaaaaaaaaaaa',
        'Naa3aaaaaaaaaaaaaaaaaa3aaa',
        'Naaaaaaaaaaaaaaaaaaaaaaaaa',
        'Naaaaaaaaaaaaaaaaaaaaaaaaa',
        'Naaaaaaaaaa3aaaaaaaaaaaaaa',
        'Naaaaaaaaaaaaaaaaaaaaaaaaa',
        'Naaaaa3aaaaaaaaaaaa3aaaaaa',
        'Naaaaaaaaaaaaaaaaaaaaaaaaa',
        'Naaaaaaaaaaaaaaaaaaaaaaaaa',
        'Naaaaaaaaaaaaaaaaaaaaaaaaa'
      ],
      spawn:[5.5, 11.5],
      place:{ seeunC:[4.6, 11.8] },
      objects:[
        { id:'care1', x:11.5, y:4.5,  kind:'care', label:'얼음물' },
        { id:'care2', x:19.5, y:8.5,  kind:'care', label:'새콤한 과일' },
        { id:'care3', x:8.5,  y:2.5,  kind:'care', label:'무릎담요' },
        { id:'noteB', x:23.5, y:12.5, note:true, label:'뮤즈의 쪽지' }
      ],
      mobs:[ ['cloud',9.5,7.5],['cloud',15.5,10.5],['cloud',20.5,5.5],['cloud',13.5,12.5] ]
    },

    echo:{
      name:'별빛 초음파실', time:'첫 손발을 본 날', grade:'rgba(160,200,255,.14)', light:'night', sky:'stars', edge:'stone',
      ambient:'rgb(186,196,238)', vignette:.3, fx:['motes'],
      rows:[
        '??????????????',
        '?ooooooooooooo',
        '?oooo5oooooooo',
        '?ooooooooooooo',
        '?ooooooooooooo',
        '?ooooooooooooo',
        '?ooooooooooooo',
        '?ooooooooooooo',
        '?ooooooooooooo',
        '?ooooooooooooo'
      ],
      spawn:[7.5, 8.2],
      place:{ seeunC:[5.4, 3.0] },
      objects:[
        { id:'monitor', x:5.5, y:4.0, label:'초음파 화면' },
        { id:'kick1', x:3.5, y:6.5, kind:'kick', label:'톡' },
        { id:'kick2', x:10.5, y:5.5, kind:'kick', label:'톡톡' },
        { id:'kick3', x:7.5, y:8.5, kind:'kick', label:'톡톡톡' }
      ]
    },

    fukuoka:{
      name:'후쿠오카의 밤바람', time:'세 식구의 첫 해외여행', grade:'rgba(150,180,255,.14)', light:'night', sky:'nightsea', edge:'sea', water:'#1a4a86',
      ambient:'rgb(152,152,212)', vignette:.3, fx:['motes'],
      rows:[
        '!!!!!!!!!!!!!!!!!!!!!!!!',
        '!nnnlnnnnnlnnnnnlnnnnnnn',
        '!nnnnnnnnnnnnnnnnnnnnnnn',
        '!nn4nnnnnn4nnnnnn4nnnnnn',
        '!nnnnnnnnnnnnnnnnnnnnnnn',
        '!nnnnnnnnnnnnnnnnnnnnnnn',
        '!nnnnnnnnnnnnnnnnnnnnnnn',
        '!nnnlnnnnnlnnnnnlnnnnnnn',
        '!nnnnnnnnnnnnnnnnnnnnnnn',
        '!rrrrrrrrrrrrrrrrrrrrrrr',
        '!wwwwwwwwwwwwwwwwwwwwwww',
        '!wwwwwwwwwwwwwwwwwwwwwww'
      ],
      spawn:[4.5, 7.5],
      place:{ seeunC:[3.8, 7.9] },
      objects:[
        { id:'lan1', x:7.5,  y:8.6, label:'소원 등불' },
        { id:'lan2', x:13.5, y:8.6, label:'소원 등불' },
        { id:'lan3', x:19.5, y:8.6, label:'소원 등불' },
        { id:'noteC', x:22.5, y:5.5, note:true, label:'뮤즈의 쪽지' }
      ],
      signs:[ { x:12, wall:'back', z:36, text:'야타이 · 후쿠오카', color:'#ffe6c0', glow:'255,140,90' } ]
    }
  },

  chatter:{
    seeunC:[{speaker:'muse', text:"그녀가 배를 살며시 쓸어내렸다.\n\n'괜찮아, 우리 찰떡이.'"}],
    klotho:[{speaker:'muse', text:"물레를 돌리는 첫째의 손끝에서, 가느다란 실이 반짝였다."}]
  },

  notes:{
    noteA:[{speaker:'muse', label:'뮤즈의 쪽지 ①', text:"모이라이는 신들조차 두려워하는 세 자매다.\n\n그러나 그날의 세 자매는 유난히 조심스러웠다. 새로 자아낼 실이 너무나 작았기 때문이다."}],
    noteB:[{speaker:'muse', label:'뮤즈의 쪽지 ②', text:"기다림의 사막에는 시계가 없다.\n\n다만 곁에 누군가 앉아 있으면, 모래가 조금 더 빨리 흐른다고 한다."}],
    noteC:[{speaker:'muse', label:'뮤즈의 쪽지 ③', text:"바다 건너에서 부는 밤바람은, 아직 태어나지 않은 아이에게도 닿는다.\n\n그래서 사람들은 그 바람 앞에서 이름을 부르고, 약속을 한다."}]
  },

  missions:[
    { id:'m1', scene:'fate', title:'세 자매', desc:'운명을 잣는 세 여신을 모두 만나자', goal:{talkAll:['klotho','lachesis','atropos']},
      start:[
        {title:'운명의 물레방', sub:'열 달의 시작'},
        {say:[{speaker:'muse', text:"별빛이 실이 되어 감기는 방.\n\n두 사람의 실 옆에서, 아주 가느다란 세 번째 실이 막 자아지기 시작하고 있었다."}]}
      ],
      talks:{
        klotho:[{speaker:'muse', label:'클로토 · 잣는 자', text:"'새 실이 —'\n\n물레를 돌리던 첫째가 말을 멈췄다. 손끝에서 작고 단단한 실 한 가닥이 돋아나고 있었다."}],
        lachesis:[{speaker:'muse', label:'라케시스 · 재는 자', text:"'— 너희 실 옆에서 —'\n\n둘째가 자로 실의 길이를 재며 고개를 끄덕였다. '길구나. 아주 길어.'"}],
        atropos:[{speaker:'muse', label:'아트로포스 · 끊는 자', text:"'— 흔들리고 있다.'\n\n셋째가 가위를 내려놓았다. '걱정 마라. 이 실은 내가 가장 오래, 가위를 대지 않을 실이니.'"}]
      } },

    { id:'m2', scene:'fate', title:'태명', desc:'클로토에게 아이의 태명을 알려주자', goal:{talk:'klotho'},
      talk:[
        {speaker:'muse', label:'클로토', text:"'실에는 이름이 있어야 감기느니라.\n\n이 아이를, 너희는 무어라 부르겠느냐?'",
          choices:["찰떡이","튼튼이","복덩이"], answer:0,
          right:"'찰떡이라… 좋구나. 이름대로 붙어 있거라.'", wrong:"'아니지. 너희가 진짜로 부르던 이름이 있지 않으냐.'"},
        {speaker:'muse', label:'태명 찰떡이', text:"엄마 배 속에 《찰떡처럼》 단단하고 건강하게 착 달라붙어 있으라는 간절한 사랑.\n\n그 마음을 담아, 두 사람은 아이를 '찰떡이'라 불렀다."}
      ],
      done:[ {give:'chaltteok'}, {scene:'sand'} ] },

    { id:'m3', scene:'sand', title:'기다림의 사막', desc:'입덧으로 힘든 세은에게 줄 것 3가지를 찾자', goal:{collect:'care', n:3},
      start:[
        {title:'기다림의 모래바다', sub:'열 달 중 가장 긴 두 달'},
        {say:[{speaker:'muse', text:"입덧이 찾아왔다.\n\n하루가 모래처럼 길어지는 시간. 그는 매일 무언가를 찾아 사막을 건넜다."}]},
        {hostile:true}
      ] },

    { id:'m4', scene:'sand', title:'곁에 있기', desc:'찾은 것들을 세은에게 가져다주자', goal:{talk:'seeunC'},
      start:[ {hostile:false} ],
      talk:[
        {speaker:'muse', text:"얼음물 한 컵, 새콤한 과일 한 조각, 무릎에 덮을 담요 한 장.\n\n대단한 것은 없었다. 그저 그는 매일, 지극정성으로 곁에 있었다."}
      ] },

    { id:'m5', scene:'sand', title:'기다림의 골렘', desc:'모래시계 골렘을 멈추자', goal:{boss:true},
      start:[
        {shake:true},
        {say:[{speaker:'muse', text:"그때 모래가 소용돌이치며 거대한 모래시계가 일어섰다.\n\n《기다림》이 모습을 가진 것이다. '아직이다… 아직, 아직…'"}]},
        {boss:'golem', at:[14.5, 5.5]},
        {toast:'⚠ 바닥에 원이 뜨면 피하세요'}
      ],
      done:[
        {say:[{speaker:'muse', text:"골렘이 무너지며 모래가 흩어졌다. 그 자리에 작은 모래시계 하나가 남았다.\n\n남은 시간 — 여덟 달."}]},
        {give:'hourglass'}, {scene:'echo'}
      ] },

    { id:'m6', scene:'echo', title:'별빛 화면', desc:'초음파 화면을 보자', goal:{use:'monitor'},
      start:[
        {title:'별빛 초음파실', sub:'첫 손발을 본 날'},
        {say:[{speaker:'muse', text:"어두운 방, 화면 위로 작은 별자리 하나가 떠올랐다."}]}
      ],
      done:[
        {say:[{speaker:'muse', label:'꼬물거리는 손발', text:"초음파로 꼬물거리는 손발을 처음 본 날의 전율.\n\n화면 속 작은 별이, 손가락을 폈다 쥐었다 했다."}]},
        {give:'ultra'}
      ] },

    { id:'m7', scene:'echo', title:'첫 태동', desc:'톡톡 신호가 오는 곳으로 가자 (3번)', goal:{collect:'kick', n:3},
      done:[
        {say:[{speaker:'muse', label:'태동의 북소리', text:"배 위로 톡톡 전해져 오던 첫 태동.\n\n온 가족이 환호했다. 작은 북소리가, 이제 분명히 들렸다."}]},
        {scene:'fukuoka'}
      ] },

    { id:'m8', scene:'fukuoka', title:'세 식구의 첫 여행', desc:'바닷가의 소원 등불 3개에 불을 켜자', goal:{useAll:['lan1','lan2','lan3']},
      start:[
        {title:'후쿠오카의 밤바람', sub:'세 식구의 첫 해외여행'},
        {say:[{speaker:'muse', text:"세 식구가 함께 떠난 첫 해외여행.\n\n야타이의 불빛과 잔잔한 밤바람 속에서, 두 사람은 배에 대고 나직이 속삭였다."}]}
      ] },

    { id:'m9', scene:'fukuoka', title:'아직 만나지 못한 너에게', desc:'', goal:{auto:true},
      start:[
        {wait:500},
        {say:[
          {speaker:'dad_young', text:"'찰떡아. 여기 바람이 참 좋다.'"},
          {speaker:'muse', label:'열 달의 실', text:"태어날 아이에게 들려주던 다정한 속삭임들.\n\n클로토의 실은 그 목소리를 모두 감아, 여덟 달 뒤의 아침으로 실어 날랐다."}
        ]},
        {give:'fukuoka'},
        {wait:500},
        {end:true}
      ] }
  ]
};

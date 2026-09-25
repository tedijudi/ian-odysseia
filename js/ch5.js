/* ============================================================
   5장 · 에일레이티이아의 문 — 영웅의 탄생
   실제 기록: 2026년 3월 11일 오전 10시 15분, 안산우성여성병원, 제왕절개(39주 1일차),
             3.36kg · 47.5cm, 이름 전이안(JEON IAN) — 기쁘고(怡) 평안하라(安)
   가족의 축복: 할머니 유윤재, 외할아버지 장건식 · 외할머니 유재순, 하늘의 별 할아버지 전용식
   ▸ [실제] 가족이 들려준 이야기 · [신화] 게임을 위해 지어낸 연출
   ============================================================ */
const CH5 = {
  id:5, title:'에일레이티이아의 문',
  intro:{ small:'CHAPTER 05', title:'에일레이티이아의 문', text:"출산의 여신 에일레이티이아가 등불을 들었다.\n마침내, 문이 열릴 시간이었다.\n\n2026년 3월 11일, 안산." },
  outro:{ small:'CHAPTER 05 CLEAR', title:'이안, 기쁘고 평안하라', text:"작은 손과 발, 세상을 향해 터뜨린 첫 울음.\n그것은 존재의 선언이자, 두 사람 인생의 가장 거대한 트로피였다.\n\n— 6장 「이타카의 아침」으로 이어집니다" },

  actors:{
    seeunC:  { pal:'mom',      name:'세은' },
    nurse:   { pal:'nurse',    name:'간호사' },
    dad:     { pal:'dad',      name:'아빠 전시현' },
    grandma: { pal:'hanbok_g', name:'할머니 유윤재' },
    gpaM:    { pal:'grandpa',  name:'외할아버지 장건식' },
    gmaM:    { pal:'hanbok_m', name:'외할머니 유재순' },
    star:    { pal:'tribute',  name:'할아버지 전용식' }
  },

  scenes:{
    lobby:{
      name:'새벽의 병원 로비', time:'2026년 3월 11일 · 새벽', grade:'rgba(210,235,255,.10)', light:'day', edge:'stone',
      ambient:'rgb(222,232,246)', vignette:.26, fx:['motes'],
      rows:[
        'IWWWWWWWWWWWWWWW',
        'IoooRooooooooppo',
        'IoooooooQQQooooo',
        'Iooooooooooooooo',
        'Iobbooooooooobbo',
        'Iooooooooooooooo',
        'Iobbooooooooobbo',
        'Iooooooooooooooo',
        'Iooooooooooooooo',
        'Ipoooooooooooooo'
      ],
      spawn:[8, 8.4],
      place:{ seeunC:[6.8, 5.4], nurse:[9.2, 1.4] },
      objects:[ { id:'noteA', x:14.5, y:8.5, note:true, label:'뮤즈의 쪽지' } ]
    },
    corridor:{
      name:'초조함의 복도', time:'수술실 앞', grade:'rgba(140,150,230,.16)', light:'night', edge:'stone',
      ambient:'rgb(176,184,222)', vignette:.36, fx:['motes','mist'],
      rows:[
        'IIIIIIIIIIIIIIIIIIIIIIIIIIIIII',
        'Ioooooooooooooooooooooooooooob',
        'Ioooooooooooooooooooooooooooob',
        'Ioooooooooooooooooooooooooooob',
        'Ioooooooooooooooooooooooooooob',
        'Ioooooooooooooooooooooooooooob'
      ],
      spawn:[2.5, 3.5],
      objects:[ { id:'door', x:28.4, y:3.0, label:'수술실 문' } ],
      mobs:[ ['shadow',7.5,2.5],['shadow',11.5,4.5],['shadow',15.5,2.2],['shadow',19.5,4.4],['shadow',23.5,2.6],['shadow',25.5,4.2] ]
    },
    nursery:{
      name:'신생아실', time:'오전 10시 15분 이후', grade:'rgba(255,225,205,.12)', light:'day', edge:'stone',
      ambient:'rgb(252,240,236)', vignette:.2, fx:['petals','beams'],
      rows:[
        'IWWWWWWWWWWWWWW',
        'Iooooooooooooo',
        'Ioo5ooo5ooo5oop',
        'Iooooooooooooo',
        'Iooooooooooooo',
        'Iooooooooooooo',
        'Iooooooooooooo',
        'Ipooooooooooooo'
      ].map(r=>(r+'ooooooooooooooo').slice(0,15)),
      spawn:[7.5, 4.2],
      place:{ dad:[5.6,5.6], seeunC:[4.4,3.4], grandma:[9.6,5.8], gpaM:[11.6,4.6], gmaM:[12.6,5.6] },
      objects:[ { id:'window', x:8.5, y:1.4, label:'창가' } ]
    }
  },

  chatter:{
    seeunC:[{speaker:'muse', text:"그녀가 그의 손을 꼭 잡았다.\n\n말보다 손이 먼저, 괜찮다고 말하고 있었다."}],
    nurse:[{speaker:'nurse', text:"'보호자분은 이쪽에서 잠시만 기다려 주세요.'"}]
  },

  notes:{
    noteA:[{speaker:'muse', label:'뮤즈의 쪽지', text:"에일레이티이아는 문을 여는 여신이다.\n\n그녀가 가장 좋아하는 소리는 — 문 너머에서 처음 들려오는 울음소리라고 한다."}]
  },

  missions:[
    { id:'m1', scene:'lobby', title:'약속의 날', desc:'안내 데스크에서 접수하자', goal:{talk:'nurse'},
      start:[
        {title:'새벽의 병원 로비', sub:'2026년 3월 11일 · 안산우성여성병원'},
        {say:[{speaker:'muse', text:"약속의 날 아침.\n\n열 달의 항해 끝에, 두 사람은 마지막 문 앞에 섰다."}]}   // [신화]
      ],
      talk:[
        {speaker:'nurse', text:"'39주 1일차, 예정된 제왕절개 맞으시죠?'\n\n'...네.'\n\n그의 목소리가 조금 떨렸다."}   // [실제+신화]
      ] },

    { id:'m2', scene:'lobby', title:'잡은 손', desc:'세은 곁으로 가자', goal:{talk:'seeunC'},
      talk:[
        {speaker:'muse', text:"대기실 의자에 나란히 앉았다.\n\n그녀가 그의 손을 꼭 잡았다. 말보다 손이 먼저, 괜찮다고 말하고 있었다."}   // [신화]
      ],
      done:[ {scene:'corridor'} ] },

    { id:'m3', scene:'corridor', title:'길어지는 복도', desc:'복도의 불안한 그림자 6개를 걷어내자', goal:{kill:6},
      start:[
        {title:'초조함의 복도', sub:'수술실 앞'},
        {say:[{speaker:'muse', text:"수술실 문이 닫혔다.\n\n복도는 걸을수록 길어졌다. 그림자들이 속삭였다. '혹시…' '만약…'"}]},   // [신화]
        {hostile:true}
      ] },

    { id:'m4', scene:'corridor', title:'공포의 신', desc:'포보스를 이겨내자', goal:{boss:true},
      start:[
        {shake:true},
        {say:[{speaker:'muse', text:"복도 끝에서, 모든 '혹시'와 '만약'이 하나로 뭉쳤다.\n\n공포의 신 《포보스》 — 기다리는 아버지의 초조함이 모습을 가진 것이다."}]},   // [신화]
        {boss:'phobos', at:[20.5, 3.0]},
        {toast:'⚠ 바닥에 원이 뜨면 피하세요'}
      ],
      done:[
        {say:[{speaker:'muse', text:"그림자가 흩어진 자리에, 멀리서 등불 하나가 다가왔다.\n\n출산의 여신 《에일레이티이아》가 문 앞에 섰다."}]}   // [신화]
      ] },

    { id:'m5', scene:'corridor', title:'문이 열리다', desc:'수술실 문 앞으로 가자', goal:{use:'door'},
      done:[
        {flash:true},
        {say:[{speaker:'muse', label:'탄생', text:"2026년 3월 11일 오전 10시 15분.\n\n문 너머에서, 첫 울음이 터졌다.\n\n3.36kg, 47.5cm.\n작은 손과 발, 세상을 향해 터뜨린 첫 울음 — 그것은 존재의 선언이었다."}]},   // [실제]
        {player:'ian'},
        {scene:'nursery'}
      ] },

    { id:'m6', scene:'nursery', title:'처음 보는 얼굴들', desc:'이안이가 되어 가족들과 눈을 맞추자', goal:{talkAll:['seeunC','dad','grandma','gpaM','gmaM']},
      start:[
        {title:'신생아실', sub:'이안이의 눈으로'},
        {say:[{speaker:'muse', text:"이제, 이안이의 눈으로 세상을 본다.\n\n눈부신 빛 속에서, 처음 보는 얼굴들이 하나둘 다가왔다."}]}   // [신화]
      ],
      talks:{
        seeunC:[{speaker:'muse', label:'엄마', text:"열 달 동안 들었던 바로 그 목소리.\n\n엄마의 품이 따뜻했다."}],
        dad:[{speaker:'muse', label:'아빠', text:"'찰떡아… 아니, 이안아.'\n\n복도에서 가장 오래 기다린 사람이, 가장 크게 울고 있었다."}],
        grandma:[{speaker:'muse', label:'할머니 유윤재', text:"갓 태어난 손주의 작은 손가락을 조심스레 어루만지며,\n할머니는 붉어진 눈시울로 축복을 쏟아내셨다."}],   // [실제]
        gpaM:[{speaker:'muse', label:'외할아버지 장건식', text:"딸의 산고와 손주의 탄생을 지켜본 외할아버지.\n\n말없이 등을 두드려 주는 손이, 든든한 버팀목이었다."}],   // [실제]
        gmaM:[{speaker:'muse', label:'외할머니 유재순', text:"외할머니는 딸의 손을 꼭 잡고, 손주를 번갈아 바라보셨다.\n\n무조건적인 사랑과 기쁨이, 그 눈에 가득했다."}]   // [실제]
      } },

    { id:'m7', scene:'nursery', title:'가장 밝은 별', desc:'창가로 가 보자', goal:{use:'window'},
      done:[
        {star:true},
        {show:'star', at:[8.4, 2.6]},
        {say:[{speaker:'grandpa_tribute', label:'하늘의 별', text:"창가에, 한낮인데도 유난히 밝은 별 하나가 떠 있었다.\n\n할아버지 전용식.\n지상에서 손주를 품에 안지는 못하셨지만, 하늘에서 가장 밝은 별이 되어 — 이안이의 앞길을 따스하게 비추고 계셨다."}]},   // [실제]
        {hide:'star'}
      ] },

    { id:'m8', scene:'nursery', title:'이름의 신탁', desc:'', goal:{auto:true},
      start:[
        {wait:400},
        {say:[
          {speaker:'muse', label:'이름의 신탁', text:"'이 아이의 이름을 무어라 부르겠느냐?'",
            choices:["이안","이준","이든"], answer:0,
            right:"'이안이라… 참 좋은 이름이구나.'", wrong:"'아니다. 두 사람이 오래 고민해 지은 이름이 있지 않느냐.'"},
          {speaker:'muse', label:'전이안 · JEON IAN', text:"기쁘고(怡), 평안하라(安).\n\n세상에서 유일한 존재가 된 날, 작은 영웅은 그 이름을 받았다."}   // [실제]
        ]},
        {give:'oracle'},
        {wait:500},
        {end:true}
      ] }
  ]
};

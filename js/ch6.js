/* ============================================================
   6장 · 이타카의 아침 — 첫 나날들
   오디세우스가 마침내 고향 이타카로 돌아오듯, 이 장의 이타카는 세 식구의 집이에요.
   ※ 이 장은 대부분 [신화] — 게임을 위해 지어낸 이야기예요. 실제 순간(백일, 첫 뒤집기, 첫 웃음…)을
     알려주시면 하나씩 바꿔 넣을게요. 마지막 장면만 보내주신 엘리베이터 거울 사진이 모티프예요.
   새 글자 — 바닥: 0 놀이매트 · 벽: : 엘리베이터(헤링본 금속 · 거울) · 소품: 8 소파
   ============================================================ */
const CH6 = {
  id:6, title:'이타카의 아침',
  intro:{ small:'CHAPTER 06', title:'이타카의 아침', text:"긴 항해 끝에, 오디세우스는 마침내 이타카로 돌아왔다.\n\n이제부터의 모든 날이\n새로운 서사시가 될 것이었다." },
  outro:{ small:'CHAPTER 06 CLEAR', title:'거울 속 세 식구', text:"항해자는 집에 돌아와 알게 되었다.\n가장 위대한 모험은, 매일 아침 다시 시작된다는 것을.\n\n— 종장 「레테의 강」으로 이어집니다" },
  companion:'seeunC',

  actors:{
    seeunC:{ pal:'mom',    name:'세은' },
    hypnos:{ pal:'hypnos', name:'히프노스' },
    dadA:  { pal:'dad',    name:'아빠' }
  },

  scenes:{
    night:{
      name:'이타카 · 새벽 세 시', time:'어느 새벽 · 3시 12분', grade:'rgba(130,150,235,.16)', light:'night', edge:'stone',
      ambient:'rgb(120,132,196)', vignette:.36, fx:['motes'],
      rows:[
        'IWWWWWWIIIIIIIII',
        'Ieeeeeeeeeeeepee',
        'Ie88eeeeeeeeeeee',
        'Ieeeeee0000eeeee',
        'Ieeeeee0000eeeee',
        'Ieeeeee0000ee5ee',
        'Ieeeeee0000eeeee',
        'Ieeeeeeeeeeeeeee',
        'IpeeeeeeDDeeeeee',
        'Ieeeeeeeeeeeeeee',
        'Ieeeeeeeeeeeeepe'
      ],
      spawn:[4.5, 8.5],
      place:{ seeunC:[13.2, 6.4] },
      objects:[ { id:'noteA', x:14.5, y:9.5, note:true, label:'뮤즈의 쪽지' } ],
      mobs:[ ['thief',8.5,2.5],['thief',11.5,7.5],['thief',5.5,5.5],['thief',13.5,2.5],['thief',9.5,9.5],['thief',3.5,3.5] ]
    },
    day:{
      name:'이타카 · 우리 집 거실', time:'다음 날 아침', grade:'rgba(255,235,200,.10)', light:'day', edge:'stone',
      ambient:'rgb(255,248,238)', vignette:.16, fx:['beams','motes'],
      rows:[
        'IWWWWWWIIIIIIIII',
        'Ieeeeeeeeeeeepee',
        'Ie88eeeeeeeeeeee',
        'Ieeeeee0000eeeee',
        'Ieeeeee0000eeeee',
        'Ieeeeee0000ee5ee',
        'Ieeeeee0000eeeee',
        'Ieeeeeeeeeeeeeee',
        'IpeeeeeeDDeeeeee',
        'Ieeeeeeeeeeeeeee',
        'Ieeeeeeeeeeeeepe'
      ],
      spawn:[8.5, 5.0],
      place:{ seeunC:[6.4, 6.6], dadA:[10.6, 6.6] },
      objects:[
        { id:'toy1', x:3.5,  y:6.5, kind:'toy', label:'딸랑이' },
        { id:'toy2', x:12.5, y:3.5, kind:'toy', label:'치발기' },
        { id:'toy3', x:8.5,  y:9.4, kind:'toy', label:'헝겊 책' }
      ]
    },
    lift:{
      name:'엘리베이터 거울 앞', time:'외출하는 날', grade:'rgba(220,230,245,.08)', light:'day', edge:'stone',
      ambient:'rgb(236,238,246)', vignette:.3, fx:['motes'],
      rows:[
        '::::::::',
        ':nnnnnnn',
        ':nnnnnnn',
        ':nnnnnnn',
        ':nnnnnnn',
        ':nnnnnnn',
        ':nnnnnnn'
      ],
      spawn:[4.6, 5.0],
      place:{ seeunC:[3.4, 4.6] },
      objects:[ { id:'mirror', x:4.5, y:1.6, label:'거울' } ]
    }
  },

  chatter:{
    seeunC:[{speaker:'muse', text:"그녀가 하품을 참으며 웃었다.\n\n'오늘도 우리 셋, 잘 버텼다.'"}],
    hypnos:[{speaker:'hypnos', text:"'하아암… 나 아직 퇴근 못 했어…'"}]
  },

  notes:{
    noteA:[{speaker:'muse', label:'뮤즈의 쪽지', text:"잠의 신 히프노스는 세상 모든 이를 재울 수 있다.\n\n단 하나, 태어난 지 백 일도 안 된 아기만은 예외다. 그건 신들 사이에서도 유명한 이야기다."}]
  },

  missions:[
    { id:'m1', scene:'night', title:'새벽 세 시의 전쟁', desc:'베개를 훔쳐 가는 새벽잠 도둑 6마리를 쫓아내자', goal:{kill:6},
      start:[
        {title:'이타카', sub:'어느 새벽 · 3시 12분'},
        {say:[{speaker:'muse', text:"항해자는 마침내 집으로 돌아왔다.\n\n그리고 첫날 밤, 그는 알게 되었다. 이타카에도 괴물이 산다는 것을."}]},   // [신화]
        {say:[{speaker:'muse', text:"자장가가 끝날 때마다, 작은 도둑들이 베개를 하나씩 훔쳐 달아났다.\n\n《새벽잠 도둑》이었다."}]},   // [신화]
        {hostile:true}
      ] },

    { id:'m2', scene:'night', title:'잠의 신', desc:'하품하는 히프노스에게 말을 걸자', goal:{talk:'hypnos'},
      start:[
        {hostile:false},
        {show:'hypnos', at:[10.2, 4.2]},
        {say:[{speaker:'hypnos', text:"'하아아암… 누가 나 불렀어?'\n\n날개 달린 모자를 쓴 소년이 눈을 비비며 나타났다. 잠의 신 《히프노스》였다."}]}   // [신화]
      ],
      talk:[
        {speaker:'hypnos', text:"'이 집 아기, 대단한걸. 내가 벌써 세 번이나 재웠는데 세 번 다 깼어.'\n\n'…저도 알아요.'"},
        {speaker:'hypnos', text:"'옛다, 꿀잠 한 조각. 아껴 써. 이건 신들도 귀한 거야.'\n\n히프노스는 그 말을 끝으로, 소파 위에서 먼저 잠들어 버렸다."}
      ],   // [신화]
      done:[ {give:'kkulzam'}, {hide:'hypnos'}, {scene:'day'} ] },

    { id:'m3', scene:'day', title:'매트 위의 대항해', desc:'이안이가 되어 놀이매트 밖의 장난감 3개를 찾아가자', goal:{collect:'toy', n:3},
      start:[
        {title:'이타카 · 우리 집 거실', sub:'다음 날 아침'},
        {player:'ian'},
        {say:[{speaker:'muse', text:"이번에는, 이안이의 차례.\n\n알록달록한 놀이매트는 넓은 바다였고, 장난감들은 저 멀리 떠 있는 섬들이었다."}]}   // [신화]
      ],
      done:[
        {say:[{speaker:'muse', label:'첫 뒤집기', text:"끙, 끙… 데구르르.\n\n작은 영웅이 처음으로 몸을 뒤집은 날. 거실에 박수 소리가 터졌다."}]}   // [신화 — 실제 날짜·장면으로 바꿀 자리]
      ] },

    { id:'m4', scene:'day', title:'두 개의 얼굴', desc:'엄마와 아빠에게 가 보자', goal:{talkAll:['seeunC','dadA']},
      talks:{
        seeunC:[{speaker:'muse', label:'엄마', text:"엄마가 까꿍, 하고 얼굴을 가렸다가 나타났다.\n\n이안이의 입꼬리가 처음으로, 크게 올라갔다."}],
        dadA:[{speaker:'muse', label:'아빠', text:"아빠가 이상한 표정을 지었다. 볼을 부풀리고, 눈을 크게 뜨고.\n\n까르르 — 집 안 가득, 처음 듣는 소리가 퍼졌다."}]
      },   // [신화]
      done:[ {player:'dad'}, {give:'rattle'}, {scene:'lift'} ] },

    { id:'m5', scene:'lift', title:'거울 속 세 식구', desc:'엘리베이터 거울 앞에 서 보자', goal:{use:'mirror'},
      start:[
        {title:'엘리베이터 거울 앞', sub:'외출하는 날'},
        {say:[{speaker:'muse', text:"아기띠를 멘 아빠, 휴대폰을 든 엄마, 그 사이의 작은 영웅.\n\n세 사람이 좁은 엘리베이터 안에 나란히 섰다."}]}
      ],
      done:[
        {photo:true},
        {say:[{speaker:'muse', label:'거울 속 세 식구', text:"거울 속에 세 사람이 있었다.\n\n웃는 엄마, 장난스러운 아빠, 그리고 모든 것이 신기한 듯 거울을 바라보는 이안이.\n\n오디세우스의 항해는 끝났다. 그러나 세 사람의 서사시는 — 이제 막 시작되었다."}]},
        {give:'mirror_photo'},
        {wait:400},
        {end:true}
      ] }
  ]
};

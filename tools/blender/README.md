# 오디세이아 스프라이트 파이프라인

3D(블렌더)로 캐릭터와 소품을 만들고, 8방향 도트 스프라이트로 구워서 게임에 씁니다.
거상이 쓴 방식과 같아요 — 3D로 만들고 2D로 구워냅니다.

## 크기 규약 (이게 제일 중요해요)

원근감이 어긋나지 않도록 모든 것이 **하나의 자에 맞춰져** 있습니다.

| 항목 | 값 |
|---|---|
| 타일 한 칸 | 가로 64px · 세로 32px = **1.23 units** |
| units 당 픽셀 (가로) | **51.9** |
| 카메라 올려본 각도 | **30°** (높이는 cos30 이 곱해져 units 당 45px) |
| 어른 키 | 1.60 units → 화면 **72px** (타일 2.2칸) |
| 집 한 채 (3칸) | 3.69 units → 화면 **192px** |

새 소품을 만들 때는 `prop_baker.py` 의 `scene(가로 units, 높이 units)` 만 부르면
해상도와 접지점이 규약대로 자동 계산됩니다. 숫자를 눈대중으로 넣지 마세요.

```
foot = 세로해상도/2 − 높이/2 × cos(30°) × 51.9
```

## 쓰는 법
```bash
pip install bpy==5.2.2                        # 블렌더를 파이썬 모듈로 (약 400MB)

python3 -I tools/blender/char_baker.py        # 캐릭터 3명 × 5동작 × 8방향 = 600장
python3 -I tools/blender/pack_sprites.py      # 후처리 + 시트로 묶기 → images/sprites/

python3 -I tools/blender/prop_baker.py        # 신전·집·올리브·조각상 등 27종
python3 -I tools/blender/pack_props.py        # 후처리 + 접지점 → images/props/
```

한 장만 빨리 보려면 `BK_ONLY='dad:idle:0:0'` (캐릭터) · `BK_ONLY='temple,olive'` (소품).
`BK_SAMPLES` 로 렌더 품질(기본 20~24)을 바꿉니다.

## 캐릭터 추가하기
`char_baker.py` 의 `CHARS` 에 한 줄 추가하면 됩니다.
색(`skin`/`hair`/`top`/`bottom`/`shoe`/`accent`), `hairstyle`, `build`(man·woman·baby), `scale`.

## 동작 추가하기
`ANIMS` 에 이름과 프레임 수를 넣고, `pose()` 에 그 이름의 포즈를 적습니다.
관절은 `arm_*`(위팔) · `fore_*`(아래팔) · `leg_*`(허벅지) · `shin_*`(종아리) · `torso` · `head`.

## 덧칠 후처리 (`paint.py`)

3D 렌더를 '손으로 그린 그림'처럼 바꾸는 단계예요. 이게 없으면 아무리 정교하게 만들어도
플라스틱 장난감처럼 보입니다. 패커가 자동으로 부릅니다.

1. 채도·대비를 올려 색을 진하게
2. 명암을 7~8단계로 뭉쳐 붓으로 칠한 면을 만들고, **어두운 쪽은 채도를 더** 올려요
3. 형태가 꺾이는 곳(소벨 경계)에 어두운 선 — '그은 선' 느낌
4. 왼쪽 위 가장자리를 밝혀 빛을 받은 결
5. 아래쪽을 어둡게 깔아 바닥에 붙은 느낌
6. 바깥 테두리 — 아래로 갈수록 두껍게

손댈 만한 값: `sat`(채도) · `levels`(명암 단계, 적을수록 또렷) · `line`(선 진하기, 작을수록 진함).

## 귀엽게 보이게 하는 것들
- **3등신** — 머리 지름이 키의 1/3. 이게 '귀엽다'의 거의 전부예요
- 눈을 얼굴 너비의 1/4 크기로, 흰자 · 홍채 · 동공 · 반짝이 두 점
- 모든 상자에 **베벨** — 모서리가 빛을 받아 둥글게 꺾여 로블록스 느낌이 사라져요
- 팔꿈치·무릎을 나눈 관절, 끝으로 갈수록 가늘어지는 `taper`
- 옷을 겹으로 — 옷깃 · 소매단 · 단추 · 허리띠 · 밑단 · 신발 밑창
- 3배 크게 렌더한 뒤 줄여서(LANCZOS) 계단을 지우고 11단계로 포스터화

## 지붕을 만들 때
경사면을 회전시켜 붙이면 쿼터뷰에서 벽이 비치는 틈이 생깁니다.
`tiled_roof_terra()` 처럼 **가로 단을 쌓아 올리세요**. 기왓장 결도 저절로 생깁니다.

## 게임 쪽 연출 (`js/gosang.js`)

소품·캐릭터 말고 실시간으로 그리는 것들입니다.

| 기능 | 찾을 이름 |
|---|---|
| 하루 시간 (새벽·아침·한낮·황혼·밤) | `SKY`, `skyAt`, `drawGrade` |
| 날씨 (맑음·바람·비) | `stepWeather`, `drawRain` |
| 신전에서 쏟아지는 빛줄기 | `drawGodRays` |
| 떠다니는 빛가루 | `drawMotes` |
| 화톳불 빛무리 | `drawGlows`, `FIRES` |
| 광장의 신의 문양 | `drawSigil` |
| 숲의 푸른 안개 | `drawMist` |
| 바다 윤슬·먼 섬 | `drawSeaSparkle`, `paintGround` 의 ISLANDS |
| 마을 사람과 동물 | `NPC_SPAWN`, `stepNpc`, `TALK` |

`?time=dawn|morning|noon|dusk|night` 를 주소에 붙이면 그 시각으로 고정됩니다.

**느려지지 않게 하는 요령** — 매 프레임 `createRadialGradient` 를 부르면 안 됩니다.
그림자·빛무리·안개·윤슬은 전부 한 번 그려 둔 캔버스(`SHADOW_IMG`, `GLOW_FIRE` …)를
`drawImage` 로 붙입니다. 색도 문자열을 새로 만들지 말고 `globalAlpha` 로 조절하세요.

## 결과물
- `images/sprites/<이름>.png` — 가로: 동작별 프레임, 세로: 동작 × 8방향
- `images/sprites/meta.json` — 행·열 위치, 프레임 수, 접지점(`foot`)
- `images/props/<이름>.png` + `meta.json` — 크기와 접지점

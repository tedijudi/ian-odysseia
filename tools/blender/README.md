# 거상풍 스프라이트 파이프라인

3D(블렌더)로 캐릭터·건물·초목을 만들고, 8방향 도트 스프라이트로 구워서 게임에 씁니다.
거상이 쓴 방식과 같아요 — 3D로 만들고 2D로 구워냅니다.

## 쓰는 법
```bash
pip install bpy==5.2.2                        # 블렌더를 파이썬 모듈로 (약 400MB)

python3 -I tools/blender/char_baker.py        # 캐릭터 3명 × 5동작 × 8방향 = 600장
python3 -I tools/blender/pack_sprites.py      # 후처리 + 시트로 묶기 → images/sprites/

python3 -I tools/blender/building_baker.py    # 상점·집·주막·성문·우물·장승
python3 -I tools/blender/tree_baker.py        # 나무 6종
python3 -I tools/blender/prop_baker.py        # 수풀·풀포기·바위
python3 -I tools/blender/pack_props.py        # 후처리 + 접지점 계산 → images/props/
```

캐릭터만 빨리 확인하려면 `BK_ONLY='dad:idle:0:0'` 처럼 한 장만 구울 수 있어요.
`BK_SAMPLES` 로 렌더 품질(기본 20)을 바꿉니다.

## 캐릭터 추가하기
`char_baker.py` 의 `CHARS` 에 한 줄 추가하면 됩니다.
색(`skin`/`hair`/`top`/`bottom`/`shoe`/`accent`), `hairstyle`, `build`(man·woman·baby), `scale`.

## 동작 추가하기
`ANIMS` 에 이름과 프레임 수를 넣고, `pose()` 에 그 이름의 포즈를 적습니다.
관절은 `arm_*`(위팔) · `fore_*`(아래팔) · `leg_*`(허벅지) · `shin_*`(종아리) · `torso` · `head` 입니다.

## 로블록스처럼 보이지 않게 하는 것들
- 모든 상자에 **베벨**(`box(..., bev=)`) — 모서리가 빛을 받아 입체로 보여요
- 팔꿈치·무릎을 **따로 나눈 관절**, 끝으로 갈수록 가늘어지는 `taper`
- 옷을 **겹**으로 — 옷깃 · 소매 · 소매단 · 단추 · 허리띠 · 밑단 · 신발 밑창
- 머리카락은 구 하나가 아니라 **정수리 · 뒤통수 · 앞머리 · 구레나룻**
- 3배 크게 렌더한 뒤 줄여서(LANCZOS) 계단을 지우고, 11단계로 포스터화

## 접지점(foot)
`pack_props.py` 는 소품이 **땅에 닿는 높이**를 카메라 값으로 계산합니다.
```
foot = (세로해상도/2 − hoff × cos(30°) × 픽셀당단위) / 슈퍼샘플
```
눈대중으로 넣으면 나무가 공중에 뜨니 꼭 계산값을 쓰세요.

## 결과물
- `images/sprites/<이름>.png` — 가로: 동작별 프레임, 세로: 동작 × 8방향
- `images/sprites/meta.json` — 각 동작의 행·열 위치와 프레임 수
- `images/props/<이름>.png` + `meta.json` — 크기와 접지점

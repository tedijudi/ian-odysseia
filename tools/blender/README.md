# 거상풍 스프라이트 파이프라인

3D(블렌더)로 캐릭터와 건물을 만들고, 8방향 도트 스프라이트로 구워서 게임에 씁니다.
거상이 쓴 방식과 같아요 — 3D로 만들고 2D로 구워냅니다.

## 쓰는 법
```bash
pip install bpy==5.2.2          # 블렌더를 파이썬 모듈로 (약 400MB)
python3 -I tools/blender/char_baker.py     # 캐릭터 8방향 × 5동작 → raw/
python3 -I tools/blender/prop_baker.py     # 건물·나무·바위 등 → raw_props/
python3 -I tools/blender/pack_sprites.py   # 후처리 + 시트로 묶기 → images/sprites, images/props
```

## 캐릭터 추가하기
`char_baker.py` 의 `CHARS` 에 한 줄 추가하면 됩니다 (피부·머리·옷 색, 머리 모양, 체형).

## 동작 추가하기
`ANIMS` 에 이름과 프레임 수를 넣고, `pose()` 에 그 이름의 포즈를 적습니다.

## 결과물
- `images/sprites/<이름>.png` — 가로: 동작별 프레임, 세로: 동작 × 8방향
- `images/sprites/meta.json` — 각 동작의 위치와 프레임 수

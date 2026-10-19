"""덧칠 후처리 — 렌더한 3D를 '손으로 그린 그림'처럼 바꿉니다.

하는 일
  1) 채도·대비를 올려 색을 진하게
  2) 명암을 몇 단계로 뭉쳐 붓으로 칠한 면을 만들고, 어두운 쪽은 채도를 더 올려요
  3) 형태가 꺾이는 곳에 어두운 선을 그어 '그은 선' 느낌
  4) 왼쪽 위 가장자리를 밝혀 빛을 받은 결
  5) 아래쪽을 어둡게 깔아 바닥에 붙은 느낌
  6) 바깥 테두리 — 아래로 갈수록 두껍게
"""
import numpy as np
from PIL import Image


def _rgb2hsv(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx = a.max(-1); mn = a.min(-1); d = mx - mn
    h = np.zeros_like(mx)
    m = d > 1e-6
    i = (mx == r) & m; h[i] = ((g - b)[i] / d[i]) % 6
    i = (mx == g) & m; h[i] = ((b - r)[i] / d[i]) + 2
    i = (mx == b) & m; h[i] = ((r - g)[i] / d[i]) + 4
    s = np.where(mx > 1e-6, d / np.maximum(mx, 1e-6), 0.0)
    return h / 6.0, s, mx


def _hsv2rgb(h, s, v):
    i = np.floor(h * 6.0)
    f = h * 6.0 - i
    p = v * (1 - s); q = v * (1 - f * s); t = v * (1 - (1 - f) * s)
    i = (i.astype(int) % 6)
    out = np.zeros(h.shape + (3,), dtype=np.float32)
    for k, (R, G, B) in enumerate([(v, t, p), (q, v, p), (p, v, t),
                                   (p, q, v), (t, p, v), (v, p, q)]):
        m = (i == k)
        out[m, 0] = R[m]; out[m, 1] = G[m]; out[m, 2] = B[m]
    return out


def _grad(v):
    gx = np.abs(np.roll(v, -1, 1) - np.roll(v, 1, 1))
    gy = np.abs(np.roll(v, -1, 0) - np.roll(v, 1, 0))
    return np.maximum(gx, gy)


def painterly(im, sat=1.34, con=1.10, levels=8, line=0.62, rim=0.24,
              ground=0.20, outline=(30, 20, 28, 240), thick_bottom=True):
    a = np.asarray(im.convert('RGBA'), dtype=np.float32) / 255.0
    rgb, al = a[..., :3], a[..., 3]
    mask = al > 0.44

    # 1) 대비
    rgb = np.clip((rgb - 0.5) * con + 0.5, 0, 1)

    # 2) 명암 뭉치기 + 그늘 채도
    h, s, v = _rgb2hsv(rgb)
    vq = np.round(v * (levels - 1)) / (levels - 1)
    s2 = np.clip(s * sat * (1.0 + (1.0 - vq) * 0.50), 0, 1)
    vq = np.clip(vq * 0.97 + 0.015, 0, 1)
    rgb = _hsv2rgb(h, s2, vq)

    # 3) 형태가 꺾이는 곳에 선
    if line < 1.0:
        g = _grad(v)
        edge = np.clip((g - 0.045) / 0.16, 0, 1) * mask
        rgb *= (1.0 - edge[..., None] * (1.0 - line))

    # 4) 왼쪽 위 림라이트
    if rim > 0:
        up = np.roll(np.roll(mask, 1, 0), 1, 1)
        edge_top = mask & (~up)
        rgb[edge_top] = np.clip(rgb[edge_top] * (1 + rim) + rim * 0.14, 0, 1)

    # 5) 바닥 쪽 그늘
    if ground > 0 and mask.any():
        ys = np.where(mask.any(1))[0]
        y0, y1 = ys[0], ys[-1]
        hgt = max(1, y1 - y0)
        yy = (np.arange(a.shape[0]) - y0) / hgt
        k = np.clip((yy - 0.62) / 0.38, 0, 1) ** 1.5
        rgb *= (1.0 - k[:, None, None] * ground)

    out = np.zeros_like(a)
    out[..., :3] = np.clip(rgb, 0, 1)
    out[..., 3] = np.where(mask, 1.0, 0.0)
    img = Image.fromarray((out * 255).astype(np.uint8), 'RGBA')

    # 6) 바깥 테두리
    m = out[..., 3] > 0.5
    ring = np.zeros_like(m)
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)):
        ring |= np.roll(np.roll(m, dy, 0), dx, 1)
    ring &= ~m
    if thick_bottom and m.any():
        ys = np.where(m.any(1))[0]
        y0, y1 = ys[0], ys[-1]
        low = np.zeros_like(m)
        cut = y0 + int((y1 - y0) * 0.70)
        low[cut:] = True
        ring2 = np.zeros_like(m)
        for dy, dx in ((2, 0), (2, 1), (2, -1), (1, 2), (1, -2)):
            ring2 |= np.roll(np.roll(m, dy, 0), dx, 1)
        ring |= (ring2 & ~m & low)

    base = np.zeros_like(out)
    base[ring] = np.array(outline, dtype=np.float32) / 255.0
    res = Image.fromarray((base * 255).astype(np.uint8), 'RGBA')
    res.alpha_composite(img)
    return res

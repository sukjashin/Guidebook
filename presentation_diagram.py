from PIL import Image, ImageDraw, ImageFont

W, H = 1800, 900
BG = (250, 250, 250)
BLUE = (204, 228, 255)
GREEN = (214, 244, 222)
PINK = (250, 220, 230)
YELLOW = (255, 238, 201)
GRAY = (120, 130, 150)
DARK = (40, 50, 60)
OUTLINE = (120, 140, 170)


def font(size, bold=False):
    candidates = ['C:/Windows/Fonts/malgunbd.ttf', 'C:/Windows/Fonts/malgun.ttf', 'malgunbd.ttf']
    for c in candidates:
        try:
            return ImageFont.truetype(c, size)
        except Exception:
            pass
    return ImageFont.load_default()


def box(draw, x1, y1, x2, y2, fill, title, title_font, subtitle=None):
    draw.rounded_rectangle((x1, y1, x2, y2), radius=18, fill=fill, outline=OUTLINE, width=2)
    # title
    tw = draw.textbbox((0, 0), title, font=title_font)[2]
    draw.text(((x1+x2)/2 - tw/2, y1+20), title, font=title_font, fill=DARK)
    if subtitle:
        sb = draw.textbbox((0, 0), subtitle, font=font(14))
        sw = sb[2]-sb[0]
        draw.text(((x1+x2)/2 - sw/2, y2-40), subtitle, font=font(14), fill=GRAY)


def arrow(draw, x1, y1, x2, y2):
    draw.line((x1, y1, x2, y2), fill=GRAY, width=3)
    if x2 > x1:
        draw.polygon([(x2, y2), (x2-18, y2-8), (x2-18, y2+8)], fill=GRAY)
    else:
        draw.polygon([(x2, y2), (x2+18, y2-8), (x2+18, y2+8)], fill=GRAY)

img = Image.new('RGB', (W, H), BG)
d = ImageDraw.Draw(img)

# header
header = '관측e비서 챗봇 구성도'
d.text((720, 40), header, font=font(32, True), fill=DARK)

# left to right blocks
box(d, 80, 220, 260, 360, BLUE, '사용자', font(24, True))
box(d, 320, 220, 560, 360, BLUE, 'React UI', font(24, True))
box(d, 620, 220, 860, 360, YELLOW, '질문 입력', font(24, True))
box(d, 920, 220, 1180, 360, PINK, 'api/chat.ts', font(24, True), '질문 처리')
box(d, 1220, 220, 1520, 360, GREEN, '검색/답변', font(24, True), '근거 찾기')
box(d, 1560, 220, 1730, 360, BLUE, '결과 화면', font(22, True))

# bottom
box(d, 400, 520, 760, 660, GREEN, 'public/data/guide-pages.json', font(20, True), 'PDF 인덱스')
box(d, 840, 520, 1220, 660, GREEN, 'Gemini File Search Store', font(20, True), '7개 PDF 문서')
box(d, 1280, 520, 1690, 660, BLUE, 'Gemini 모델', font(22, True), '최종 답변 생성')

# arrows
arrow(d, 260, 290, 320, 290)
arrow(d, 560, 290, 620, 290)
arrow(d, 860, 290, 920, 290)
arrow(d, 1180, 290, 1220, 290)
arrow(d, 1520, 290, 1560, 290)

arrow(d, 540, 360, 540, 520)
arrow(d, 1050, 360, 1050, 520)
arrow(d, 880, 590, 840, 590)
arrow(d, 1220, 590, 1280, 590)
arrow(d, 1690, 590, 1700, 590)

# explanatory label
box(d, 760, 690, 1160, 770, (255,255,255), '핵심 흐름', font(20, True))
label = '질문 → 문서 검색 → 근거 찾기 → Gemini 답변 생성 → 사용자에게 전달'
d.text((330, 725), label, font=font(23), fill=DARK)

img.save('presentation_diagram.png')
print('created: presentation_diagram.png')

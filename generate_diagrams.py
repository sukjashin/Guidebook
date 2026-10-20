from PIL import Image, ImageDraw, ImageFont

WIDTH = 1800
HEIGHT = 1000
BG = (248, 250, 252)
BOX_FILL = (230, 240, 255)
BOX_STROKE = (59, 130, 246)
ALT_FILL = (232, 245, 233)
ALT_STROKE = (34, 197, 94)
TEXT = (17, 24, 39)
LIGHT_TEXT = (71, 85, 105)
ARROW = (71, 85, 105)


def load_font(size):
    try:
        return ImageFont.truetype('malgunbd.ttf', size)
    except Exception:
        try:
            return ImageFont.truetype('C:/Windows/Fonts/malgunbd.ttf', size)
        except Exception:
            return ImageFont.load_default()


def rounded_box(draw, x1, y1, x2, y2, fill, stroke, radius=18, text='', font=None, text_fill=TEXT):
    draw.rounded_rectangle((x1, y1, x2, y2), radius=radius, fill=fill, outline=stroke, width=3)
    if text:
        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2]-bbox[0]
        th = bbox[3]-bbox[1]
        draw.text(((x1+x2)/2 - tw/2, (y1+y2)/2 - th/2), text, font=font, fill=text_fill)


def arrow(draw, x1, y1, x2, y2):
    draw.line((x1, y1, x2, y2), fill=ARROW, width=4)
    dx = x2 - x1
    dy = y2 - y1
    length = (dx*dx + dy*dy) ** 0.5
    if length == 0:
        return
    ux, uy = dx/length, dy/length
    px, py = x2, y2
    left = (px - 20*ux + 8*uy, py - 20*uy - 8*ux)
    right = (px - 20*ux - 8*uy, py - 20*uy + 8*ux)
    draw.line((px, py, left[0], left[1]), fill=ARROW, width=4)
    draw.line((px, py, right[0], right[1]), fill=ARROW, width=4)


def draw_diagram_dev():
    img = Image.new('RGB', (WIDTH, HEIGHT), BG)
    draw = ImageDraw.Draw(img)
    font_big = load_font(26)
    font_mid = load_font(20)
    font_small = load_font(17)

    boxes = [
        (150, 120, 430, 230, '사용자 질문', BOX_FILL, BOX_STROKE),
        (540, 120, 870, 230, 'React UI', BOX_FILL, BOX_STROKE),
        (980, 120, 1350, 230, 'api/chat.ts', BOX_FILL, BOX_STROKE),
        (520, 420, 890, 560, '로컬 검색', ALT_FILL, ALT_STROKE),
        (980, 420, 1380, 560, 'Gemini File Search', ALT_FILL, ALT_STROKE),
        (590, 760, 1220, 880, 'Gemini 응답 생성', BOX_FILL, BOX_STROKE),
    ]

    for x1, y1, x2, y2, label, fill, stroke in boxes:
        rounded_box(draw, x1, y1, x2, y2, fill, stroke, text=label, font=font_big)

    draw.text((650, 60), '개발자용 아키텍처', font=font_big, fill=TEXT)
    small = [
        'public/data/guide-pages.json',
        '관련 문장/페이지 추출',
        '답변 + 출처 + 근거'
    ]
    draw.text((560, 310), small[0], font=font_small, fill=LIGHT_TEXT)
    draw.text((1020, 310), 'Gemini File Search Store', font=font_small, fill=LIGHT_TEXT)
    draw.text((640, 650), small[1], font=font_small, fill=LIGHT_TEXT)
    draw.text((670, 915), small[2], font=font_small, fill=LIGHT_TEXT)

    arrow(draw, 430, 175, 540, 175)
    arrow(draw, 870, 175, 980, 175)
    arrow(draw, 1180, 230, 1180, 300)
    arrow(draw, 1180, 300, 730, 420)
    arrow(draw, 1180, 300, 1180, 420)
    arrow(draw, 730, 560, 730, 760)
    arrow(draw, 1180, 560, 1180, 760)
    arrow(draw, 1180, 760, 1220, 760)
    arrow(draw, 1200, 760, 980, 760)

    draw.text((1150, 250), '질문 분석', font=font_small, fill=LIGHT_TEXT)
    draw.text((860, 355), '관련 문맥', font=font_small, fill=LIGHT_TEXT)
    draw.text((1100, 355), '근거 찾기', font=font_small, fill=LIGHT_TEXT)

    return img


def draw_diagram_operational():
    img = Image.new('RGB', (WIDTH, HEIGHT), BG)
    draw = ImageDraw.Draw(img)
    font_big = load_font(24)
    font_mid = load_font(18)
    font_small = load_font(16)

    boxes = [
        (80, 120, 430, 250, '사용자', BOX_FILL, BOX_STROKE),
        (520, 120, 910, 250, 'Guidebook Frontend', BOX_FILL, BOX_STROKE),
        (980, 120, 1360, 250, 'Vercel API', BOX_FILL, BOX_STROKE),
        (1000, 430, 1360, 560, 'Gemini Model', BOX_FILL, BOX_STROKE),
        (540, 430, 920, 560, 'Local Retrieval Layer', ALT_FILL, ALT_STROKE),
        (140, 430, 430, 560, 'PDF Index Builder', ALT_FILL, ALT_STROKE),
        (500, 760, 1200, 880, '답변 생성', BOX_FILL, BOX_STROKE),
    ]

    for x1, y1, x2, y2, label, fill, stroke in boxes:
        rounded_box(draw, x1, y1, x2, y2, fill, stroke, text=label, font=font_big)

    draw.text((610, 60), '배포/운영용 아키텍처', font=font_big, fill=TEXT)
    draw.text((520, 300), '환경 변수', font=font_mid, fill=LIGHT_TEXT)
    draw.text((1030, 300), 'GEMINI_API_KEY', font=font_small, fill=LIGHT_TEXT)
    draw.text((1230, 300), 'GEMINI_FILE_SEARCH_STORES', font=font_small, fill=LIGHT_TEXT)
    draw.text((180, 620), 'tmp/pdfs', font=font_small, fill=LIGHT_TEXT)
    draw.text((145, 660), 'scripts/sync-guide-document.mjs', font=font_small, fill=LIGHT_TEXT)
    draw.text((610, 660), 'public/data/guide-pages.json', font=font_small, fill=LIGHT_TEXT)
    draw.text((550, 930), '출처 / 근거 / 대답', font=font_small, fill=LIGHT_TEXT)

    arrow(draw, 430, 185, 520, 185)
    arrow(draw, 910, 185, 980, 185)
    arrow(draw, 1180, 250, 1180, 430)
    arrow(draw, 1180, 250, 730, 430)
    arrow(draw, 290, 250, 290, 430)
    arrow(draw, 290, 560, 290, 760)
    arrow(draw, 730, 560, 730, 760)
    arrow(draw, 1180, 560, 1180, 760)
    arrow(draw, 730, 760, 1180, 760)
    arrow(draw, 1180, 250, 1180, 430)

    draw.text((970, 360), '검색/응답', font=font_small, fill=LIGHT_TEXT)
    draw.text((600, 360), '검색 결과', font=font_small, fill=LIGHT_TEXT)
    draw.text((150, 350), '인덱싱', font=font_small, fill=LIGHT_TEXT)
    return img


img1 = draw_diagram_dev()
img1.save('diagram-dev.png')
img2 = draw_diagram_operational()
img2.save('diagram-operational.png')
print('created: diagram-dev.png and diagram-operational.png')

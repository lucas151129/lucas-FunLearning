# -*- coding: utf-8 -*-
"""
生成詞語插圖（Poe / nano-banana）。

用法：
    set POE_KEY=sk-...          （PowerShell: $env:POE_KEY="sk-..."）
    python make_images.py 全部      # 生成全部
    python make_images.py xigua putao   # 只生成指定幾個

輸出：images/<slug>.png，512x512、白底、統一風格。
金鑰只從環境變數讀，不寫進檔案（repo 是公開的）。
"""
import json
import os
import re
import sys
import time
import urllib.request
from io import BytesIO

from PIL import Image

try:  # CP950 主控台印不到某些字會整個中斷
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

API = "https://api.poe.com/v1/chat/completions"
MODEL = "nano-banana-2"
HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(HERE, "images")
SIZE = 512

STYLE = (
    "cute kawaii children's flashcard illustration, flat vector style, "
    "thick soft brown outline, pastel colours, rounded friendly shapes, "
    "square 1:1 composition, subject centred and filling the frame, "
    "plain pure white background, no text, no letters, no border"
)

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"

# slug -> (英文描述, 中文詞，只作記錄)
ITEMS = {
    "zaoshanghao": ("a cheerful smiling sun rising above soft green hills with two small white clouds", "早上好"),
    "tongxue": ("two happy classmates, a boy and a girl in school uniform, standing side by side and waving", "同學"),
    "laoshi": ("a friendly young female teacher with glasses, holding an open book, smiling", "老師"),
    "youxi": ("two happy children playing together with colourful building blocks and a ball", "遊戲"),
    "changge": ("a happy little girl singing into a microphone with floating music notes around her", "唱歌"),
    "xuexi": ("a happy child sitting at a small desk reading an open book with a pencil beside it", "學習"),
    "yanjing": ("a pair of big cute cartoon eyes looking forward, white eyeballs, big dark pupils, no face, no eyelashes drawn on skin", "眼睛"),
    "erduo": ("a single cute cartoon human ear, large and rounded, pale skin tone", "耳朵"),
    "zuiba": ("a smiling closed mouth with soft pink lips, front view, no eyes, no face", "嘴巴"),
    "shuaya": ("a happy child brushing teeth with a toothbrush and toothpaste foam, holding a cup", "刷牙"),
    "xilian": ("a happy child washing their face with both hands, water splashes and droplets around", "洗臉"),
    "xishou": ("two hands being washed under a running tap with soap bubbles", "洗手"),
    "baba": ("a friendly adult father around forty years old, short neat black hair, a small moustache, wearing a light blue button-up shirt and dark trousers, broad adult shoulders", "爸爸"),
    "mama": ("a friendly adult mother around forty years old, shoulder-length dark hair tied in a low bun, wearing a pink blouse and a long navy skirt, adult woman", "媽媽"),
    "gege": ("a teenage older brother around fifteen years old, tall teenager with short hair, wearing a white school uniform shirt and carrying a backpack", "哥哥"),
    "didi": ("a very small preschool boy around four years old, tiny toddler with a round face, wearing a yellow t-shirt and holding a toy car", "弟弟"),
    "jiejie": ("a teenage older sister around fifteen years old, with long straight dark hair, wearing a white school uniform blouse and carrying a shoulder bag", "姐姐"),
    "meimei": ("a very small preschool girl around four years old, with two short pigtails and pink hair bows, wearing a pink dress and holding a teddy bear", "妹妹"),
    "mianbao": ("a golden brown loaf of bread and a soft bread bun", "麵包"),
    "dangao": ("a slice of layered cream cake topped with a strawberry, on a small plate", "蛋糕"),
    "binggan": ("three round chocolate chip cookies stacked", "餅乾"),
    "miantiao": ("a bowl of steaming noodles with chopsticks lifting some noodles", "麵條"),
    "niunai": ("a glass of fresh milk with a splash and a small milk bottle beside it", "牛奶"),
    "guozhi": ("a glass of orange juice with a straw and a slice of orange", "果汁"),
    "shuiguo": ("a woven basket full of mixed fruit: apple, orange, grapes and a pear", "水果"),
    "xigua": ("a slice of red watermelon with green rind and black seeds", "西瓜"),
    "putao": ("a bunch of purple grapes with a green leaf and curly vine", "葡萄"),
    "shuye": ("a single green tree leaf with visible veins, autumn-free, bright green", "樹葉"),
}

# 吉祥物／icon：圓形頭像用，所以主體要留邊、不要頂滿
AVATARS = {
    "kongkong": (
        "head and upper body portrait of a cute chubby corgi puppy with no tail, "
        "orange and white fur, big upright ears, wearing a small black graduation cap tilted on the head "
        "and round glasses, cheerful open-mouth smile, waving one front paw, "
        "centred with generous empty margin around the character",
        "吉祥物（空空，狗博士）",
    ),
    "zh-pth-icon": (
        "head portrait of a cute chubby corgi puppy with no tail, orange and white fur, "
        "big upright ears, wearing a small black graduation cap tilted on the head and round glasses, "
        "cheerful smile, centred with generous empty margin around the character",
        "遊戲 icon（空空）",
    ),
}

# 頭像用的 prompt 尾段：不要「填滿畫面」，要留白給圓形裁切
AVATAR_STYLE = (
    "cute kawaii children's illustration, flat vector style, thick soft brown outline, "
    "pastel colours, rounded friendly shapes, plain pure white background, "
    "no text, no letters, no border"
)


def gen_one(slug: str) -> str:
    if slug in AVATARS:
        subject, _ = AVATARS[slug]
        style = AVATAR_STYLE
    else:
        subject, _ = ITEMS[slug]
        style = STYLE
    payload = json.dumps({
        "model": MODEL,
        "messages": [{"role": "user", "content": f"{subject}, {style}"}],
    }).encode("utf-8")
    req = urllib.request.Request(
        API,
        data=payload,
        headers={
            "Authorization": "Bearer " + os.environ["POE_KEY"],
            "Content-Type": "application/json",
            "User-Agent": UA,
        },
    )
    with urllib.request.urlopen(req, timeout=240) as r:
        data = json.load(r)
    content = data["choices"][0]["message"]["content"]
    m = re.search(r"https://pfst\.cf2\.poecdn\.net/[^)\s\"']+", content)
    if not m:
        raise RuntimeError("no image url in response: " + content[:300])
    url = m.group(0)
    dreq = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(dreq, timeout=240) as r:
        raw = r.read()
    im = Image.open(BytesIO(raw)).convert("RGB")
    w, h = im.size
    s = min(w, h)
    im = im.crop(((w - s) // 2, (h - s) // 2, (w + s) // 2, (h + s) // 2))
    im = im.resize((SIZE, SIZE), Image.LANCZOS)
    path = os.path.join(OUT_DIR, slug + ".png")
    im.save(path, "PNG", optimize=True)
    return path


def main():
    if not os.environ.get("POE_KEY"):
        sys.exit("POE_KEY 未設定")
    os.makedirs(OUT_DIR, exist_ok=True)
    args = sys.argv[1:]
    if not args or args[0] == "全部":
        slugs = list(ITEMS) + list(AVATARS)
    else:
        slugs = args
    bad = [s for s in slugs if s not in ITEMS and s not in AVATARS]
    if bad:
        sys.exit("不認識的 slug：" + ", ".join(bad))

    ok, fail = 0, []
    for i, slug in enumerate(slugs, 1):
        t0 = time.time()
        for attempt in (1, 2):
            try:
                p = gen_one(slug)
                label = (ITEMS.get(slug) or AVATARS[slug])[1]
                print(f"[{i}/{len(slugs)}] OK {slug} ({label}) "
                      f"{os.path.getsize(p)//1024}KB {time.time()-t0:.1f}s", flush=True)
                ok += 1
                break
            except Exception as e:
                if attempt == 2:
                    print(f"[{i}/{len(slugs)}] FAIL {slug}: {e}", flush=True)
                    fail.append(slug)
                else:
                    time.sleep(3)
    print(f"完成：{ok} 成功，{len(fail)} 失敗" + (" -> " + ",".join(fail) if fail else ""))


if __name__ == "__main__":
    main()

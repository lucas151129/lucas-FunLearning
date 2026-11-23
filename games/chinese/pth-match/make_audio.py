# -*- coding: utf-8 -*-
"""
一次性生成所有词语的普通话发音 MP3。
用法：改下面的 WORDS 列表，然后运行：
    python make_audio.py
输出：audio/<文件名>.mp3
声音：微软 Edge 神经网络 TTS（免费，无需 API key），标准普通话。
"""
import asyncio
import os
import sys

import edge_tts

try:  # CP950 主控台印不到某些字会整个中断
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

# 词语表：(词语, 文件名, 拼音)
# 文件名用拼音（避免中文路径问题），要与 index.html 的 audio 字段一致。
WORDS = [
    ("早上好", "zaoshanghao", "zǎo shang hǎo"),
    ("同學",   "tongxue",     "tóng xué"),
    ("老師",   "laoshi",      "lǎo shī"),
    ("遊戲",   "youxi",       "yóu xì"),
    ("唱歌",   "changge",     "chàng gē"),
    ("學習",   "xuexi",       "xué xí"),
    ("眼睛",   "yanjing",     "yǎn jing"),
    ("耳朵",   "erduo",       "ěr duo"),
    ("嘴巴",   "zuiba",       "zuǐ ba"),
    ("刷牙",   "shuaya",      "shuā yá"),
    ("洗臉",   "xilian",      "xǐ liǎn"),
    ("洗手",   "xishou",      "xǐ shǒu"),
    ("爸爸",   "baba",        "bà ba"),
    ("媽媽",   "mama",        "mā ma"),
    ("哥哥",   "gege",        "gē ge"),
    ("弟弟",   "didi",        "dì di"),
    ("姐姐",   "jiejie",      "jiě jie"),
    ("妹妹",   "meimei",      "mèi mei"),
    ("麵包",   "mianbao",     "miàn bāo"),
    ("蛋糕",   "dangao",      "dàn gāo"),
    ("餅乾",   "binggan",     "bǐng gān"),
    ("麵條",   "miantiao",    "miàn tiáo"),
    ("牛奶",   "niunai",      "niú nǎi"),
    ("果汁",   "guozhi",      "guǒ zhī"),
    ("水果",   "shuiguo",     "shuǐ guǒ"),
    ("蘋果",   "pingguo",     "píng guǒ"),
    ("香蕉",   "xiangjiao",   "xiāng jiāo"),
    ("西瓜",   "xigua",       "xī guā"),
    ("葡萄",   "putao",       "pú táo"),
    ("樹葉",   "shuye",       "shù yè"),
]

VOICE = "zh-CN-XiaoxiaoNeural"  # 女声，清晰标准；也可换 zh-CN-YunxiNeural（男声）
RATE = "-8%"                    # 语速稍慢，适合小朋友
OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "audio")


async def gen(word: str, filename: str):
    tts = edge_tts.Communicate(word, VOICE, rate=RATE)
    path = os.path.join(OUT_DIR, filename + ".mp3")
    await tts.save(path)
    return path


async def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for word, filename, _ in WORDS:
        p = await gen(word, filename)
        print(f"OK  {word}  ->  {os.path.basename(p)}  ({os.path.getsize(p)} bytes)")


if __name__ == "__main__":
    asyncio.run(main())

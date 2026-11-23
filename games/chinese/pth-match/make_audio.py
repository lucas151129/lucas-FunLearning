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
import edge_tts

# 词语表：(词语, 文件名, 拼音)
# 把你想教的词语加进来即可，文件名建议用拼音（避免中文路径问题）
WORDS = [
    ("蘋果", "pingguo", "píng guǒ"),
    ("香蕉", "xiangjiao", "xiāng jiāo"),
    ("小貓", "xiaomao", "xiǎo māo"),
    ("小狗", "xiaogou", "xiǎo gǒu"),
    ("眼睛", "yanjing", "yǎn jīng"),
    ("鼻子", "bizi", "bí zi"),
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

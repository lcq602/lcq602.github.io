---
title: "RAG 入门：给大模型接上自己的知识库，别再让它一本正经地胡说八道"
date: 2026-11-23T20:30:00+08:00
description: "聊天助手搭完之后，下一个问题马上就来了：它只会聊自己训练时记住的东西，问它我的笔记里写了什么，它就开始一本正经地编。这篇记录我用纯标准库手写一个最小 RAG 的过程：切块、TF-IDF 检索、组装提示词，跑通之后再看什么时候该换真家伙。"
categories:
  - 学习
tags:
  - RAG
  - LangChain
  - Python
  - 大模型
image: "/img/posts/learning-rag-qa-bot/cover.jpg"
background_position: "center center"
background_brightness: 0.72
---

上一篇文章搭完带记忆的聊天助手之后，我立刻撞上一个新问题：它只会聊自己训练时记住的东西。我问它「我那篇 LangChain 笔记里写了什么」，它答得飞快、自信满满，然后我一翻笔记，发现它说的每句话都是编的。这就是大模型的幻觉——答不出来的时候，它不会说不知道，它会现编一个听起来很合理的答案。

解决办法不是让它背下我的所有笔记，而是换个思路：回答之前，先去我的资料里翻一翻，把翻到的相关内容贴给它，让它照着资料回答。这就是 RAG，检索增强生成（Retrieval-Augmented Generation）。

## RAG 其实只有三步

整个流程拆开看一点都不神秘：

1. **切块**：先把资料切成一小段一小段，每段叫一个 chunk。模型一次吃不下整本书，切块就是为了让每次只喂它最相关的几段。
2. **检索**：用户提问时，从所有 chunk 里找出最相关的几段。这是 RAG 的核心，也是最容易翻车的地方。
3. **生成**：把找出来的几段连同问题一起交给大模型，并且在提示词里明确要求：只根据这些资料回答，不知道就说不知道。

离线准备一次（切块、建索引），在线每次问答都走「检索再生成」。理解了这个节奏，后面所有的工具和框架都只是在把这三步做得更快、更准。

## 先写一个能跑的最小版本

我这次故意没用 LangChain，也没接任何向量数据库，就用 Python 标准库手写了一个最小 RAG。原因很实际：资料只有几段笔记的时候，上重型工具等于用大炮打蚊子，而且手写一遍才能知道每一步到底在算什么。出问题的时候，我能定位是切块、检索还是提示词的问题，而不是对着黑盒猜。

完整代码不到 120 行，存成 `rag_demo.py` 直接跑：

```python
"""最小 RAG 演示：纯标准库，手写 TF-IDF 检索 + 组装提示词。

不依赖任何第三方库，也不调用任何 API，
离线就能跑通「切块 -> 检索 -> 组装提示词」这条主链路。
生成一步留了接口：有 OPENAI_API_KEY 时走兼容接口，
没有就只打印提示词，照样能验证检索有没有找对。
"""
import json
import math
import os
import re
import urllib.request
from collections import Counter

# ---- 1. 知识库：几段自己的学习笔记（真实场景里换成读 md/txt 文件） ----
DOCS = [
    ("langchain.md", "LangChain 是一个用来开发大模型应用的框架，"
     "它把提示词模板、记忆、工具调用和 Agent 串成一条链。"
     "上一篇文章里我用它搭了一个带记忆的聊天助手。"),
    ("rag.md", "RAG 是检索增强生成。先把资料切成小块、算出向量存进向量库；"
     "用户提问时先检索最相关的几块，再把它们连同问题一起交给大模型回答。"
     "这样模型不用记住所有知识，答案也有出处可查。"),
    ("vector-db.md", "向量数据库负责存向量并做相似度搜索。"
     "常见的做法是把文本切块后调用 embedding 模型得到向量，"
     "查询时算余弦相似度，取最接近的 top k 条。"),
    ("prompt.md", "提示词工程的关键是给模型清晰的角色、任务和输出格式，"
     "并把检索到的资料明确标为参考资料，要求模型只根据资料回答，"
     "不知道就说不知道，不要编造。"),
]

# ---- 2. 切块：按固定长度切，块与块之间留一点重叠，避免一句话被拦腰切断 ----
def chunk(text, size=60, overlap=10):
    chunks, start = [], 0
    while start < len(text):
        chunks.append(text[start:start + size])
        start += size - overlap
    return chunks

# ---- 3. 分词：中文按字切、英文按词切，够演示用 ----
def tokenize(text):
    return re.findall(r"[A-Za-z0-9]+|[\u4e00-\u9fff]", text.lower())

# ---- 4. TF-IDF：手写，只用 math 和 Counter ----
class Retriever:
    def __init__(self, docs):
        self.chunks = []      # (来源, 文本)
        for name, text in docs:
            for c in chunk(text):
                self.chunks.append((name, c))
        self.df = Counter()   # 每个词出现在多少个块里
        self.tfs = []
        for _, c in self.chunks:
            tf = Counter(tokenize(c))
            self.tfs.append(tf)
            for w in tf:
                self.df[w] += 1
        self.n = len(self.chunks)

    def search(self, query, top_k=2):
        q = Counter(tokenize(query))
        scored = []
        for (name, text), tf in zip(self.chunks, self.tfs):
            score = 0.0
            for w, qtf in q.items():
                if w in tf:
                    idf = math.log((self.n + 1) / (self.df[w] + 1)) + 1
                    score += qtf * tf[w] * idf
            scored.append((score, name, text))
        scored.sort(key=lambda x: x[0], reverse=True)
        return [(s, n, t) for s, n, t in scored[:top_k] if s > 0]

# ---- 5. 组装提示词：把检索结果当作参考资料塞进去 ----
def build_prompt(query, hits):
    refs = "\n\n".join("【资料{} · 来自 {}】\n{}".format(i + 1, n, t)
                       for i, (_, n, t) in enumerate(hits))
    return ("你是一个学习助手，只根据下面提供的参考资料回答问题，"
            "不知道就直说不知道，不要编造。\n\n" + refs +
            "\n\n问题：" + query + "\n回答：")

# ---- 6. 生成：有 key 就调模型，没 key 就打印提示词收工 ----
def generate(prompt):
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        return "(未设置 OPENAI_API_KEY，这里只展示组装好的提示词)"
    body = json.dumps({"model": "gpt-4o-mini",
                       "messages": [{"role": "user", "content": prompt}]}).encode()
    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions", data=body,
        headers={"Authorization": "Bearer " + key,
                 "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())["choices"][0]["message"]["content"]

if __name__ == "__main__":
    r = Retriever(DOCS)
    question = "RAG 是怎么让大模型回答时有根据的？"
    hits = r.search(question)
    for score, name, text in hits:
        print("[{:.2f}] {}: {}".format(score, name, text))
    print("-" * 40)
    print(generate(build_prompt(question, hits)))
```

## 跑起来，看看它到底找对了没有

不接 API key 也能跑，生成那一步会跳过，只验证检索和提示词组装：

```text
[19.55] prompt.md: 提示词工程的关键是给模型清晰的角色、任务和输出格式，并把检索到的资料明确标为参考资料，要求模型只根据资料回答，不知道就说
[18.24] rag.md: 连同问题一起交给大模型回答。这样模型不用记住所有知识，答案也有出处可查。
----------------------------------------
(未设置 OPENAI_API_KEY，这里只展示组装好的提示词)
```

这是我真实跑出来的输出。两段都找对了方向，但里面藏着两个值得记下来的翻车点。

**第一，排第一的居然不是讲 RAG 定义的那段。** 我问的是「RAG 是怎么让大模型回答时有根据的」，得分最高的却是讲提示词工程的那段。原因很直白：TF-IDF 只看字面上的词重合度，谁和问题共有的词多、那些词又越稀有，谁的分就高。它根本不懂「意思接近」这回事。这恰恰说明了真实系统为什么要用 embedding 向量——向量算的是语义距离，「检索增强」和「翻资料回答」这种没重一个字的表达也能被认出来。

**第二，第一名那段话被拦腰切断了。** 固定长度切块不管句子边界，「不知道就说不知道」切到一半就没了。资料量小的时候这只是难看，资料量大了就可能把关键结论切丢。真实系统里一般按段落、按句子切，或者用 LangChain 的 `RecursiveCharacterTextSplitter`，先按段落切、段落太长再按句子切，尽量不断句。

这两个坑都不用急着修，先看到它们存在，比直接套一个开箱即用的方案要值钱——以后检索结果不对的时候，我知道该先查哪一步。

## 什么时候该换真家伙

手写版够我理解原理，但它有明确的天花板，碰到下面任何一种情况就该升级了：

- **资料从几段笔记变成几百个文件**：TF-IDF 每次都要全量扫一遍，慢。换向量数据库（Chroma、FAISS、pgvector），查询时算余弦相似度，取最接近的 top k 条。
- **检索质量不够**：把手写 TF-IDF 换成 embedding 模型（比如 OpenAI 的 text-embedding 系列，或者本地能跑的 bge），再加一个重排序（rerank）步骤，把初筛的十几段再精排一次。
- **不想自己拼链**：LangChain 里有现成的 `create_retrieval_chain`，几行代码就是这套流程的生产版，切块、向量库、提示词模板都帮你接好了。

但顺序别反了：先手写跑通，再用框架提速。反过来就只会调参数，出了问题连日志都看不懂。

## 下一步

下一步我打算把那 19 章 AI 学习笔记喂给这个小东西：把 md 文件读进来切块，embedding 换成真正的向量，再接上之前那篇的聊天助手做记忆。这样它回答的不再是「训练时记住的东西」，而是我自己的笔记——问它 LangChain 的记忆是怎么实现的，它能翻出我写的那一章再回答。那才是我想要的「记得住、查得到」的助手。

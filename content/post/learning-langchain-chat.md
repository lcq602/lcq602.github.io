---
title: "LangChain 入门：用 Python 搭一个记得住上下文的聊天助手"
date: 2026-11-20T15:40:00+08:00
description: "学大模型应用开发的第一步，不是先啃完所有理论，而是先跑通一个能对话的程序。这篇记录我用 LangChain 搭一个带记忆的聊天助手的全过程：环境、代码、还有中间踩的坑。"
categories:
  - 学习
tags:
  - LangChain
  - Python
  - 大模型
  - 学习笔记
image: "/img/posts/learning-langchain-chat/cover.jpg"
background_position: "center center"
background_brightness: 0.72
---

学一样新东西的时候，我以前总有个坏习惯：先找一堆资料，从第一页开始看，想着全部看懂了再动手。结果往往是看到第三章就困了，合上书什么也没留下。

这次学大模型应用开发，我换了个顺序：**先跑通，再回头补理论。**

这篇就是第一步的记录——用 Python 和 LangChain 搭一个能在终端里对话、而且记得住上文的聊天助手。东西不大，但麻雀虽小，该有的都有了。

## 先把环境搭起来

我现在管理 Python 项目统一用 uv，建项目、装依赖、跑程序都是它，速度快，也不用再和虚拟环境搏斗。

```bash
uv init chat-demo
cd chat-demo
uv add langchain langchain-openai
```

然后把模型服务的密钥写进环境变量。LangChain 支持很多家模型，我这里用兼容 OpenAI 接口的写法，换哪家服务基本只改地址和模型名：

```bash
export LLM_API_KEY="你的密钥"
export LLM_BASE_URL="https://你的模型服务地址/v1"
export LLM_MODEL="你要用的模型名"
```

## 最小版本：先让它说一句话

第一步的目标定得很低：能问一句、答一句，就算成功。

```python
import os

from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    api_key=os.environ["LLM_API_KEY"],
    base_url=os.environ["LLM_BASE_URL"],
    model=os.environ["LLM_MODEL"],
    temperature=0.7,
)

answer = llm.invoke("用一句话介绍你自己")
print(answer.content)
```

跑起来，终端里真的打印出回答的那一刻，其实有点感慨。以前总觉得“调用大模型”是件很玄乎的事，落到代码里，就是十几行。

## 它没有记性——这才是真正要解决的问题

但紧接着就会发现一个尴尬的事：你问它“我刚才问了什么”，它答不上来。

原因不复杂：**每一次调用都是独立的，模型本身不保存任何状态。** 所谓“记忆”，是应用层自己把之前的对话攒下来，每次提问时连同新问题一起发过去。

理解了这一点，代码就顺了。用 LangChain 的提示词模板留一个历史消息的占位符，再自己维护一个消息列表：

```python
import os

from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    api_key=os.environ["LLM_API_KEY"],
    base_url=os.environ["LLM_BASE_URL"],
    model=os.environ["LLM_MODEL"],
    temperature=0.7,
)

prompt = ChatPromptTemplate.from_messages(
    [
        ("system", "你是一个耐心的学习伙伴，回答尽量简洁清楚。"),
        MessagesPlaceholder(variable_name="history"),
        ("human", "{question}"),
    ]
)

chain = prompt | llm
history: list = []

print("开始聊天，输入 quit 退出")
while True:
    question = input("\n我：")
    if question.strip().lower() == "quit":
        break
    result = chain.invoke({"history": history, "question": question})
    print("AI：", result.content)
    history.append(HumanMessage(content=question))
    history.append(AIMessage(content=result.content))
```

再试一次连环提问：先告诉它“我最近在学 LangChain”，再问“我刚才说我在学什么”，这一次它答得上来了。

## 中间踩的两个小坑

**坑一：历史越攒越长。** 对话轮数多了以后，每次发送的内容会越来越长，既费钱也可能超出模型的上下文上限。真实项目里一般会做截断（只保留最近 N 轮）或者把旧对话总结成摘要再带上。入门阶段先知道有这回事就行。

**坑二：密钥别写进代码。** 图省事把密钥硬编码进脚本，代码一旦推到公开仓库，密钥就等于公开了。用环境变量或者 `.env` 文件，并且把 `.env` 写进 `.gitignore`，这是必须养成的习惯。

## 写在最后

回头看，这个小助手真正教会我的不是 LangChain 的某个 API，而是把一件事拆开看的能力：

模型负责“想”，应用负责“记”和“组织”。框架只是把这些零件提前接好了，零件本身并不神秘。

下一篇打算给它接上自己的文档，做一个能根据我的笔记回答问题的版本——也就是常说的 RAG。那是另一条线了，跑通之后再来记录。

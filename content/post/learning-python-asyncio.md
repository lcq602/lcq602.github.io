---
title: "Python asyncio 入门：三个请求从 3 秒变 1 秒，我终于搞懂了协程"
date: 2026-11-24T20:30:00+08:00
description: "写爬虫时三个请求要等 3 秒，我一直以为是网速问题，直到亲手跑了一遍 asyncio：把等待的时间让给别的任务，3 秒直接变 1 秒。这篇记录我从串行到并发、再到限流的完整过程，包括我踩过的坑。"
categories:
  - 学习
tags:
  - Python
  - asyncio
  - 并发
  - 爬虫
image: "/img/posts/learning-python-asyncio/cover.jpg"
background_position: "center center"
background_brightness: 0.72
---

前几天写一个小爬虫，抓三个页面花了 3 秒多。我第一反应是网太慢，直到我盯着日志看了一会儿才发现问题不在网速：每个请求本身只要 1 秒，但三个请求是排着队一个一个等过来的。CPU 大部分时间都在干等，什么都没干。

这就是典型的 I/O 密集型任务。asyncio 就是为这种场景生的：一个任务等网络的时候，让出位置给别的任务跑，轮到它了再回来继续。我今天把这套东西从头跑了一遍，算是真正搞明白了。

## 先看最笨的写法：串行

```python
import asyncio
import time

async def fetch_page(name: str, delay: float) -> str:
    """模拟一次网络请求：等 delay 秒后返回结果。"""
    await asyncio.sleep(delay)
    return f"{name} 抓到了（耗时 {delay}s）"

async def sequential() -> None:
    start = time.perf_counter()
    for name, delay in [("A", 1), ("B", 1), ("C", 1)]:
        print(await fetch_page(name, delay))
    print(f"串行总耗时：{time.perf_counter() - start:.2f}s")

asyncio.run(sequential())
```

输出是 3.00 秒。注意这里有个容易忽略的细节：`await` 在循环里，A 没回来之前 B 连开始都不会开始。`async def` 只是声明这是一个协程函数，不调用、不 await，它就永远只是个躺在那里的对象，什么都不会发生。

## 关键一步：gather 让它们同时跑

```python
async def concurrent() -> None:
    start = time.perf_counter()
    results = await asyncio.gather(
        fetch_page("A", 1),
        fetch_page("B", 1),
        fetch_page("C", 1),
    )
    for r in results:
        print(r)
    print(f"并发总耗时：{time.perf_counter() - start:.2f}s")

asyncio.run(concurrent())
```

输出是 1.00 秒。三个任务在同一秒里各自等各自的，谁也不挡谁。

我一开始对这里的理解是错的：我以为 gather 是开了三个线程。其实不是。整个过程只有一个线程，事件循环在三个协程之间来回切换——A 等着的时候切去 B，B 等着的时候切去 C，C 到时间了再切回来。切换的成本几乎可以忽略，因为切换点就是 `await`，是程序员自己标出来的。

这个认知很关键：asyncio 的并发不是「同时做三件事」，而是「等的时候不闲着」。所以它只对 I/O 等待有效。如果三个任务都是纯计算，各跑 1 秒 CPU，那 asyncio 帮不上忙，三个加起来还是 3 秒，这种场景该用多进程。

## 我踩过的第一个坑：忘了 await

刚上手的时候我写过这样的代码：

```python
# 错误示范
fetch_page("A", 1)  # 没有 await！
```

Python 不会报错，只会给一个 `RuntimeWarning: coroutine was never awaited`，然后你的任务就悄悄没执行。我现在养成了一个习惯：凡是 `async def` 定义的函数，调用时如果不在 `await`、`gather`、`create_task` 里出现，立刻检查一遍。

第二个坑是在普通函数里直接调用协程函数。`asyncio.run()` 是程序入口，只能在最外层用一次，协程函数内部想调别的协程函数直接 `await` 就行，不需要再套一层 `run`。嵌套 `asyncio.run` 会直接报 `RuntimeError`。

## 真实场景不能无限并发：信号量限流

gather 虽然好用，但真爬虫不能这么写。一百个请求同时发出去，对方服务器会直接把你封掉，自己的内存也可能被几百个挂起的连接吃光。所以我加了一个信号量，把并发数卡在 2：

```python
async def limited() -> None:
    sem = asyncio.Semaphore(2)  # 最多同时跑 2 个，防把对方服务器打爆

    async def guarded(name: str, delay: float) -> str:
        async with sem:
            return await fetch_page(name, delay)

    results = await asyncio.gather(
        *(guarded(n, d) for n, d in [("A", 1), ("B", 1), ("C", 1), ("D", 1)])
    )
    print("限流 2 并发：", results)

asyncio.run(limited())
```

四个 1 秒的任务，2 并发跑下来是 2 秒——前两个先跑，腾出位置后两个再跟上。这个模式我以后写爬虫会直接复用：`gather` + `Semaphore`，几乎是固定搭配。

## 完整代码和实测结果

把上面三段拼成一个文件，我实际跑了一遍，输出如下：

```
A 抓到了（耗时 1s）
B 抓到了（耗时 1s）
C 抓到了（耗时 1s）
串行总耗时：3.00s
A 抓到了（耗时 1s）
B 抓到了（耗时 1s）
C 抓到了（耗时 1s）
并发总耗时：1.00s
限流 2 并发： ['A 抓到了（耗时 1s）', 'B 抓到了（耗时 1s）', 'C 抓到了（耗时 1s）', 'D 抓到了（耗时 1s）']
```

有一点要注意：`asyncio.sleep` 只是模拟等待，真实请求要换成 `aiohttp` 这类支持异步的库。如果用 `requests.get` 放在协程里，它会在等待时卡住整个事件循环，并发效果全没了——这是 asyncio 新手最常见的翻车点，库必须本身就是异步的。

## 我现在对 asyncio 的理解

画一张简单的图帮助记忆：

- **同步代码**：排队买票，一个人买完下一个人才能上前。
- **asyncio**：一个窗口，前面的人填表等叫号时，后面的人先上来填表，谁先叫到谁先办。

事件循环就是那个窗口管理员，`await` 就是「我先去旁边等，叫到我再回来」的动作。

学完这一轮，我给自己定了三条规矩：I/O 密集才用 asyncio，纯计算去找多进程；异步库必须配套，同步库塞进协程里等于白搭；并发数永远要设上限，gather 裸奔只适合写 demo。下一篇我想把这套东西接到真实的 HTTP 请求上，用 aiohttp 真抓几个页面，顺便测一测超时和重试该怎么写。

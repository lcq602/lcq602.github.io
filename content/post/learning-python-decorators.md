---
title: "Python 装饰器：给函数包一层“外衣”，不改一行原代码"
date: 2026-11-20T20:35:00+08:00
description: "第一次看到 @app.route、@pytest.mark 这些写法时，我以为是某种特殊语法。后来才发现，装饰器只是 Python 里一个很朴素的技巧：函数可以被另一个函数包起来。这篇是我从计时器写到重试器的学习记录。"
categories:
  - 学习
tags:
  - Python
  - 装饰器
  - 学习笔记
image: "/img/posts/learning-python-decorators/cover.jpg"
background_position: "center center"
background_brightness: 0.72
---

第一次认真看 Flask 教程的时候，我被一行代码卡住了：

```python
@app.route("/hello")
def hello():
    return "你好"
```

`@app.route` 到底是什么？它看起来像注解，又像魔法。我当时直接跳过了，心想“先会用就行”。结果后来学 LangChain、写 FastAPI、看 pytest 的时候，`@` 符号到处都是，躲不掉了。

这周我专门花了一个晚上把它弄明白。结论比我想象的朴素得多：**装饰器不是什么特殊语法，它只是“函数可以被另一个函数包起来”这个事实的自然用法。** 在 Python 里函数是一等公民，可以被赋值、被传参、被返回，所以一个函数接收另一个函数、返回一个加工过的新函数，是完全自然的事。

## 第一个装饰器：给函数加个计时器

我最早想解决的实际问题很具体：写 LangChain 聊天助手的时候，我想知道每次调用大模型花了多久，但又不想在每个函数里都写 `time.time()`。

```python
import time
import functools


def timer(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        elapsed = time.perf_counter() - start
        print(f"{func.__name__} 耗时 {elapsed:.3f} 秒")
        return result
    return wrapper


@timer
def slow_add(a, b):
    time.sleep(0.2)
    return a + b


print(slow_add(2, 3))
```

运行结果：

```text
slow_add 耗时 0.200 秒
5
```

`@timer` 这一行，本质上就是 `slow_add = timer(slow_add)` 的简写。`timer` 收到原来的 `slow_add`，返回一个包了一层计时逻辑的新函数 `wrapper`，以后调用 `slow_add`，实际跑的是 `wrapper`。

`wrapper` 里的 `*args, **kwargs` 很重要：它让装饰器能包住**任何签名**的函数，不管原函数有几个参数都能原样转发。这是我一开始漏掉的地方——第一次写的版本只接受固定参数，换个函数就报错。

## 一个容易踩的坑：函数名会被偷走

装饰器有个经典陷阱。如果去掉 `@functools.wraps(func)` 那一行，`slow_add.__name__` 会变成 `"wrapper"`。函数被包了一层之后，外面看到的名字、文档字符串都是包装函数的，不是原函数的。

这在写小脚本时没感觉，但一旦用上日志、调试工具，或者像 Flask 那样靠函数名注册路由，就会出怪问题。所以我现在养成了习惯：**写装饰器必加 `@functools.wraps(func)`**，就当是固定搭配。

## 带参数的装饰器：再包一层

计时器够用了，但重试不行。调大模型 API、调网络接口的时候，偶尔一次失败很正常，我想写一个 `@retry(times=3)`，失败自动再试几次。带参数的装饰器要多嵌套一层：

```python
def retry(times=3, delay=0.1):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(1, times + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    print(f"第 {attempt} 次失败：{e}")
                    if attempt == times:
                        raise
                    time.sleep(delay)
        return wrapper
    return decorator
```

三层结构第一次看确实绕。我是这样记的：最外层 `retry(times=3)` 只是个“工厂”，它造出真正的装饰器 `decorator`；`decorator` 再造出 `wrapper` 去包原函数。调用的时候，Python 先执行 `retry(times=3)` 得到装饰器，再用它去装饰函数。

注意 `if attempt == times: raise` 这一行：重试次数用完了，就把最后一次异常原样抛出去，而不是悄悄吞掉返回一个 `None`。失败了就该让调用方知道，这是我写重试逻辑时给自己立的规矩。

## 叠加使用：顺序真的有讲究

装饰器可以叠着用。我模拟了一个前两次必失败、第三次才成功的接口，把两个装饰器一起贴上去：

```python
class FakeAPI:
    """模拟一个前两次必失败、第三次才成功的接口。"""

    def __init__(self):
        self.calls = 0

    @retry(times=3, delay=0.1)
    @timer
    def fetch(self, user_id):
        self.calls += 1
        if self.calls < 3:
            raise ConnectionError("网络抖动")
        return {"id": user_id, "name": "林允"}


api = FakeAPI()
print(api.fetch(42))
print("总共调了", api.calls, "次")
```

运行结果：

```text
第 1 次失败：网络抖动
第 2 次失败：网络抖动
fetch 耗时 0.000 秒
{'id': 42, 'name': '林允'}
总共调了 3 次
```

这里有个细节值得留意：`@retry` 在外层、`@timer` 在内层，所以计时器包的是真正干活的 `fetch`，重试包的是“带计时的 fetch”。失败那两次，`timer` 还没来得及打印耗时就抛异常了，于是日志里只有最后成功那一次的耗时。**装饰器离函数越近，执行时就越靠里。** 调换顺序，日志的样子会完全不一样。写的时候我特意在脑子里先过了一遍这个顺序，确认输出符合预期才贴上来。

## 什么时候该用，什么时候不该用

学完之后我回头翻了翻自己以前的代码，发现装饰器适合的场景其实很固定，都是那种“横切”在很多函数上的重复工作：计时和日志、调外部 API 时的重试、用 `functools.lru_cache` 一行解决重复计算、Web 接口的权限检查。

但它也不是万能胶。我现在给自己定了两条线：第一，装饰器里不要藏业务逻辑——它应该只做“外围”的事；第二，一个函数上别贴超过两个装饰器，贴多了之后，读代码的人得在脑子里一层层剥开才能看到真身，调试的时候也容易晕。

## 小结

装饰器学下来，我最大的感受是它把 Python 的一个核心思想用得很彻底：**函数是值，就可以被组合。** 不用改原代码，不用继承，贴一行 `@` 就把能力加上去了。

之前看 Flask 的 `@app.route` 觉得是魔法，现在再看就很亲切了——它做的事和我写的 `@timer` 没有本质区别，都是“收到一个函数，返回一个加工过的函数”。下次再看到满屏的 `@`，我应该不会再跳过了。

---
title: "LangChain 结构化输出：让大模型按格式回话，别再用正则抠 JSON"
date: 2026-11-27T20:30:00+08:00
description: "聊天助手和 RAG 都跑通之后，我想把用户的评论变成一张结构化表格，结果模型返回的 JSON 三次里总有一次带废话、带代码围栏、缺字段。这篇记录我用 PydanticOutputParser 和 with_structured_output 把格式变成代码契约的过程，全部代码本地实测跑通。"
categories:
  - 学习
tags:
  - LangChain
  - 结构化输出
  - Pydantic
  - Python
image: "/img/posts/learning-langchain-structured-output/cover.jpg"
background_position: "center center"
background_brightness: 0.72
---

RAG 那篇写完之后，我给自己加了个小需求：把用户发来的商品评论自动抽成结构化数据——商品名、评分、优点、缺点、推不推荐，存进表里以后能直接统计。听起来比聊天简单多了，不就是让模型返回一段 JSON 吗？结果这是我这周翻车最惨的一次。

## 直接要 JSON，十次里总有几次翻车

我最开始的写法特别直白：提示词里写「请返回 JSON」，拿到结果 `json.loads` 一下。跑了十几条评论，翻车的花样比我想象的多：

- 模型先客气一句「当然可以！这是你要的 JSON：」，再贴 JSON，`json.loads` 第一行就炸；
- JSON 包在 ```json 代码围栏里，`loads` 照样炸；
- 字段名今天叫 `rating`，明天写成 `score`，后天干脆少一个字段；
- 评分让我填 1 到 5，它给了个 6，还一脸自信。

我当时第一反应是加正则：先把围栏剥掉，再把 JSON 抠出来，再补默认值。这条路我真写过，写完就后悔了——正则只能修我见过的错，模型下次换个新花样，我还得再补一条。而且一旦字段缺失，我补的默认值等于在替模型编数据，统计结果悄悄就脏了。

后来我想明白了，问题不在模型不听话，而在我的要求本身就没进「契约」：提示词里的「请返回 JSON」只是个建议，模型爱听不听。真正靠谱的做法，是把格式要求变成代码里能校验的东西。

## 办法一：PydanticOutputParser，任何模型都能用

思路分两步。第一步，用 Pydantic 模型把我要的结构写死，字段、类型、范围都在这里：

```python
from pydantic import BaseModel, Field

class Review(BaseModel):
    product: str = Field(description="商品名称")
    rating: int = Field(description="1 到 5 的评分", ge=1, le=5)
    pros: list[str] = Field(description="优点列表")
    cons: list[str] = Field(description="缺点列表")
    recommend: bool = Field(description="是否推荐购买")
```

注意 `description` 不是写给人看的注释，它会被原样塞进提示词，是模型理解每个字段的说明书。`rating` 的 `ge=1, le=5` 更是关键：它把「1 到 5」从一句提示词变成了硬校验，模型给 6 就直接报错，而不是悄悄入库。

第二步，用 `PydanticOutputParser` 把这个模型变成提示词的一部分，再把模型、提示词、解析器串成一条链：

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser

parser = PydanticOutputParser(pydantic_object=Review)

prompt = ChatPromptTemplate.from_messages([
    ("system", "从用户评论中提取结构化信息。\n{format_instructions}"),
    ("human", "{review}"),
])

chain = prompt | model | parser
```

`parser.get_format_instructions()` 会自动生成一段格式说明，大概是「输出必须是 JSON，字段是这些，类型是那些」的意思，精确程度比我自己手写提示词高得多。这就是这套办法的核心：格式说明不是我凭感觉写的，是从 Pydantic 模型自动推导的，模型定义和格式要求永远不会对不上。

## 本地实测：零 key 也能把链路跑通

我不想为了验证解析链路去烧真实模型的调用，所以用了 LangChain 自带的 `FakeListChatModel`：它不联网，只是按顺序返回我预设好的字符串，正好用来模拟「模型返回了干净 JSON」和「模型返回了带废话的脏 JSON」两种情况。下面这段是我本地实际跑过的完整代码：

```python
from langchain_core.language_models import FakeListChatModel

REVIEW = "这款降噪耳机 X1 降噪确实不错，续航也长，就是戴久了耳朵有点压，总体还是推荐。"

# 模拟模型返回了一段干净的 JSON
good_json = (
    '{"product": "降噪耳机 X1", "rating": 4, '
    '"pros": ["降噪效果好", "续航长"], '
    '"cons": ["耳压感明显"], "recommend": true}'
)
fake = FakeListChatModel(responses=[good_json])
chain = prompt | fake | parser

result = chain.invoke({
    "review": REVIEW,
    "format_instructions": parser.get_format_instructions(),
})
print(result)
print(type(result).__name__, result.rating, result.recommend)
```

实测输出：

```text
product='降噪耳机 X1' rating=4 pros=['降噪效果好', '续航长'] cons=['耳压感明显'] recommend=True
Review 4 True
```

拿到的是一个真正的 `Review` 对象，不是字典也不是字符串，后面 `result.rating` 直接就能用，存数据库、做统计都不用再拆一次。这是我最喜欢的一点：解析这一步做完，下游代码就再也不用跟字符串打交道了。

换成真实模型也只需要改一行，把 `fake` 换成 `ChatOpenAI(model="gpt-4o-mini")` 之类的真实聊天模型，提示词和解析器原封不动。验证链路和花钱调用，在这里是分开的两件事。

## 类型校验是真的在干活，不是摆设

我还特意测了校验是不是真的拦得住坏数据。让模型返回 `rating: 6`：

```python
bad_json = good_json.replace('"rating": 4', '"rating": 6')
parser.parse(bad_json)  # 抛出 OutputParserException，内含 less_than_equal
```

结果是解析直接抛异常，错误里明确写着 `less_than_equal`。这正是我想要的行为：错数据宁可在解析这一步炸出来，也不要带着一个 6 分混进统计表里。以前用 `json.loads` 的时候，6 分是能悄悄入库的，等我发现统计结果不对劲，早就不知道是哪条评论出的问题了。

解析失败之后怎么办，我的做法是重试一次：第一次模型返回了带废话的脏 JSON，解析失败，第二次再调一次，拿到干净 JSON 就成功。实测里这个重试逻辑也跑通了。更讲究的做法是把校验错误信息喂回给模型，让它自己修正重答——LangChain 里有现成的 `RetryOutputParser` 干这个，我暂时没接，原因是重试一次已经覆盖了我遇到的大多数情况，等失败率真的上来了再加也不迟。

## 办法二：with_structured_output，更干净，但要挑模型

如果用的模型支持工具调用（function calling），还有更省事的写法：

```python
structured_model = model.with_structured_output(Review)
result = structured_model.invoke("从这条评论里提取信息：……")
# 直接返回 Review 对象，连提示词里的格式说明都不用自己写
```

这种方式是模型在底层用工具调用的机制保证结构，格式说明不用我手写，返回的也是直接可用的对象。缺点是它挑模型：只支持带工具调用能力的聊天模型，而且我本地用的 `FakeListChatModel` 明确不支持它（会抛 `NotImplementedError`），所以这段我没有在本地跑通——生产环境用真实模型时选它，本地验证链路时用办法一。

我的选型结论很简单：

- 模型不确定支不支持工具调用，或者想先在本地把链路跑通，用 `PydanticOutputParser`；
- 确定用 GPT-4o、Claude 这类支持工具调用的模型，直接上 `with_structured_output`，代码更短；
- 不管用哪种，结构定义只写一份 Pydantic 模型，格式说明从模型推导，不要手写两份。

## 三个我踩过的坑

第一，**字段描述要写给模型看**。`description="商品名称"` 和 `description="从评论中提到的商品全名"`，模型给出的结果稳定性是不一样的。描述越具体，模型越少自由发挥。我现在写 `Field` 的时候，会默认自己就是在给模型写说明书。

第二，**别把什么都塞进一个模型**。我一开始想把「情感倾向、关键词、购买意向、复购概率」全塞进一个 `Review`，结果字段越多，模型越容易漏填。现在的习惯是：一次只抽最核心的 4 到 6 个字段，不够再拆第二次调用。

第三，**解析失败是信号，不是 bug**。以前我一看到解析异常就想办法把它吞掉、给个默认值，现在反过来了：解析失败说明模型没理解任务，或者我的结构定义有歧义。记下来、看一眼，比静默吞掉有价值得多——上周我就靠一条解析失败的日志，发现有用户评论里根本没提商品名，是我的提示词漏了「没提到就填空字符串」这句。

## 一句话总结

结构化输出这件事，本质上是把「请按格式回答」从一句提示词，升级成一段能被代码校验的契约。Pydantic 模型就是那份契约：字段、类型、范围写死，格式说明自动生成，错数据在解析时就地拦下。之前我用正则抠 JSON 的那一版只活了一天就被我删了——不是正则不够努力，是它修补的永远是上一次的错误，而契约防住的是下一类错误。

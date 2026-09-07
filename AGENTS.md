# ✦ Lin Yun Blog · AI Authoring Guide

> **Purpose**  
> 这不是一份“让 AI 随便写文章”的说明，而是一套让 AI 像一个靠谱编辑一样工作的博客创作规范。  
> 目标只有一个：**文章好看、自然、能读、能点开，并且看起来像真的个人博客。**

---

## 01 · 先记住这件事

### ✅ 我们要的

- 像真实的人写出来的博客
- 有自己的判断、偏好、吐槽和细节
- 页面舒服，阅读优先
- 首页卡片、分类页、详情页全部正常
- 保留现有站点的动态背景、导航和整体视觉
- **文章封面图只承担“首页卡片 + 文章详情页背景”两个职责**

### ❌ 我们不要的

- AI 产品官网感
- 巨大的渐变标题
- “不仅仅是……更是……”式套话
- 一堆玻璃卡片互相套娃
- 一篇文章单独做成另一个网站
- 首页有卡片，点进去却 404
- **文章正文再次重复展示封面图**

---

# ✍️ Article Philosophy

## 02 · 写作应该像“人”，不是像“模型”

文章优先保留用户自己的表达。

AI 可以做这些事：

- 整理语序
- 拆分长段落
- 增加自然的小标题
- 补充必要过渡
- 帮用户把零散想法整理成完整文章

AI 不应该做这些事：

- 把用户原话全部洗成标准议论文
- 每一段都总结中心思想
- 强行升华
- 大量使用模板句
- 为了“显得高级”而写空话

### 避免这些高频 AI 句式

> “真正让我感动的是……”  
> “这不仅仅是……更是……”  
> “也许这就是……的意义。”  
> “在这个快节奏的时代……”  
> “当我们回过头来看……”

可以有情绪，但要具体。

**写场景、角色、瞬间、选择、当时的感觉。**

---

# 🗂 Content Structure

## 03 · 文章放在哪里

普通文章：

```text
content/post/<slug>.md
```

需要更自由的排版时：

```text
content/post/<slug>.html
```

例如：

```text
content/post/code-geass-lelouch.html
```

> `.html` 文章不是完整网页。
>
> **禁止**写：
>
> ```html
> <!doctype html>
> <html>
> <head>
> <body>
> ```
>
> Hugo 已经负责整站框架。

---

# 🧾 Front Matter

## 04 · 每篇文章必须有完整元信息

```yaml
---
title: "《反叛的鲁路修》：如果结局从一开始就写好了"
date: 2026-09-07T20:13:00+08:00
description: "我喜欢鲁路修，不是因为他永远算得准，而是因为这个聪明、傲慢又狼狈的人，最后真的把自己也放进了棋盘。"
categories:
  - 动漫
tags:
  - 反叛的鲁路修
  - 鲁路修
image: "/img/posts/code-geass-lelouch/cover.jpg"
---
```

### 必填字段

| 字段 | 用途 |
|---|---|
| `title` | 文章标题 |
| `date` | 发布时间 |
| `description` | 首页卡片和列表摘要 |
| `categories` | 决定首页进入哪个栏目 |
| `image` | 首页封面 + 文章详情页背景 |

> `image` 是文章的**唯一主视觉来源**。详情页模板会自动把它作为背景，因此正文中不要再次插入同一张封面。

---

# 🧭 Categories

## 05 · 当前分类只允许这三个

```text
电影
动漫
学习
```

必须完全一致。

### ✅ 正确

```yaml
categories:
  - 动漫
```

### ❌ 不要写

```text
动画
Anime
动漫笔记
Movies
学习笔记
```

因为首页是按固定分类自动筛选的。

---

# 🖼 Cover & Background

## 06 · 每篇文章只保留一张主视觉封面

图片统一存放：

```text
static/img/posts/<slug>/cover.jpg
```

例如：

```text
static/img/posts/code-geass-lelouch/cover.jpg
```

Front Matter：

```yaml
image: "/img/posts/code-geass-lelouch/cover.jpg"
```

这张 `cover.jpg` 必须同时用于：

```text
首页文章卡片
        ↓
文章详情页背景
```

### 详情页背景规则

当用户点击文章进入详情页时：

- 如果文章存在 `image`，详情页背景自动替换成该图片
- 不再使用首页的默认三笠动态背景
- 背景应 `cover` 铺满视口
- 背景可以适度降低亮度、饱和度，保证正文可读
- 必须保留遮罩层，避免浅色图片导致文字看不清
- 背景固定在页面后方，滚动正文时保持稳定

### 最重要的规则

> **封面图已经作为详情页背景，因此正文中禁止再次展示封面图。**

### ❌ 禁止

```html
<figure>
  <img src="/img/posts/code-geass-lelouch/cover.jpg">
</figure>
```

### ✅ 正确

```html
<p>第一次看《反叛的鲁路修》的时候……</p>

<h2>我喜欢的是那个不完美的鲁路修</h2>

<p>正文继续……</p>
```

文章正文从文字直接开始。

如果以后确实需要额外的剧情截图、插画或示意图，可以使用：

```text
static/img/posts/<slug>/01.jpg
static/img/posts/<slug>/02.jpg
```

但这些属于**正文辅助图**，不能和 `cover.jpg` 重复。

---

# 🎨 Visual Language

## 07 · 背景负责氛围，正文负责阅读

文章页面视觉目标：

> **像一本放在动画海报前面的个人随笔，而不是传统新闻站文章页。**

推荐：

- 大幅背景图承担作品氛围
- 正文保持克制
- 标题清晰
- 内容区域有适度半透明底或阴影保证可读性
- 段落不要太长
- 二级标题简洁
- 可以使用引用和少量强调

不要为了“丰富”页面而在正文顶部重新塞一张大封面。

### 推荐正文标签

```html
<p></p>
<h2></h2>
<h3></h3>
<blockquote></blockquote>
<ul></ul>
<ol></ol>
<strong></strong>
<em></em>
<hr>
```

只有存在真正需要说明的额外图片时，才使用：

```html
<figure class="article-figure">
  <img src="/img/posts/<slug>/01.jpg" alt="准确的图片描述" loading="lazy">
  <figcaption>必要的图片说明。</figcaption>
</figure>
```

---

# 🚫 Global Style Safety

## 08 · 单篇文章不能破坏整个网站

禁止在文章中：

```text
position: fixed 覆盖全屏
自行实现文章背景
修改 html / body
修改 .site-header
修改 .hero
写全局 * {}
引入 React / Vue / Vite
引入无必要第三方 JS
修改全站主题
```

### 背景功能属于模板层

文章作者只负责：

```yaml
image: "/img/posts/<slug>/cover.jpg"
```

**不要在文章 HTML 中自己写背景 CSS。**

背景切换由 Hugo 的全局模板统一处理。

---

# 📰 Example Article

## 09 · 推荐的 HTML 正文结构

```html
<p>
第一次看《反叛的鲁路修》，最容易记住的是那些很“爽”的东西：Geass、Zero、黑色骑士团……
</p>

<p>
但隔一段时间再想，我最喜欢的反而不是“鲁路修有多聪明”。
</p>

<h2>我喜欢的是那个不完美的鲁路修</h2>

<p>
鲁路修有一种很奇怪的魅力……
</p>

<blockquote>
如果鲁路修真的从头到尾都像一台完美的计算机，这个角色大概反而没那么有意思。
</blockquote>

<h2>Zero 这个面具，比 Geass 更重要</h2>

<p>
正文继续……
</p>
```

注意：**正文示例中没有封面 `<img>`。**

---

# 🔗 Routing

## 10 · “能点开”是强制要求

新增文章之后，必须确认详情页真的生成。

执行：

```bash
hugo --minify
```

然后确认：

```text
public/post/<slug>/index.html
```

例如：

```text
content/post/code-geass-lelouch.html
```

应该生成：

```text
public/post/code-geass-lelouch/index.html
```

对应 URL：

```text
/post/code-geass-lelouch/
```

首页卡片必须继续使用 Hugo 自动生成的：

```text
.RelPermalink
```

---

# 🧪 Verification Checklist

## 11 · 完成文章前必须检查

- [ ] Front Matter 完整
- [ ] `categories` 使用正确分类
- [ ] `image` 指向真实存在的 `cover.jpg`
- [ ] 首页卡片能看到封面
- [ ] 进入详情页后背景自动切换为该文章封面
- [ ] 详情页不再显示默认三笠背景
- [ ] 正文中没有重复展示 `cover.jpg`
- [ ] 背景遮罩足够，正文清晰可读
- [ ] `hugo --minify` 成功
- [ ] `public/post/<slug>/index.html` 存在
- [ ] 首页卡片点击能进入详情
- [ ] 分类页能看到文章
- [ ] GitHub Pages Actions 部署成功
- [ ] 手机端背景裁切与正文排版正常

---

# 🤖 Agent Workflow

## 12 · 用户说“帮我写一篇博客”时

Agent 默认按下面流程执行：

```text
01  阅读 AGENTS.md
02  阅读用户文字/主题
03  确定分类
04  确定 slug
05  准备最具代表性的 cover.jpg
06  保存到 static/img/posts/<slug>/cover.jpg
07  将 cover 路径写入 Front Matter image
08  生成文章正文，但不要把 cover 再插入正文
09  检查 AI 味
10  Hugo 构建
11  检查详情页背景是否切成 cover
12  检查正文有没有重复封面
13  检查真实路由
14  检查首页卡片
15  检查分类页
16  最后提交
```

---

# ✦ Final Rule

> **一篇文章，一张主视觉。**
>
> 首页把它当封面，详情页把它当背景。
>
> **正文不再重复展示这张图。**
>
> 背景负责氛围，文字负责内容。

# ✦ Lin Yun Blog · AI Authoring Guide

> **Purpose**  
> 这不是一份“让 AI 随便写文章”的说明，而是一套让 AI 像一个靠谱编辑一样工作的博客创作规范。  
> 目标只有一个：**文章好看、自然、能读、能点开，并且看起来像真的个人博客。**

---

## 01 · 先记住这件事

### ✅ 我们要的

- 像真实的人写出来的博客
- 有自己的判断、偏好、吐槽和细节
- 图片与文字自然穿插
- 页面舒服，阅读优先
- 首页卡片、分类页、详情页全部正常
- 保留现有站点的动态背景、导航和整体视觉

### ❌ 我们不要的

- AI 产品官网感
- 巨大的渐变标题
- “不仅仅是……更是……”式套话
- 一堆玻璃卡片互相套娃
- 一篇文章单独做成另一个网站
- 首页有卡片，点进去却 404

---

# ✍️ Article Philosophy

## 02 · 写作应该像“人”，不是像“模型”

文章优先保留用户自己的表达。

AI 可以做这些事：

- 整理语序
- 拆分长段落
- 增加自然的小标题
- 根据图片安排图文节奏
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

需要更漂亮的图文排版时，优先：

```text
content/post/<slug>.html
```

例如：

```text
content/post/attack-on-titan-thoughts.html
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
title: "《进击的巨人》：自由的另一面"
date: 2026-09-07T20:00:00+08:00
description: "重新看完《进击的巨人》以后，我对自由、三笠和墙外世界的一些想法。"
categories:
  - 动漫
tags:
  - 进击的巨人
  - 三笠
  - 观后感
image: "/img/posts/attack-on-titan/cover.jpg"
---
```

### 必填字段

| 字段 | 用途 |
|---|---|
| `title` | 文章标题 |
| `date` | 发布时间 |
| `description` | 首页卡片和列表摘要 |
| `categories` | 决定首页进入哪个栏目 |
| `image` | 首页封面图 |

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

# 🖼 Images

## 06 · 图片统一管理

每篇文章创建自己的图片目录：

```text
static/img/posts/<slug>/
```

推荐结构：

```text
static/img/posts/attack-on-titan/
├── cover.jpg
├── 01.jpg
├── 02.jpg
└── 03.jpg
```

HTML 中：

```html
<figure class="article-figure article-figure-wide">
  <img
    src="/img/posts/attack-on-titan/01.jpg"
    alt="夕阳下站在屋顶上的三笠"
    loading="lazy"
  >
  <figcaption>走出墙外以后，自由反而变得更复杂。</figcaption>
</figure>
```

### 图片规则

- 封面必须同步写到 `image`
- 图片必须有有意义的 `alt`
- 非首屏图片使用 `loading="lazy"`
- 不把 base64 直接塞进正文
- 不依赖容易失效的第三方图片热链
- 用户已经给图时，优先使用用户原图

---

# 🎨 Visual Language

## 07 · 文章要“好看”，但不能抢戏

文章页面的视觉目标：

> **像杂志，不像 SaaS 落地页。**

推荐：

- 大图 + 正文
- 图注
- 双图布局
- 引用
- 少量重点文字
- 适量留白
- 清晰的二级标题
- 段落不要太长

### 推荐标签

```html
<p></p>
<h2></h2>
<h3></h3>
<figure></figure>
<img>
<figcaption></figcaption>
<blockquote></blockquote>
<ul></ul>
<ol></ol>
<strong></strong>
<em></em>
<hr>
```

需要自定义布局时：

```html
<section class="article-scene">
  ...
</section>
```

自定义 class 必须以：

```text
article-
```

开头。

---

# 🚫 Global Style Safety

## 08 · 单篇文章不能破坏整个网站

禁止在文章中：

```text
position: fixed 覆盖全屏
修改 html / body
修改 .site-header
修改 .hero
写全局 * {}
引入 React / Vue / Vite
引入无必要第三方 JS
修改全站主题
```

如果文章确实需要专属样式：

```text
static/css/article.css
```

并确保选择器全部使用：

```css
.article-xxx {}
```

---

# 📰 Example Layout

## 09 · 一个推荐的 HTML 文章结构

```html
<figure class="article-figure article-figure-wide">
  <img src="/img/posts/attack-on-titan/cover.jpg" alt="三笠站在夕阳下">
  <figcaption>有些故事，看完以后反而更难说清楚。</figcaption>
</figure>

<p>
第一次看《进击的巨人》的时候，我一直觉得墙外就是自由。
</p>

<p>
后来才发现，真正走到墙外以后，问题反而更多了。
</p>

<h2>墙外并不等于自由</h2>

<p>
这里继续正文……
</p>

<blockquote>
有些人拼命想出去，有些人拼命想回家。
</blockquote>

<figure class="article-figure">
  <img src="/img/posts/attack-on-titan/02.jpg" alt="角色站在海边">
</figure>

<h2>我后来越来越能理解三笠</h2>

<p>
这里继续正文……
</p>
```

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
content/post/attack-on-titan-thoughts.html
```

应该生成：

```text
public/post/attack-on-titan-thoughts/index.html
```

对应 URL：

```text
/post/attack-on-titan-thoughts/
```

首页卡片必须使用 Hugo 自动生成的：

```text
.RelPermalink
```

### 绝对不能出现

- 首页有卡片但详情页 404
- 手写错误 URL
- slug 大小写不一致
- `.html` 路径和 Hugo 路由冲突
- 文章生成了但分类页找不到

---

# 🧪 Verification Checklist

## 11 · 完成文章前必须检查

- [ ] Front Matter 完整
- [ ] `categories` 使用正确分类
- [ ] `image` 指向存在的封面
- [ ] 正文图片路径有效
- [ ] 图片有 `alt`
- [ ] HTML 没有破坏全站样式
- [ ] `hugo --minify` 成功
- [ ] `public/post/<slug>/index.html` 存在
- [ ] 首页卡片能看到文章
- [ ] 首页卡片点击能进入详情
- [ ] 分类页能看到文章
- [ ] GitHub Pages Actions 部署成功
- [ ] 手机端排版没有明显溢出

---

# 🤖 Agent Workflow

## 12 · 用户说“帮我写一篇博客”时

Agent 默认按下面流程执行：

```text
01  阅读 AGENTS.md
02  阅读用户文字与图片
03  确定分类
04  确定 slug
05  整理图片目录
06  选择 Markdown 或 HTML
07  写 Front Matter
08  生成正文
09  检查 AI 味
10  Hugo 构建
11  检查真实路由
12  检查首页卡片
13  检查分类页
14  最后提交
```

---

# ✦ Final Rule

> **不要为了“看起来高级”而增加设计。**
>
> 好的文章页面应该让人先注意到：
>
> **图片、文字、故事和作者本人的想法。**
>
> 如果一个页面第一眼让人想到的是“这是 AI 生成的网站”，那就应该继续删东西，而不是继续加东西。

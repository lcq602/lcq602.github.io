# ✦ Lin Yun Blog · AI Authoring Guide

> **Purpose**  
> 这是一套博客内容与页面生成规范。目标是让文章自然、好看、能读、能点开，并保持统一的个人博客风格。

---

## 01 · 先记住这件事

### ✅ 我们要的

- 像真实的人写出来的博客
- 有自己的判断、偏好、吐槽和细节
- 页面舒服，阅读优先
- 首页卡片、分类页、详情页全部正常
- 保留现有站点的导航和整体视觉
- 文章详情页优先使用作品相关 **MP4 视频背景**
- 没有视频时再使用文章 `image` 作为静态背景
- 视频和主视觉图片都只承担背景/封面职责，不进入正文重复展示

### ❌ 我们不要的

- AI 产品官网感
- 巨大的渐变标题
- “不仅仅是……更是……”式套话
- 一堆玻璃卡片互相套娃
- 一篇文章单独做成另一个网站
- 首页有卡片，点进去却 404
- 正文重复展示背景视频或主视觉封面图
- 在正文里直接放 `<video controls>`

---

# ✍️ Article Philosophy

## 02 · 写作应该像“人”，不是像“模型”

文章优先保留用户自己的表达。

AI 可以整理语序、拆分长段落、增加自然的小标题、补充必要过渡，但不要把文章洗成模板化议论文，也不要强行升华。

避免高频 AI 句式，例如：

> “真正让我感动的是……”  
> “这不仅仅是……更是……”  
> “也许这就是……的意义。”

可以有情绪，但要具体：**写场景、角色、瞬间、选择、当时的感觉。**

---

# 🧭 Media First

## 03 · 写文章之前，先确认背景资源

当用户要求新增一篇电影、动漫、学习或其他内容文章时，**在开始制作页面前先确认背景资源来源**。

必须先问用户：

> **你已经有这篇文章要用的 MP4 视频或图片资源，还是需要我帮你在网上找？**

处理顺序：

```text
用户已有 MP4
    ↓
优先使用用户视频

用户没有 MP4，但有图片
    ↓
使用用户图片

用户没有资源，并要求 AI 帮忙找
    ↓
优先寻找合适的 MP4
    ↓
找不到合适 MP4
    ↓
再寻找代表性图片
```

如果用户明确说“不需要问，直接找”，可以直接执行，不要重复确认。

---

# 🎬 Background Priority

## 04 · 详情页背景优先级

文章详情页统一遵循：

```text
video (.mp4)
   ↓ 没有
image
   ↓ 没有
站点默认背景
```

也就是说：

1. 存在 `video` → **必须优先播放 MP4 背景**
2. 没有 `video`，但存在 `image` → 使用图片背景
3. 两者都没有 → 使用站点默认三笠动态背景

### 视频当前只允许做背景

`video` 目前只用于文章详情页背景：

- autoplay
- muted
- loop
- playsinline
- 不显示 controls
- 不进入正文
- 不作为独立播放器
- 不在正文中再次插入

视频属于模板层背景资源，而不是文章正文内容。

---

# 🗂 Content Structure

## 05 · 文章与资源目录

文章：

```text
content/post/<slug>.md
content/post/<slug>.html
```

图片：

```text
static/img/posts/<slug>/
```

视频：

```text
static/video/posts/<slug>/
```

推荐：

```text
content/post/code-geass-lelouch.html

static/img/posts/code-geass-lelouch/
└── cover.jpg

static/video/posts/code-geass-lelouch/
└── background.mp4
```

不要把正文资源散落到无关目录。

---

# 🧾 Front Matter

## 06 · 推荐元信息

有视频时：

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
video: "/video/posts/code-geass-lelouch/background.mp4"
---
```

只有图片时：

```yaml
image: "/img/posts/code-geass-lelouch/cover.jpg"
```

### 字段职责

| 字段 | 用途 |
|---|---|
| `title` | 文章标题 |
| `date` | 发布时间 |
| `description` | 首页卡片和列表摘要 |
| `categories` | 首页分类 |
| `image` | 首页卡片封面；无 video 时兼任详情页背景；有 video 时可作为视频 poster/fallback |
| `video` | 文章详情页最高优先级背景，只支持 MP4 |

`image` 即使有 `video` 也推荐保留，因为首页文章卡片仍需要静态封面，同时它可以作为视频加载前的 poster/fallback。

---

# 🧭 Categories

## 07 · 当前一级分类

```text
电影
动漫
学习
```

必须完全一致。

---

# 🫥 Hidden Media Rule

## 08 · 背景资源必须从正文中隐藏

所谓“隐藏”是指：**背景资源由 Hugo 模板在正文之外渲染，文章内容本身不展示它。**

因此正文中禁止写：

```html
<img src="/img/posts/<slug>/cover.jpg">
<video src="/video/posts/<slug>/background.mp4"></video>
<video controls>...</video>
```

Markdown 中也不要再次写：

```md
![封面](/img/posts/<slug>/cover.jpg)
```

### 正确正文

```html
<p>第一次看《反叛的鲁路修》的时候……</p>
<h2>我喜欢的是那个不完美的鲁路修</h2>
<p>正文继续……</p>
```

如果确实需要额外剧情截图，可以使用：

```text
static/img/posts/<slug>/01.jpg
static/img/posts/<slug>/02.jpg
```

这些属于正文辅助图，不是 `cover.jpg`，也不是背景视频。

---

# 🎨 Visual Language

## 09 · 背景负责氛围，正文负责阅读

目标：

> **像一本放在作品画面前面的个人随笔，而不是视频播放器，也不是 SaaS 落地页。**

背景视频或图片应：

- 铺满视口
- 保持在正文后方
- 有遮罩保证文字清晰
- 视频静音循环
- 不抢交互焦点
- 移动端保持可用

正文保持克制，重点是标题、段落、引用和个人观点。

---

# 🚫 Global Style Safety

## 10 · 背景功能属于模板层

文章作者只负责 Front Matter：

```yaml
image: "/img/posts/<slug>/cover.jpg"
video: "/video/posts/<slug>/background.mp4"
```

不要在单篇文章中自行实现：

```text
position: fixed 全屏背景
body/html 背景
视频 autoplay JS
全局 CSS
.site-header / .hero 修改
React / Vue / Vite
```

背景选择、播放、遮罩、fallback 均由 Hugo 全局模板处理。

---

# 🔗 Routing

## 11 · “能点开”是强制要求

新增文章之后执行：

```bash
hugo --minify
```

确认：

```text
public/post/<slug>/index.html
```

首页卡片必须继续使用 Hugo 的 `.RelPermalink`。

---

# 🧪 Verification Checklist

## 12 · 完成前必须检查

- [ ] 写文章前已经确认用户资源来源，或用户明确授权 AI 自行寻找
- [ ] 如果有合适 MP4，已优先使用 `video`
- [ ] `video` 必须是 `.mp4`
- [ ] 视频保存在 `static/video/posts/<slug>/`
- [ ] 图片保存在 `static/img/posts/<slug>/`
- [ ] `image` 指向真实文件
- [ ] `video` 指向真实文件（如果有）
- [ ] 有 video 时详情页播放 video 背景
- [ ] 没有 video 时详情页使用 image 背景
- [ ] video/image 没有出现在正文中
- [ ] 首页卡片有正常封面
- [ ] 背景遮罩足够，正文清晰可读
- [ ] `hugo --minify` 成功
- [ ] `public/post/<slug>/index.html` 存在
- [ ] 首页卡片点击能进入详情
- [ ] 分类页能看到文章
- [ ] GitHub Pages Actions 部署成功
- [ ] 手机端正常

---

# 🤖 Agent Workflow

## 13 · 用户说“帮我写一篇博客”时

```text
01  阅读 AGENTS.md
02  明确主题与分类
03  询问：用户已有 MP4/图片，还是需要 AI 帮忙找
04  有 MP4 → 优先采用
05  无 MP4 → 再采用图片
06  保存 MP4 到 static/video/posts/<slug>/background.mp4
07  保存封面到 static/img/posts/<slug>/cover.jpg
08  写入 Front Matter video / image
09  生成正文，禁止重复插入背景资源
10  检查 AI 味
11  Hugo 构建
12  验证 video > image > default 的背景优先级
13  检查真实路由、首页卡片和分类页
14  最后提交
```

---

# ✦ Final Rule

> **有视频，优先视频；没有视频，再用图片。**
>
> 视频目前只做背景。
>
> 图片负责首页封面和视频 fallback，也可以在没有视频时承担详情页背景。
>
> **背景资源不进入正文。**

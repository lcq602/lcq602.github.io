# ✦ Lin Yun Blog · AI Authoring Guide

> 目标：写得像真实个人博客，内容优先，视觉克制；所有文章共享站点模板，不把单篇文章做成独立网站。

## 01 · 开始写文章前，先确认背景资源

用户要求新增文章时，在开始制作页面前先问一次：

> **你已经有想用的 MP4 视频或图片资源，还是需要我帮你找？**

规则：

1. 用户已有资源 → 优先使用用户提供的资源。
2. 用户要求代找 → 优先寻找适合作为背景的 MP4；没有合适视频时再找代表性图片。
3. 不要为了使用视频而使用质量差、过大、比例错误或来源不稳定的视频。
4. 背景资源必须保存到仓库本地，不依赖第三方热链。
5. 在提交前验证资源真实存在、可访问；MP4 还要验证能正常播放。

## 02 · 内容与分类

文章放在：

```text
content/post/<slug>.md
content/post/<slug>.html
```

HTML Content 不是完整网页，禁止写 `<!doctype html>`、`<html>`、`<head>`、`<body>`。

一级分类只允许：

```text
电影
动漫
学习
```

写作要保留个人判断、具体场景和自然表达。避免 AI 产品官网感、模板化升华、巨型渐变标题、玻璃卡片套娃和空洞套话。

## 03 · 文章背景资源目录

每篇文章的视觉资源按 slug 分目录：

```text
static/
├── img/posts/<slug>/
│   ├── cover.jpg          # 首页封面、视频 poster、图片背景 fallback
│   └── 01.jpg             # 可选正文辅助图
└── video/posts/<slug>/
    └── background.mp4     # 可选文章动态背景
```

例如：

```text
static/img/posts/code-geass-lelouch/cover.jpg
static/video/posts/code-geass-lelouch/background.mp4
```

## 04 · Front Matter 统一字段

推荐：

```yaml
---
title: "文章标题"
date: 2026-09-07T20:00:00+08:00
description: "自然、简短的文章摘要。"
categories:
  - 动漫
tags:
  - 示例
image: "/img/posts/example/cover.jpg"
video: "/video/posts/example/background.mp4"
background_position: "62% center"
background_brightness: 0.72
---
```

字段职责：

| 字段 | 用途 |
|---|---|
| `image` | 首页卡片封面；文章图片背景；视频 poster/fallback |
| `video` | 文章详情页动态背景，存在时优先于 image |
| `background_position` | 控制人物/主体裁切位置，默认 `center center` |
| `background_brightness` | 背景亮度，默认 `0.72`，通常建议 `0.55 ~ 0.85` |

Hugo 支持通过 Front Matter 自定义参数控制模板，因此文章级视觉差异应放在这些参数中，而不是每篇文章自己写 CSS。

## 05 · 背景选择优先级

详情页统一遵循：

```text
video (MP4)
   ↓ 没有
image
   ↓ 没有
站点默认背景
```

如果同时存在 `video` 和 `image`：

- 桌面端优先播放 MP4。
- `image` 同时作为 poster 和 fallback，避免视频加载前黑屏。
- 手机端（当前断点 ≤ 760px）自动隐藏背景视频并使用 `image`，降低流量、耗电和发热。
- 用户启用 `prefers-reduced-motion` 时同样退回静态 `image`。
- MP4 只用于背景：`autoplay + muted + loop + playsinline`，禁止显示 controls。

如果提供 `video`，原则上也应提供 `image`，确保移动端和加载失败时仍有主视觉。

## 06 · 背景永远不进入正文

`image` 和 `video` 属于模板背景资源，不属于文章正文。

禁止重复：

```html
<img src="/img/posts/example/cover.jpg">
<video src="/video/posts/example/background.mp4" controls></video>
```

正文从文字直接开始。视频目前**只允许做背景**，不要在正文中做播放器。

正文确实需要截图时，可使用 `01.jpg`、`02.jpg` 等独立辅助图，但不能重复 `cover.jpg`。

## 07 · 背景视觉参数怎么选

`background_position` 要根据主体位置调整：

```yaml
background_position: "center center"
background_position: "65% center"
background_position: "35% 40%"
```

人物在右侧时可适当提高横向百分比；人物在左侧则降低。必须实际查看裁切结果，不能机械套值。

`background_brightness` 默认：

```yaml
background_brightness: 0.72
```

背景很亮时降低，背景很暗时适度提高。正文可读性优先于展示原图亮度。

## 08 · 性能规则

- MP4 尽量使用 H.264、16:9、无音频或静音背景素材。
- 背景视频应该短、可自然循环，并尽量控制文件体积。
- 不要用 20MB、50MB 的视频只为了几秒背景效果。
- 视频使用 `preload="metadata"`，避免页面一打开就强制预载完整文件。
- 移动端和 reduced-motion 默认静态 fallback。
- 图片应控制合理分辨率和体积，不使用 base64。
- 不使用脆弱的第三方图片/视频热链。

## 09 · 单篇文章不能破坏全站

禁止文章自行：

```text
position: fixed 覆盖全屏
修改 html / body
修改 .site-header / .hero
实现自己的背景系统
写全局 * {}
引入 React / Vue / Vite
引入不必要第三方 JS
修改整站主题
```

背景、遮罩、视频播放、移动端 fallback 全部属于 Hugo 模板层。

## 10 · 路由与构建

完成后执行：

```bash
hugo --minify
```

确认：

```text
public/post/<slug>/index.html
```

首页文章卡片必须使用 `.RelPermalink`，并实际验证首页和分类页能点进详情。

## 11 · Agent 标准工作流

```text
01  阅读 AGENTS.md
02  询问用户：已有 MP4/图片，还是需要代找？
03  确定主题、分类、slug
04  优先准备 background.mp4；没有合适视频再使用 cover.jpg
05  无论是否有视频，都尽量准备 cover.jpg 作为首页封面和 fallback
06  保存资源到 static/video/posts/<slug>/ 与 static/img/posts/<slug>/
07  验证 MP4/图片文件真实有效
08  填写 image / video
09  根据主体位置设置 background_position
10  根据可读性设置 background_brightness
11  写正文，不重复插入背景资源
12  检查 AI 味和移动端阅读
13  hugo --minify
14  验证详情页路由
15  验证桌面端 video-first
16  验证移动端 image fallback
17  验证首页卡片和分类页
18  提交并确认 GitHub Pages 部署
```

## 12 · 完成检查清单

- [ ] 已询问用户资源来源
- [ ] `image` 指向真实文件
- [ ] 有 `video` 时 MP4 指向真实且可播放文件
- [ ] video 存在时同时有 image fallback
- [ ] 桌面详情页优先视频
- [ ] 手机端退回图片
- [ ] reduced-motion 退回图片
- [ ] 视频无 controls、无正文播放器
- [ ] 正文没有重复 cover/background.mp4
- [ ] 主体没有被 `cover` 裁掉
- [ ] 背景亮度不影响阅读
- [ ] 首页封面正常
- [ ] 详情页正常
- [ ] 分类页正常
- [ ] `hugo --minify` 成功
- [ ] GitHub Pages 部署成功

# ✦ Final Rule

> **视频优先，图片兜底；移动端优先体验。**
>
> 背景资源负责氛围，正文只负责内容。
>
> 所有视觉差异通过统一 Front Matter 参数交给模板处理，不在单篇文章里重复造页面结构。

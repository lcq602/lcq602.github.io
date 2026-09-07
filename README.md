# 林允最近在干什么

一个基于 **Hugo + GitHub Pages** 的个人内容站，用来记录最近看过的电影、动漫，以及正在折腾的学习和开发内容。

站点地址：`https://lcq602.github.io/`

---

## 当前背景机制

首页继续使用三笠动态背景。

进入文章详情页以后，背景资源按照这个顺序自动选择：

```text
video (.mp4)
   ↓ 没有
image
   ↓ 没有
站点默认背景
```

也就是说：

- 文章有 `video`：优先播放 MP4 作为整页背景
- 没有 `video`，但有 `image`：使用图片作为整页背景
- 两者都没有：继续使用站点默认三笠动态背景
- 背景视频静音、自动播放、循环，不显示播放器控件
- `video` 目前只作为背景使用
- 主视觉视频和封面图片都不在正文里重复展示

`image` 仍推荐保留，因为首页卡片需要静态封面，同时它还能作为视频 poster/fallback。

---

## 项目结构

```text
.
├── AGENTS.md
├── README.md
├── content/
│   ├── post/                      # 文章正文
│   ├── categories/
│   ├── archive/
│   └── about/
├── layouts/
│   ├── _default/
│   │   ├── baseof.html            # 背景优先级、全站基础结构
│   │   └── single.html            # 文章详情页
│   ├── partials/
│   └── index.html
├── static/
│   ├── css/
│   ├── js/
│   ├── img/
│   │   └── posts/
│   │       └── <slug>/
│   │           └── cover.jpg
│   └── video/
│       └── posts/
│           └── <slug>/
│               └── background.mp4
└── hugo.toml
```

---

## 新建文章

文章放在：

```text
content/post/
```

Markdown：

```text
content/post/my-post.md
```

需要更自由排版时：

```text
content/post/my-post.html
```

推荐 Front Matter：

```yaml
---
title: "文章标题"
date: 2026-09-07T20:00:00+08:00
description: "首页卡片显示的简短摘要。"
categories:
  - 动漫
tags:
  - 示例标签
image: "/img/posts/my-post/cover.jpg"
video: "/video/posts/my-post/background.mp4"
---
```

只有图片时，可以省略 `video`：

```yaml
image: "/img/posts/my-post/cover.jpg"
```

目前一级分类固定为：

```text
电影
动漫
学习
```

---

## 媒体资源规范

图片：

```text
static/img/posts/<slug>/cover.jpg
```

视频：

```text
static/video/posts/<slug>/background.mp4
```

背景资源不应该再次写进正文。

错误示例：

```html
<img src="/img/posts/my-post/cover.jpg">
<video controls src="/video/posts/my-post/background.mp4"></video>
```

正确做法是只在 Front Matter 中声明：

```yaml
image: "/img/posts/my-post/cover.jpg"
video: "/video/posts/my-post/background.mp4"
```

然后由 Hugo 模板负责背景显示。

---

## AI / Codex 工作方式

仓库根目录的 [`AGENTS.md`](./AGENTS.md) 是 AI 写作和页面生成规范。

新增文章时，Agent 应先确认媒体资源：

> 你已经有这篇文章要用的 MP4 视频或图片资源，还是需要我帮你在网上找？

如果需要 AI 帮忙找，优先寻找合适的 MP4；找不到再选择代表性图片。

核心规则：

- `video` 优先级高于 `image`
- `video` 只支持 MP4
- `video` 目前只做背景
- `image` 用于首页卡片，也可以做视频 poster/fallback
- 没有视频时，`image` 才作为文章详情页背景
- 背景资源不进入正文
- 新文章必须验证真实路由、首页卡片、分类页和 GitHub Pages 部署

---

## 本地运行

```bash
hugo server
```

访问：

```text
http://localhost:1313/
```

正式构建：

```bash
hugo --minify
```

检查：

```text
public/post/<slug>/index.html
```

---

## 部署

推送到 `main` 后，GitHub Actions 自动构建并发布到 GitHub Pages。

```text
编辑内容
   ↓
git push main
   ↓
GitHub Actions
   ↓
Hugo Build
   ↓
GitHub Pages
```

如果源码更新但线上没有变化，优先检查：

1. GitHub Actions 是否成功
2. 最新 Pages 构建是否使用最新 commit
3. MP4 / 图片是否真的进入 `static/`
4. Front Matter 路径是否正确
5. 浏览器是否仍在使用旧缓存

---

## 设计原则

这个博客保持比较克制的个人编辑风格：

> 背景负责作品氛围，文字负责内容。

有视频时让画面动起来；没有视频时用一张好的图就够了。不要为了“更丰富”而把背景资源再次塞进正文。

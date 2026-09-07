# 林允最近在干什么

一个基于 **Hugo + GitHub Pages** 的个人内容站，用来记录最近看过的电影、动漫，以及正在折腾的学习和开发内容。

这个项目不是传统技术博客，也不是作品集模板，更像一个持续更新的个人收藏页：

- 电影：记下值得反复回味的故事
- 动漫：写角色、剧情和看完之后留下来的感受
- 学习：记录 Godot、开发实践和最近正在研究的东西

站点地址：`https://lcq602.github.io/`

---

## 当前设计

首页使用三笠主题动态背景，内容按 `电影 / 动漫 / 学习` 三个分类展示。

文章详情页会自动读取 Front Matter 中的 `image`：

- 首页把它当文章卡片封面
- 点进文章后把它作为整页背景
- 正文中不再重复展示这张封面图

文章页右上角提供悬浮返回按钮，方便回到首页继续浏览。

---

## 项目结构

```text
.
├── AGENTS.md
├── content/
│   ├── post/                 # 正文文章
│   ├── categories/
│   ├── archive/
│   └── about/
├── layouts/
│   ├── _default/
│   │   ├── baseof.html       # 全站基础结构、动态/文章背景
│   │   └── single.html       # 文章详情页
│   ├── partials/
│   └── index.html            # 首页
├── static/
│   ├── css/
│   ├── js/
│   ├── img/
│   │   └── posts/            # 每篇文章自己的图片目录
│   └── video/
└── hugo.toml
```

---

## 新建文章

文章统一放在：

```text
content/post/
```

普通文章可以使用 Markdown：

```text
content/post/my-post.md
```

需要更自由的正文排版时也可以使用 Hugo HTML Content：

```text
content/post/my-post.html
```

### 推荐 Front Matter

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
---
```

目前一级分类固定为：

```text
电影
动漫
学习
```

分类名称需要完全一致，因为首页会自动按这些名称筛选文章。

---

## 图片规范

每篇文章建议有自己的图片目录：

```text
static/img/posts/<slug>/
```

例如：

```text
static/img/posts/code-geass-lelouch/
└── cover.jpg
```

Front Matter：

```yaml
image: "/img/posts/code-geass-lelouch/cover.jpg"
```

`image` 是文章的主视觉，不需要在正文里再插入同一张 `cover.jpg`。

如果正文确实需要其他截图，可以继续放：

```text
01.jpg
02.jpg
03.jpg
```

然后在文章中按需引用。

---

## AI / Codex 写文章

仓库根目录的 [`AGENTS.md`](./AGENTS.md) 是 AI 写作和页面生成规范。

使用 Codex 或其他 Agent 新增文章前，应先阅读它。核心要求包括：

- 写得像个人博客，不像 AI 产品落地页
- 保留具体观点、场景和个人判断
- 不滥用渐变、玻璃卡片和模板化套话
- `image` 作为首页封面和文章背景
- 正文不重复展示封面
- 新文章完成后必须验证详情页真实生成
- 首页卡片必须能正常跳转

可以直接这样给 Agent 下任务：

```text
按照 AGENTS.md 的规范，
根据我提供的主题、文字和图片写一篇动漫文章。
图片整理到对应 posts 目录，
完成后验证首页卡片、文章背景和详情页路由。
```

---

## 本地运行

安装 Hugo 后，在项目根目录执行：

```bash
hugo server
```

然后访问：

```text
http://localhost:1313/
```

正式构建：

```bash
hugo --minify
```

构建结果位于：

```text
public/
```

新增文章后重点检查：

```text
public/post/<slug>/index.html
```

确保真实页面存在，而不是只有首页卡片。

---

## 部署

代码推送到 `main` 后，GitHub Actions 会运行 Hugo 构建并部署到 GitHub Pages。

主要流程：

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
   ↓
https://lcq602.github.io/
```

如果源码已经更新但线上没有变化，优先检查：

1. GitHub Actions 是否成功
2. 最新 Pages 构建使用的是不是最新 commit
3. 图片是否真的进入 `static/`
4. 浏览器是否仍在使用旧 CSS / JS 缓存

---

## 当前内容示例

目前已经有：

- 《进击的巨人》观后感
- 《反叛的鲁路修》观后感

这些文章都会自动出现在首页的「动漫」栏目中。

---

## 设计原则

这个博客希望保持一种比较克制的个人编辑风格：

> 图片、文字和最近真正感兴趣的东西，比 UI 本身更重要。

如果页面开始越来越像一个 AI 自动生成的 SaaS 官网，那就应该删设计，而不是继续加设计。

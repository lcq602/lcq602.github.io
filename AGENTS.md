# AGENTS.md

本仓库是 Hugo 个人博客。所有 AI/Agent 在新增、修改文章或页面时，必须遵守本文件。

## 1. 核心原则

- 博客不是 AI 产品落地页，不要使用夸张、模板化、营销式文案。
- 文章应像真实个人博客：自然、克制、有个人观点，有具体细节，不堆砌空洞总结。
- 用户提供文字、图片、主题后，AI 可以直接整理并生成 HTML 内容文章。
- **禁止为单篇文章生成完整独立 HTML 文档。** 不要写 `<!doctype html>`、`<html>`、`<head>`、`<body>`。
- 单篇文章必须继续使用 Hugo 现有的 `baseof.html`、header、footer、全局动态背景和站点 CSS。
- 不要为了新增文章修改全站主题，除非用户明确要求。

## 2. 推荐文章格式：Hugo HTML Content

需要富文本、图文混排、特殊布局时，优先创建：

```text
content/post/<slug>.html
```

例如：

```text
content/post/attack-on-titan-thoughts.html
```

文件顶部必须包含 YAML Front Matter：

```yaml
---
title: "文章标题"
date: 2026-09-07T20:00:00+08:00
description: "用于首页卡片和列表页的简短描述，建议 35～80 字。"
categories:
  - 动漫
tags:
  - 进击的巨人
  - 观后感
image: "/img/posts/attack-on-titan/cover.jpg"
---
```

Front Matter 之后只写文章内容片段，例如：

```html
<figure class="article-figure article-figure-wide">
  <img src="/img/posts/attack-on-titan/cover.jpg" alt="夕阳下的三笠" loading="lazy">
  <figcaption>真正走到墙外以后，自由反而变得更复杂。</figcaption>
</figure>

<p>正文第一段……</p>

<h2>墙外并不等于自由</h2>
<p>正文……</p>
```

## 3. 分类规范

当前一级内容分类固定为：

- `电影`
- `动漫`
- `学习`

Front Matter 的 `categories` 至少包含一个上述分类。

首页会通过分类筛选文章，所以分类名称必须完全一致，不要写成：

- 动画
- Anime
- 学习笔记
- Movies

除非以后同步修改首页分类逻辑。

## 4. 图片规范

文章图片统一存放：

```text
static/img/posts/<slug>/
```

推荐：

```text
static/img/posts/attack-on-titan/cover.jpg
static/img/posts/attack-on-titan/01.jpg
static/img/posts/attack-on-titan/02.jpg
```

文章中引用：

```html
<img src="/img/posts/attack-on-titan/01.jpg" alt="准确描述图片内容" loading="lazy">
```

要求：

- 必须填写有意义的 `alt`。
- 非首屏图片使用 `loading="lazy"`。
- 封面图必须同时写入 Front Matter 的 `image` 字段，否则首页卡片不会使用它。
- 不要把 base64 图片直接塞入 HTML。
- 不要引用随时可能失效的第三方图片热链；优先保存到本仓库 `static/img/posts/...`。
- 用户已经提供图片时优先使用用户图片，不要擅自替换。

## 5. HTML 文章结构规范

正文最外层**不要再创建第二个站点容器**。Hugo 的 single layout 已经负责文章外框。

推荐使用这些原生标签：

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

如确实需要自定义图文布局，可以使用：

```html
<section class="article-scene">
  ...
</section>
```

但 class 必须以 `article-` 开头，避免污染全站样式。

禁止在文章中：

- 使用固定定位覆盖全屏。
- 修改 `html`、`body`、`.site-header`、`.hero` 等全局元素。
- 写全局 `* {}` 样式。
- 引入 React/Vue/Vite 等前端框架。
- 引入不必要的第三方 JS。
- 使用超大渐变标题、AI 常见霓虹按钮墙、无意义玻璃卡片堆叠。

## 6. 文章视觉风格

文章本身应该让图片和内容成为主角，而不是让 UI 抢注意力。

推荐：

- 正文宽度保持适合阅读。
- 图片可做宽图、双图或图注。
- 二级标题简洁。
- 段落不要太长。
- 可适量使用引用、分隔线和重点文字。
- 与站点现有深色、动态背景、Liquid Glass 风格兼容，但文章内部不要再次堆一层厚重玻璃面板。

如果需要新增文章专用 CSS，应优先放到：

```text
static/css/article.css
```

并保证全部选择器以 `.article-` 开头。

## 7. 文案规范

用户提供原始文字时：

1. 优先保留用户自己的表达和观点。
2. 可以整理语序、补充小标题、拆段，但不要把全文改成标准 AI 议论文。
3. 不要频繁使用以下模板化表达：
   - “真正让我感动的是……”
   - “这不仅仅是……更是……”
   - “也许这就是……的意义”
   - “在这个快节奏的时代……”
4. 不要每一节最后都总结中心思想。
5. 允许保留犹豫、偏好、吐槽和主观判断，个人博客不需要写成百科。
6. 观后感重点写具体场景、角色、当时的感受和个人判断。

## 8. 首页卡片兼容要求

首页文章卡片依赖 Hugo Page 参数：

- `.Title`
- `.Description`
- `.Date`
- `.Params.categories`
- `.Params.image`
- `.RelPermalink`

因此每篇文章必须保证这些信息可用。

新增文章后，不允许手写首页文章链接。首页应继续通过 Hugo 自动读取文章。

## 9. 路由与跳转验证（强制）

**新增文章后必须验证文章详情页真的生成，不能只看到首页卡片就认为完成。**

至少执行：

```bash
hugo --minify
```

然后检查生成目录，例如：

```text
public/post/<slug>/index.html
```

并检查首页生成的链接与该路径一致。

如果是：

```text
content/post/attack-on-titan-thoughts.html
```

预期 URL 通常为：

```text
/post/attack-on-titan-thoughts/
```

不得出现：

- 首页能看到文章但点击 404。
- 卡片链接指向不存在页面。
- 大小写不一致导致 GitHub Pages 404。
- 手写 `.html` URL 与 Hugo `RelPermalink` 冲突。

GitHub Pages 部署后还应确认 Actions 中 `Deploy Hugo site to Pages` 成功。

## 10. 新文章执行流程

当用户说“帮我写一篇博客/把这些文字和图片做成文章”时，Agent 默认执行：

1. 阅读 `AGENTS.md`。
2. 检查用户提供的文字和图片。
3. 确定分类与 slug。
4. 图片整理到 `static/img/posts/<slug>/`。
5. 创建 `content/post/<slug>.html`。
6. 写完整 Front Matter。
7. 根据素材生成自然的图文 HTML 正文。
8. 不修改首页硬编码文章。
9. 运行/检查 Hugo 构建。
10. 检查 `public/post/<slug>/index.html` 是否存在。
11. 检查首页卡片 href 是否指向正确文章 URL。
12. 最后再提交代码。

## 11. Markdown 仍然允许

普通文字文章仍可使用：

```text
content/post/<slug>.md
```

但是当用户明确提出“根据文字和图片设计文章页面”“图文排版好看一点”“直接写 HTML”时，优先使用 `.html` 内容文章。

无论 `.md` 还是 `.html`，Front Matter、分类、图片、路由验证规则完全相同。

## 12. 修改现有文章

修改已有文章时：

- 不要随意改变 slug，否则旧链接会失效。
- 不要删除 Front Matter 必需字段。
- 不要因为修改正文而重做整个网站样式。
- 图片路径变化时必须同步检查首页封面和正文图片。
- 修改完成后仍然必须执行路由验证。

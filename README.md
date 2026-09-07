# 林允的收藏夹

基于 Hugo 和 GitHub Pages 构建的电影、动漫与学习内容站。

## 新建文章

在 `content/post/` 目录创建 Markdown 文件。文章头部至少填写：

```yaml
---
title: "文章标题"
date: 2026-09-07
draft: false
description: "卡片摘要"
image: "/img/封面.jpg"
categories:
  - 电影 # 也可以是：动漫、学习
---
```

把封面上传到 `static/img/`，提交到 `main` 后 GitHub Actions 会自动发布。首页会按分类展示每类最新 4 篇文章。

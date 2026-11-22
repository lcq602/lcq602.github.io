---
title: "Cloudflare Workers 入门：把一个消息转发服务跑在边缘上"
date: 2026-11-22T20:30:00+08:00
description: "从一个真实的消息转发项目出发，讲清 Workers 是什么、怎么写第一个 Worker，以及部署时真正会踩到的坑。"
categories:
  - 学习
tags:
  - Cloudflare Workers
  - TypeScript
  - 边缘计算
  - 后端
image: "/img/posts/learning-cloudflare-workers-intro/cover.jpg"
background_position: "center center"
background_brightness: 0.72
---

我第一次认真去学 Cloudflare Workers，不是因为看了什么教程，而是因为手头有个服务实在没地方放。

那段时间我在做一个实时消息转发服务：手机 App 要收股票提醒，Telegram 频道要推热点，中间需要一个 24 小时在线、能接 WebSocket、还能定时自检的中转站。租一台云服务器当然能跑，但要装系统、配 Nginx、写 systemd、操心掉线重启——为一个几百行代码的小服务，我觉得不值。最后我把它整个搬到了 Workers 上，免费套餐就够跑，到现在还在线。这篇文章就是我从这个项目里抠出来的入门笔记。

## Workers 到底是什么

一句话：**把你的 JavaScript/TypeScript 代码部署到 Cloudflare 全球几百个机房里，用户从哪访问，就由离他最近的机房执行。**

它和传统服务器最大的区别不在"快"，而在"没有服务器"。你不用选机型、不用装依赖、不用管扩容，写一个 `fetch` 处理函数，部署，完事。背后的执行单元是 V8 Isolate——不是容器也不是虚拟机，而是一个轻量到毫秒级启动的 JS 沙箱。这也是 Workers 冷启动几乎感觉不到的原因：它不是在"启动一台机器"，只是在一个已经跑着的进程里新建一个隔离上下文。

但这个模型也有代价，你迟早会撞上：

- **没有常驻进程。** 请求处理完，内存里的数据原则上就丢了。想存东西，得用它提供的 KV、R2、D1 或 Durable Objects。
- **CPU 时间有限。** 免费套餐每次请求最多 10ms CPU 时间（付费版 30 秒起步，可调）。死循环、重型计算会直接被掐掉。
- **不是 Node.js。** 虽然现在兼容了不少 Node API，但 `fs`、`child_process` 这些不存在。能用的是 Web 标准 API：`fetch`、`Request`、`Response`、`WebSocket`、`crypto`。

我刚开始总想拿写 Express 的思路套它，处处别扭；后来想通了——它更像一个"带全球分发的函数"，而不是"一台小服务器"。心态转过来，后面就顺了。

## 第一个 Worker：十分钟跑起来

先装 Wrangler，这是官方的命令行工具，开发、调试、部署都靠它：

```bash
npm install -g wrangler
wrangler login
wrangler init my-first-worker
```

选 TypeScript 模板，生成的项目里最核心的就是 `src/index.ts`。我把一个最小可用的消息接口写成这样：

```typescript
export interface Env {
  // 绑定在 wrangler.toml 里的 KV 命名空间
  MESSAGES: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // POST /api/publish：收一条消息，存进 KV
    if (request.method === "POST" && url.pathname === "/api/publish") {
      const body = (await request.json()) as { channel: string; text: string };
      if (!body.channel || !body.text) {
        return Response.json({ error: "channel and text are required" }, { status: 400 });
      }
      const key = `${body.channel}:${Date.now()}`;
      await env.MESSAGES.put(key, body.text, { expirationTtl: 86400 });
      return Response.json({ ok: true, key });
    }

    // GET /api/latest?channel=xxx：取该频道最新一条
    if (request.method === "GET" && url.pathname === "/api/latest") {
      const channel = url.searchParams.get("channel") ?? "general";
      const list = await env.MESSAGES.list({ prefix: `${channel}:`, limit: 1 });
      if (list.keys.length === 0) {
        return Response.json({ channel, message: null });
      }
      const text = await env.MESSAGES.get(list.keys[0].name);
      return Response.json({ channel, message: text });
    }

    return new Response("Not Found", { status: 404 });
  },
};
```

本地跑起来验证：

```bash
wrangler dev
curl -X POST http://localhost:8787/api/publish \
  -H "Content-Type: application/json" \
  -d '{"channel":"stocks","text":"NVDA 财报超预期"}'
```

这个例子我特意选了"先存后取"的形态，因为它是真实项目里最常见的骨架：**收到请求 → 校验 → 写存储 → 返回结果**。我的消息转发服务就是在这个骨架上长出来的，只不过后来把 KV 换成了 Durable Objects，又在外面包了一层 WebSocket 推送。

## 路由怎么写才不乱

上面那种 `if (pathname === ...)` 的写法，接口一多就变成面条。我后来改成一张路由表，请求进来先查表：

```typescript
type Handler = (req: Request, env: Env) => Promise<Response>;

const routes: Record<string, Record<string, Handler>> = {
  "/api/publish": { POST: publishMessage },
  "/api/latest": { GET: getLatest },
  "/api/health": { GET: async () => Response.json({ ok: true }) },
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const handler = routes[url.pathname]?.[request.method];
    if (!handler) return new Response("Not Found", { status: 404 });
    try {
      return await handler(request, env);
    } catch (err) {
      console.error(err);
      return Response.json({ error: "internal error" }, { status: 500 });
    }
  },
};
```

两点是我踩坑后坚持的习惯：第一，**所有 handler 外面统一包 try/catch**，Workers 里未捕获的异常会直接返回 500，而且免费套餐的日志保留时间很短，错误现场稍纵即逝；第二，**健康检查接口 `/api/health` 从第一天就加上**，后来做定时自检、配监控告警，全靠它。

如果接口再多，就该上路由库了。`itty-router` 是 Workers 生态里最常用的轻量选择，几十 KB，写法接近 Express。不过我个人判断是：十个以内的接口，路由表完全够用，别急着引依赖。

## 数据存哪：KV、D1、Durable Objects 怎么选

这是我学 Workers 时卡得最久的地方。官方给了好几个存储，名字都很像，选错了重构很痛苦。我的经验是按"数据长什么样"来分：

| 场景 | 选什么 | 为什么 |
| --- | --- | --- |
| 配置、缓存、读多写少 | KV | 全球复制，读极快，但写后全球同步要几十秒 |
| 结构化数据、要查 | D1 | SQLite，支持 SQL，适合订单、用户这类表 |
| 文件、图片 | R2 | 对象存储，零流出费用 |
| 每个频道/房间一份状态，还要实时推送 | Durable Objects | 单实例强一致，还能挂 WebSocket |

我的转发服务每个频道一个 Durable Objects 实例：消息先写进实例里的 SQLite，再推给挂在这个实例上的 WebSocket 客户端。这样做的好处是**写完立刻能读到**——KV 的最终一致性在这里会出问题：刚发布的消息，另一个机房的订阅者可能几十秒后才看得到，实时推送就失去了意义。

但 Durable Objects 也有脾气：同一个实例同一时间只处理一个请求（单线程），写的时候别在里面做重活；而且它的位置是固定的，频道建在哪，数据就在哪，不会跟着用户跑。对我的场景完全够用，对全球写多读多的场景就不一定了。

## 部署与免费额度

部署只有一行：

```bash
wrangler deploy
```

第一次会给你一个 `https://<名字>.<子域名>.workers.dev` 的地址。免费套餐每天 10 万次请求，对个人项目绰绰有余；我那个转发服务跑了这么久，一分钱没花过。自定义域名也免费绑，改一条 DNS 就行。

但有几条红线要记在心里：

- **不要在 Worker 里存密钥明文。** 用 `wrangler secret put <名字>`，它会进加密存储，代码里通过 `env.名字` 读。我早期把一个发布 Token 写在代码里，后来发现提交进了 Git 历史，清理起来很狼狈。
- **定时任务用 Cron Triggers。** 在 `wrangler.toml` 里写 `[triggers] crons = ["*/30 * * * *"]`，再导出一个 `scheduled` 处理函数。我每天的消息清理和健康自检就是这么跑的，不用再挂一台机器跑 cron。
- **注意 CPU 时间。** 免费版 10ms 听起来很少，但纯转发、查 KV 这种操作一般在 1ms 以内。真正容易超的是 JSON 解析大报文和正则回溯，报文先限大小，`request.json()` 之前看一眼 `Content-Length`。

## 我踩过的三个坑

**第一，WebSocket 握手必须返回 101。** Workers 里升级 WebSocket 要用 `new WebSocketPair()`，服务端那一端留着，客户端那一端包进 101 响应返回。我第一次写的时候直接返回了 200，客户端死活连不上，查了半天才发现是状态码问题。

**第二，`fetch` 子请求也会算 CPU 时间和次数。** Worker 里调外部 API 非常方便，但每次子请求都计入配额。我曾经在一个接口里循环调了几十次外部接口，免费额度半天就见底了。后来改成批量请求 + KV 缓存，次数直接降了一个数量级。

**第三，本地 `wrangler dev` 和线上行为不完全一样。** 最典型的就是 KV 的 list 操作：本地模拟器返回顺序和线上可能不同，依赖顺序的代码上线就翻车。我的做法是：关键逻辑写完后，一定要在 `workers.dev` 的真实地址上再测一遍，别只信本地。

## 小结

学 Workers 最大的收获不是多会一个部署方式，而是换了一种后端直觉：**先想"这次请求要算什么"，再想"数据放哪"，最后才是"代码怎么写"。** 服务器思维里，数据默认就在本地磁盘上；边缘思维里，计算和存储是分开的两件事，每次请求都要显式地去取、去存。

如果你手头也有一个"想 24 小时在线，但不值得租服务器"的小服务——提醒推送、Webhook 中转、定时签到、轻量 API——Workers 是我目前试过性价比最高的解法。先从上面那个 publish/latest 的骨架开始，跑通一次，剩下的都是在这个骨架上加东西。

下一篇我打算顺着这条线，把 Durable Objects + WebSocket 的实时推送部分单独拆出来写：一个频道实例怎么接住几十个长连接，断线重连和离线补发又是怎么做的。

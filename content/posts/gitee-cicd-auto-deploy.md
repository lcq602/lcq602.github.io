---
title: "Gitee CI/CD 自动化部署教程：从提交代码到服务器自动发布"
date: 2026-09-03T11:45:00+08:00
draft: false
description: "使用 Gitee Go 搭建 CI/CD 流水线，实现代码提交后自动构建、测试并部署 Spring Boot 项目到 Linux 服务器。"
tags:
  - Gitee
  - CI/CD
  - DevOps
  - Spring Boot
  - Linux
categories:
  - DevOps
ShowToc: true
TocOpen: true
---

很多项目刚开始时，部署流程通常是这样的：

1. 本地写完代码。
2. 执行 `mvn clean package`。
3. 找到生成的 JAR。
4. 使用 SCP、XFTP 或其他工具上传到服务器。
5. SSH 登录服务器。
6. 停掉旧服务。
7. 启动新版本。

项目小时还能接受，但只要提交频繁，这套流程就会越来越麻烦，而且很容易出现“忘记打包”“上传错文件”“旧进程没停掉”等问题。

这篇文章介绍如何使用 **Gitee Go 流水线** 搭建一套简单的 CI/CD：代码推送到 Gitee 后，自动完成构建、测试和部署。

> 本文以 Spring Boot + Maven + Linux 服务器为例。Vue、Node.js 等项目的思路也是一样的，只需要替换构建命令和部署产物。

## 一、CI/CD 到底是什么

CI 是 Continuous Integration，也就是持续集成。

简单理解：

```text
提交代码
   ↓
自动拉代码
   ↓
自动安装依赖
   ↓
自动编译
   ↓
自动测试
```

CD 一般指 Continuous Delivery / Continuous Deployment，也就是持续交付或持续部署。

继续往下就是：

```text
代码提交
   ↓
自动构建
   ↓
自动测试
   ↓
生成 JAR
   ↓
上传服务器
   ↓
停止旧服务
   ↓
启动新服务
```

最终达到的效果就是：

```text
git push

↓ 几分钟后

服务器自动更新完成
```

## 二、准备条件

开始之前需要准备：

- 一个 Gitee 仓库。
- 一个可以正常构建的 Spring Boot 项目。
- 一台 Linux 服务器。
- 服务器上已经安装 Java。
- Gitee 流水线可以访问你的部署服务器。
- 一个专门用于部署的 Linux 用户。

假设项目构建后生成：

```text
target/demo.jar
```

服务器部署目录为：

```text
/opt/apps/demo
```

不要为了省事长期使用 root 用户执行流水线部署。更推荐创建独立用户，例如：

```bash
sudo useradd -m deploy
sudo mkdir -p /opt/apps/demo
sudo chown -R deploy:deploy /opt/apps/demo
```

## 三、开启 Gitee Go 流水线

打开 Gitee 仓库，进入仓库中的 **流水线** 页面。

创建一条新的流水线。

Gitee Go 目前支持可视化编排和 YAML 编排，并支持手动、自动、定时等触发方式。

对于第一次配置的人，我更推荐：

```text
先使用可视化编排
      ↓
跑通以后
      ↓
再考虑维护 YAML
```

因为插件参数、运行环境和部署方式以后可能变化，可视化配置比较容易排查问题。

## 四、配置自动触发

我们的目标是：

```text
push main
   ↓
自动执行流水线
```

所以在流水线触发条件中设置：

```text
触发方式：代码 Push
目标分支：main
```

实际工作中最好不要所有分支都直接部署生产环境。

推荐：

```text
feature/*  -> 开发分支，不部署
dev        -> 测试环境
main       -> 正式环境
```

这样更加安全。

## 五、第一阶段：构建项目

创建一个“构建”阶段。

如果项目是 Maven，可以执行：

```bash
java -version
mvn -version
mvn clean package -DskipTests
```

如果你的项目使用 Maven Wrapper，则更推荐：

```bash
chmod +x mvnw
./mvnw clean package -DskipTests
```

成功后应该得到：

```text
target/demo.jar
```

### 为什么推荐 Maven Wrapper

因为流水线服务器上的 Maven 版本不一定与你本地一致。

使用：

```text
mvnw
```

可以尽可能保证：

```text
本地构建环境
≈
CI 构建环境
```

## 六、第二阶段：执行自动测试

真正的 CI 最好不要直接跳过测试。

可以单独增加一个测试步骤：

```bash
./mvnw test
```

整个过程变成：

```text
Push
 ↓
编译
 ↓
单元测试
 ↓
打包
 ↓
部署
```

只要测试失败，就停止部署。

这样可以避免明显有问题的代码自动跑到服务器上。

## 七、第三阶段：准备服务器

服务器创建目录：

```bash
mkdir -p /opt/apps/demo
mkdir -p /opt/apps/demo/logs
```

推荐最终保持这样的目录结构：

```text
/opt/apps/demo/
├── demo.jar
├── demo.jar.bak
├── logs/
└── deploy.sh
```

## 八、编写 deploy.sh

服务器创建：

```text
/opt/apps/demo/deploy.sh
```

内容如下：

```bash
#!/bin/bash

set -e

APP_NAME="demo"
APP_DIR="/opt/apps/demo"
JAR="$APP_DIR/demo.jar"
LOG_FILE="$APP_DIR/logs/demo.log"

echo "===== 开始部署 $APP_NAME ====="

PID=$(pgrep -f "$JAR" || true)

if [ -n "$PID" ]; then
    echo "停止旧进程: $PID"
    kill "$PID"

    for i in {1..20}; do
        if ! kill -0 "$PID" 2>/dev/null; then
            break
        fi
        sleep 1
    done

    if kill -0 "$PID" 2>/dev/null; then
        echo "旧进程仍未退出，强制停止"
        kill -9 "$PID"
    fi
fi

echo "启动新版本"

nohup java -jar "$JAR" \
  --spring.profiles.active=prod \
  >> "$LOG_FILE" 2>&1 &

NEW_PID=$!

echo "新进程 PID: $NEW_PID"

sleep 5

if kill -0 "$NEW_PID" 2>/dev/null; then
    echo "部署成功"
else
    echo "启动失败，请检查日志：$LOG_FILE"
    exit 1
fi
```

然后：

```bash
chmod +x /opt/apps/demo/deploy.sh
```

## 九、配置 SSH 免密登录

流水线需要能够登录部署服务器。

建议为 CI/CD 单独生成一组 SSH Key，而不是直接复用自己的个人密钥。

例如：

```bash
ssh-keygen -t ed25519 -C "gitee-ci"
```

将公钥加入服务器部署用户：

```text
/home/deploy/.ssh/authorized_keys
```

私钥不要提交到 Git 仓库。

应该放入 Gitee 的凭证、密钥或流水线变量管理中。

错误示例：

```yaml
PRIVATE_KEY: |
  -----BEGIN OPENSSH PRIVATE KEY-----
  ...
```

然后直接提交到仓库。

这种方式非常危险。

正确思路是：

```text
Git 仓库
    × 不保存密码
    × 不保存私钥

Gitee 凭证管理
    √ SSH Private Key
    √ Token
    √ 密码
```

## 十、第四阶段：上传 JAR

构建完成后，把：

```text
target/demo.jar
```

上传至：

```text
/opt/apps/demo/demo.jar
```

如果使用命令行方式，本质上类似：

```bash
scp target/demo.jar deploy@服务器IP:/opt/apps/demo/demo.jar
```

如果 Gitee Go 中已经提供主机部署、文件上传等插件，优先使用流水线插件管理主机和凭证，而不是把密码写进 Shell。

## 十一、部署前自动备份

不要直接覆盖旧版本。

可以先执行：

```bash
if [ -f /opt/apps/demo/demo.jar ]; then
    cp /opt/apps/demo/demo.jar /opt/apps/demo/demo.jar.bak
fi
```

然后再上传新 JAR。

完整流程：

```text
旧 demo.jar
      ↓
复制为 demo.jar.bak
      ↓
上传新 demo.jar
      ↓
执行 deploy.sh
```

这样出了问题可以快速回滚。

## 十二、执行远程部署

JAR 上传成功以后，在服务器执行：

```bash
cd /opt/apps/demo
./deploy.sh
```

流水线最终结构建议设计成：

```text
Stage 1：Build
 ├─ Checkout
 ├─ Maven Build
 └─ Archive Artifact

Stage 2：Test
 └─ Maven Test

Stage 3：Deploy
 ├─ Backup
 ├─ Upload JAR
 └─ Run deploy.sh
```

## 十三、增加健康检查

仅仅发现 Java 进程存在，并不能代表程序真正启动成功。

Spring Boot 如果启用了 Actuator，可以增加：

```bash
curl -f http://127.0.0.1:8080/actuator/health
```

或者直接检查自己的业务接口：

```bash
curl -f http://127.0.0.1:8080/api/health
```

部署流程变成：

```text
启动应用
   ↓
等待几秒
   ↓
调用健康检查
   ↓
200 OK
   ↓
发布成功
```

如果不是 200：

```text
部署失败
↓
流水线标红
↓
检查日志 / 执行回滚
```

## 十四、增加自动回滚

一个简单的回滚脚本：

```bash
#!/bin/bash

APP_DIR="/opt/apps/demo"

if [ ! -f "$APP_DIR/demo.jar.bak" ]; then
    echo "没有可回滚版本"
    exit 1
fi

pkill -f "$APP_DIR/demo.jar" || true

cp "$APP_DIR/demo.jar.bak" "$APP_DIR/demo.jar"

nohup java -jar "$APP_DIR/demo.jar" \
  --spring.profiles.active=prod \
  >> "$APP_DIR/logs/demo.log" 2>&1 &

echo "回滚完成"
```

更完善的做法不是只保存一个 `.bak`，而是按版本号保存：

```text
releases/
├── demo-20260901.jar
├── demo-20260902.jar
└── demo-20260903.jar
```

再通过软链接决定当前版本：

```text
current.jar -> releases/demo-20260903.jar
```

这样回滚会更加可靠。

## 十五、推荐的完整流程

对于个人项目或小型 Java 项目，可以先实现：

```text
开发者
  │
  │ git push origin main
  ▼
Gitee
  │
  ▼
Gitee Go
  │
  ├── 拉取代码
  ├── Maven 编译
  ├── 单元测试
  ├── Maven 打包
  ├── 备份旧 JAR
  ├── 上传新 JAR
  ├── SSH 执行 deploy.sh
  └── HTTP 健康检查
          │
          ▼
      Linux 服务器
          │
          ▼
     Spring Boot
```

以后每次开发就只需要：

```bash
git add .
git commit -m "feat: 新增xxx功能"
git push origin main
```

剩下的工作全部由流水线完成。

## 十六、生产环境还应该注意什么

CI/CD 跑通只是第一步。

正式项目至少还建议增加：

- 独立的 dev、test、prod 环境。
- main 分支保护。
- Pull Request / Code Review。
- 自动测试。
- 密钥统一放凭证管理，不写入仓库。
- 部署前备份。
- 发布后的健康检查。
- 自动或手动回滚。
- 日志集中管理。
- 发布通知。

对于重要生产环境，还可以增加“人工确认”步骤：

```text
代码通过测试
     ↓
等待负责人确认
     ↓
确认发布
     ↓
部署生产
```

这样既保留自动化，也可以避免一次错误提交直接影响线上服务。

## 总结

使用 Gitee Go 后，我们真正希望得到的不是“少敲几个命令”，而是把发布过程标准化。

以前：

```text
打包 → 找文件 → 上传 → SSH → 停服务 → 启服务
```

现在：

```text
git push
   ↓
CI/CD
   ↓
自动部署
```

对于经常维护 Spring Boot 项目的人，这套流程非常值得搭建。等基础流程稳定后，还可以继续加入 Docker、Nginx、蓝绿部署、灰度发布以及 Kubernetes，把它逐步升级成完整的 DevOps 发布体系。

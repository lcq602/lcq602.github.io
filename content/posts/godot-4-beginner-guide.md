---
title: "Godot 4 入门使用指南：从创建项目到角色移动"
date: 2026-09-02T17:05:00+09:00
draft: false
description: "面向 Godot 新手的完整入门教程，介绍项目、场景、节点、脚本、角色移动、信号和定时器。"
tags:
  - Godot
  - 游戏开发
  - GDScript
categories:
  - Godot 学习笔记
ShowToc: true
TocOpen: true
---

Godot 是一款免费、开源的游戏引擎，特别适合个人开发者制作 2D 游戏。它体积小、启动快，使用自己的脚本语言 GDScript，语法与 Python 比较接近。

这篇文章以 Godot 4 为例，从创建项目开始，逐步做出一个可以用键盘控制的 2D 角色。

## 一、下载哪个版本

进入 [Godot 官网](https://godotengine.org/) 下载稳定版本。

Godot 通常提供两个版本：

- **Godot Engine**：使用 GDScript，适合新手，也是本文使用的版本。
- **Godot Engine .NET**：支持 C#，需要额外安装 .NET SDK。

如果刚开始学习，建议选择标准版。以后确实需要 C# 时，再使用 .NET 版本也不迟。

## 二、创建第一个项目

打开 Godot，点击“新建项目”，填写以下信息：

- 项目名称：例如 `MyFirstGame`
- 项目路径：选择一个空文件夹
- 渲染器：普通 2D 项目可以选择“兼容性”
- 版本控制：选择 Git

点击“创建并编辑”，即可进入 Godot 编辑器。

建议一开始整理好目录：

```text
MyFirstGame/
├── assets/       # 图片、音乐和音效
├── scenes/       # 场景文件
├── scripts/      # GDScript 脚本
├── project.godot
└── main.tscn
```

## 三、理解场景和节点

Godot 最重要的两个概念是“节点”和“场景”。

### 节点是什么

节点是组成游戏的基本零件，每种节点负责一种功能。

常见的 2D 节点如下：

| 节点 | 作用 |
|---|---|
| `Node2D` | 普通 2D 节点，可以设置位置、旋转和缩放 |
| `Sprite2D` | 在画面中显示图片 |
| `CharacterBody2D` | 制作可以移动和发生碰撞的角色 |
| `CollisionShape2D` | 给角色设置碰撞形状 |
| `Camera2D` | 让摄像机跟随玩家 |
| `Area2D` | 检测角色是否进入某个区域 |
| `Timer` | 定时执行操作，例如生成敌人和自动攻击 |
| `AnimationPlayer` | 播放位置、透明度等属性动画 |

一个玩家通常不是单独的图片，而是一棵节点树：

```text
Player（CharacterBody2D）
├── Sprite2D
├── CollisionShape2D
└── Camera2D
```

其中：

- `CharacterBody2D` 负责移动。
- `Sprite2D` 负责显示人物图片。
- `CollisionShape2D` 负责碰撞。
- `Camera2D` 负责让视角跟随玩家。

### 场景是什么

场景是保存好的一组节点，文件扩展名是 `.tscn`。

例如：

- `player.tscn`：玩家场景
- `enemy.tscn`：敌人场景
- `bullet.tscn`：子弹场景
- `main.tscn`：主游戏场景

场景可以重复实例化。比如只制作一次 `enemy.tscn`，运行时便可以生成很多个敌人。

## 四、创建玩家场景

新建一个“其他节点”，选择 `CharacterBody2D`，重命名为 `Player`。

然后添加两个子节点：

1. `Sprite2D`
2. `CollisionShape2D`

选中 `Sprite2D`，把人物图片拖到右侧检查器的 `Texture` 属性中。

选中 `CollisionShape2D`，在 `Shape` 中新建一个 `CapsuleShape2D` 或 `RectangleShape2D`，再调整碰撞框大小，使其覆盖人物身体。

最后把场景保存为：

```text
scenes/player.tscn
```

## 五、设置移动按键

打开：

```text
项目 → 项目设置 → 输入映射
```

添加四个动作：

| 动作名 | 按键 |
|---|---|
| `move_left` | A、方向左 |
| `move_right` | D、方向右 |
| `move_up` | W、方向上 |
| `move_down` | S、方向下 |

动作名可以自己定义，但脚本中使用的名称必须与这里完全一致。

## 六、编写角色移动脚本

选中 `Player`，点击“附加脚本”，保存为：

```text
scripts/player.gd
```

写入以下代码：

```gdscript
extends CharacterBody2D

# 玩家每秒移动的像素数
@export var speed: float = 250.0

func _physics_process(_delta: float) -> void:
    # 读取四个方向的输入，并自动合成为一个方向向量
    var direction := Input.get_vector(
        "move_left",
        "move_right",
        "move_up",
        "move_down"
    )

    # 设置当前移动速度
    velocity = direction * speed

    # 根据 velocity 移动，同时处理碰撞
    move_and_slide()
```

运行后，角色就可以通过 WASD 或方向键移动。

### 这些代码分别是什么意思

- `extends CharacterBody2D`：脚本继承 `CharacterBody2D` 的移动能力。
- `@export`：把变量显示在检查器中，方便直接修改。
- `_physics_process()`：物理帧更新函数，适合处理移动和碰撞。
- `Input.get_vector()`：读取四个方向，并返回归一化方向。
- `velocity`：角色当前的移动速度。
- `move_and_slide()`：让角色按照速度移动并处理碰撞。

`_physics_process`、`Input.get_vector` 和 `move_and_slide` 都是 Godot 提供的功能，而 `speed` 和 `direction` 是我们自己定义的变量。

## 七、设置主场景

新建一个 `Node2D`，重命名为 `Main`，保存为：

```text
main.tscn
```

把 `player.tscn` 从文件系统面板拖到 `Main` 节点下面。

第一次运行项目时，Godot 会让你选择主场景，选择 `main.tscn` 即可。以后按 `F6` 运行当前场景，按 `F5` 运行整个项目。

## 八、使用信号

信号用于通知其他节点：“某件事发生了”。

例如按钮被点击、计时器结束、角色进入攻击范围，都可以通过信号处理。

假设玩家有一个受伤方法：

```gdscript
signal health_changed(current_health: int)

@export var max_health: int = 100
var health: int

func _ready() -> void:
    health = max_health

func take_damage(amount: int) -> void:
    health = max(health - amount, 0)
    health_changed.emit(health)

    if health == 0:
        queue_free()
```

其他节点连接 `health_changed` 信号后，就能在玩家受伤时更新血条，而不需要每一帧检查血量。

## 九、使用 Timer 定时器

`Timer` 很适合实现：

- 定时生成敌人
- 武器自动攻击
- 技能冷却
- 倒计时
- 持续伤害

给节点添加一个 `Timer`，设置：

- `Wait Time`：间隔秒数
- `One Shot`：是否只执行一次
- `Autostart`：是否在场景开始时自动启动

然后连接它的 `timeout` 信号：

```gdscript
func _on_attack_timer_timeout() -> void:
    print("执行一次自动攻击")
```

当计时结束时，Godot 就会调用这个函数。

## 十、实例化敌人

先准备一个 `enemy.tscn`，然后在主场景脚本中生成敌人：

```gdscript
extends Node2D

@export var enemy_scene: PackedScene

func spawn_enemy() -> void:
    var enemy := enemy_scene.instantiate()
    enemy.global_position = Vector2(
        randf_range(100.0, 1100.0),
        randf_range(100.0, 1100.0)
    )
    add_child(enemy)
```

选中主场景，在检查器中把 `enemy.tscn` 拖到 `Enemy Scene` 属性上。

这里最重要的三步是：

1. `instantiate()` 创建敌人实例。
2. 设置敌人的出生位置。
3. `add_child()` 把敌人加入场景树。

如果始终只有一个敌人，通常要检查是否重复使用了同一个节点、旧敌人是否被删除，以及 `Timer` 是否真的持续触发。

## 十一、几个常见报错

### Mixed use of tabs and spaces

表示脚本同时使用了 Tab 和空格缩进。

解决方法是统一使用四个空格，并在编辑器中执行缩进格式化。

### Unexpected identifier

通常表示上一行存在语法错误，例如：

- 少了括号
- 多写了一个字符
- 缩进层级错误
- 在函数外写了不允许出现的语句

报错位置不一定是真正出错的位置，也要检查它的上一行。

### Node not found

表示 `get_node()` 或 `$节点名` 找不到目标节点。检查节点名称、大小写和节点路径是否一致。

### Attempt to call function on a null instance

表示变量现在是 `null`。常见原因是节点没有找到、场景没有拖入导出属性，或者对象已经被 `queue_free()` 删除。

## 十二、适合新手的开发顺序

不要一开始就做完整的大型游戏。可以按照下面的顺序逐步实现：

1. 玩家显示与移动
2. 场景边界和碰撞
3. 敌人生成与追踪
4. 玩家自动攻击
5. 子弹和伤害
6. 生命值与死亡
7. 经验值和升级
8. 武器选择
9. UI、音效与暂停菜单
10. 保存和读取游戏数据

每完成一个功能就运行测试，再提交一次 Git。这样遇到问题时更容易定位，也可以随时回退。

## 总结

学习 Godot 时，最重要的是先理解节点树、场景实例化和信号。不要急着背诵所有 API，而是做一个小功能、运行验证，再继续添加下一个功能。

对于 2D 幸存者类游戏，可以先完成“玩家移动 → 敌人追踪 → 自动攻击”这个最小闭环。只要这个闭环能够稳定运行，后面的升级、武器和角色系统就都是在它的基础上继续扩展。

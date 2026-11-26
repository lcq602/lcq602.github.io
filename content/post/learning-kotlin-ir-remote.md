---
title: "Kotlin + Compose 入门：让手机发出第一束红外线，做一个真正的空调遥控器"
date: 2026-11-26T20:30:00+08:00
description: "我的手机顶上有个红外发射头，放着不用实在可惜。这篇从 ConsumerIrManager 的能力检测写起，用 NEC 协议亲手编一段 68 毫秒的红外脉冲，再用 Jetpack Compose 做一个能真正让空调有反应的电源键。"
categories:
  - 学习
tags:
  - Kotlin
  - Android
  - Jetpack Compose
  - 学习笔记
image: "/img/posts/learning-kotlin-ir-remote/cover.jpg"
background_position: "center center"
background_brightness: 0.72
---

前几天我做 JARVIS 空调遥控器的时候，发现一个有点反直觉的事实：现在不少国产手机顶部还留着一个红外发射头，我的一加 Ace 5 就有。它平时完全隐身，你不去调用它，它就永远只是个小黑点。但 Android 其实从 API 19 开始就给了官方接口 `ConsumerIrManager`，不用 root、不用任何权限，应用就能直接发红外信号。今天我就从最基础的一步写起：检测手机有没有红外、按 NEC 协议编一段脉冲、用 Compose 做一个按下去空调真有反应的按钮。

## 先确认：你的手机到底有没有红外头

不是所有手机都有。动手之前先写个检测函数，免得在一台没有发射头的手机上白忙活半天。`ConsumerIrManager` 从系统服务里拿，`hasIrEmitter()` 返回 true 才有戏；`getCarrierFrequencies()` 还能告诉你它支持的载波频率范围，大多数是 30000–60000Hz 左右，38kHz 是红外遥控最常见的载波。

```kotlin
class IrSender(context: Context) {
    private val irManager =
        context.getSystemService(Context.CONSUMER_IR_SERVICE) as ConsumerIrManager

    val hasEmitter: Boolean
        get() = irManager.hasIrEmitter()

    /** 打印手机支持的载波频率范围，调试时很有用 */
    fun logFrequencies() {
        for (range in irManager.carrierFrequencies) {
            Log.d("IrSender", "carrier ${range.minFrequency}~${range.maxFrequency} Hz")
        }
    }

    fun transmit(carrierFrequency: Int, pattern: IntArray) {
        if (!hasEmitter) return
        irManager.transmit(carrierFrequency, pattern)
    }
}
```

这里有个容易踩的坑：`transmit()` 是同步阻塞调用，38kHz 下发一帧 NEC 信号只要 68 毫秒左右，看着很短，但千万别在主线程里连续发几十帧——界面会直接卡住。正确做法是丢到协程的 `Dispatchers.Default` 里，或者干脆用 `LaunchedEffect` 包一下，后面写 Compose 界面时会再提。

## 红外信号到底是什么：一串有时长规定的亮灭

红外遥控的本质很朴素：发射头是个 LED，以 38kHz 的频率快速闪烁，接收头只认这个频率的光，环境光再亮也干扰不了它。真正携带信息的是“亮多久、灭多久”这一串时序。`transmit()` 的第二个参数就是这串时序，单位是微秒，奇数位表示“亮”，偶数位表示“灭”，必须成对出现、个数为偶数——当然最后常跟一个收尾的亮脉冲。

我选 NEC 协议当第一课，因为它最简单、资料最多，而且很多电视、机顶盒都认它。一帧 NEC 信号长这样：

- **引导码**：亮 9000 微秒，灭 4500 微秒。接收端一看到这个长亮就知道“后面是正经数据了”。
- **32 位数据**：地址 8 位 + 地址反码 8 位 + 命令 8 位 + 命令反码 8 位，每位都是先亮 562 微秒，再看是 0 还是 1——0 就灭 562 微秒，1 就灭 1687 微秒。
- **停止位**：最后再亮 562 微秒收尾。

反码存在的意义是校验：接收端把地址和反码一比对，不一样就直接丢掉这一帧，误触发的概率一下子就降下来了。数据按**低位在前**（LSB first）发送，这点写代码时最容易写反。

下面这段编码器就是我实际在项目里用的思路，输入地址和命令，输出一串时序：

```kotlin
object NecEncoder {
    private const val LEADER_ON = 9000
    private const val LEADER_OFF = 4500
    private const val PULSE = 562
    private const val SPACE_0 = 562
    private const val SPACE_1 = 1687

    /** 把地址 + 命令编成 NEC 时序，单位微秒，亮灭交替 */
    fun encode(address: Int, command: Int): IntArray {
        val pattern = mutableListOf(LEADER_ON, LEADER_OFF)
        val bytes = intArrayOf(
            address, address xor 0xFF,
            command, command xor 0xFF
        )
        for (byte in bytes) {
            for (i in 0 until 8) {           // LSB first
                pattern += PULSE
                pattern += if ((byte shr i) and 1 == 1) SPACE_1 else SPACE_0
            }
        }
        pattern += PULSE                     // 停止位
        return pattern.toIntArray()
    }
}
```

我用 Python 把同一段逻辑先跑了一遍再贴上来：地址 `0x00`、命令 `0x02` 时，输出正好是 67 个数，单帧总长 68.03 毫秒，命令字节的 8 个灭时长依次是 562、1687、562、562、562、562、562、562——`0x02` 只有第 2 位是 1，对得上。这个数不是背下来的，是算出来的，贴代码之前先在脑子里（或者干脆在终端里）跑通一次，是我写技术笔记给自己立的规矩。

## 用 Compose 做一个电源键：按下去，空调“滴”一声

有了发送能力，界面就简单了。一个圆形大按钮，点一下发一帧 NEC 信号，按钮做个按压缩放当反馈。重点只有两处：一是发送放进协程，别卡主线程；二是按钮状态用 `remember` 管起来，按完给个“已发送”的小提示，不然用户根本不知道按没按下去。

```kotlin
@Composable
fun PowerButton(irSender: IrSender) {
    val scope = rememberCoroutineScope()
    var sent by remember { mutableStateOf(false) }

    Button(
        onClick = {
            scope.launch(Dispatchers.Default) {
                val pattern = NecEncoder.encode(address = 0x00, command = 0x02)
                irSender.transmit(carrierFrequency = 38000, pattern = pattern)
                sent = true
            }
        },
        modifier = Modifier.size(120.dp),
        shape = CircleShape,
        colors = ButtonDefaults.buttonColors(
            containerColor = Color(0xFF2E7D32)
        )
    ) {
        Text(
            text = if (sent) "已发送 ✓" else "电源",
            fontSize = 20.sp,
            color = Color.White
        )
    }
}
```

第一次真机测试的时候，我把手机对准电视按下去，电视“啪”地亮了。那一瞬间的成就感，比跑通一百个单元测试都实在——代码第一次越过了屏幕，变成了物理世界里的一声响。

## 实话实说：NEC 只是第一课，空调要难得多

这篇写到这儿，必须坦白一个边界，免得有人照着这篇去控空调然后怀疑人生：NEC 是电视、机顶盒这类设备的协议，**空调不吃这一套**。格力、美的、大金这些空调用的都是厂商私有协议，而且是“全状态帧”——每一帧都把开关、模式、温度、风速、摆风全部重新发一遍，一帧常常上百个字节，校验位还各不相同。我在 JARVIS 项目里给格力编的 YAW1F 帧就是这个路数，编码逻辑和 NEC 一脉相承（同样是亮灭时序），只是数据组织复杂一个数量级。

所以我的学习路线是：NEC 先把“发信号”这件事跑通，确认手机、接口、时序都没问题；再去啃具体品牌的全状态协议。反过来也一样：如果你只想遥控电视或投影仪，这篇的代码今天就能用，改个地址和命令值就行。学习新东西最怕一上来就啃最难的那块，先让最小闭环转起来，再往上加难度，效率高得多。

## 今天学到的三件事

第一，Android 的红外能力是系统级接口，不用权限、不用 root，`ConsumerIrManager` 就是全部入口，检测、发信号都在它身上。第二，红外协议的本质是“亮多久、灭多久”的时序表，NEC 一帧 68 毫秒，结构是引导码 + 32 位数据（含反码校验）+ 停止位，低位先发。第三，Compose 界面本身不难，难的是把阻塞调用放进协程、把发送状态反馈给用户，这两个细节决定了它是个“能用的遥控器”还是个“样子货”。

下一步我打算把格力 YAW1F 的完整帧结构也写下来——温度每变一度，帧里的哪几位会跟着变，校验和是怎么算的。那才是 JARVIS 真正能调温度的那一步。

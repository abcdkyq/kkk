# 灵境奇途 — ARPG 动作手游项目文档

---

## 一、开发计划与完成情况

### ✅ 已完成模块

- **通用 FSM 状态机框架** — 泛型 CRTP 架构，支持 Player/Enemy 独立扩展
- **玩家状态系统（18 个状态）** — Idle / Walk / Fall / Dash / Spin / Backflip / Crouch / Crawl / Swim / Glide / AirDive / Stomp / WallDrag / LedgeHang / LedgeClimb / PoleClimb / RailGrind / Hurt / Die
- **敌人 AI 状态系统** — Idle / Follow / Waypoint 三状态，含视野检测与接触攻击
- **Input System 输入模块** — 基于 Unity Input System，支持手柄/键鼠，跳跃缓冲，相机相对方向
- **物理碰撞与检测系统** — SphereCast / CapsuleCast / OverlapCapsule，地面/墙壁/边缘检测
- **战斗系统（伤害/击退/踩踏）** — HitBox 触发器、接触攻击、踩头判定、受击反馈
- **数据持久化系统** — 三层架构 GameData / LevelData / GameSaver，支持 Binary / JSON / PlayerPrefs
- **关卡机制** — 传送门 / 检查点 / 掉落平台 / 移动平台 / 弹簧 / 重力场 / 减速区域 / 水域 / 轨道
- **拾取与投掷系统** — CapsuleCast 检测、物品附着、速度投掷、自动重生
- **收集品与计分系统** — 金币/星星收集，LevelScore 合并最佳成绩
- **第三人称相机** — Cinemachine 跟随，视角控制，自动旋转
- **音效系统** — 事件驱动，覆盖跳跃/受伤/冲刺等动作音效，脚步声按距离轮询

### 📝 待补充模块

- **UI 系统** —暂时只完成了UI滚动列表和学习了UIFramework框架
- **关卡设计（具体关卡内容）** —需要具体的策划来涉及关卡场景和游戏流程
- **性能优化** —暂时只学习了AssetBundle资源管理框架
- **打包与发布** —可以简单的打包成.exe和apk文件，打算学习SDK接入

---

## 二、项目背景

本项目是一款基于 Unity 3D 引擎开发的 ARPG 动作手游，目标平台为移动端与 PC。游戏以第三人称视角为核心，融合了经典 3D 平台跳跃与动作战斗元素，玩家操控角色在多个关卡中探索、战斗、收集道具并挑战机关障碍。

项目采用组件化架构，核心系统包括：通用有限状态机（FSM）、基于 Unity Input System 的跨平台输入、物理驱动的碰撞检测与交互、三层数据持久化，以及模块化的关卡机制。

---

## 三、需求概述

### 3.1 核心玩法需求
- 流畅的第三人称动作操控：跑、跳、冲刺、旋转攻击、滑翔、蹬墙跳、攀爬等
- 多样化的敌人 AI：巡逻、追击、接触攻击、视野检测
- 丰富的关卡交互：传送门、检查点、移动/掉落平台、水域、减速区域、轨道滑行

### 3.2 系统需求
- 可扩展的状态机框架，支持快速新增角色状态
- 跨平台输入适配（手柄/键鼠/触屏），支持按键重映射
- 多槽位存档系统，支持多种序列化方式
- 关卡成绩记录与历史最佳合并

### 3.3 非功能需求
- 移动端 120fps 稳定运行
- 碰撞检测零 GC（使用 NonAlloc API）
- 存档数据安全性（防篡改）

---

## 四、详细设计

### 4.1 FSM 状态机框架

**架构分层：**

```
EntityState<T>              — 抽象状态基类（生命周期：Enter/Step/Exit/OnContact）
  ├─ PlayerState            — 玩家状态基类（空实现，类型标记）
  │    ├─ IdlePlayerState
  │    ├─ WalkPlayerState
  │    ├─ FallPlayerState
  │    └─ ... (共 18 个)
  └─ EnemyState             — 敌人状态基类
       ├─ IdleEnemyState
       ├─ FollowEnemyState
       └─ WaypointEnemyState

EntityStateManager<T>       — 状态管理器（持有状态列表、当前/上一状态、转换逻辑）
  ├─ PlayerStateManager
  └─ EnemyStateManager

Entity<T>                   — 实体基类（驱动状态机 + 物理 + 碰撞）
  ├─ Player
  └─ Enemy
```

**关键设计决策：**

1. CRTP 泛型约束 `where T : Entity<T>`：状态方法直接接收具体子类类型，避免向下转型
2. 反射实例化：Inspector 配置状态类名字符串数组，`Start()` 时通过 `Activator.CreateInstance` 创建，运行时零反射开销
3. 命令式转换：状态内部直接调用 `states.Change<TargetState>()`，转换条件与业务逻辑内聚
4. 事件系统：`EntityStateManagerEvents` 提供 `onChange/onEnter/onExit` 回调，解耦外部监听

**驱动流程（每帧）：**

```
Entity.Update()
  → HandleStates()      // StateManager.Step() → 当前状态.OnStep()
  → HandleController()  // CharacterController.Move(velocity * deltaTime)
  → HandleSpline()      // 轨道检测
  → HandleGround()      // SphereCast 地面检测
  → HandleContacts()    // OverlapCapsule 碰撞检测 + IEntityContact 回调
```

### 4.2 输入系统

基于 Unity Input System 的 `InputActionAsset`，`PlayerInputManager` 缓存 15 个 `InputAction` 引用。

**核心机制：**
- 相机相对方向：`GetMovementCameraDirection()` 用 `Quaternion.AngleAxis(Camera.main.eulerAngles.y, Vector3.up)` 将输入从屏幕空间转换到世界空间
- 跳跃缓冲：记录 `m_lastJumpTime`，0.15 秒窗口内落地自动触发跳跃
- 方向锁定：`LockMovementDirection(duration)` 用于蹬墙跳/后空翻，防止输入干扰动作轨迹
- 十字死区：逐轴独立死区 + 重映射，避免圆形死区导致的对角线灵敏度问题

### 4.3 物理与碰撞系统

角色移动基于 `CharacterController`（非 Rigidbody），手动管理速度向量。

**速度分解：**
- `lateralVelocity`：水平速度 (x, 0, z)
- `verticalVelocity`：垂直速度 (0, y, 0)
- 统一通过 `velocity` 属性读写，setter 自动合并

**碰撞检测 API（全部使用 NonAlloc 避免 GC）：**
- `SphereCast`：地面检测、边缘检测
- `CapsuleCast`：墙壁检测、拾取检测
- `OverlapCapsuleNonAlloc`：实体接触检测（预分配 buffer）
- `OverlapSphereNonAlloc`：敌人视野检测

**加速度模型（`Accelerate` 方法）：**

将当前水平速度投影分解为"同向分量"和"转向分量"：
- 同向分量：沿输入方向做加速并限速
- 转向分量：独立衰减（`turningDrag`），实现惯性转弯

```
speed = Dot(direction, lateralVelocity)   // 投影：当前速度在目标方向的分量
velocity = direction * speed              // 同向速度
turningVelocity = lateralVelocity - velocity  // 转向残余
// 分别处理：同向加速，转向衰减，最后合并
```

**坡道系统（`SlopeFactor` 方法）：**
- `Dot(Vector3.up, groundNormal)` 计算坡度因子
- `Dot(localSlopeDirection, lateralVelocity)` 判断上坡/下坡
- 上坡施加较大阻力，下坡施加较小助推力，分开配置

### 4.4 战斗系统

**伤害流程：**

```
攻击源（HitBox/ContactAttack/Pickable）
  → target.ApplyDamage(damage, origin)
    → health.Damage(amount)
    → 计算受击方向（origin → target，忽略 Y 轴）
    → 面朝攻击方向 + 后退击退力 + 上抛力
    → 切换 HurtPlayerState
    → 血量归零 → 触发 OnDie
```

**踩头判定：**
- 敌人 `ContactAttack()` 中计算 `stepping = bounds.max + Vector3.down * tolerance`
- 用 `player.IsPointUnderStep(stepping)` 判断玩家是否在敌人头顶
- 若玩家在上方则跳过伤害，实现经典"踩头免伤"机制

**敌人视野检测：**
- 未锁定时：`OverlapSphereNonAlloc` 以 `spotRange` 为半径检测玩家
- 已锁定时：距离超过 `viewRange` 或玩家死亡则解除锁定
- 发现/丢失分别触发 `OnPlayerSpotted` / `OnPlayerScaped` 事件

### 4.5 数据持久化系统

**三层架构：**

```
GameSaver（存储层）
  ├─ Binary：BinaryFormatter 序列化到文件
  ├─ JSON：JsonUtility 序列化到文本文件
  └─ PlayerPrefs：JSON 字符串存入 PlayerPrefs
       ↕
GameData（数据传输层）
  ├─ retries: int
  ├─ levels: LevelData[]
  ├─ createdAt / updatedAt: string
  └─ ToJson() / FromJson() 互转
       ↕
Game + GameLevel（运行时层）
  ├─ LoadState(GameData) 恢复状态
  ├─ ToData() 导出快照
  └─ RequestSaving() 触发存盘
```

**成绩合并策略（`LevelScore.Consolidate`）：**
- 金币：取历史最大值
- 时间：取历史最短
- 星星：取并集（任何一次收集过即保留）

### 4.6 关卡机制

| 机制 | 实现类 | 核心原理 |
|------|--------|----------|
| 传送门 | `Portal` | 成对配置，保持高度差传送，`Dot` 判断朝向，速度重定向到出口方向 |
| 检查点 | `Checkpoint` | 触发器，首次接触调用 `player.SetRespawn()` 记录重生点 |
| 掉落平台 | `FallingPlatform` | 接触后延迟 + 抖动预警 → 禁用碰撞体 → 可选自动重置 |
| 移动平台 | `MovingPlatform` | 沿 `WaypointManager` 路径匀速移动，支持 PingPong/Loop/Once |
| 弹簧 | `Spring` | 接触施加向上力，重置跳跃/冲刺/旋转计数 |
| 重力场 | `GravityField` | 触发区域内施加 `transform.up * force` 方向力 |
| 减速区域 | `EntityVolumeEffector` | 进入时修改 Entity 的 multiplier（加速度/重力/极速等），离开时重置 |
| 水域 | `Volume` + `SwimPlayerState` | `OnTriggerStay` 检测水体包围盒，进入切换游泳状态，浮力系统 |
| 轨道 | `SplineContainer` + `RailGrindPlayerState` | Spline 求值定位，坡度影响速度，自定义碰撞 |
| 可破坏物 | `Breakable` | 被 `EntityHitBox` 命中后隐藏模型、禁用碰撞 |

---

## 五、内容介绍

### 5.1 玩家动作系统

玩家拥有 18 种状态，覆盖地面、空中、水中、墙面、轨道等全场景动作：

**地面动作：** Idle（待机）→ Walk（行走/奔跑）→ Brake（急停）→ Crouch（蹲下）→ Crawling（匍匐）

**跳跃体系：** 基础跳跃（支持多段跳 + 土狼时间）→ Fall（下落，含空中控制）→ Backflip（后空翻，需反向输入触发）

**空中技能：** Dash（冲刺，地面/空中均可，有冷却和次数限制）→ Spin（旋转攻击，空中有次数上限）→ AirDive（俯冲）→ Stomp（下砸，蓄力 + 落地弹跳）→ Gliding（滑翔，限制下落速度）

**墙面/边缘：** WallDrag（贴墙滑行 + 蹬墙跳）→ LedgeHanging（悬挂，可左右移动）→ LedgeClimbing（攀上，协程驱动两阶段位移）

**特殊：** PoleClimbing（攀杆，上下移动 + 绕杆旋转）→ RailGrind（轨道滑行，Spline 求值）→ Swim（游泳，浮力 + 潜水 + 跳出水面）

**交互：** 拾取/投掷系统（CapsuleCast 前方检测，物品附着到插槽，投掷力与移动速度关联）

### 5.2 敌人 AI 系统

敌人基于 3 状态 FSM：
- **Idle**：原地待机，施加重力和摩擦力
- **Waypoint**：沿预设路径点巡逻，到达后切换下一个，支持 PingPong/Loop/Once 模式
- **Follow**：发现玩家后计算水平方向向量，加速追击并平滑转向

视野系统采用双距离机制：`spotRange`（发现距离，球形检测）< `viewRange`（丢失距离），形成"易发现难甩脱"的追击体验。

### 5.3 关卡系统

关卡由多种可组合的机关元素构成：
- 传送门成对放置，保持传送前后的速度连贯性和朝向合理性
- 掉落平台提供视觉抖动预警，给玩家反应时间
- 减速区域（沼泽）通过 multiplier 系数影响角色物理参数，而非直接修改速度
- 水域通过包围盒检测进出，配合独立的游泳状态和浮力系统
- 弹簧重置所有空中动作计数器，允许连续弹跳组合技

### 5.4 存档与进度

5 个存档槽位，支持新建/读取/删除。每次通关自动合并最佳成绩（金币最大值、时间最短、星星并集），解锁下一关。存档路径为 `Application.persistentDataPath`，跨平台兼容。

---

## 六、设计难点与技术亮点

### 亮点 1：CRTP 泛型状态机框架

**难点：** 如何让 FSM 框架同时服务于 Player（18 状态）和 Enemy（3 状态），且状态内部能直接访问具体子类成员而无需强制转型。

**方案：** 采用奇异递归模板模式 `EntityState<T> where T : Entity<T>`，编译期确定类型安全。状态通过 Inspector 字符串配置 + 反射实例化，兼顾灵活性和运行时零开销。

**价值：** 新增状态只需继承 `PlayerState` 并在 Inspector 添加类名，无需修改框架代码，完全符合开闭原则。

### 亮点 2：向量投影分解的加速度模型

**难点：** 传统 `velocity += direction * acceleration` 在急转弯时会导致速度超限，且转向手感生硬。

**方案：** 将速度投影分解为同向分量（加速限速）和转向分量（独立衰减），两者分别处理后合并。`turningDrag` 参数控制转向惯性大小。

**价值：** 实现了"转弯时旧方向惯性逐渐消失、新方向逐渐加速"的丝滑手感，且速度永远不会超过 `topSpeed`。

### 亮点 3：物理驱动的坡道与地面系统

**难点：** CharacterController 不自带坡道加减速，角色在斜面上容易"飘"或"卡"。

**方案：** `SlopeFactor` 用两次 `Vector3.Dot` 分别计算坡度因子和移动方向，上坡/下坡施加不同力度。`SnapToGround` 在地面时施加恒定向下力防止浮空。地面检测用 `SphereCast` + `EvaluateLanding`（坡度限制 + stepOffset 判断）。

**价值：** 角色在各种坡度上都有自然的加减速体验，不会出现悬浮或穿透。

### 亮点 4：零 GC 碰撞检测

**难点：** 每帧大量碰撞检测（地面/墙壁/接触/视野）如果使用 `OverlapSphere` 等返回数组的 API，会产生大量 GC。

**方案：** 全部使用 `NonAlloc` 变体（`OverlapCapsuleNonAlloc`、`OverlapSphereNonAlloc`），预分配固定大小的 `Collider[]` buffer。

**价值：** 运行时碰撞检测零内存分配，移动端无 GC 卡顿。

### 亮点 5：传送门的速度连贯性设计

**难点：** 传送后如果直接设置位置，玩家会感觉"断裂"——速度方向错乱、朝向不对。

**方案：** 传送时保持高度差（`yOffset`），用 `Dot` 判断输入方向与出口朝向的关系决定面朝方向，速度大小保留但方向重定向到面朝方向（`transform.forward * magnitude`），最后重置相机。

**价值：** 传送前后速度和朝向无缝衔接，玩家几乎感觉不到"被传送"，体验流畅。

### 亮点 6：踩头免伤的精确判定

**难点：** 敌人接触攻击和玩家踩头攻击共用碰撞检测，如何区分"被撞"和"踩头"？

**方案：** 在敌人碰撞盒顶部向下偏移 `contactSteppingTolerance` 得到参考点 `stepping`，用 `player.IsPointUnderStep(stepping)` 判断玩家脚底是否高于该点。高于则为踩头（跳过伤害），否则为接触攻击。

**价值：** 用一个简单的高度比较实现了经典的"马里奥踩头"机制，`tolerance` 参数可精细调节判定宽容度。

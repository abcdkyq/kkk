# CyclicScrollView 无限滚动列表 — 项目文档

## 项目演示视频待后续更新！！！

## 一、项目背景

Unity UGUI 原生 ScrollRect + LayoutGroup 方案在大数据量场景下存在严重性能问题：

- **初始化卡顿**：一次性 Instantiate 所有 Cell 的 GameObject，10000 条数据需要创建 10000 个对象
- **滚动帧率低**：Canvas.SendWillRenderCanvases 遍历所有 dirty Graphic，LayoutGroup 每帧标记全部子物体 dirty，Rebuild 开销 O(n)
- **内存浪费**：所有 Cell 常驻内存，即使 99% 不在视野内
- **GC Spike**：如果动态创建/销毁 Cell，频繁触发 GC 导致卡顿

本项目实现了一套基于对象池的虚拟化滚动列表，核心思路：仅维护视野内及缓冲区的少量 UI 元素（通常 12-14 个 Bundle），超出视野的元素回收到对象池，新进入视野的元素从池中取出复用。无论数据量多大，活跃的 GameObject 数量恒定，实现万级数据的流畅滚动。

## 二、需求

- **R1 (P0)**：支持大数据量列表（10000+）的流畅滚动，帧率稳定 60fps
- **R2 (P0)**：支持垂直（Vertical）和水平（Horizontal）两种滚动方向
- **R3 (P0)**：支持网格布局，单行/单列可配置多个 Cell（`_ItemCellCount`）
- **R4 (P0)**：支持运行时动态增删数据并实时刷新视图，不需要重新初始化
- **R5 (P1)**：支持单个元素的局部刷新（`ElementAtDataChange`），避免全量重绘
- **R6 (P0)**：框架与业务完全解耦，子类只需实现一个抽象方法即可接入
- **R7 (P0)**：快速拖拽/跳跃场景下能正确恢复显示，不出现空白或错位
- **R8 (P1)**：数据缩减时自动清理越界的 UI 元素

## 三、开发计划

**已完成：**
- ✅ 核心框架：泛型基类 `UICyclicScrollList<C,D>` 架构设计，partial class 三文件拆分
- ✅ 对象池：Queue-based ViewCellBundle 池化机制，高水位线策略
- ✅ 滚动逻辑：双端回收算法（RemoveHead/RemoveTail/AddHead/AddTail）
- ✅ 位置系统：anchoredPosition 坐标计算、GetIndex 索引反算、视野判断
- ✅ 方向支持：Vertical / Horizontal 双方向，Content 锚点自动配置
- ✅ 网格布局：`_ItemCellCount` 多列/多行支持，Bundle 内 Cell 偏移计算
- ✅ 数据变更：单元素刷新 / 全量刷新 / Content 尺寸重算
- ✅ 跳跃恢复：链表清空检测 + RefreshAllCellInViewRange 从零重建
- ✅ 边界处理：最后一行不满时的 Cell 隐藏、数据缩减时的越界清理
- ✅ 索引校验：AddHead/AddTail 中位置反算索引与顺序索引的双重验证
- ✅ 缓冲区：视野外一个 ItemSize 的回收容差，防止来回滚动抖动
- ✅ 示例场景：ViewListTest 压力测试（动态增删、数据替换、批量刷新）

**待补充：**
- 📝 不等高 Cell：支持动态高度的 Cell（前缀和 + 二分查找）
- 📝 吸附/对齐：滚动停止时自动 Snap 到最近的 Item
- 📝 跳转接口：`ScrollToIndex(int index)` 程序化定位到指定数据
- 📝 数据绑定优化：`ICollection` → `IList`，消除 `ElementAt` 的 O(n) 隐患
- 📝 自动感知数据变化：ObservableCollection 或版本号机制，免手动调刷新
- 📝 池缩容策略：空闲 Bundle 超时自动 Destroy，避免峰值后内存不释放

## 四、详细设计

### 4.1 整体架构

```
UICyclicScrollList<C, D> (abstract partial class, 命名空间 Knivt.Tools.UI)
│
├── CyclicScrollView.cs           — 核心滚动逻辑
│   ├── UpdateDisplay()           — 每帧驱动入口
│   ├── AddHead() / AddTail()     — 向视野边缘扩展填充
│   ├── RemoveHead() / RemoveTail() — 回收超出视野的 Bundle
│   ├── RefreshAllCellInViewRange() — 跳跃场景从零重建
│   ├── RemoveItemOutOfListRange()  — 数据缩减时清理越界
│   ├── GetIndex()                — 位置 → 索引反算
│   ├── CaculateRelativePostion() — Bundle 位置 → 视野相对坐标
│   └── AboveViewRange / UnderViewRange / InViewRangeLeft / InViewRangeRight / OnViewRange
│
├── CyclicScrollView.Pool.cs      — 对象池管理
│   ├── GetViewBundle()           — 从池获取或新建 Bundle
│   ├── ReleaseViewBundle()       — 回收 Bundle 到池
│   ├── InstantiateCell()         — 虚方法，可重写 Cell 创建逻辑
│   ├── ResetRectTransform()      — 统一锚点/Pivot 为左上角 (0,1)
│   ├── ResetCellData()           — 抽象方法，子类实现数据绑定
│   └── ClearPoolItem() / ClearAllUiItem()
│
├── CyclicScrollView.DataChange.cs — 数据变更响应
│   ├── ElementAtDataChange()     — 单元素局部刷新
│   ├── RefrashViewRangeData()    — 全量刷新视野内所有 Cell
│   └── RecalculateContentSize()  — Content 尺寸重算 + 锚点配置
│
├── ViewCellBundle<TCell>          — 池化单元
│   ├── TCell[] Cells             — 一行/一列的 Cell 数组
│   ├── int index                 — 当前 Item 索引
│   ├── Vector2 position          — 当前 anchoredPosition
│   └── Clear()                   — IPoolObject 实现，隐藏所有 Cell
│
└── IPoolObject                    — 池对象接口，定义 Clear()

子类接入示例：
ViewListTest : UICyclicScrollList<ViewCell, TestData>
  └── 只需实现 ResetCellData(ViewCell cell, TestData data, int dataIndex)
```

### 4.2 核心数据结构选型

- **活跃列表** (`LinkedList<ViewCellBundle<C>>`): 滚动时只在头尾增删，LinkedList 头尾操作 O(1)；不需要随机访问。若用 List，`RemoveAt(0)` 需要 O(n) 搬移
- **对象池** (`Queue<ViewCellBundle<C>>`): FIFO 保证每个 Bundle 被均匀复用，避免 Stack(LIFO) 导致部分 Bundle 长期闲置；入队出队均 O(1)
- **Bundle 内部** (`TCell[]` 固定长度数组): 长度 = `_ItemCellCount`（网格列数），生命周期内不变，数组访问 O(1)，无 GC 开销
- **数据源** (`ICollection<D>` 外部引用): 不拷贝数据，零额外内存；通过 `ElementAt` 访问（对 IList 实现为 O(1)）

### 4.3 每帧更新流程（UpdateDisplay）

```
Update()
  ├── Datas == null → return（未初始化保护）
  └── UpdateDisplay()
        │
        ├── Step 1: RemoveHead()
        │   遍历链表头部，将超出视野上方/左侧的 Bundle 逐个回收到池
        │   垂直：relativePos.y > ItemSize.y（含一个 ItemSize 缓冲）
        │   水平：relativePos.x < -ItemSize.x
        │
        ├── Step 2: RemoveTail()
        │   遍历链表尾部，将超出视野下方/右侧的 Bundle 逐个回收到池
        │   垂直：relativePos.y < -viewRange.sizeDelta.y
        │   水平：relativePos.x > viewRange.sizeDelta.x
        │
        ├── Step 3: 链表为空？
        │   ├── 是 → RefreshAllCellInViewRange()
        │   │         根据 content.anchoredPosition 反算视野起止索引
        │   │         从池中取 Bundle 逐个填充，处理跳跃/快速拖拽场景
        │   └── 否 → AddHead() + AddTail()
        │             从当前头/尾 Bundle 向外偏移一个 ItemSize
        │             while 新位置在视野内 && 索引合法：
        │               从池取 Bundle → 设置位置和数据 → 插入链表头/尾
        │             同时做索引双重校验（位置反算 vs 顺序递推）
        │
        └── Step 4: RemoveItemOutOfListRange()
              数据缩减时，尾部 Bundle.index > ItemCount-1 的逐个回收
```

**为什么先回收再填充？** 先执行 RemoveHead/RemoveTail 将不可见 Bundle 归还池中，AddHead/AddTail 时池中已有可用 Bundle，直接 Dequeue 复用，避免触发 Instantiate。如果顺序反过来，池可能为空，被迫创建新对象。

### 4.4 位置计算系统

**坐标空间：** 所有计算基于 Content 的 `anchoredPosition`，锚点统一为左上角 `(0,1)`。不使用 world position，避免 Canvas 缩放和分辨率差异的影响。

**Item 位置公式：**
```
垂直模式：position[i] = (0, -i × ItemSize.y)
水平模式：position[i] = (i × ItemSize.x, 0)

其中 ItemSize = CellSize + _cellSpace
CellSize 来自 _cellRectTransform.sizeDelta（模板 Cell 的尺寸）
```

**网格内 Cell 偏移：**
```
垂直模式（多列）：第 j 个 Cell 偏移 = j × (CellSize.x + _cellSpace.x, 0)
水平模式（多行）：第 j 个 Cell 偏移 = j × (0, -(CellSize.y + _cellSpace.y))
```

**索引反算（GetIndex）：**
```csharp
// 垂直
index = Mathf.RoundToInt(-position.y / ItemSize.y);
// 水平
index = Mathf.RoundToInt(position.x / ItemSize.x);
```
使用 `RoundToInt` 而非 `FloorToInt`，对浮点精度误差（如 -299.9999 vs -300.0001）有容错能力。

**视野判断（CaculateRelativePostion）：**
```
relativePos = bundlePos + content.anchoredPosition（沿滚动轴分量）
```
将 Bundle 的 Content 局部坐标转换为相对视野左上角的坐标，再与视野尺寸比较判断是否在可见范围内。

**缓冲区：** AboveViewRange 判断阈值为 `ItemSize.y`（而非 0），即元素完全离开视野顶部一整个元素高度后才回收。防止用户小幅来回滚动时频繁触发回收-创建。

### 4.5 对象池详细流程

**GetViewBundle(itemIndex, position, cellSize, cellSpace)：**
```
if 池空:
    new ViewCellBundle(_ItemCellCount)  // 创建 Bundle 壳
    for j in 0.._ItemCellCount:
        Instantiate(_cellObject, content)  // 创建 Cell GameObject
        SetActive(false)
        ResetRectTransform → pivot/anchor 统一为 (0,1)
        anchoredPosition = position + j × cellOffset
        if dataIndex 在 [0, Datas.Count) 内:
            ResetCellData(cell, data, dataIndex)  // 子类绑定数据
else:
    Dequeue 已有 Bundle（零 Instantiate）
    for j in 0.._ItemCellCount:
        ResetRectTransform  // 重置锚点（防止外部修改）
        anchoredPosition = position + j × cellOffset
        if dataIndex 在 [0, Datas.Count) 内:
            ResetCellData(cell, data, dataIndex)
return bundle
```

**ReleaseViewBundle(bundle)：**
```
bundle.Clear()
  → index = -1
  → 遍历 Cells，全部 SetActive(false)
Enqueue 回池
```

**池特性：**
- 高水位线策略：池大小增长到同时可见 Bundle 的峰值后稳定，不主动 Destroy
- 稳态下滚动零 Instantiate、零 Destroy、零 GC Alloc
- `ClearPoolItem()` 清空池（不销毁 GameObject）
- `ClearAllUiItem()` 清空池 + 活跃列表

### 4.6 数据变更机制

**单元素刷新 — ElementAtDataChange(int index)：**
```
1. 边界检查：index < 0 || index >= Datas.Count → 抛异常
2. 链表为空 → return（无可见 Cell）
3. 计算 targetItemIndex = index / _ItemCellCount（属于哪个 Bundle）
4. 计算 targetIndex = index % _ItemCellCount（Bundle 内第几个 Cell）
5. 判断 targetItemIndex 是否在 [firstBundle.index, lastBundle.index] 范围内
6. 是 → 用 LINQ Single 找到对应 Bundle，取 Cells[targetIndex]，调用 ResetCellData
7. 否 → 不在视野内，无需刷新（数据已更新，滚动到该位置时自然会绑定新数据）
```

**全量刷新 — RefrashViewRangeData()：**
```
遍历 viewCellBundles 链表中每个 Bundle：
  计算 startIndex = bundle.index × _ItemCellCount
  计算 endIndex = startIndex + Cells.Length - 1
  if endIndex >= Datas.Count:
    endIndex = Datas.Count - 1（截断）
    标记 flag = true（后续 Bundle 全部越界）
  对 [startIndex, endIndex] 范围内的 Cell 调用 ResetCellData
  if flag:
    将 Bundle 内剩余 Cell 全部 SetActive(false)（最后一行不满的情况）
    break

遍历结束后，将链表中多余的 Bundle（数据缩减导致的）逐个 ReleaseViewBundle 回池
```

**Content 尺寸重算 — RecalculateContentSize(bool resetPos)：**
```
垂直模式：
  content.anchorMin = (0, 1), anchorMax = (1, 1)  // 顶部拉伸
  content.sizeDelta.y = ItemCount × ItemSize.y - _cellSpace.y

水平模式：
  content.anchorMin = (0, 0), anchorMax = (0, 1)  // 左侧拉伸
  content.sizeDelta.x = ItemCount × ItemSize.x - _cellSpace.x

减去一个 _cellSpace 是因为最后一个 Item 后面不需要间距。
resetPos = true 时将 content.anchoredPosition 归零（回到顶部/左侧）。
```

### 4.7 Content 锚点配置

- **Vertical**: anchorMin=(0,1), anchorMax=(1,1) → Content 锚定在视野顶部，宽度跟随父物体，高度由 sizeDelta.y 控制
- **Horizontal**: anchorMin=(0,0), anchorMax=(0,1) → Content 锚定在视野左侧，高度跟随父物体，宽度由 sizeDelta.x 控制

Cell 统一使用 pivot=(0,1), anchor=(0,1)，即左上角定位，确保位置计算的一致性。

### 4.8 泛型与模板方法模式

```
                    UICyclicScrollList<C, D>
                    (abstract partial class)
                    where C : MonoBehaviour
                            │
                            │ 定义算法骨架：
                            │   Update → UpdateDisplay → Add/Remove Head/Tail
                            │   GetViewBundle → ResetCellData (abstract)
                            │   InstantiateCell (virtual)
                            │
                    ┌───────┴───────┐
                    │               │
              ViewListTest      其他业务列表
        <ViewCell, TestData>   <XXCell, XXData>
                    │               │
          只需实现：          只需实现：
          ResetCellData()     ResetCellData()
```

子类的接入成本极低：
1. 定义数据结构（struct/class）
2. 定义 Cell（继承 MonoBehaviour，挂载 UI 组件引用）
3. 继承 `UICyclicScrollList<MyCell, MyData>`，实现 `ResetCellData`
4. Inspector 中配置 `_cellObject`（模板 Cell）、`content`、`_viewRange`、`_cellSpace`、`_ItemCellCount`

## 五、内容介绍

### 5.1 文件结构与职责

- **CyclicScrollView.cs** (~366行): 核心滚动逻辑 — 枚举定义、ViewCellBundle 类、字段声明、Initlize/Refrash、Update 驱动、UpdateDisplay、AddHead/AddTail/RemoveHead/RemoveTail、RefreshAllCellInViewRange、RemoveItemOutOfListRange、位置计算、视野判断
- **CyclicScrollView.Pool.cs** (~115行): 对象池 — IPoolObject 接口、Queue 池、GetViewBundle（创建/复用）、ReleaseViewBundle（回收）、ResetRectTransform、ResetCellData（抽象）、InstantiateCell（虚方法）、ClearPoolItem/ClearAllUiItem
- **CyclicScrollView.DataChange.cs** (~117行): 数据变更 — ElementAtDataChange（单元素刷新）、RefrashViewRangeData（全量刷新 + 越界清理）、RecalculateContentSize（Content 尺寸 + 锚点）
- **ViewCell.cs** (~19行): 具体 Cell — TestData 结构体（Sprite + string）、ViewCell 组件（Image + Text + UpdateDisplay 方法）
- **ViewListTest.cs** (~76行): 测试子类 — Start 中初始化 100 条数据、Q 键批量替换 11111 条、G 键持续添加 300 条/帧、F 键持续删除 300 条/帧、W 键切换到全新 5 条数据列表

### 5.2 关键 API 详解

- **Initlize(ICollection\<D\>, bool)**
  - 参数: datas(数据源引用), resetPos(是否归零滚动位置)
  - 说明: 初始化或完全替换数据源，内部依次调用 RecalculateContentSize → UpdateDisplay → RefrashViewRangeData
  - 调用时机: 首次加载、切换数据源

- **Refrash(bool)**
  - 参数: resetContentPos(是否归零)
  - 说明: 数据量变化后刷新，不替换数据源引用
  - 调用时机: 批量增删后

- **ElementAtDataChange(int)**
  - 参数: index(数据索引，非 Bundle 索引)
  - 说明: 如果该数据对应的 Cell 在视野内，立即刷新其 UI；否则无操作
  - 调用时机: 单条数据内容变化

- **RecalculateContentSize(bool)**
  - 参数: resetPos
  - 说明: 根据当前 Datas.Count 重算 Content 的 sizeDelta
  - 调用时机: 增删数据后，需要更新滚动范围

- **RefrashViewRangeData()**
  - 参数: 无
  - 说明: 遍历所有可见 Bundle 重新绑定数据，清理越界 Bundle
  - 调用时机: 数据内容批量变化

- **ResetCellData(C, D, int)** [抽象方法]
  - 参数: cell, data, dataIndex
  - 说明: 子类必须实现，将数据绑定到 Cell 的 UI 组件
  - 调用时机: 框架内部调用

- **InstantiateCell()** [虚方法]
  - 参数: 无
  - 说明: 默认 `Instantiate(_cellObject, content)`，可重写实现自定义创建（如从 AssetBundle 加载）
  - 调用时机: 池空时创建新 Cell

### 5.3 Inspector 配置项

- **viewDirection** (enum): 滚动方向 — Vertical / Horizontal
- **_cellObject** (C, MonoBehaviour): 模板 Cell 预制体引用，用于 Instantiate
- **content** (RectTransform): ScrollRect 的 Content 节点
- **_viewRange** (RectTransform): 可见区域的 RectTransform（通常是 Viewport）
- **_cellSpace** (Vector2): Cell 间距，x 为水平间距，y 为垂直间距
- **_ItemCellCount** (int): 每个 Bundle 包含的 Cell 数量（网格列数/行数）

### 5.4 使用示例（ViewListTest）

```csharp
public class ViewListTest : UICyclicScrollList<ViewCell, TestData>
{
    // Start 中初始化
    Initlize(datas);  // 传入 TestData[] 或 List<TestData>

    // 运行时单条刷新
    dataList[i] = newData;
    ElementAtDataChange(i);

    // 运行时批量添加
    dataList.Add(newData);
    RecalculateContentSize(false);  // 更新 Content 尺寸，保持当前滚动位置

    // 运行时批量删除
    dataList.RemoveAt(dataList.Count - 1);
    RecalculateContentSize(false);

    // 完全替换数据源
    Initlize(newDataList);

    // 子类唯一必须实现的方法
    protected override void ResetCellData(ViewCell cell, TestData data, int dataIndex)
    {
        cell.gameObject.SetActive(true);
        cell.UpdateDisplay(data.iconSprite, data.name);
    }
}
```

## 六、设计难点与亮点

### 难点

**1. 双端回收的边界索引一致性**

滚动时头尾同时增删 Bundle，索引必须严格连续（不能出现 3→5 跳过 4 的情况）。这里的难点在于位置是浮点数，经过多次加减 ItemSize 后可能产生累积误差，导致 `GetIndex(position)` 反算出的索引与顺序递推的索引不一致。

解决方案：在 AddHead/AddTail 中做双重校验——从当前头/尾 Bundle 的 `index ± 1` 得到期望索引，同时用 `GetIndex(newPos)` 从位置反算索引，两者不一致时 `Debug.LogError` 报警。开发阶段能及时发现问题，而 `RoundToInt` 的使用也最大程度容忍了浮点误差。

```csharp
int caculatedIndex = GetIndex(newHeadBundlePos);  // 位置反算
int index = bundle.index - 1;                      // 顺序递推
if (caculatedIndex != index)
    Debug.LogError($"计算索引:{caculatedIndex},计数索引{index}...");
```

**2. 快速拖拽的跳跃恢复**

用户快速拖拽时，一帧内 Content 可能移动数百像素，所有 Bundle 瞬间超出视野。如果只依赖 AddHead/AddTail 从当前头尾逐个扩展，无法跨越中间的空白区域。

解决方案：RemoveHead + RemoveTail 执行后检测链表是否为空。为空说明发生了跳跃，此时调用 `RefreshAllCellInViewRange()`，根据当前 `content.anchoredPosition` 直接计算视野对应的起止索引，从对象池中取 Bundle 逐个填充，相当于"瞬移"到新位置重建视图。

```csharp
if (viewCellBundles.Count == 0)
{
    RefreshAllCellInViewRange();  // 跳跃恢复：从零重建
}
```

**3. 网格布局下最后一行的不完整处理**

当 `_ItemCellCount = 3`（每行3个）且数据总量为 10 时，最后一个 Bundle 只有 1 个有效 Cell，另外 2 个 Cell 没有数据。如果不处理，这 2 个 Cell 会显示上一次绑定的残留数据。

解决方案：在两个关键路径中处理——
- `GetViewBundle`：遍历 Cell 时，`dataIndex >= Datas.Count` 的 Cell 跳过 `ResetCellData`，保持 `SetActive(false)` 状态
- `RefrashViewRangeData`：检测到 `endIndex >= Datas.Count` 时截断，将多余 Cell 显式 `SetActive(false)`

**4. 数据动态增删时的三步同步**

运行时增删数据需要同时处理三件事，顺序不当会导致闪烁或索引越界：

```
正确顺序：
1. 修改数据源（外部 List 的 Add/Remove）
2. RecalculateContentSize(false)  — 更新 Content 尺寸，ScrollRect 才能正确计算滚动范围
3. 下一帧 UpdateDisplay 自动处理 Bundle 的增删

错误顺序示例：
- 先 RecalculateContentSize 再改数据 → ItemCount 基于旧数据计算，尺寸错误
- 改数据后不调 RecalculateContentSize → Content 尺寸不变，滚动条位置错误，尾部可能无法滚动到
```

**5. RemoveItemOutOfListRange 的边界处理**

数据缩减时（如从 10000 条变为 100 条），视野内可能存在 index > 新 ItemCount-1 的 Bundle。需要从链表尾部逐个检查并回收。这里有一个微妙的点：必须在 RemoveHead/RemoveTail 之后执行，因为 RemoveTail 只检查位置是否超出视野，不检查索引是否越界；而 RemoveItemOutOfListRange 专门处理"位置在视野内但索引已越界"的情况。

---

### 亮点

**1. O(1) 的每帧滚动开销**

无论数据量是 100 还是 100000，每帧只处理视野边缘的 1-2 个 Bundle 增删。核心循环的迭代次数取决于"一帧内新进入/离开视野的 Bundle 数量"，正常滚动速度下为 0-1 次，与数据总量完全无关。

- **RemoveHead/RemoveTail**: O(k)，k=离开视野的 Bundle 数（通常 0-1） — LinkedList 头尾删除 O(1) × k
- **AddHead/AddTail**: O(k)，k=进入视野的 Bundle 数（通常 0-1） — 池 Dequeue O(1) + ResetCellData O(1) × k
- **GetViewBundle** (池非空时): O(_ItemCellCount) — 遍历 Cell 设置位置和数据
- **GetIndex**: O(1) — 简单除法
- **视野判断**: O(1) — 一次加法 + 一次比较

**2. 稳态零 GC 的滚动**

对象池达到高水位后的滚动过程中：
- 零 Instantiate / 零 Destroy → 不触发 Unity 对象管理的 GC
- Vector2 是值类型 → 位置计算不产生堆分配
- LinkedList 的 AddFirst/AddLast/RemoveFirst/RemoveLast 复用已有节点 → 不产生新的 LinkedListNode 分配（注：C# LinkedList 实际会 new node，这是一个可优化点）

避免了 GC Spike 导致的帧率突降，对移动端尤为重要。

**3. 极简的子类接入成本**

模板方法模式将"不变的算法骨架"（滚动、回收、位置计算）封装在基类，"可变的业务逻辑"（数据如何绑定到 UI）留给子类。子类只需：
- 实现 1 个抽象方法 `ResetCellData`
- 可选重写 `InstantiateCell`（自定义创建逻辑，如 AssetBundle 加载）
- 可选重写 `Update`（添加业务逻辑，需调用 `base.Update()`）

无需理解滚动算法细节即可接入。

**4. 视野缓冲区防抖设计**

回收判断预留一个 ItemSize 的缓冲区：

```
视野顶部 ─────────────────── y = 0
                              ↑ 缓冲区（1个 ItemSize 高度）
回收阈值 ─────────────────── y = ItemSize.y
                              ↑ 元素超过此线才回收

视野底部 ─────────────────── y = -viewRange.height
                              ↓ 元素低于此线才回收
```

效果：用户小幅来回滚动时，边缘元素不会被反复回收-创建，减少了不必要的 `ResetCellData` 调用和 `SetActive` 切换，提升视觉流畅度。

**5. partial class 的工程化拆分**

将单个类按职责拆分为三个文件：

- **CyclicScrollView.cs**: 核心滚动算法 — 修改频率低（算法稳定后很少改动）
- **CyclicScrollView.Pool.cs**: 对象池管理 — 修改频率中（可能调整池策略）
- **CyclicScrollView.DataChange.cs**: 数据变更响应 — 修改频率高（业务需求变化时常改动）

相比继承拆分：partial class 共享私有字段，不需要额外的引用传递或 protected 暴露。
相比组合拆分：不需要创建额外的 Manager/Handler 类，不增加对象数量和间接调用。

**6. 双重索引校验的防御性设计**

AddHead/AddTail 中同时用两种方式计算索引：
- 顺序递推：`currentBundle.index ± 1`
- 位置反算：`GetIndex(newPosition)`

两者不一致时输出错误日志。这种设计在开发阶段能及时发现浮点漂移、ItemSize 配置错误、Content 锚点异常等问题，属于"fail-fast"的防御性编程实践。

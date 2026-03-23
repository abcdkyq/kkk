# Unity UI框架 项目文档

## 项目演示视频待后续更新！！！

## 一、开发计划

**阶段1：核心架构设计（UILayer基类、接口定义）✅ 已完成**
- UILayer<TScreen>泛型基类，定义Screen注册/注销/查找/显隐的通用逻辑
- IScreenController/IWindowController/IPanelController三层接口体系，约束所有UI元素的统一行为契约

**阶段2：Panel面板层实现 ✅ 已完成**
- PanelUILayer继承UILayer，实现无状态的直接Show/Hide
- PanelController基类提供Priority属性
- PanelPriorityLayerList通过Dictionary<PanelPriority, Transform>实现四级优先级分层（None/Prioritary/Tutorial/Blocker），面板按优先级自动Reparent到对应父节点

**阶段3：Window窗口层实现 ✅ 已完成**
- WindowUILayer继承UILayer，用Stack<WindowHistoryEntry>管理历史回退，Queue<WindowHistoryEntry>管理排队等待
- ShouldEnqueue方法根据WindowPriority（ForceForeground/Enqueue）和SuppressPrefabProperties决定入队策略
- HideScreen关闭后按Queue>Stack优先级自动显示下一个窗口

**阶段4：弹窗遮罩系统 ✅ 已完成**
- WindowParaLayer作为Popup的独立容器层，IsPopup=true的窗口在注册时自动Reparent到此层
- DarkenBG通过激活半透明Image+SetAsLastSibling实现遮罩
- RefreshDarken在Popup关闭动画结束后遍历containedScreens检查是否还有活跃Popup

**阶段5：动画组件系统 ✅ 已完成**
- AniComponent抽象基类继承MonoBehaviour，定义Animate(Transform, Action)接口
- 内置FadeAni基于CanvasGroup.alpha的Lerp插值实现淡入淡出，支持动画打断
- 扩展ScaleScreenAni和SlideScreenAni基于DOTween实现缩放和滑动动画

**阶段6：事件通信系统 ✅ 已完成**
- 集成Signals轻量级类型安全发布-订阅系统，通过Signals.Get<T>()全局访问，支持0-3个泛型参数
- Controller在Awake/OnDestroy中通过AddListeners/RemoveListeners管理订阅生命周期

**阶段7：UIFrame门面类 ✅ 已完成**
- 统一封装PanelUILayer和WindowUILayer的所有操作
- 监听WindowUILayer的RequestScreenBlock/Unblock事件控制GraphicRaycaster的启禁用
- ShowScreen方法通过注册表自动判断Screen类型并路由到对应Layer

**阶段8：UISettings配置化 ✅ 已完成**
- ScriptableObject驱动，配置UIFrame预制体和Screen预制体列表
- CreateUIInstance()一键实例化并批量注册
- OnValidate自动校验并移除没有IScreenController组件的非法配置项

**阶段9：Editor工具 ✅ 已完成**
- UIFrameworkTools提供菜单工具，一键在Scene或Prefab中创建完整的UIFrame层级结构（Canvas + PanelLayer + WindowLayer + ParaLayer + DarkenBG）

**阶段10：资源异步加载 📝 待补充**
- 可扩展：将UISettings的同步Instantiate替换为Addressables异步加载，支持按需加载Screen预制体，减少初始化内存占用

**阶段11：对象池管理 📝 待补充**
- 可扩展：对高频开关的窗口实现对象池缓存，避免反复Instantiate/Destroy的GC开销

**阶段12：UI适配方案 📝 待补充**
- 可扩展：多分辨率适配、刘海屏安全区域处理、横竖屏切换策略

**阶段13：单元测试 📝 待补充**
- 可扩展：针对WindowUILayer的栈队列逻辑、ShouldEnqueue判断、动画打断等核心模块编写自动化测试

---

## 二、项目背景

在Unity项目开发中，UI系统往往是最复杂且变动最频繁的模块。随着项目规模增长，UI代码容易陷入以下困境：

- UI逻辑和显示高度耦合：界面的业务逻辑（按钮点击处理、数据绑定）直接写在MonoBehaviour中与UI组件引用混在一起，修改界面布局时不得不同时改动业务代码，牵一发而动全身
- 窗口管理混乱：多个弹窗同时弹出时层级覆盖不可控，关闭弹窗后无法自动回到上一个界面，缺乏统一的窗口排队机制导致弹窗互相覆盖或丢失
- 动画过渡各自为政：每个界面自己实现打开/关闭动画，风格不统一，且动画播放期间用户可以点击其他按钮触发不可预期的行为
- 界面间通信依赖直接引用：A界面要通知B界面更新数据，必须持有B的引用，导致界面之间形成蜘蛛网式的依赖关系，新增或删除界面时需要修改大量关联代码
- 缺乏配置化管理：新增界面需要手动写代码注册，容易遗漏，且无法让非程序人员（策划/美术）参与界面配置

本框架旨在提供一套轻量、可扩展的UI管理方案，通过分层架构（Panel层/Window层）、Controller-Properties模式、可插拔动画系统和全局事件总线，系统性地解决上述问题。

---

## 三、需求

### 3.1 功能需求

1. 支持两种UI类型：常驻面板（Panel，如血条、小地图、导航栏）和模态窗口（Window，如设置页、背包、确认弹窗），两者有不同的生命周期管理策略
2. Window层需要完整的生命周期管理：同一时间只显示一个活跃窗口，支持队列排队（后来的窗口等前一个关闭后再显示）和栈回退（关闭当前窗口自动回到上一个），支持高优先级窗口插队
3. 弹窗（Popup）需要独立于普通窗口的层级，自动显示半透明遮罩背景，遮罩在所有Popup关闭后自动隐藏
4. Panel层需要支持多级渲染优先级，不同优先级的面板渲染在不同层级，保证如新手引导面板始终在普通面板之上
5. 统一的动画过渡系统：支持可插拔的自定义动画组件，框架内置淡入淡出，可扩展缩放、滑动等效果
6. 动画过渡期间自动屏蔽用户输入，防止在界面切换动画未完成时触发其他操作
7. 逻辑与显示分离：Controller负责业务逻辑，Properties承载数据，同一个界面预制体可通过不同Properties展示不同内容
8. 界面之间通过全局事件总线通信，发布者和订阅者完全解耦
9. 配置化管理：通过ScriptableObject统一配置和注册所有Screen预制体，支持Inspector拖拽操作，自动校验非法配置

### 3.2 非功能需求

1. 轻量级：框架本身不依赖重量级第三方库（DOTween仅在扩展动画中可选使用），核心代码量小，易于理解和维护
2. 可扩展：动画系统、Properties类型、Controller类型均可通过继承扩展，不需要修改框架源码
3. 低侵入：业务代码只需继承对应的Controller基类并重写生命周期钩子，不需要了解框架内部实现

---

## 四、详细设计

### 4.1 整体架构

框架采用三层架构：

**Layer层（管理层）**
- UILayer<TScreen>：泛型基类，封装Screen的注册、查找、显隐逻辑
- PanelUILayer：管理Panel，无状态直接显隐
- WindowUILayer：管理Window，维护Stack（历史回退）和Queue（排队等待）

**Controller层（逻辑层）**
- IScreenController：所有UI元素的基础接口
- IPanelController：Panel专用接口，定义Priority属性
- IWindowController：Window专用接口，定义IsPopup、WindowPriority等属性
- 具体Controller：继承基类实现业务逻辑

**Properties层（数据层）**
- IScreenProperties：标记接口
- 具体Properties：纯数据类，传递给Controller用于界面初始化

### 4.2 核心类设计

#### 4.2.1 UILayer<TScreen>

泛型基类，TScreen约束为IScreenController。

**核心字段**
```
Dictionary<Type, TScreen> registeredScreens  // 已注册的Screen实例
HashSet<Type> screenTransitionQueue          // 正在播放动画的Screen
```

**核心方法**
- RegisterScreen(TScreen)：注册Screen到字典
- UnregisterScreen<T>()：从字典移除
- GetScreenController<T>()：按类型查找
- ShowScreen<T>(IScreenProperties)：显示Screen，调用Controller.Show()
- HideScreen<T>()：隐藏Screen，调用Controller.Hide()
- IsScreenRegistered<T>()：检查是否已注册

#### 4.2.2 WindowUILayer

继承UILayer<IWindowController>，新增窗口队列和栈管理。

**核心字段**
```
Stack<WindowHistoryEntry> windowHistory      // 历史窗口栈
Queue<WindowHistoryEntry> windowQueue        // 等待队列
IWindowController currentWindow              // 当前活跃窗口
```

**核心方法**
- ShowScreen<T>(IScreenProperties)：重写父类方法
  - 调用ShouldEnqueue判断是否入队
  - 如果入队：加入windowQueue
  - 如果不入队：隐藏currentWindow，显示新窗口，压入windowHistory
- HideScreen<T>()：重写父类方法
  - 隐藏当前窗口
  - 按Queue > Stack优先级显示下一个窗口
- ShouldEnqueue(IWindowController)：判断逻辑
  - 如果没有currentWindow：不入队
  - 如果新窗口WindowPriority == ForceForeground：不入队
  - 如果新窗口SuppressPrefabProperties == true：不入队
  - 否则：入队

#### 4.2.3 PanelPriorityLayerList

管理Panel的四级优先级分层。

**核心字段**
```
Dictionary<PanelPriority, Transform> priorityLayers
```

**核心方法**
- AddScreen(IPanelController)：根据Priority将Panel的Transform.SetParent到对应层级
- RefreshScreenPriority(IPanelController)：优先级变化时重新Reparent

#### 4.2.4 WindowParaLayer

管理Popup窗口的独立容器层。

**核心字段**
```
List<IWindowController> containedScreens  // 当前层内的所有Popup
GameObject darkenBgObject                 // 半透明遮罩
```

**核心方法**
- AddScreen(IWindowController)：将Popup的Transform.SetParent到此层
- RefreshDarken()：检查containedScreens中是否有活跃Popup，有则显示遮罩，无则隐藏

#### 4.2.5 AniComponent

动画组件抽象基类。

**核心方法**
- Animate(Transform, Action)：播放动画，完成后调用回调

**内置实现**
- FadeAni：基于CanvasGroup.alpha的Lerp插值
- ScaleScreenAni：基于DOTween的缩放动画
- SlideScreenAni：基于DOTween的滑动动画

#### 4.2.6 UIFrame

门面类，统一封装所有UI操作。

**核心字段**
```
PanelUILayer panelLayer
WindowUILayer windowLayer
GraphicRaycaster graphicRaycaster
```

**核心方法**
- ShowScreen<T>(IScreenProperties)：自动判断类型路由到对应Layer
- HideScreen<T>()：自动判断类型路由到对应Layer
- RegisterScreen(IScreenController)：自动判断类型路由到对应Layer
- OnScreenBlockRequested/OnScreenUnblockRequested：监听Window层事件，控制GraphicRaycaster启禁用

### 4.3 生命周期流程

#### 4.3.1 Window显示流程

1. 调用UIFrame.ShowScreen<WindowController>(properties)
2. UIFrame路由到WindowUILayer.ShowScreen
3. WindowUILayer调用ShouldEnqueue判断
4. 如果不入队：
   - 隐藏currentWindow（播放关闭动画）
   - 显示新窗口（播放打开动画）
   - 新窗口压入windowHistory
   - 更新currentWindow引用
5. 如果入队：
   - 创建WindowHistoryEntry加入windowQueue
   - 等待当前窗口关闭

#### 4.3.2 Window关闭流程

1. 调用UIFrame.HideScreen<WindowController>()
2. WindowUILayer.HideScreen执行
3. 播放关闭动画
4. 动画完成后检查windowQueue
5. 如果Queue非空：
   - Dequeue取出第一个Entry
   - 显示该窗口
6. 如果Queue为空，检查windowHistory
7. 如果Stack非空：
   - Pop取出上一个Entry
   - 显示该窗口
8. 如果都为空：currentWindow = null

#### 4.3.3 Popup遮罩流程

1. 注册Popup时，WindowParaLayer.AddScreen将其Reparent到ParaLayer
2. Popup显示时，WindowParaLayer.RefreshDarken检查containedScreens
3. 如果有活跃Popup：darkenBgObject.SetActive(true)，SetAsLastSibling确保在所有Popup下方
4. Popup关闭动画结束后，再次调用RefreshDarken
5. 如果没有活跃Popup：darkenBgObject.SetActive(false)

### 4.4 事件通信机制

使用Signals轻量级发布-订阅系统。

**使用方式**
```csharp
// 定义信号
public class PlayerHealthChangedSignal : Signal<int> { }

// 发布
Signals.Get<PlayerHealthChangedSignal>().Dispatch(newHealth);

// 订阅
Signals.Get<PlayerHealthChangedSignal>().AddListener(OnHealthChanged);

// 取消订阅
Signals.Get<PlayerHealthChangedSignal>().RemoveListener(OnHealthChanged);
```

**生命周期管理**
Controller在Awake中调用AddListeners()订阅，在OnDestroy中调用RemoveListeners()取消订阅，避免内存泄漏。

### 4.5 配置化管理

UISettings是ScriptableObject，配置：
- UIFrame预制体引用
- Screen预制体列表（List<GameObject>）

**自动校验**
OnValidate方法自动检查列表中的GameObject是否包含IScreenController组件，不包含则移除。

**一键初始化**
调用UISettings.CreateUIInstance()：
1. 实例化UIFrame预制体
2. 遍历Screen预制体列表，逐个Instantiate
3. 调用UIFrame.RegisterScreen注册所有Screen

---

## 五、核心内容

### 5.1 分层架构

框架将UI分为Panel和Window两层，各自独立管理：
- Panel：常驻面板，无状态，直接显隐，支持四级优先级（None/Prioritary/Tutorial/Blocker）
- Window：模态窗口，有状态，维护历史栈和等待队列，同一时间只有一个活跃窗口

### 5.2 Controller-Properties模式

- Controller：继承MonoBehaviour，负责业务逻辑，生命周期由框架管理
- Properties：纯C#类，负责数据传递，同一个Controller可接收不同Properties展示不同内容

示例：
```csharp
public class ConfirmationPopupProperties : IWindowProperties
{
    public string Title;
    public string Message;
    public Action OnConfirm;
    public Action OnCancel;
}

public class ConfirmationPopupController : WindowController<ConfirmationPopupProperties>
{
    protected override void OnPropertiesSet()
    {
        titleText.text = Properties.Title;
        messageText.text = Properties.Message;
    }
}
```

### 5.3 可插拔动画系统

所有Controller都有InAnimationComponent和OutAnimationComponent字段，可在Inspector中拖拽赋值。框架在Show/Hide时自动调用对应动画组件的Animate方法。

动画播放期间，框架自动禁用GraphicRaycaster，防止用户点击。

### 5.4 窗口队列与栈管理

- Queue：后来的窗口等待当前窗口关闭后再显示
- Stack：记录窗口打开历史，关闭当前窗口后自动回到上一个
- 优先级：Queue > Stack，即优先显示排队的新窗口，队列为空才回退到历史窗口

### 5.5 Popup独立层级

IsPopup=true的窗口自动Reparent到WindowParaLayer，与普通窗口隔离。ParaLayer管理半透明遮罩，在有活跃Popup时显示，所有Popup关闭后隐藏。

---

## 六、难点与亮点

### 6.1 难点

#### 6.1.1 窗口队列与栈的协调

Window层同时维护Queue和Stack，需要精确控制两者的优先级和状态同步：
- 关闭窗口时，先检查Queue是否有等待的窗口，有则显示Queue中的窗口
- Queue为空时，再检查Stack是否有历史窗口，有则Pop并显示
- 显示新窗口时，需要判断是入队还是直接显示，判断逻辑涉及WindowPriority、SuppressPrefabProperties等多个条件

**解决方案**
ShouldEnqueue方法封装判断逻辑，HideScreen方法按Queue > Stack顺序处理，确保状态机正确流转。

#### 6.1.2 动画过渡期间的状态管理

动画播放期间，Screen处于"正在显示"或"正在隐藏"的中间状态，此时：
- 不能再次触发显示/隐藏操作（避免动画打断）
- 需要屏蔽用户输入（避免点击其他按钮）
- Popup遮罩的显隐需要等待动画完成后再判断

**解决方案**
- UILayer维护screenTransitionQueue，记录正在播放动画的Screen
- 动画开始时加入队列，完成后移除
- WindowUILayer在动画开始时触发RequestScreenBlock事件，UIFrame禁用GraphicRaycaster
- 动画完成后触发RequestScreenUnblock事件，UIFrame重新启用GraphicRaycaster
- WindowParaLayer的RefreshDarken在动画完成回调中调用，确保遮罩状态正确

#### 6.1.3 泛型约束与类型转换

UILayer<TScreen>是泛型基类，TScreen约束为IScreenController。PanelUILayer和WindowUILayer分别约束为IPanelController和IWindowController。

问题：
- UIFrame需要统一管理两个Layer，但它们的泛型参数不同
- ShowScreen方法需要根据Controller类型自动路由到对应Layer

**解决方案**
- UIFrame持有PanelUILayer和WindowUILayer的具体类型引用
- ShowScreen方法通过typeof(IPanelController).IsAssignableFrom判断类型
- 使用as转换为对应接口类型后调用

### 6.2 亮点

#### 6.2.1 高度解耦的分层设计

- Layer层只负责管理，不关心具体业务
- Controller层只负责业务逻辑，不关心管理策略
- Properties层只负责数据，完全无状态
- 三层之间通过接口通信，可独立扩展

#### 6.2.2 可插拔的动画系统

动画组件继承AniComponent抽象基类，实现Animate方法即可。框架内置FadeAni，用户可扩展任意动画效果（缩放、滑动、旋转等），无需修改框架代码。

#### 6.2.3 类型安全的事件系统

Signals基于泛型实现，编译期检查类型，避免运行时错误。支持0-3个参数，覆盖大部分使用场景。

#### 6.2.4 配置化与自动校验

UISettings通过OnValidate自动校验配置合法性，避免运行时因配置错误导致崩溃。CreateUIInstance一键初始化，降低使用门槛。

#### 6.2.5 优先级分层渲染

PanelPriorityLayerList通过Dictionary<PanelPriority, Transform>实现四级优先级，Panel自动Reparent到对应层级，无需手动调整Hierarchy顺序。

#### 6.2.6 Popup独立层级与自动遮罩

WindowParaLayer将Popup与普通窗口隔离，自动管理半透明遮罩的显隐，遮罩始终在所有Popup下方，无需手动控制层级。

---

## 七、扩展方向

### 7.1 资源异步加载

当前UISettings使用同步Instantiate，所有Screen预制体在初始化时全部加载到内存。

**扩展方案**
- 将Screen预制体配置改为AssetReference（Addressables）
- ShowScreen时异步加载预制体，加载完成后再显示
- 首次加载后缓存实例，后续直接复用

### 7.2 对象池管理

高频开关的窗口（如确认弹窗、提示框）反复Instantiate/Destroy会产生GC开销。

**扩展方案**
- 为Window层添加对象池
- HideScreen时不Destroy，而是SetActive(false)并放入池中
- ShowScreen时优先从池中取，池中无则Instantiate

### 7.3 UI适配方案

不同分辨率、刘海屏、横竖屏切换需要适配。

**扩展方案**
- 在UIFrame中添加SafeAreaAdapter组件
- 监听Screen.safeArea变化，动态调整RectTransform
- 提供多套Canvas Scaler配置，根据设备类型自动切换

### 7.4 单元测试

核心逻辑（窗口队列、栈管理、ShouldEnqueue判断）需要自动化测试保障。

**扩展方案**
- 使用Unity Test Framework编写PlayMode测试
- Mock IWindowController和IScreenProperties
- 测试ShowScreen/HideScreen的各种组合场景

---

## 八、使用示例

### 8.1 创建Panel

```csharp
public class PlayerPanelController : PanelController
{
    public Text healthText;

    protected override void Awake()
    {
        base.Awake();
        Signals.Get<PlayerHealthChangedSignal>().AddListener(OnHealthChanged);
    }

    protected override void OnDestroy()
    {
        Signals.Get<PlayerHealthChangedSignal>().RemoveListener(OnHealthChanged);
        base.OnDestroy();
    }

    private void OnHealthChanged(int newHealth)
    {
        healthText.text = $"HP: {newHealth}";
    }
}
```

### 8.2 创建Window

```csharp
public class SettingsWindowProperties : IWindowProperties
{
    public float MusicVolume;
    public float SfxVolume;
}

public class SettingsWindowController : WindowController<SettingsWindowProperties>
{
    public Slider musicSlider;
    public Slider sfxSlider;

    protected override void OnPropertiesSet()
    {
        musicSlider.value = Properties.MusicVolume;
        sfxSlider.value = Properties.SfxVolume;
    }

    public void OnConfirmClicked()
    {
        Signals.Get<SettingsChangedSignal>().Dispatch(musicSlider.value, sfxSlider.value);
        UIFrame.Instance.HideScreen<SettingsWindowController>();
    }
}
```

### 8.3 显示窗口

```csharp
var properties = new SettingsWindowProperties
{
    MusicVolume = 0.8f,
    SfxVolume = 0.6f
};
UIFrame.Instance.ShowScreen<SettingsWindowController>(properties);
```

### 8.4 创建Popup

```csharp
public class ConfirmationPopupController : WindowController<ConfirmationPopupProperties>
{
    public Text titleText;
    public Text messageText;

    protected override void OnPropertiesSet()
    {
        titleText.text = Properties.Title;
        messageText.text = Properties.Message;
    }

    public void OnConfirmClicked()
    {
        Properties.OnConfirm?.Invoke();
        UIFrame.Instance.HideScreen<ConfirmationPopupController>();
    }

    public void OnCancelClicked()
    {
        Properties.OnCancel?.Invoke();
        UIFrame.Instance.HideScreen<ConfirmationPopupController>();
    }
}
```

在Inspector中勾选IsPopup，框架自动处理遮罩和层级。

---

## 九、总结

本框架通过分层架构、Controller-Properties模式、可插拔动画系统和全局事件总线，系统性地解决了Unity UI开发中的常见问题：

- 逻辑与显示分离，降低耦合
- 窗口队列与栈管理，规范化窗口生命周期
- Popup独立层级与自动遮罩，简化弹窗管理
- 优先级分层渲染，保证面板层级正确
- 配置化管理，降低使用门槛
- 事件总线通信，解耦界面间依赖

框架设计轻量、可扩展、低侵入，适合中小型Unity项目快速集成。
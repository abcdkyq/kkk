# Unity 资源管理与热更新框架 - 项目文档（函数级工作流版）

## 一、项目介绍
### 1. 项目名称
Unity 资源管理与热更新框架（AssetBundle + AES + Lua）

### 2. 项目目标
本项目要解决的问题是：在不频繁整包发版的前提下，实现资源与 Lua 脚本的线上增量更新，并保证运行时加载性能和内存稳定性。

具体目标：
1. 编辑器侧可配置打包，自动分析依赖并生成运行时清单。
2. 构建“未加密包 -> 加密包 -> 版本文件”的发布链路。
3. 客户端按版本差异增量下载，落盘到持久化目录。
4. 运行时支持加密 AB 解密加载，且避免 LoadFromMemory 大内存峰值。
5. 资源生命周期自动管理（引用计数 + 延迟卸载）。
6. Lua 脚本纳入统一 AB 热更新链路。

### 3. 技术栈与关键词
- Unity / C# / UnityEditor 扩展
- AssetBundle 打包与运行时加载
- XML 序列化配置（BuildSetting.xml）
- 二进制清单（Resource.bytes / Bundle.bytes / Dependency.bytes）
- AES 文件加密解密（AesCryptoServiceProvider）
- 增量更新（ABVersionFile：路径 + MD5 + size）
- 双层架构：Resource 层 + Bundle 层
- 引用计数与延迟回收（Update / LateUpdate）
- xLua + Lua AB 化 + require 加载

---

## 二、目录与产物约定

### 1) 编辑器阶段目录
- 未加密 AB：`AssetBundles/<Platform>/`
- 加密 AB：`AssetBundlesEncrypt/<Platform>/`
- 打包规则：`BuildSetting.xml`

### 2) 客户端运行时目录
- 下载与持久化：`Application.persistentDataPath/AssetBundles/<Platform>/`
- 解密临时文件：`Application.temporaryCachePath/AssetBundleFrameworkLoadFiles/`

### 3) 关键文件
- 版本文件：`ABVersionFile.txt`
- 清单包：`manifest.ab`（内含 `Resource.bytes / Bundle.bytes / Dependency.bytes`）

---

## 三、系统级架构图（逻辑）
1. Editor 打包系统：产出未加密 AB 与清单。
2. 加密系统：对 AB 加密，产出加密 AB 与版本文件。
3. 热更新下载系统：比较版本后增量下载加密 AB 到本地。
4. 运行时加载系统：读取加密 AB -> 解密 -> 临时文件 -> LoadFromFile。
5. Lua 子系统：从 AB 中读取 Lua 文本资源并 require。

---

## 四、子系统与函数级工作流

## 4.1 编辑器打包子系统（AssetBundleFramework/Editor）

### A. 关键类与职责

#### 1) `Builder`
核心入口与总流程控制。

关键函数：
- `BuildWindows()`：菜单入口（Tools/AB包更新）。
- `Build()`：完整打包主流程。
- `SwitchPlatform()`：切换目标平台。
- `LoadSetting()`：读取并初始化 `BuildSetting.xml`。
- `Collect()`：收集资源、依赖、Bundle 映射并生成清单数据。
- `CollectDependency()`：递归依赖分析。
- `CollectBundle()`：根据规则计算 bundleName。
- `GenerateManifest()`：生成三份二进制清单（Resource/Bundle/Dependency）。
- `BuildBundle()`：调用 `BuildPipeline.BuildAssetBundles`。
- `ClearAssetBundle()`：删除无效旧 AB（并行删除）。
- `BuildManifest()`：把三份 `.bytes` 再打成 `manifest.ab`。

#### 2) `BuildSetting`
打包规则容器与规则匹配器。

关键函数：
- `EndInit()`：规范化路径、解析后缀、构建规则字典。
- `Collect()`：按规则收集直接资源文件。
- `GetBuildItem()`：按“最长前缀匹配”找到资源归属规则。
- `GetBundleName()`：根据 `BundleType` 或自定义 `BundleName` 生成包名。

#### 3) `BuildItem`
单条规则的数据结构。

关键字段：
- `assetPath`：规则路径。
- `resourceType`：Direct / Dependency。
- `bundleType`：File / Directory / All。
- `bundleName`：自定义包名（支持 Lua 合包，如 `lua.ab`）。
- `suffix`：后缀过滤。

#### 4) `XmlUtility`
XML 读写工具，负责配置序列化/反序列化。

### B. 打包主流程（按函数调用顺序）

1. 菜单点击触发 `Builder.BuildWindows()`。
2. `Build()` 开始：
   - `SwitchPlatform()`
   - `LoadSetting(BuildSetting.xml)`
3. `Collect()`：
   - `buildSetting.Collect()` 拿 Direct 文件集合。
   - `CollectDependency(files)` 递归拿依赖集合。
   - 合并 Direct + Dependency 类型标记。
   - `CollectBundle(...)` 生成 `bundleDic`（bundleName -> asset列表）。
   - `GenerateManifest(...)` 生成 `Resource.bytes / Bundle.bytes / Dependency.bytes`。
4. `BuildBundle(bundleDic)` 打包 AB 到 `AssetBundles/<Platform>/`。
5. `ClearAssetBundle()` 清理过时 AB。
6. `BuildManifest()` 把 3 份 `.bytes` 打成 `manifest.ab` 并拷贝到输出目录。

### C. 二进制清单在运行时的作用
- `Resource.bytes`：资源 ID 与 URL 映射。
- `Bundle.bytes`：资源 URL -> Bundle URL 映射来源。
- `Dependency.bytes`：资源依赖 URL 列表。

运行时 `ResourceManager.Initialize()` 会读取这三份二进制文件建立字典。

---

## 4.2 加密与版本生成子系统（Editor/ABPackMenu）

### A. 关键类与函数

#### 1) `ABPackMenu`
菜单入口与加密发布流程。

关键函数：
- `EncryptAB_Windows()` / `EncryptAB_Android()` / `EncryptAB_iOS()`：平台入口。
- `EncryptAndCreateVersionFile(buildTarget)`：核心流程。
- `GetRawOutputPath()`：未加密 AB 路径。
- `GetEncryptOutputPath()`：加密 AB 输出路径。
- `GetPlatformFolderName()`：统一平台目录命名。
- `GetRelativePath()`：版本文件用相对路径。
- `RecreateDirectory()`：重建输出目录。

#### 2) `AESEncryptMgr`
AES 加解密实现。

关键函数：
- `AESEncryptFile(src, dst)`：文件加密。
- `AESDecryptFileToStream(path)`：运行时解密为字节数组。
- `CreateAES_CSP(key, iv)`：创建 AES 参数对象。

#### 3) `MD5Mgr` / `ABPackUtils`
生成版本行、计算哈希、维护后缀与平台路径规则。

### B. 加密发布流程（函数级）

1. 读取 `AssetBundles/<Platform>/` 目录。
2. 遍历全部文件：
   - 后缀是 `.ab` -> `AESEncryptMgr.AESEncryptFile()`
   - 其他文件直接拷贝
3. 对每个目标文件计算 MD5 与大小。
4. 使用 `ABPackUtils.GetABPackVersionStr()` 拼装版本行。
5. 输出 `ABVersionFile.txt` 到 `AssetBundlesEncrypt/<Platform>/`。

---

## 4.3 客户端热更新下载子系统（HotUpdate + ABDownloader）

### A. 关键类与职责

#### 1) `HotUpdateMgr`
热更新总调度器（单例）。

关键函数：
- `Awake()`：初始化本地版本文件路径。
- `StartHotUpdate()`：启动热更协程。
- `DownloadAllABPackVersion()`：下载服务端版本文件。
- `ConvertToAllABPackDesc()`：版本文件文本解析。
- `CheckNeedDownloadABPack()`：与本地版本比较，筛选差异包。
- `StartDownloadAllABPack()`：创建下载器并发下载。
- `ChangeDownloadNextABPack()`：下载器轮转与完成判定。
- `UpdateClientABInfo()`：更新本地版本缓存字典。
- `SaveVersionFile()`：全部完成后写回本地版本文件。
- `HotUpdateEnd()`：热更完成回调 `Test_Callback.OnHotUpdateFinished()`。

#### 2) `ABDownloader`
单下载器执行器。

关键函数：
- `DownloadABPack(ABPackInfo)`：下载单个 AB，写入本地。
- `GetDownloadResSize()`：返回当前包大小供进度统计。

### B. 热更新流程（函数级）

1. `Test_Callback.Start()` 调用 `HotUpdateMgr.StartHotUpdate()`。
2. `DownloadAllABPackVersion()` 下载服务器版本文本。
3. `ConvertToAllABPackDesc()` 解析成 `{abPath -> ABPackInfo}`。
4. `CheckNeedDownloadABPack()`：
   - 若本地版本存在：逐项对比 MD5，差异入队。
   - 若本地版本不存在：全量入队。
5. `StartDownloadAllABPack()`：按 `nMaxDownloader` 并发启动。
6. 每个下载器执行 `ABDownloader.DownloadABPack()`：
   - 下载成功后写到 `persistentDataPath/AssetBundles/...`
   - 回调 `HotUpdateMgr.UpdateClientABInfo()`
   - 再回调 `ChangeDownloadNextABPack()` 继续下一包
7. 全部下载完成后 `SaveVersionFile()` 落盘本地版本。
8. `HotUpdateEnd()` 进入资源系统初始化。

### C. 错误处理
- 网络错误使用 `UnityWebRequest.result` 判定（兼容旧版本宏）。
- 下载器错误后会继续推进队列，避免全局阻塞。

---

## 4.4 运行时资源加载子系统（Resource 层 + Bundle 层）

### A. 核心类关系

#### Resource 层
- `ResourceManager`：资源总入口与生命周期调度。
- `AResource`：资源基类（引用计数、依赖、回调）。
- `Resource`：同步资源实现。
- `ResourceAsync`：异步资源实现。

#### Bundle 层
- `BundleManager`：AB 总入口与生命周期调度。
- `ABundle`：AB 基类（引用计数、依赖、loadFile）。
- `Bundle`：同步 AB 实现。
- `BundleAsync`：异步 AB 实现。

### B. 初始化流程（函数级）

入口：`Test_Callback.OnHotUpdateFinished()` -> `ResourceManager.Initialize(...)`

`ResourceManager.Initialize()` 做了两件事：
1. 调 `BundleManager.Initialize(...)` 读取平台 Manifest（AB 依赖图）。
2. 读取 `manifest.ab` 中三份二进制清单，构建：
   - `ResourceBundleDic`（资源 -> bundle）
   - `ResourceDependenciesDic`（资源 -> 依赖资源列表）

`BundleManager.Initialize()` 关键点：
- `ResolveLoadFile()` 支持“解密字节 -> 临时文件”模式。
- 加载平台同名 manifest bundle，拿到 `AssetBundleManifest`。
- 使用 `Unload(false)` 保留 manifest 对象可用于后续依赖查询。

### C. 同步加载流程（Resource.Load）

1. 业务层调用 `ResourceManager.Load(url, false)`。
2. `LoadInternal()`：
   - 先查 `m_ResourceDic` 缓存。
   - 若不存在，先按 `ResourceDependenciesDic` 递归加载依赖资源。
   - 创建 `Resource` 并执行 `Resource.Load()`。
3. `Resource.Load()`：
   - 通过 `ResourceBundleDic[url]` 找到 `bundleUrl`。
   - 调 `BundleManager.Load(bundleUrl)`。
4. `BundleManager.LoadInternal()`：
   - 若 AB 缓存存在，引用 +1 返回。
   - 否则先递归加载 AB 依赖（`AssetBundleManifest.GetDirectDependencies`）。
   - 创建 `Bundle` 并执行 `Bundle.Load()`。
5. `Bundle.Load()`：
   - `GetFileUrl(url)` 得到源路径（persistentDataPath）。
   - `ResolveLoadFile(source)`：
     - 有解密回调则写临时文件到 `temporaryCachePath`
     - 否则直接用源文件
   - `AssetBundle.LoadFromFile(loadFile)` 完成 AB 加载。
6. 回到 `Resource.LoadAsset()` 执行 `bundle.LoadAsset(url)` 获取资源。

### D. 异步加载流程（ResourceAsync / BundleAsync）

1. `ResourceManager.LoadWithCallback(url, true, cb)`。
2. `LoadInternal()` 创建 `ResourceAsync`，加入 `m_AsyncList`。
3. `ResourceAsync.Load()` 调 `BundleManager.LoadAsync(bundleUrl)`。
4. `BundleAsync.Load()` 启动 `AssetBundle.LoadFromFileAsync`。
5. 每帧 `ResourceManager.Update()`：
   - 先 `BundleManager.Update()` 更新 AB 异步状态。
   - 再更新资源 `m_AsyncList`。
6. `ResourceAsync.Update()` 在依赖和 AB 就绪后执行 `LoadAssetAsync()`。
7. 资源完成后触发 `finishedCallback`。

### E. 卸载流程（引用计数 + 延迟回收）

1. 业务层 `ResourceManager.UnLoad(resource)`：引用 -1。
2. 若引用为 0，加入 `m_NeedUnloadList`（不立刻销毁）。
3. 每帧 `ResourceManager.LateUpdate()`：
   - 批量 `resource.UnLoad()`。
   - 递减其依赖资源引用。
4. `BundleManager.LateUpdate()` 同步处理 AB 卸载队列。
5. `Bundle.UnLoad()/BundleAsync.UnLoad()` 会调用 `ReleaseLoadFile(loadFile)` 删除临时文件。

### F. 解密临时文件链路（本项目重点）

回调来源：`Test_Callback.GetLoadBytes(sourceFile)`。

流程：
1. 读取 `persistentDataPath` 下加密 AB。
2. `AESEncryptMgr.AESDecryptFileToStream(sourceFile)` 返回明文字节。
3. `BundleManager.ResolveLoadFile()` 写入 `temporaryCachePath/AssetBundleFrameworkLoadFiles/`。
4. `LoadFromFile(tempFile)` 加载。
5. AB 卸载时 `ReleaseLoadFile(tempFile)` 删除临时文件。

该方案优点：
- 安全：磁盘常驻的是加密文件。
- 内存友好：避免 `LoadFromMemory` 直接占用大块内存。

---

## 4.5 Lua 子系统工作流（xLua + AB）

### A. 关键类
`LuaInterpreter`

关键函数：
- `Awake()`：创建 `LuaEnv`，注册 `CustomLuaLoader`，重定向 `print`。
- `RequireLua(name)`：触发 Lua 脚本执行。
- `InitializeLuaCache()`：从 `ResourceManager.ResourceBundleDic` 扫描 Lua 资源并缓存字节。
- `CustomLuaLoader(ref path)`：按模块路径返回 Lua 字节。
- `SetOutputText(Text)` + `OnLuaPrintFromLua()`：将 Lua print 输出到 UI Text。
- `ReleaseLuaCache()`：退出时释放 Lua 资源引用。

### B. 打包到加载的全流程
1. `BuildSetting.xml` 定义 Lua 规则：`Assets/Scripts/Lua/` + `Suffix=.lua.txt` + `BundleName=lua.ab`。
2. 打包阶段 Lua 作为资源进入 AB。
3. 热更新阶段 Lua AB 与普通资源 AB 一起比较、下载、落盘。
4. 运行时 `RequireLua("HelloWorld")`：
   - 若缓存未初始化，先 `InitializeLuaCache()` 从资源系统加载 Lua 文本。
   - `CustomLuaLoader` 返回对应模块字节。
   - Lua 执行，并将 `print` 输出同步到 UI（如已绑定 Text）。

---

## 五、启动到显示 UI 的完整调用链（当前测试场景）

1. `Test_Callback.Start()`
   - 调 `HotUpdateMgr.StartHotUpdate()`。

2. 热更新完成 `HotUpdateMgr.HotUpdateEnd()`
   - 调 `Test_Callback.OnHotUpdateFinished()`。

3. `Test_Callback.OnHotUpdateFinished()`
   - 计算平台目录路径。
   - 调 `ResourceManager.Initialize(platform, GetFileUrl, ..., GetLoadBytes)`。
   - 调 `InitializeScene()`。

4. `InitializeScene()`
   - 异步加载 `UIRoot.prefab`。
   - 加载 `TestUI.prefab` 并实例化。
   - 执行 `RunLua()`。

5. `RunLua()`
   - `LuaInterpreter.RequireLua("HelloWorld")`
   - `LuaInterpreter.RequireLua("Test")`

6. 每帧驱动
   - `Test_Callback.Update()` -> `ResourceManager.Update()`
   - `Test_Callback.LateUpdate()` -> `ResourceManager.LateUpdate()`

---

## 六、核心数据与配置说明

### 1) `BuildSetting.xml`
定义打包范围、后缀过滤、粒度策略、自定义包名（如 Lua 合包）。

### 2) `ABVersionFile.txt`
每行：
```
<ab相对路径> <md5> <size_kb>
```
用于客户端差异比对。

### 3) 三份运行时清单
- `Resource.bytes`：资源 URL 索引
- `Bundle.bytes`：资源 URL -> Bundle URL
- `Dependency.bytes`：资源依赖图

---

## 七、项目关键难点与对应实现

### 难点 1：加密 AB 与运行时加载方式冲突
- 问题：加密文件不能直接 `LoadFromFile`。
- 方案：通过 `getLoadBytesCallback` 解密后写临时文件，再 `LoadFromFile`。

### 难点 2：避免 LoadFromMemory 内存峰值
- 问题：大包解密后直接内存加载，峰值明显。
- 方案：临时文件中转 + AB 卸载时自动删临时文件。

### 难点 3：资源与 AB 依赖管理复杂
- 问题：单层管理易出现依赖遗漏或过度卸载。
- 方案：Resource/Bundle 双层管理，分别维护引用计数与依赖关系。

### 难点 4：同帧装卸导致抖动
- 问题：立刻卸载会造成重复加载和抖动。
- 方案：引用归零入队，LateUpdate 统一回收。

### 难点 5：路径规范不一致导致映射失效
- 问题：业务路径与打包路径前缀不一致时，`bundleUrl` 查不到。
- 方案：统一使用 `Assets/Resources/...` 作为资源 URL 规范。

### 难点 6：Manifest 生命周期管理
- 问题：初始化后若错误释放 Manifest，会导致依赖查询异常。
- 方案：保留 `AssetBundleManifest` 对象生命周期供依赖查询使用。

---

## 八、可复用价值
1. 该框架可直接迁移到其他 Unity 项目作为热更新底座。
2. 配置驱动 + 双层管理使后续资源迭代成本显著下降。
3. 在安全（加密存储）与性能（LoadFromFile + 引用计数）之间取得平衡。
4. 对后续扩展（断点续传、CDN、灰度更新）具备良好兼容性。

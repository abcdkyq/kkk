export const siteConfig = {
  name: "孔榆乔",
  nameEn: "KKK6.",
  title: "Unity 游戏开发",
  titleEn: "Unity Game Developer",
  description:
    "热爱游戏开发，专注于 Unity 引擎，擅长游戏玩法设计与实现。希望通过技术与创意，打造有趣的互动体验。",
  email: "kkk61025@163.com",
  github: "https://github.com/abcdkyq",
  bilibili: "https://space.bilibili.com/",
  location: "中国",
  education: {
    school: "豫章师范学院",
    major: "软件工程",
    degree: "本科",
    period: "2023 - 2027",
  },
};

export interface Project {
  title: string;
  titleEn: string;
  slug: string;
  description: string;
  bvid: string;
  tags: string[];
  role: string;
  highlights: string[];
}

export const projects: Project[] = [
  {
    title: "竞速回廊",
    titleEn: "3D jshl",
    slug: "3d-jshl",
    description:
      "一款基于Unity开发的无尽赛车跑酷游戏，玩家驾驶汽车在程序化生成的圆柱形赛道内壁飞驰，躲避障碍物并穿越得分门来获取分数，赛道通过柏林噪声实时生成，带来独特的视觉与驾驶体验。",
    bvid: "BV1hiP9zAEFe",
    tags: ["Unity", "C#", "3D", "程序化地形生成"],
    role: "独立开发",
    highlights: [
      "通过手动构建网格与柏林噪声，实时生成无限延伸的圆柱形管道赛道，地块无缝衔接",
      "采用世界移动、玩家静止的设计模式，避免浮点精度漂移，地块高效循环复用",
      "基于WheelCollider实现车辆物理模拟，支持粒子特效、刹车痕迹与碰撞效果",
    ],
  },
  {
    title: "灵境奇途",
    titleEn: "3D ARPG",
    slug: "3D-ARPG",
    description:
      "一款基于Unity 引擎开发的 3D 动作平台跳跃游戏，采用泛型 FSM 状态机架构驱动多种玩家动作状态，实现了物理驱动的角色控制、敌人 AI、关卡交互机制及三层数据持久化系统，支持手柄与键鼠跨平台输入。",
    bvid: "BV1xxxxxxxxx2",
    tags: ["Unity", "C#", "3D", "FSM有限状态机"],
    role: "独立开发",
    highlights: [
      "泛型状态机框架，编译期类型安全，新增状态零侵入扩展",
      "向量投影分解加速模型，转向惯性平滑衰减，手感丝滑自然",
      "全链路Physics.NonAlloc碰撞检测，运行时零 GC，移动端稳定流畅",
    ],
  },
  {
    title: "AssetBundle资源框架",
    titleEn: "Unity AssetBundle Framework",
    slug: "assetbundle-framework",
    description:
      "独立实现 Unity AssetBundle 资源打包与动态加载框架，包含编辑器打包工具与运行时加载系统：支持 XML 规则配置、多粒度打包、自动依赖分析、同步/异步加载、双层引用计数与延迟卸载，适用于热更新资源管理。",
    bvid: "BV1xxxxxxxxx3",
    tags: ["Unity", "C#", "AssetBundle", "Editor"],
    role: "独立开发",
    highlights: [
      "XML 配置驱动打包规则：File/Directory/All 多粒度策略",
      "递归依赖分析 + 清单/映射表（二进制）生成，减少配置体积",
      "Resource 层 + Bundle 层双层架构，双层引用计数 + LateUpdate 延迟卸载",
    ],
  },
  {
    title: "UIFramework 框架",
    titleEn: "UIFramework",
    slug: "ui-framework",
    description:
      "基于 Unity 的通用 UI 框架，支持界面栈管理、层级控制、生命周期回调和资源自动加载，适用于中大型项目的 UI 架构。",
    bvid: "BV1xxxxxxxxx4",
    tags: ["Unity", "C#", "UI", "层级控制"],
    role: "独立开发",
    highlights: [
      "界面栈管理与层级控制",
      "生命周期回调机制",
      "资源自动加载与缓存",
    ],
  },
  {
    title: "UI 滚动列表",
    titleEn: "UI Scroll List",
    slug: "ui-scroll-list",
    description:
      "高性能 UI 滚动列表组件，支持无限滚动、对象池复用和动态数据绑定，解决大量数据下的性能问题。",
    bvid: "BV1xxxxxxxxx5",
    tags: ["Unity", "C#", "UI", "对象池复用"],
    role: "独立开发",
    highlights: [
      "对象池复用机制",
      "无限滚动与动态加载",
      "高性能数据绑定",
    ],
  },
];

export interface SkillCategory {
  name: string;
  nameEn: string;
  icon: string;
  skills: string[];
}

export const skillCategories: SkillCategory[] = [
  {
    name: "游戏引擎",
    nameEn: "Game Engine",
    icon: "Gamepad2",
    skills: ["Unity", "Unity Editor 扩展", "UnityGUI", "Shader Graph"],
  },
  {
    name: "编程语言",
    nameEn: "Programming",
    icon: "Code",
    skills: ["C#", "HLSL / Shader", "C++"],
  },
  {
    name: "工具与流程",
    nameEn: "Tools & Pipeline",
    icon: "Wrench",
    skills: ["Git", "Rider/VS2022", "Sourcetree"],
  },
  {
    name: "其他能力",
    nameEn: "Soft Skills",
    icon: "Users",
    skills: ["团队协作", "技术文档撰写", "快速学习", "问题排查"],
  },
];

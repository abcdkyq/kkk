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
    title: "多人在线射击原型",
    titleEn: "Multiplayer Shooter Prototype",
    slug: "multiplayer-shooter",
    description:
      "基于 Unity Netcode 的多人在线射击游戏原型，实现了网络同步、射击判定和基础的匹配系统。",
    bvid: "BV1xxxxxxxxx3",
    tags: ["Unity", "C#", "Netcode", "Multiplayer"],
    role: "主程序",
    highlights: [
      "客户端预测与服务器校验",
      "射线检测射击系统",
      "简易房间匹配逻辑",
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

export const siteConfig = {
  name: "孔榆乔",
  nameEn: "KKKYQ",
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
      "一款基于 Unity 开发的 3D 平台跳跃游戏，包含多个关卡、角色控制系统和动态相机系统。实现了流畅的角色移动手感和丰富的关卡机关。",
    bvid: "BV1hiP9zAEFe",
    tags: ["Unity", "C#", "3D", "Physics"],
    role: "独立开发",
    highlights: [
      "自定义角色控制器，支持跳跃、冲刺、攀爬",
      "程序化关卡生成系统",
      "基于状态机的 AI 敌人行为",
    ],
  },
  {
    title: "2D 像素风 RPG",
    titleEn: "2D Pixel RPG",
    slug: "2d-pixel-rpg",
    description:
      "像素风格的 2D 角色扮演游戏，包含对话系统、背包系统和回合制战斗。注重叙事体验和像素美术表现。",
    bvid: "BV1xxxxxxxxx2",
    tags: ["Unity", "C#", "2D", "UI Toolkit"],
    role: "独立开发",
    highlights: [
      "可扩展的对话系统与分支剧情",
      "背包与装备系统",
      "回合制战斗与技能树",
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
    skills: ["Unity", "Unity Editor 扩展", "Unity UI Toolkit", "Shader Graph"],
  },
  {
    name: "编程语言",
    nameEn: "Programming",
    icon: "Code",
    skills: ["C#", "HLSL / Shader", "Lua", "TypeScript"],
  },
  {
    name: "工具与流程",
    nameEn: "Tools & Pipeline",
    icon: "Wrench",
    skills: ["Git", "Blender (基础)", "Photoshop", "Notion"],
  },
  {
    name: "其他能力",
    nameEn: "Soft Skills",
    icon: "Users",
    skills: ["团队协作", "技术文档撰写", "快速学习", "问题排查"],
  },
];

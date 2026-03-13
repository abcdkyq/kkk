import { GraduationCap, MapPin } from "lucide-react";
import SectionWrapper from "@/components/SectionWrapper";
import { siteConfig } from "@/lib/constants";

export default function About() {
  const { education } = siteConfig;

  return (
    <SectionWrapper id="about">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-2 text-2xl font-bold tracking-tight">关于我</h2>
        <p className="mb-5 text-sm text-muted-foreground md:mb-8">About Me</p>

        <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
          <p>
            我是一名热爱游戏开发的在校学生，专注于 Unity
            引擎的学习与实践。从最初对游戏的好奇，到现在能够独立完成完整的游戏原型，这段旅程让我对交互设计和实时渲染有了深入的理解。
          </p>
          <p>
            我相信好的游戏体验来自于对细节的打磨。无论是角色手感的调优、UI
            的交互反馈，还是性能的优化，我都愿意花时间去打磨到满意为止。
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3 text-sm sm:gap-6">
          <div className="flex items-start gap-2 text-muted-foreground">
            <GraduationCap size={16} className="mt-0.5 shrink-0" />
            <span>
              {education.school} · {education.major} · {education.period}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin size={16} />
            <span>{siteConfig.location}</span>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}

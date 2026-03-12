import { Gamepad2, Code, Wrench, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SkillCategory as SkillCategoryType } from "@/lib/constants";

const iconMap: Record<string, React.ReactNode> = {
  Gamepad2: <Gamepad2 size={18} />,
  Code: <Code size={18} />,
  Wrench: <Wrench size={18} />,
  Users: <Users size={18} />,
};

interface SkillCategoryProps {
  category: SkillCategoryType;
}

export default function SkillCategory({ category }: SkillCategoryProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-foreground">
        {iconMap[category.icon]}
        <h3 className="text-sm font-semibold">{category.name}</h3>
        <span className="text-xs text-muted-foreground">
          {category.nameEn}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {category.skills.map((skill) => (
          <Badge
            key={skill}
            variant="secondary"
            className="text-xs font-normal"
          >
            {skill}
          </Badge>
        ))}
      </div>
    </div>
  );
}

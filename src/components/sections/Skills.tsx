"use client";

import { motion } from "framer-motion";
import SectionWrapper from "@/components/SectionWrapper";
import SkillCategory from "@/components/SkillCategory";
import { skillCategories } from "@/lib/constants";
import { staggerContainer, fadeInUp } from "@/lib/animations";

export default function Skills() {
  return (
    <SectionWrapper id="skills">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-2 text-2xl font-bold tracking-tight">技能</h2>
        <p className="mb-10 text-sm text-muted-foreground">Skills</p>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-80px" }}
          className="grid gap-8 sm:grid-cols-2"
        >
          {skillCategories.map((cat) => (
            <motion.div key={cat.name} variants={fadeInUp}>
              <SkillCategory category={cat} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </SectionWrapper>
  );
}

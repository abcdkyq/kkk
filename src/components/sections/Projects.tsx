"use client";

import { motion } from "framer-motion";
import SectionWrapper from "@/components/SectionWrapper";
import ProjectCard from "@/components/ProjectCard";
import { projects } from "@/lib/constants";
import { staggerContainer, fadeInUp } from "@/lib/animations";

export default function Projects() {
  return (
    <SectionWrapper id="projects" className="bg-accent/30">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-2 text-2xl font-bold tracking-tight">作品展示</h2>
        <p className="mb-6 text-sm text-muted-foreground md:mb-10">Projects</p>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-80px" }}
          className="grid gap-6 sm:grid-cols-2"
        >
          {projects.map((project) => (
            <motion.div key={project.bvid} variants={fadeInUp}>
              <ProjectCard project={project} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </SectionWrapper>
  );
}

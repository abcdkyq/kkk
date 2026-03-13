"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BilibiliEmbed from "@/components/BilibiliEmbed";
import type { Project } from "@/lib/constants";

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      className="group"
    >
      <Card className="overflow-hidden border-border/60 bg-card">
        <BilibiliEmbed bvid={project.bvid} title={project.title} />
        <CardContent className="space-y-3 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 text-lg font-semibold">{project.title}</h3>
            <span className="shrink-0 text-xs text-muted-foreground">
              {project.role}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {project.description}
          </p>
          <ul className="space-y-1">
            {project.highlights.map((h) => (
              <li
                key={h}
                className="text-xs leading-relaxed text-muted-foreground before:mr-2 before:content-['·']"
              >
                {h}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {project.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs font-normal"
              >
                {tag}
              </Badge>
            ))}
          </div>
          <Link
            href={`/projects/${project.slug}`}
            className="inline-flex items-center gap-1 py-2 text-xs font-medium text-primary transition-colors hover:text-primary/80"
          >
            查看详情
            <ArrowRight size={12} />
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}

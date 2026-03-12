"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, List } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import BilibiliEmbed from "@/components/BilibiliEmbed";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import type { Project } from "@/lib/constants";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

function extractToc(markdown: string): TocItem[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const items: TocItem[] = [];
  let match;
  while ((match = headingRegex.exec(markdown)) !== null) {
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fff]+/g, "-")
      .replace(/^-|-$/g, "");
    items.push({ id, text, level: match[1].length });
  }
  return items;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff]+/g, "-")
    .replace(/^-|-$/g, "");
}

interface ProjectDetailProps {
  project: Project;
  markdown: string;
}

export default function ProjectDetail({
  project,
  markdown,
}: ProjectDetailProps) {
  const toc = useMemo(() => extractToc(markdown), [markdown]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-8"
        >
          {/* Back link */}
          <motion.div variants={fadeInUp}>
            <Link
              href="/#projects"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft size={14} />
              返回作品列表
            </Link>
          </motion.div>

          {/* Header */}
          <motion.div variants={fadeInUp} className="space-y-3">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {project.title}
              </h1>
              <span className="text-sm text-muted-foreground">
                {project.role}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {project.titleEn}
            </p>
            <div className="flex flex-wrap gap-1.5">
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
          </motion.div>

          {/* Video */}
          <motion.div variants={fadeInUp}>
            <BilibiliEmbed bvid={project.bvid} title={project.title} />
          </motion.div>

          {/* Table of Contents */}
          {toc.length > 0 && (
            <motion.nav
              variants={fadeInUp}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <List size={14} />
                目录
              </div>
              <ul className="space-y-1.5">
                {toc.map((item) => (
                  <li
                    key={item.id}
                    style={{ paddingLeft: `${(item.level - 2) * 16}px` }}
                  >
                    <a
                      href={`#${item.id}`}
                      className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {item.text}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.nav>
          )}

          {/* Markdown content */}
          <motion.article
            variants={fadeInUp}
            className="prose max-w-none"
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h2: ({ children, ...props }) => {
                  const text = typeof children === "string" ? children : String(children);
                  const id = slugify(text);
                  return <h2 id={id} {...props}>{children}</h2>;
                },
                h3: ({ children, ...props }) => {
                  const text = typeof children === "string" ? children : String(children);
                  const id = slugify(text);
                  return <h3 id={id} {...props}>{children}</h3>;
                },
                img: ({ src, alt, ...props }) => {
                  const srcStr = typeof src === "string" ? src : "";
                  if (!srcStr || srcStr.startsWith("D:") || srcStr.startsWith("C:") || srcStr.startsWith("\\")) {
                    return alt ? <span className="text-xs text-muted-foreground italic">[图片: {alt}]</span> : null;
                  }
                  return <img src={srcStr} alt={alt || ""} {...props} />;
                },
              }}
            >
              {markdown}
            </ReactMarkdown>
          </motion.article>
        </motion.div>
      </div>
    </div>
  );
}

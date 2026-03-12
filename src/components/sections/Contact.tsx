"use client";

import { Mail, Github, ExternalLink } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import SectionWrapper from "@/components/SectionWrapper";
import { siteConfig } from "@/lib/constants";

export default function Contact() {
  return (
    <SectionWrapper id="contact">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="mb-2 text-2xl font-bold tracking-tight">联系方式</h2>
        <p className="mb-4 text-sm text-muted-foreground">Contact</p>
        <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
          如果你对我的作品感兴趣，或者有实习机会，欢迎联系我。
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href={`mailto:${siteConfig.email}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-2"
            )}
          >
            <Mail size={14} />
            邮箱
          </a>
          <a
            href={siteConfig.github}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-2"
            )}
          >
            <Github size={14} />
            GitHub
          </a>
          <a
            href={siteConfig.bilibili}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-2"
            )}
          >
            <ExternalLink size={14} />
            Bilibili
          </a>
        </div>
      </div>
    </SectionWrapper>
  );
}

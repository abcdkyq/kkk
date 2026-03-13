"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { siteConfig } from "@/lib/constants";
import { fadeInUp, staggerContainer } from "@/lib/animations";

export default function Hero() {
  return (
    <section className="relative flex min-h-dvh flex-col items-center justify-center px-6">
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="max-w-2xl text-center"
      >
        <motion.p
          variants={fadeInUp}
          className="mb-3 text-sm tracking-widest text-muted-foreground"
        >
          {siteConfig.titleEn}
        </motion.p>
        <motion.h1
          variants={fadeInUp}
          className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
        >
          {siteConfig.name}
        </motion.h1>
        <motion.p
          variants={fadeInUp}
          className="mb-8 text-base leading-relaxed text-muted-foreground md:text-lg"
        >
          {siteConfig.description}
        </motion.p>
        <motion.a
          variants={fadeInUp}
          href="#projects"
          className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm transition-colors hover:bg-accent"
        >
          查看作品
        </motion.a>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-10"
      >
        <ChevronDown size={20} className="animate-bounce text-muted-foreground" />
      </motion.div>
    </section>
  );
}

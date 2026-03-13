"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { fadeInUp } from "@/lib/animations";

interface SectionWrapperProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export default function SectionWrapper({
  children,
  className = "",
  id,
}: SectionWrapperProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.section
      ref={ref}
      id={id}
      variants={fadeInUp}
      initial="initial"
      animate={isInView ? "animate" : "initial"}
      className={`px-6 py-12 md:px-12 md:py-20 lg:px-24 ${className}`}
    >
      {children}
    </motion.section>
  );
}

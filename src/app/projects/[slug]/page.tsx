import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import { projects } from "@/lib/constants";
import ProjectDetail from "./ProjectDetail";

function getMarkdownContent(slug: string): string | null {
  const filePath = path.join(
    process.cwd(),
    "src",
    "content",
    "projects",
    slug,
    "index.md"
  );
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return params.then(({ slug }) => {
    const project = projects.find((p) => p.slug === slug);
    if (!project) return { title: "Not Found" };
    return {
      title: `${project.title} | Portfolio`,
      description: project.description,
    };
  });
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) notFound();

  const markdown = getMarkdownContent(slug) ?? "";

  return <ProjectDetail project={project} markdown={markdown} />;
}

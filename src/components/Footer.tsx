import { Separator } from "@/components/ui/separator";

export default function Footer() {
  return (
    <footer className="px-6 pb-8 pt-4">
      <Separator className="mb-8" />
      <p className="text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Portfolio. Built with Next.js
      </p>
    </footer>
  );
}

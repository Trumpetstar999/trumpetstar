import { ReactNode } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { cn } from "@/lib/utils";

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number; // ms
  direction?: "up" | "left" | "right" | "fade";
}

export function AnimatedSection({
  children,
  className,
  delay = 0,
  direction = "up",
}: AnimatedSectionProps) {
  const { ref, visible } = useScrollAnimation();

  const base = "transition-all duration-700 ease-out";
  const hidden =
    direction === "up"
      ? "opacity-0 translate-y-8"
      : direction === "left"
      ? "opacity-0 -translate-x-8"
      : direction === "right"
      ? "opacity-0 translate-x-8"
      : "opacity-0";
  const shown = "opacity-100 translate-y-0 translate-x-0";

  return (
    <div
      ref={ref}
      className={cn(base, visible ? shown : hidden, className)}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

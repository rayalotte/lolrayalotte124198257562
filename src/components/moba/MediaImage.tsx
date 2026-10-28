import { useMediaUrl } from "@/lib/moba";
import { cn } from "@/lib/utils";
import { useState, type ReactNode } from "react";

export function MediaImage({
  path,
  alt,
  className,
  fallback,
  eager,
}: {
  path: string | null | undefined;
  alt: string;
  className?: string;
  fallback?: ReactNode;
  eager?: boolean;
}) {
  const url = useMediaUrl(path);
  const [failed, setFailed] = useState(false);
  if (!path || failed) return <>{fallback ?? null}</>;
  if (!url) return <div className={cn("animate-pulse bg-muted", className)} />;
  return (
    <img
      src={url}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

export function Monogram({ name, className }: { name: string; className?: string }) {
  return (
    <div className={cn("flex items-center justify-center bg-panel-raised scanlines font-display text-muted-foreground", className)}>
      {name.trim().slice(0, 2).toUpperCase() || "?"}
    </div>
  );
}

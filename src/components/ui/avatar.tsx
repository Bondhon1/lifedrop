import { cn } from "@/lib/utils";
import Image from "next/image";
import { HTMLAttributes } from "react";

export function Avatar({
  src,
  alt,
  className,
  size = "md",
  ...props
}: {
  src?: string | null;
  alt?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
} & HTMLAttributes<HTMLDivElement>) {
  const sizeMap = {
    sm: "h-9 w-9",
    md: "h-11 w-11",
    lg: "h-14 w-14",
  } as const;

  const resolvedSrc = src && src.trim().length > 0 ? src : "/images/default-avatar.svg";
  const sizeToPixelsMap = {
    sm: "36px",
    md: "44px",
    lg: "56px",
  } as const;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-full bg-white/10 text-white",
        sizeMap[size],
        className,
      )}
      {...props}
    >
      <Image src={resolvedSrc} alt={alt ?? "Avatar"} fill className="object-cover" sizes={sizeToPixelsMap[size]} />
    </div>
  );
}

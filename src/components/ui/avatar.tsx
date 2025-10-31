import { cn } from "@/lib/utils";
import Image from "next/image";
import { HTMLAttributes } from "react";
import { User as UserIcon } from "lucide-react";

export function Avatar({
  src,
  alt,
  className,
  fallbackIcon = <UserIcon className="h-5 w-5" />,
  size = "md",
  ...props
}: {
  src?: string | null;
  alt?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  fallbackIcon?: React.ReactNode;
} & HTMLAttributes<HTMLDivElement>) {
  const sizeMap = {
    sm: "h-9 w-9",
    md: "h-11 w-11",
    lg: "h-14 w-14",
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
      {src ? (
        <Image src={src} alt={alt ?? "Avatar"} fill className="object-cover" sizes="48px" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-white/70">
          {fallbackIcon}
        </div>
      )}
    </div>
  );
}

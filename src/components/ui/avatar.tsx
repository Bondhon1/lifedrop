"use client";

import * as React from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";

type AvatarSize = "sm" | "md" | "lg" | "xl";

const DEFAULT_AVATAR_SRC = "/images/default-avatar.svg";

const sizeStyles: Record<AvatarSize, { container: string; text: string; sizeAttr: string }> = {
	sm: { container: "h-9 w-9", text: "text-xs", sizeAttr: "36px" },
	md: { container: "h-11 w-11", text: "text-sm", sizeAttr: "44px" },
	lg: { container: "h-14 w-14", text: "text-base", sizeAttr: "56px" },
	xl: { container: "h-20 w-20", text: "text-xl", sizeAttr: "80px" },
};

export type AvatarProps = React.HTMLAttributes<HTMLDivElement> & {
	src?: string | null;
	alt?: string;
	size?: AvatarSize;
	fallback?: React.ReactNode;
};

const getInitials = (value?: string) => {
	if (!value) {
		return "?";
	}
	const parts = value
		.trim()
		.split(/\s+/)
		.filter(Boolean);
	if (parts.length === 0) {
		return value.slice(0, 2).toUpperCase();
	}
	if (parts.length === 1) {
		return parts[0].slice(0, 2).toUpperCase();
	}
	return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const normalizeSrc = (value?: string | null) => {
	if (!value) {
		return null;
	}
	const trimmed = value.trim();
	if (!trimmed || trimmed === "default.jpg" || trimmed === "default_cover.jpg") {
		return null;
	}
	return trimmed;
};

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
	({ className, size = "md", src, alt, fallback, ...props }, ref) => {
		const [hasError, setHasError] = React.useState(false);
		const sanitizedSrc = normalizeSrc(src);
		const shouldRenderImage = Boolean(sanitizedSrc) && !hasError;
		const label = alt ?? "Avatar";
		const fallbackContent = fallback ?? getInitials(alt);

		return (
			<div
				ref={ref}
				className={cn(
					"relative overflow-hidden rounded-full bg-surface-overlay text-secondary",
					sizeStyles[size].container,
					className,
				)}
				aria-label={label}
				{...props}
			>
				{shouldRenderImage ? (
					<Image
						src={sanitizedSrc!}
						alt={label}
						fill
						className="object-cover"
						sizes={sizeStyles[size].sizeAttr}
						onError={() => setHasError(true)}
						priority={size === "xl"}
					/>
				) : (
					<Image
						src={DEFAULT_AVATAR_SRC}
						alt={label}
						fill
						className="object-cover"
						sizes={sizeStyles[size].sizeAttr}
					/>
				)}
				{!shouldRenderImage ? (
					<div className={cn("absolute inset-0 flex items-center justify-center font-semibold", sizeStyles[size].text)}>
						{fallbackContent}
					</div>
				) : null}
			</div>
		);
	},
);

Avatar.displayName = "Avatar";

export { Avatar };

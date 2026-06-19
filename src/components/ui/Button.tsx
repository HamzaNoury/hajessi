import Link from "next/link";
import { type ReactNode } from "react";

const variants = {
  primary:
    "bg-accent text-white hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 shadow-sm",
  outline:
    "border border-accent/40 text-accent hover:bg-accent/5 hover:border-accent",
  ghost: "text-foreground hover:bg-muted",
  accent:
    "bg-accent text-white hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent",
  inverted:
    "border border-border text-foreground hover:bg-muted",
} as const;

const sizes = {
  sm: "px-5 py-2.5 text-[0.65rem]",
  md: "px-7 py-3 text-[0.65rem]",
  lg: "px-9 py-3.5 text-[0.7rem]",
} as const;

interface ButtonProps {
  href?: string;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}

export function Button({
  href,
  variant = "primary",
  size = "md",
  className = "",
  children,
  onClick,
  type = "button",
  disabled,
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-full font-sans font-medium tracking-[0.06em] uppercase transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";
  const classes = `${base} ${variants[variant]} ${sizes[size]} ${className}`;

  if (href) {
    const isExternal = href.startsWith("http");
    const isTel = href.startsWith("tel:");
    if (isExternal || isTel) {
      return (
        <a
          href={href}
          className={classes}
          {...(isExternal
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        >
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
    >
      {children}
    </button>
  );
}

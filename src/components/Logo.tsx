import Link from "next/link";
import { BRAND } from "@/lib/config";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "h-10 w-10 text-lg",
    md: "h-14 w-14 text-xl",
    lg: "h-20 w-20 text-3xl",
  };

  return (
    <Link href="/" className="flex items-center gap-3 group">
      {/* Placeholder logo — remplacer par le vrai logo HAJESSI */}
      <div
        className={`${sizes[size]} rounded-full border-2 border-gold flex items-center justify-center bg-bg-card group-hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-shadow`}
        aria-label={`${BRAND.name} logo`}
      >
        <span className="font-serif text-gold leading-none" dir="rtl">
          {BRAND.arabicName}
        </span>
      </div>
      <span className="font-serif text-gold tracking-[0.2em] text-lg hidden sm:block">
        {BRAND.name}
      </span>
    </Link>
  );
}

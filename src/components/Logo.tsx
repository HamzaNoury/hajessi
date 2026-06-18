import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/config";

const SIZES = { sm: 44, md: 60, lg: 88, xl: 150 } as const;

/** Bump when logo asset changes (busts Next.js image cache). */
const LOGO_SRC = "/images/hajessi-logo.png";

export function Logo({ size = "md" }: { size?: keyof typeof SIZES }) {
  const px = SIZES[size];
  return (
    <Link
      href="/"
      className="inline-flex shrink-0 items-center group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      aria-label={`${size === "xl" ? "" : "الرئيسية — "}${BRAND.arabicName}`}
    >
      <Image
        src={LOGO_SRC}
        alt="HAJESSI — هاجسي"
        width={px}
        height={px}
        unoptimized
        className="object-contain transition-opacity duration-200 group-hover:opacity-85"
        priority={size === "xl"}
      />
    </Link>
  );
}

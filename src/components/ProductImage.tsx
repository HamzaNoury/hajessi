import Image from "next/image";

interface ProductImageProps {
  src: string;
  alt: string;
  priority?: boolean;
  large?: boolean;
  hero?: boolean;
  card?: boolean;
  className?: string;
}

/** Flacon PNG transparent — fond page ou dégradé selon le contexte */
export function ProductImage({
  src,
  alt,
  priority = false,
  large = false,
  hero = false,
  card = false,
  className = "",
}: ProductImageProps) {
  const unoptimized = src.startsWith("/images/perfumes/");

  if (card || hero) {
    return (
      <div
        className={`relative ${
          hero ? "aspect-[4/5] p-6 sm:p-8 md:p-10 bg-background" : "aspect-[4/5] p-4 sm:p-5"
        } ${className}`}
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          unoptimized={unoptimized}
          className="product-image object-contain object-center"
          sizes={
            hero
              ? "(max-width:1024px) 100vw, 50vw"
              : "(max-width:768px) 50vw, (max-width:1024px) 33vw, 25vw"
          }
        />
      </div>
    );
  }

  const padding = hero ? "p-10 md:p-14" : large ? "p-8 md:p-10" : "p-6 md:p-8";

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-b from-muted to-background ${padding} ${
        hero ? "aspect-[4/5] min-h-[420px]" : large ? "aspect-[4/5]" : "aspect-[3/4]"
      } ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        unoptimized={unoptimized}
        className="product-image object-contain object-center drop-shadow-[0_20px_40px_rgba(12,10,9,0.12)]"
        sizes={
          hero
            ? "(max-width:1024px) 100vw, 50vw"
            : large
              ? "50vw"
              : "(max-width:768px) 50vw, 33vw"
        }
      />
    </div>
  );
}

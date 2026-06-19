import Link from "next/link";
import type { Product } from "@/types";
import { ProductImage } from "./ProductImage";
import { isProductAvailable } from "@/lib/product-utils";
import { categoryLabels, formatPrice, t } from "@/lib/i18n";

function SoonBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block text-label text-secondary border border-border bg-muted px-2.5 py-1 rounded-full ${className}`}
    >
      {t.soon}
    </span>
  );
}

export function ProductCard({
  product,
  priority = false,
  large = false,
  compact = false,
}: {
  product: Product;
  priority?: boolean;
  large?: boolean;
  compact?: boolean;
}) {
  const available = isProductAvailable(product);

  if (compact) {
    return (
      <article className={`product-card group ${!available ? "opacity-90" : ""}`}>
        <Link
          href={`/boutique/${product.slug}`}
          className="block card-luxury focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <div className="relative product-stage">
            <ProductImage
              src={product.imageUrl}
              alt={product.name}
              priority={priority}
              card
            />
            {!available && (
              <div className="absolute inset-0 flex items-start justify-end p-2 pointer-events-none">
                <SoonBadge />
              </div>
            )}
          </div>
          <div className="px-4 pb-5 pt-4 text-center border-t border-border/50">
            <p className="text-label text-secondary mb-1 text-[0.65rem] tracking-widest uppercase">
              {categoryLabels[product.category]}
            </p>
            <h3 className="font-serif text-lg text-foreground group-hover:text-accent transition-colors duration-200 leading-snug">
              {product.name}
            </h3>
            {available ? (
              <p className="mt-2 text-sm font-medium text-accent tabular-nums">
                {formatPrice(product.price)}
              </p>
            ) : (
              <p className="mt-2 text-sm text-secondary">{t.soon}</p>
            )}
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article className={`product-card group ${!available ? "opacity-90" : ""}`}>
      <Link
        href={`/boutique/${product.slug}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <div className="relative product-stage rounded-2xl overflow-hidden">
          <ProductImage
            src={product.imageUrl}
            alt={product.name}
            priority={priority}
            large={large}
          />
          {!available && (
            <div className="absolute inset-0 flex items-start justify-end p-3 pointer-events-none">
              <SoonBadge />
            </div>
          )}
        </div>
        <div className="pt-5 md:pt-6 text-center">
          <p className="text-label text-secondary mb-1 tracking-widest uppercase">
            {categoryLabels[product.category]}
          </p>
          <h3
            className={`font-serif text-foreground group-hover:text-accent transition-colors duration-200 ${
              large ? "text-2xl md:text-3xl" : "text-xl md:text-2xl"
            }`}
          >
            {product.name}
          </h3>
          {available ? (
            <p className="mt-2 text-sm font-medium text-accent tabular-nums">
              {formatPrice(product.price)}
            </p>
          ) : (
            <p className="mt-2 text-sm text-secondary">{t.soon}</p>
          )}
        </div>
      </Link>
    </article>
  );
}

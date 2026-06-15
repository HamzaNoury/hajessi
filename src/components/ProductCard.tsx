import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="product-card group bg-bg-card border border-gold/20 rounded-sm overflow-hidden">
      <Link href={`/boutique/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-bg-deep">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, 25vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-deep/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="p-4 border-t border-gold/10">
          <p className="text-xs text-gold-light uppercase tracking-widest mb-1">
            {product.category}
          </p>
          <h3 className="font-serif text-lg text-cream group-hover:text-gold transition-colors">
            {product.name}
          </h3>
          <p className="text-gold font-medium mt-2">
            {product.price.toLocaleString("fr-MA")} MAD
          </p>
        </div>
      </Link>
      <div className="px-4 pb-4">
        <Link
          href={`/boutique/${product.slug}`}
          className="block w-full text-center py-2 text-xs tracking-widest uppercase border border-gold/40 text-gold hover:bg-gold hover:text-bg-deep transition-colors"
        >
          Voir détails
        </Link>
      </div>
    </article>
  );
}

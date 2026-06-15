"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/types";
import { trackViewContent } from "@/components/TrackingScripts";

interface ProductDetailClientProps {
  product: Product;
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    trackViewContent(product.name, product.price);
  }, [product.name, product.price]);

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        <div className="relative aspect-[3/4] bg-bg-card border border-gold/20 rounded-sm overflow-hidden">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>

        <div className="flex flex-col justify-center">
          <p className="text-gold-light text-xs uppercase tracking-[0.4em] mb-2">
            {product.category}
          </p>
          <h1 className="font-serif text-4xl md:text-5xl text-gold-gradient mb-4">
            {product.name}
          </h1>
          <p className="text-2xl text-gold font-medium mb-6">
            {product.price.toLocaleString("fr-MA")} MAD
          </p>
          <p className="text-cream/70 leading-relaxed mb-8">{product.description}</p>

          <div className="mb-8 p-6 bg-bg-card border border-gold/20 rounded-sm">
            <h2 className="font-serif text-gold text-sm tracking-widest uppercase mb-4">
              Notes olfactives
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex gap-4">
                <span className="text-gold w-16 shrink-0">Tête</span>
                <span className="text-cream/70">{product.notes.tete}</span>
              </div>
              <div className="flex gap-4">
                <span className="text-gold w-16 shrink-0">Cœur</span>
                <span className="text-cream/70">{product.notes.coeur}</span>
              </div>
              <div className="flex gap-4">
                <span className="text-gold w-16 shrink-0">Fond</span>
                <span className="text-cream/70">{product.notes.fond}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <label className="text-sm text-cream/60">Quantité</label>
            <div className="flex items-center border border-gold/30">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-4 py-2 text-gold hover:bg-gold/10"
              >
                −
              </button>
              <span className="px-4 py-2 text-cream min-w-[3rem] text-center">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() =>
                  setQuantity((q) => Math.min(product.stock, q + 1))
                }
                className="px-4 py-2 text-gold hover:bg-gold/10"
              >
                +
              </button>
            </div>
            <span className="text-cream/40 text-xs">
              {product.stock} en stock
            </span>
          </div>

          <Link
            href={`/commande?product=${product.id}&qty=${quantity}`}
            className="block w-full text-center py-4 bg-gradient-to-r from-gold to-gold-dark text-bg-deep font-medium text-sm tracking-[0.2em] uppercase hover:opacity-90 transition-opacity"
          >
            Commander maintenant
          </Link>
        </div>
      </div>
    </div>
  );
}

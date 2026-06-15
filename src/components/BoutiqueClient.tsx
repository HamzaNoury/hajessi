"use client";

import { useMemo, useState } from "react";
import type { Product, ProductCategory } from "@/types";
import { ProductCard } from "@/components/ProductCard";

interface BoutiqueClientProps {
  products: Product[];
}

type PriceFilter = "all" | "low" | "mid" | "high";

export function BoutiqueClient({ products }: BoutiqueClientProps) {
  const [category, setCategory] = useState<ProductCategory | "all">("all");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (priceFilter === "low" && p.price > 300) return false;
      if (priceFilter === "mid" && (p.price <= 300 || p.price > 600)) return false;
      if (priceFilter === "high" && p.price <= 600) return false;
      return true;
    });
  }, [products, category, priceFilter]);

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="font-serif text-4xl text-gold-gradient mb-3">Boutique</h1>
        <p className="text-cream/60">Notre collection de parfums d&apos;exception</p>
        <div className="gold-line w-24 mx-auto mt-6" />
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4 mb-10 p-4 bg-bg-card border border-gold/20 rounded-sm">
        <div className="flex-1">
          <label className="text-xs text-gold uppercase tracking-widest block mb-2">
            Catégorie
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ProductCategory | "all")}
            className="w-full bg-bg-deep border border-gold/30 text-cream px-3 py-2 text-sm rounded-sm"
          >
            <option value="all">Tous</option>
            <option value="homme">Homme</option>
            <option value="femme">Femme</option>
            <option value="unisexe">Unisexe</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs text-gold uppercase tracking-widest block mb-2">
            Gamme de prix
          </label>
          <select
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value as PriceFilter)}
            className="w-full bg-bg-deep border border-gold/30 text-cream px-3 py-2 text-sm rounded-sm"
          >
            <option value="all">Tous les prix</option>
            <option value="low">Jusqu&apos;à 300 MAD</option>
            <option value="mid">300 – 600 MAD</option>
            <option value="high">Plus de 600 MAD</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-cream/50 py-20">
          Aucun parfum ne correspond à vos critères.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

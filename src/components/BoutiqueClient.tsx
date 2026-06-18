"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { Product, ProductCategory } from "@/types";
import { ProductCard } from "@/components/ProductCard";
import { SectionHeading } from "@/components/SectionHeading";
import { Container } from "@/components/ui/Container";
import { categoryLabels, t } from "@/lib/i18n";

const CATEGORIES: { value: ProductCategory | "all"; label: string }[] = [
  { value: "all", label: t.boutique.all },
  { value: "homme", label: categoryLabels.homme },
  { value: "femme", label: categoryLabels.femme },
  { value: "unisexe", label: categoryLabels.unisexe },
];

const PRICES = [
  { value: "all" as const, label: t.boutique.allPrices },
  { value: "low" as const, label: t.boutique.priceLow },
  { value: "mid" as const, label: t.boutique.priceMid },
  { value: "high" as const, label: t.boutique.priceHigh },
];

type PriceFilter = (typeof PRICES)[number]["value"];

export function BoutiqueClient({ products }: { products: Product[] }) {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category");
  const [category, setCategory] = useState<ProductCategory | "all">("all");
  const [price, setPrice] = useState<PriceFilter>("all");

  useEffect(() => {
    if (
      initialCategory === "homme" ||
      initialCategory === "femme" ||
      initialCategory === "unisexe"
    ) {
      setCategory(initialCategory);
    }
  }, [initialCategory]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (price === "low" && p.price > 300) return false;
      if (price === "mid" && (p.price <= 300 || p.price > 600)) return false;
      if (price === "high" && p.price <= 600) return false;
      return true;
    });
  }, [products, category, price]);

  return (
    <div className="bg-background min-h-screen py-10 md:py-16">
      <Container>
        <SectionHeading
          eyebrow={t.boutique.eyebrow}
          title={t.boutique.title}
          description={t.boutique.description}
        />

        <p className="text-center text-label text-accent mb-8">{t.cod}</p>

        <div className="flex flex-col gap-4 mb-12" role="group" aria-label={t.boutique.filters}>
          <div className="flex flex-wrap justify-center gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className={`chip ${category === c.value ? "chip-active" : ""}`}
                aria-pressed={category === c.value}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {PRICES.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPrice(p.value)}
                className={`chip ${price === p.value ? "chip-active" : ""}`}
                aria-pressed={price === p.value}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-center text-secondary py-20" role="status">
            {t.boutique.empty}
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5 lg:gap-6">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} compact />
            ))}
          </div>
        )}

        <p className="text-center mt-12 text-label text-secondary" aria-live="polite">
          {t.boutique.count(filtered.length)}
        </p>
      </Container>
    </div>
  );
}

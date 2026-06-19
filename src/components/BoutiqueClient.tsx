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
  { value: "unisexe", label: categoryLabels.unisexe },
];

export function BoutiqueClient({ products }: { products: Product[] }) {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category");
  const [category, setCategory] = useState<ProductCategory | "all">("all");

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
      return true;
    });
  }, [products, category]);

  const showFilters = products.length > 3;

  return (
    <div className="bg-background min-h-screen py-10 md:py-16">
      <Container>
        <SectionHeading
          eyebrow={t.boutique.eyebrow}
          title={t.boutique.title}
          description={t.boutique.description}
        />

        <div className="flex justify-center mb-10">
          <span className="text-label text-accent border border-accent/25 bg-accent/5 px-4 py-2 rounded-full">
            {t.cod} · {t.deliveryMorocco}
          </span>
        </div>

        {showFilters && (
          <div
            className="flex flex-wrap justify-center gap-2 mb-12"
            role="group"
            aria-label={t.boutique.filters}
          >
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
        )}

        {filtered.length === 0 ? (
          <p className="text-center text-secondary py-20" role="status">
            {t.boutique.empty}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 max-w-4xl mx-auto">
            {filtered.map((product, i) => (
              <ProductCard key={product.id} product={product} compact priority={i === 0} />
            ))}
          </div>
        )}

        <p className="text-center mt-14 text-label text-secondary" aria-live="polite">
          {t.boutique.count(filtered.length)}
        </p>
      </Container>
    </div>
  );
}

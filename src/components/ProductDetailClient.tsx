"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Product } from "@/types";
import { trackViewContent } from "@/components/TrackingScripts";
import { ProductImage } from "@/components/ProductImage";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { isProductAvailable } from "@/lib/product-utils";
import { categoryLabels, formatPrice, t } from "@/lib/i18n";

export function ProductDetailClient({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const available = isProductAvailable(product);

  useEffect(() => {
    trackViewContent(product.name, product.price);
  }, [product.name, product.price]);

  const notes = [
    { label: t.product.topNotes, value: product.notes.tete },
    { label: t.product.heartNotes, value: product.notes.coeur },
    { label: t.product.baseNotes, value: product.notes.fond },
  ];

  return (
    <div className="bg-background pb-20">
      <Container className="pt-6 md:pt-10">
        <nav className="text-label text-secondary mb-8" aria-label="مسار التنقل">
          <Link href="/boutique" className="hover:text-foreground transition-colors">
            {t.product.breadcrumb}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
          <ProductImage
            src={product.imageUrl}
            alt={product.name}
            priority
            hero
            className="lg:sticky lg:top-24 lg:self-start"
          />

          <div className="py-4 lg:py-8">
            <p className="text-label text-accent mb-2">
              {categoryLabels[product.category]}
            </p>
            <h1 className="font-serif text-display-sm text-foreground mb-3">
              {product.name}
            </h1>
            <p className="text-xl font-medium text-accent tabular-nums mb-6">
              {available ? formatPrice(product.price) : t.soon}
            </p>

            {available ? (
              <p className="text-label text-accent mb-8 border border-accent/30 bg-accent/5 px-4 py-3">
                {t.codShort}
              </p>
            ) : (
              <p className="text-label text-secondary mb-8 border border-border bg-muted px-4 py-3 rounded-full inline-block">
                {t.product.soonDesc}
              </p>
            )}

            <p className="text-body text-secondary mb-10">{product.description}</p>

            <div className="border-t border-border pt-8 mb-10">
              <h2 className="text-label text-foreground mb-6">{t.product.pyramid}</h2>
              <dl className="space-y-4">
                {notes.map((n) => (
                  <div key={n.label} className="grid grid-cols-3 gap-4 text-sm">
                    <dt className="text-label text-secondary !text-[0.7rem]">{n.label}</dt>
                    <dd className="col-span-2 text-secondary font-light">{n.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {available && (
              <>
                <div className="flex flex-wrap items-center gap-4 mb-8">
                  <span className="text-label" id="qty-label">
                    {t.product.quantity}
                  </span>
                  <div
                    className="flex items-center border border-border"
                    role="group"
                    aria-labelledby="qty-label"
                  >
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="min-w-[44px] min-h-[44px] text-foreground hover:bg-muted transition-colors"
                      aria-label={t.product.decrease}
                    >
                      −
                    </button>
                    <span className="min-w-[44px] text-center tabular-nums" aria-live="polite">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                      className="min-w-[44px] min-h-[44px] text-foreground hover:bg-muted transition-colors"
                      aria-label={t.product.increase}
                    >
                      +
                    </button>
                  </div>
                  <span className="text-sm text-secondary">
                    {t.product.available(product.stock)}
                  </span>
                </div>

                <Button
                  href={`/commande?product=${product.id}&qty=${qty}`}
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  {t.product.order}
                </Button>
                <p className="mt-3 text-sm text-secondary">{t.product.codNote}</p>
              </>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}

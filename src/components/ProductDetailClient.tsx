"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Product } from "@/types";
import { trackViewContent } from "@/components/TrackingScripts";
import { ProductImage } from "@/components/ProductImage";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
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
    <div className="bg-background pb-24">
      <Container className="pt-8 md:pt-12">
        <nav className="text-caption mb-10" aria-label="مسار التنقل">
          <Link href="/" className="hover:text-accent transition-colors">
            الرئيسية
          </Link>
          <span className="mx-2 text-border">/</span>
          <Link href="/boutique" className="hover:text-accent transition-colors">
            {t.product.breadcrumb}
          </Link>
          <span className="mx-2 text-border">/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 max-w-6xl mx-auto">
          <div className="product-stage rounded-2xl border border-border overflow-hidden lg:sticky lg:top-28 lg:self-start">
            <ProductImage
              src={product.imageUrl}
              alt={product.name}
              priority
              hero
            />
          </div>

          <div className="lg:py-6">
            <p className="text-label text-accent mb-3">
              {categoryLabels[product.category]} · {t.product.extrait}
            </p>
            <h1 className="font-serif text-display-sm text-foreground mb-4">
              {product.name}
            </h1>
            <p className="font-serif text-2xl text-accent tabular-nums mb-8">
              {available ? formatPrice(product.price) : t.soon}
            </p>

            <p className="text-body text-secondary mb-10 leading-relaxed">
              {product.description}
            </p>

            <div className="panel-luxury p-6 md:p-8 mb-10">
              <h2 className="text-label text-foreground mb-6">{t.product.pyramid}</h2>
              <dl className="space-y-5">
                {notes.map((n) => (
                  <div key={n.label} className="flex gap-6 border-b border-border/60 pb-5 last:border-0 last:pb-0">
                    <dt className="text-label text-secondary w-24 shrink-0">{n.label}</dt>
                    <dd className="text-sm text-foreground font-light">{n.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {available ? (
              <div className="panel-luxury p-6 md:p-8">
                <span className="badge-gold mb-6">{t.codShort}</span>

                <div className="flex flex-wrap items-center gap-5 mb-8 mt-6">
                  <span className="text-label" id="qty-label">
                    {t.product.quantity}
                  </span>
                  <QuantityStepper
                    value={qty}
                    min={1}
                    max={product.stock}
                    onChange={setQty}
                    label={t.product.quantity}
                  />
                  <span className="text-caption">
                    {t.product.available(product.stock)}
                  </span>
                </div>

                <Button
                  href={`/commande?product=${product.id}&qty=${qty}`}
                  size="lg"
                  className="w-full"
                >
                  {t.product.order}
                </Button>
                <p className="mt-4 text-center text-caption">{t.product.codNote}</p>
              </div>
            ) : (
              <p className="text-label text-secondary border border-border bg-muted px-5 py-4 rounded-2xl inline-block">
                {t.product.soonDesc}
              </p>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}

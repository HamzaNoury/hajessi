"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Product } from "@/types";
import { trackPurchase } from "@/components/TrackingScripts";
import { ProductImage } from "@/components/ProductImage";
import { SectionHeading } from "@/components/SectionHeading";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { categoryLabels, formatPrice, t } from "@/lib/i18n";

function CommandeForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = searchParams.get("product") ?? "";
  const initialQty = parseInt(searchParams.get("qty") ?? "1", 10);

  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(initialQty);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    clientName: "",
    phone: "",
    city: "",
    address: "",
  });

  useEffect(() => {
    if (!productId) return;
    fetch(`/api/products?id=${productId}`)
      .then((r) => r.json())
      .then(setProduct)
      .catch(() => setError(t.order.loadError));
  }, [productId]);

  const total = product ? product.price * quantity : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!product) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, productId: product.id, quantity }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? t.order.error);
      }
      trackPurchase(product.name, total, quantity);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.order.error);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="bg-background pb-20">
        <Container className="pt-10 md:pt-14">
          <div className="max-w-md mx-auto rounded-2xl border border-border bg-surface p-8 md:p-10 text-center shadow-sm">
            <p className="text-label text-accent mb-3">{t.order.confirmed}</p>
            <h1 className="font-serif text-display-sm text-foreground mb-4">{t.order.received}</h1>
            <p className="text-body text-secondary mb-4">{t.order.thanks(form.clientName, form.city)}</p>
            <p className="inline-block text-label text-accent border border-accent/25 bg-accent/5 px-4 py-2 rounded-full mb-8">
              {t.cod}
            </p>
            <Button onClick={() => router.push("/boutique")} variant="outline">
              {t.order.backToShop}
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="bg-background pb-20">
      <Container className="pt-10 md:pt-14">
        <SectionHeading
          eyebrow={t.order.eyebrow}
          title={t.order.title}
          description={t.codShort}
        />
      </Container>

      <Container className="max-w-2xl">
        <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
          <div className="border-b border-accent/20 bg-accent/5 px-6 py-4 text-center">
            <p className="text-label text-accent">{t.order.codBanner}</p>
          </div>

          {product ? (
            <div className="border-b border-border p-5 md:p-6">
              <div className="flex gap-4 md:gap-6 items-center">
                <div className="w-24 sm:w-28 shrink-0 rounded-xl border border-border bg-background overflow-hidden">
                  <ProductImage src={product.imageUrl} alt={product.name} card />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-label text-secondary mb-1">
                    {categoryLabels[product.category]}
                  </p>
                  <p className="font-serif text-xl text-foreground">{product.name}</p>
                  <p className="text-sm text-secondary mt-1 tabular-nums">
                    {formatPrice(product.price)} × {quantity}
                  </p>
                </div>
                <p className="font-medium text-lg text-accent tabular-nums whitespace-nowrap">
                  {formatPrice(total)}
                </p>
              </div>
            </div>
          ) : (
            <div className="border-b border-border p-6 text-center text-secondary text-sm" role="status">
              {t.order.loading}
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-5 md:p-8 space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              {(
                [
                  { key: "clientName", label: t.order.fullName, type: "text", auto: "name" },
                  { key: "phone", label: t.order.phone, type: "tel", auto: "tel" },
                ] as const
              ).map((f) => (
                <div key={f.key}>
                  <label htmlFor={f.key} className="text-label block mb-2">
                    {f.label} <span className="text-accent">*</span>
                  </label>
                  <input
                    id={f.key}
                    required
                    type={f.type}
                    autoComplete={f.auto}
                    value={form[f.key]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    className="field-box"
                    dir={f.key === "phone" ? "ltr" : undefined}
                  />
                </div>
              ))}
            </div>

            <div>
              <label htmlFor="city" className="text-label block mb-2">
                {t.order.city} <span className="text-accent">*</span>
              </label>
              <input
                id="city"
                required
                type="text"
                autoComplete="address-level2"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="field-box"
              />
            </div>

            <div>
              <label htmlFor="address" className="text-label block mb-2">
                {t.order.address} <span className="text-accent">*</span>
              </label>
              <textarea
                id="address"
                required
                rows={3}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="field-box resize-none"
              />
            </div>

            <div>
              <label htmlFor="qty" className="text-label block mb-2">
                {t.order.quantity}
              </label>
              <div className="inline-flex items-center rounded-xl border border-border bg-background overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="min-w-[44px] min-h-[44px] text-foreground hover:bg-muted transition-colors"
                  aria-label={t.product.decrease}
                >
                  −
                </button>
                <span className="min-w-[48px] text-center tabular-nums font-medium" aria-live="polite">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) => Math.min(product?.stock ?? 99, q + 1))
                  }
                  className="min-w-[44px] min-h-[44px] text-foreground hover:bg-muted transition-colors"
                  aria-label={t.product.increase}
                >
                  +
                </button>
              </div>
            </div>

            {error && (
              <p
                className="text-destructive text-sm rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3"
                role="alert"
              >
                {error}
              </p>
            )}

            <div className="pt-2 border-t border-border">
              <div className="flex justify-between items-center mb-5 pt-4">
                <span className="text-label text-secondary">{t.order.total}</span>
                <span className="font-serif text-2xl text-accent tabular-nums">
                  {formatPrice(total)}
                </span>
              </div>
              <Button type="submit" disabled={loading || !product} className="w-full" size="lg">
                {loading ? t.order.sending : t.order.submit}
              </Button>
              <p className="mt-3 text-center text-sm text-secondary">{t.product.codNote}</p>
            </div>
          </form>
        </div>
      </Container>
    </div>
  );
}

export default function CommandePage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background min-h-[50vh] flex items-center justify-center">
          <p className="text-secondary" role="status">
            {t.order.loading}
          </p>
        </div>
      }
    >
      <CommandeForm />
    </Suspense>
  );
}

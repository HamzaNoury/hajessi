"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Product } from "@/types";
import { trackPurchase } from "@/components/TrackingScripts";

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
      .then((data) => setProduct(data))
      .catch(() => setError("Impossible de charger le produit"));
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
        body: JSON.stringify({
          ...form,
          productId: product.id,
          quantity,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erreur lors de la commande");
      }

      trackPurchase(product.name, total, quantity);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full border-2 border-gold flex items-center justify-center">
          <span className="text-gold text-2xl">✓</span>
        </div>
        <h2 className="font-serif text-3xl text-gold mb-4">Commande confirmée</h2>
        <p className="text-cream/70 mb-8 max-w-md mx-auto">
          Merci {form.clientName} ! Votre commande de {product?.name} ({quantity}x)
          sera livrée à {form.city}. Paiement à la livraison.
        </p>
        <button
          type="button"
          onClick={() => router.push("/boutique")}
          className="text-gold border border-gold/40 px-8 py-3 text-sm tracking-widest uppercase hover:bg-gold/10"
        >
          Retour à la boutique
        </button>
      </div>
    );
  }

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="font-serif text-4xl text-gold-gradient mb-3">Commande</h1>
        <p className="text-cream/60 text-sm">Paiement à la livraison (cash on delivery)</p>
        <div className="gold-line w-24 mx-auto mt-6" />
      </div>

      {product && (
        <div className="mb-8 p-4 bg-bg-card border border-gold/20 rounded-sm flex justify-between items-center">
          <div>
            <p className="font-serif text-cream">{product.name}</p>
            <p className="text-gold text-sm">
              {product.price.toLocaleString("fr-MA")} MAD × {quantity}
            </p>
          </div>
          <p className="text-gold font-medium text-lg">
            {total.toLocaleString("fr-MA")} MAD
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs text-gold uppercase tracking-widest mb-2">
            Nom complet *
          </label>
          <input
            required
            value={form.clientName}
            onChange={(e) => setForm({ ...form, clientName: e.target.value })}
            className="w-full bg-bg-card border border-gold/30 text-cream px-4 py-3 rounded-sm focus:border-gold"
          />
        </div>
        <div>
          <label className="block text-xs text-gold uppercase tracking-widest mb-2">
            Téléphone *
          </label>
          <input
            required
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full bg-bg-card border border-gold/30 text-cream px-4 py-3 rounded-sm focus:border-gold"
            placeholder="+212 6XX XXX XXX"
          />
        </div>
        <div>
          <label className="block text-xs text-gold uppercase tracking-widest mb-2">
            Ville *
          </label>
          <input
            required
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className="w-full bg-bg-card border border-gold/30 text-cream px-4 py-3 rounded-sm focus:border-gold"
          />
        </div>
        <div>
          <label className="block text-xs text-gold uppercase tracking-widest mb-2">
            Adresse complète *
          </label>
          <textarea
            required
            rows={3}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full bg-bg-card border border-gold/30 text-cream px-4 py-3 rounded-sm focus:border-gold resize-none"
          />
        </div>
        <div>
          <label className="block text-xs text-gold uppercase tracking-widest mb-2">
            Quantité
          </label>
          <input
            type="number"
            min={1}
            max={product?.stock ?? 99}
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
            className="w-24 bg-bg-card border border-gold/30 text-cream px-4 py-3 rounded-sm focus:border-gold"
          />
        </div>

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !product}
          className="w-full py-4 bg-gradient-to-r from-gold to-gold-dark text-bg-deep font-medium text-sm tracking-[0.2em] uppercase hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? "Envoi en cours..." : "Confirmer la commande"}
        </button>
      </form>
    </div>
  );
}

export default function CommandePage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-cream/50">Chargement...</div>}>
      <CommandeForm />
    </Suspense>
  );
}

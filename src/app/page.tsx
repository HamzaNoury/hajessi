import Link from "next/link";
import { getFeaturedProducts } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { BRAND } from "@/lib/config";

export default async function HomePage() {
  const featured = await getFeaturedProducts();

  return (
    <>
      {/* Hero plein écran */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-bg-deep" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gold/10 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-gold-dark/10 blur-3xl" />
        </div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="w-24 h-24 mx-auto mb-8 rounded-full border-2 border-gold flex items-center justify-center">
            <span className="font-serif text-4xl text-gold" dir="rtl">
              {BRAND.arabicName}
            </span>
          </div>
          <h1 className="font-serif text-5xl md:text-7xl text-gold-gradient mb-4 tracking-wide">
            {BRAND.name}
          </h1>
          <p className="text-cream/80 text-lg md:text-xl mb-2 font-light">
            {BRAND.taglineFr}
          </p>
          <p className="text-gold-light text-xl md:text-2xl mb-10" dir="rtl">
            {BRAND.taglineAr}
          </p>
          <Link
            href="/boutique"
            className="inline-block px-10 py-4 border border-gold text-gold text-sm tracking-[0.3em] uppercase hover:bg-gold hover:text-bg-deep transition-all duration-300"
          >
            Découvrir la collection
          </Link>
        </div>
      </section>

      {/* Produits vedettes */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-gold text-xs tracking-[0.4em] uppercase mb-3">
            Sélection exclusive
          </p>
          <h2 className="font-serif text-3xl md:text-4xl text-cream">
            Produits vedettes
          </h2>
          <div className="gold-line w-24 mx-auto mt-6" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/boutique"
            className="text-gold text-sm tracking-widest uppercase hover:text-gold-light transition-colors border-b border-gold/40 pb-1"
          >
            Voir toute la boutique →
          </Link>
        </div>
      </section>

      {/* Bandeau marque */}
      <section className="py-16 border-y border-gold/20 bg-bg-card">
        <div className="max-w-3xl mx-auto text-center px-4">
          <p className="font-serif text-2xl text-cream/90 italic leading-relaxed">
            « Chaque flacon HAJESSI raconte une histoire — celle d&apos;un héritage
            olfactif où l&apos;Orient rencontre l&apos;élégance contemporaine. »
          </p>
        </div>
      </section>
    </>
  );
}

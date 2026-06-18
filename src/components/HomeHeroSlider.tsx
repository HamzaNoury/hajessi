"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types";
import { formatPrice, t } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";

interface HomeHeroSliderProps {
  slides: Product[];
}

function ChevronIcon({ direction }: { direction: "prev" | "next" }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
      className={direction === "prev" ? "rotate-180" : ""}
    >
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HomeHeroSlider({ slides }: HomeHeroSliderProps) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  const goTo = useCallback(
    (index: number) => {
      if (count === 0) return;
      setActive(((index % count) + count) % count);
    },
    [count]
  );

  const next = useCallback(() => goTo(active + 1), [active, goTo]);
  const prev = useCallback(() => goTo(active - 1), [active, goTo]);

  useEffect(() => {
    if (count <= 1 || paused) return;
    const timer = window.setInterval(next, 7000);
    return () => window.clearInterval(timer);
  }, [count, next, paused]);

  if (count === 0) return null;

  const product = slides[active];

  return (
    <section
      className="relative bg-background border-b border-border overflow-hidden"
      aria-label="سلايدر الصفحة الرئيسية"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Slides */}
      <div className="relative w-full aspect-[4/5] sm:aspect-[16/10] lg:aspect-[21/9] max-h-[85vh]">
        {slides.map((slide, i) => {
          const src = slide.bannerUrl ?? slide.imageUrl;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-out ${
                i === active ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
              aria-hidden={i !== active}
            >
              <Image
                src={src}
                alt={slide.name}
                fill
                priority={i === 0}
                unoptimized
                className="object-cover object-center"
                sizes="100vw"
              />
              {/* Soft overlay for controls readability */}
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent pointer-events-none"
                aria-hidden
              />
            </div>
          );
        })}

        {/* Bottom info bar */}
        <div className="absolute inset-x-0 bottom-0 z-20 px-5 sm:px-8 lg:px-12 pb-8 sm:pb-10 pt-24 bg-gradient-to-t from-black/60 to-transparent">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div
              key={product.id}
              className="hero-slide-text text-white max-w-xl"
              aria-live="polite"
            >
              <p className="text-label text-white/70 mb-2">{t.home.eyebrow}</p>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl mb-2 leading-tight">
                {product.name}
              </h1>
              <p className="text-sm sm:text-base text-white/80 mb-1">
                {t.product.extrait}
              </p>
              <p className="text-lg font-medium text-amber-200 tabular-nums">
                {formatPrice(product.price)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Button href={`/boutique/${product.slug}`}>{t.home.ctaOrder}</Button>
              <Button
                href="/boutique"
                variant="outline"
                className="!border-white/40 !text-white hover:!bg-white/10"
              >
                {t.home.ctaCollection}
              </Button>
            </div>
          </div>
        </div>

        {/* Nav arrows */}
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute top-1/2 -translate-y-1/2 right-4 sm:right-6 z-30 flex items-center justify-center w-11 h-11 rounded-full border border-white/30 bg-black/20 backdrop-blur-sm text-white hover:bg-black/40 transition-colors"
              aria-label="الشريحة السابقة"
            >
              <ChevronIcon direction="prev" />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute top-1/2 -translate-y-1/2 left-4 sm:left-6 z-30 flex items-center justify-center w-11 h-11 rounded-full border border-white/30 bg-black/20 backdrop-blur-sm text-white hover:bg-black/40 transition-colors"
              aria-label="الشريحة التالية"
            >
              <ChevronIcon direction="next" />
            </button>
          </>
        )}
      </div>

      {/* Dots + trust badges */}
      <div className="bg-background border-t border-border">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          {count > 1 && (
            <div
              className="flex items-center gap-2"
              role="tablist"
              aria-label="اختيار الشريحة"
            >
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  type="button"
                  role="tab"
                  aria-selected={i === active}
                  aria-label={slide.name}
                  onClick={() => goTo(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === active
                      ? "w-10 bg-accent"
                      : "w-2 bg-border hover:bg-accent/50"
                  }`}
                />
              ))}
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-2">
            <span className="text-label text-accent border border-accent/25 bg-accent/5 px-3 py-1.5 rounded-full">
              {t.cod}
            </span>
            <span className="text-label text-secondary border border-border px-3 py-1.5 rounded-full">
              {t.deliveryMorocco}
            </span>
          </div>
        </div>
      </div>

      {/* Hidden link for SEO / keyboard */}
      <Link
        href={`/boutique/${product.slug}`}
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:right-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent focus:text-white rounded-full"
      >
        {product.name}
      </Link>
    </section>
  );
}

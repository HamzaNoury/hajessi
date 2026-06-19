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
      width="20"
      height="20"
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
      className="relative bg-primary overflow-hidden"
      aria-label="سلايدر الصفحة الرئيسية"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="relative w-full aspect-[4/5] sm:aspect-[16/9] lg:aspect-[21/9] max-h-[90vh]">
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
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10 pointer-events-none"
                aria-hidden
              />
            </div>
          );
        })}

        {count > 1 && (
          <div className="absolute top-6 left-6 z-30 text-label text-white/60 tracking-widest" aria-hidden>
            {String(active + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 z-20 px-5 sm:px-10 lg:px-16 pb-10 sm:pb-14 pt-32">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div key={product.id} className="hero-slide-text text-white max-w-lg" aria-live="polite">
              <p className="text-label text-white/60 mb-4">{t.home.eyebrow}</p>
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl mb-4 leading-[1.1]">
                {product.name}
              </h1>
              <p className="text-sm text-white/70 mb-2 tracking-wide">{t.product.extrait}</p>
              <p className="font-serif text-2xl text-amber-200/90 tabular-nums">
                {formatPrice(product.price)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Button href={`/boutique/${product.slug}`} size="lg">
                {t.home.ctaOrder}
              </Button>
              <Button
                href="/boutique"
                variant="outline"
                className="!border-white/50 !text-white hover:!bg-white/10 !bg-transparent"
              >
                {t.home.ctaCollection}
              </Button>
            </div>
          </div>
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute top-1/2 -translate-y-1/2 right-4 sm:right-8 z-30 flex items-center justify-center w-11 h-11 rounded-full border border-white/25 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-colors cursor-pointer"
              aria-label="الشريحة السابقة"
            >
              <ChevronIcon direction="prev" />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute top-1/2 -translate-y-1/2 left-4 sm:left-8 z-30 flex items-center justify-center w-11 h-11 rounded-full border border-white/25 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-colors cursor-pointer"
              aria-label="الشريحة التالية"
            >
              <ChevronIcon direction="next" />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="bg-surface border-t border-border py-4">
          <div className="max-w-7xl mx-auto px-5 sm:px-10 flex justify-center gap-2">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                aria-label={slide.name}
                onClick={() => goTo(i)}
                className={`h-0.5 rounded-full transition-all duration-300 cursor-pointer ${
                  i === active ? "w-12 bg-accent" : "w-6 bg-border hover:bg-accent/40"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      <Link
        href={`/boutique/${product.slug}`}
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:right-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent focus:text-white rounded-full"
      >
        {product.name}
      </Link>
    </section>
  );
}

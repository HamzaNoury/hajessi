"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

const SWIPE_THRESHOLD = 48;

export function HomeHeroSlider({ slides }: HomeHeroSliderProps) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
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

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setPaused(true);
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const dx = touchStartX.current - e.changedTouches[0].clientX;
    const dy = touchStartY.current - e.changedTouches[0].clientY;

    touchStartX.current = null;
    touchStartY.current = null;
    setPaused(false);

    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;

    // RTL: swipe left → next, swipe right → prev
    if (dx > 0) next();
    else prev();
  }

  if (count === 0) return null;

  const product = slides[active];

  return (
    <section
      className="relative bg-foreground overflow-hidden"
      aria-label="سلايدر الصفحة الرئيسية"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Mobile: fixed height · Desktop: cinematic ratio */}
      <div
        className="relative w-full h-[min(68dvh,520px)] sm:h-auto sm:aspect-[16/9] lg:aspect-[21/9] sm:max-h-[min(85vh,720px)] touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {slides.map((slide, i) => {
          const src = slide.bannerUrl ?? slide.imageUrl;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-out ${
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
                className="object-cover object-[center_20%] sm:object-center"
                sizes="100vw"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/5 pointer-events-none"
                aria-hidden
              />
            </div>
          );
        })}

        {count > 1 && (
          <div
            className="absolute top-4 left-4 z-30 text-[0.65rem] text-white/70 tracking-widest sm:top-6 sm:left-6"
            aria-hidden
          >
            {String(active + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 z-20 px-4 sm:px-10 lg:px-16 pt-16 sm:pt-28 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-10 lg:pb-14">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 sm:gap-8">
            <div key={product.id} className="hero-slide-text text-white min-w-0" aria-live="polite">
              {count > 1 && (
                <div
                  className="flex justify-center gap-1 sm:hidden mb-4 -mt-2"
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
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                    >
                      <span
                        className={`block h-1 rounded-full transition-all duration-300 ${
                          i === active ? "w-8 bg-accent" : "w-4 bg-white/40"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              )}
              <p className="text-label text-white/60 mb-2 sm:mb-3">{t.home.eyebrow}</p>
              <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl mb-2 sm:mb-4 leading-tight">
                {product.name}
              </h1>
              <p className="text-xs sm:text-sm text-white/75 mb-1">{t.product.extrait}</p>
              <p className="font-serif text-xl sm:text-2xl text-amber-200/90 tabular-nums">
                {formatPrice(product.price)}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2.5 sm:gap-3 shrink-0">
              <Button href={`/boutique/${product.slug}`} size="lg" className="w-full sm:w-auto">
                {t.home.ctaOrder}
              </Button>
              <Button
                href="/boutique"
                variant="outline"
                size="lg"
                className="w-full sm:w-auto !border-white/50 !text-white hover:!bg-white/10 !bg-transparent"
              >
                {t.home.ctaCollection}
              </Button>
            </div>
          </div>
        </div>

        {/* Arrows — desktop/tablet only */}
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="hidden sm:flex absolute top-1/2 -translate-y-1/2 right-4 lg:right-8 z-30 items-center justify-center w-11 h-11 rounded-full border border-white/25 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-colors cursor-pointer"
              aria-label="الشريحة السابقة"
            >
              <ChevronIcon direction="prev" />
            </button>
            <button
              type="button"
              onClick={next}
              className="hidden sm:flex absolute top-1/2 -translate-y-1/2 left-4 lg:left-8 z-30 items-center justify-center w-11 h-11 rounded-full border border-white/25 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-colors cursor-pointer"
              aria-label="الشريحة التالية"
            >
              <ChevronIcon direction="next" />
            </button>
          </>
        )}
      </div>

      {/* Dots — below hero on tablet/desktop */}
      {count > 1 && (
        <div className="hidden sm:block bg-surface border-t border-border py-4">
          <div className="max-w-7xl mx-auto px-5 sm:px-10 flex justify-center gap-2">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                aria-label={slide.name}
                onClick={() => goTo(i)}
                className={`h-1 rounded-full transition-all duration-300 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center`}
              >
                <span
                  className={`block h-1 rounded-full transition-all ${
                    i === active ? "w-12 bg-accent" : "w-6 bg-border hover:bg-accent/40"
                  }`}
                />
              </button>
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

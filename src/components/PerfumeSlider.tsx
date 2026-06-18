"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/types";
import { isProductAvailable } from "@/lib/product-utils";
import { categoryLabels, formatPrice, t } from "@/lib/i18n";

interface PerfumeSliderProps {
  products: Product[];
  ariaLabel: string;
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

export function PerfumeSlider({ products, ariaLabel }: PerfumeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(max > 4 && el.scrollLeft < max - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    window.addEventListener("resize", updateArrows);
    return () => window.removeEventListener("resize", updateArrows);
  }, [products, updateArrows]);

  const scroll = (direction: "prev" | "next") => {
    const el = trackRef.current;
    if (!el) return;
    const slides = [...el.querySelectorAll<HTMLElement>("[data-slide]")];
    if (!slides.length) return;

    const containerRect = el.getBoundingClientRect();
    let active = 0;
    for (let i = 0; i < slides.length; i++) {
      const r = slides[i].getBoundingClientRect();
      if (r.left >= containerRect.left - 20) {
        active = i;
        break;
      }
      active = i;
    }

    const target =
      direction === "next"
        ? Math.min(active + 1, slides.length - 1)
        : Math.max(active - 1, 0);

    slides[target]?.scrollIntoView({
      behavior: "smooth",
      inline: "start",
      block: "nearest",
    });
    window.setTimeout(updateArrows, 400);
  };

  if (products.length === 0) return null;

  return (
    <div className="relative">
      <div className="flex items-center justify-end gap-2 mb-5">
        <button
          type="button"
          onClick={() => scroll("prev")}
          disabled={!canPrev}
          className="flex items-center justify-center w-10 h-10 rounded-full border border-border text-secondary hover:text-accent hover:border-accent/40 transition-colors disabled:opacity-30 disabled:pointer-events-none"
          aria-label="السابق"
        >
          <ChevronIcon direction="prev" />
        </button>
        <button
          type="button"
          onClick={() => scroll("next")}
          disabled={!canNext}
          className="flex items-center justify-center w-10 h-10 rounded-full border border-border text-secondary hover:text-accent hover:border-accent/40 transition-colors disabled:opacity-30 disabled:pointer-events-none"
          aria-label="التالي"
        >
          <ChevronIcon direction="next" />
        </button>
      </div>

      <div
        ref={trackRef}
        onScroll={updateArrows}
        className="perfume-slider flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 scroll-smooth"
        aria-label={ariaLabel}
        role="region"
      >
        {products.map((product) => {
          const available = isProductAvailable(product);
          return (
            <article
              key={product.id}
              data-slide
              className="perfume-slide shrink-0 w-[11.5rem] sm:w-[13.5rem] md:w-[15rem]"
            >
              <Link
                href={`/boutique/${product.slug}`}
                className={`group block rounded-xl border border-border bg-background overflow-hidden transition-shadow duration-200 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  !available ? "opacity-90" : ""
                }`}
              >
                <div className="relative aspect-[3/4] bg-background p-3 sm:p-4">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    unoptimized={product.imageUrl.includes("/perfumes/")}
                    className="object-contain object-center transition-transform duration-500 group-hover:scale-[1.03]"
                    sizes="(max-width:640px) 40vw, 15rem"
                  />
                  {!available && (
                    <span className="absolute top-2 left-2 text-[0.65rem] text-secondary border border-border bg-muted px-2 py-0.5 rounded-full">
                      {t.soon}
                    </span>
                  )}
                </div>
                <div className="px-3 pb-4 pt-3 border-t border-border/60">
                  <p className="text-label text-secondary mb-0.5 text-[0.7rem]">
                    {categoryLabels[product.category]}
                  </p>
                  <h3 className="font-serif text-base text-foreground group-hover:text-accent transition-colors leading-snug">
                    {product.name}
                  </h3>
                  {available ? (
                    <p className="mt-1 text-sm font-medium text-accent tabular-nums">
                      {formatPrice(product.price)}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-secondary">{t.soon}</p>
                  )}
                </div>
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}

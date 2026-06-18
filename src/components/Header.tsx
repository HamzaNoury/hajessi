"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { t } from "@/lib/i18n";

const NAV = [
  { href: "/boutique", label: t.nav.collection },
  { href: "/a-propos", label: t.nav.about },
  { href: "/contact", label: t.nav.contact },
] as const;

function MenuIcon({ open }: { open: boolean }) {
  return (
    <span className="relative block w-5 h-3.5" aria-hidden>
      <span
        className={`absolute right-0 top-0 block h-px w-5 bg-foreground transition-all duration-200 ${
          open ? "top-1.5 rotate-45" : ""
        }`}
      />
      <span
        className={`absolute right-0 top-1.5 block h-px w-5 bg-foreground transition-all duration-200 ${
          open ? "opacity-0" : ""
        }`}
      />
      <span
        className={`absolute right-0 top-3 block h-px w-5 bg-foreground transition-all duration-200 ${
          open ? "top-1.5 -rotate-45" : ""
        }`}
      />
    </span>
  );
}

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 glass-nav">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 h-16 md:h-[4.5rem] flex items-center justify-between gap-4 overflow-hidden">
          <Logo size="sm" />

          <nav className="hidden lg:flex items-center gap-8 shrink-0" aria-label="القائمة الرئيسية">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-label transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md ${
                    active ? "text-foreground" : "text-secondary"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden lg:flex items-center gap-4 shrink-0">
            <span className="text-label text-accent hidden xl:inline">{t.cod}</span>
            <Link
              href="/boutique"
              className="text-label text-accent hover:text-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
            >
              {t.nav.shop}
            </Link>
          </div>

          <button
            type="button"
            className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2 shrink-0"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? t.menu.close : t.menu.open}
          >
            <MenuIcon open={menuOpen} />
          </button>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-40 lg:hidden overflow-hidden transition-opacity duration-300 ${
          menuOpen
            ? "opacity-100 pointer-events-auto visible"
            : "opacity-0 pointer-events-none invisible"
        }`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          className="absolute inset-0 bg-foreground/40"
          onClick={() => setMenuOpen(false)}
          aria-label={t.menu.closeOverlay}
        />
        <nav
          className={`absolute top-0 left-0 h-full w-[min(100%,20rem)] bg-surface shadow-2xl overflow-hidden transition-transform duration-300 ${
            menuOpen ? "translate-x-0 visible" : "-translate-x-[105%] invisible"
          }`}
          aria-label="قائمة الجوال"
          inert={!menuOpen ? true : undefined}
        >
          <div className="flex flex-col h-full pt-20 px-8 pb-8">
            <p className="text-label text-accent mb-6 pb-4 border-b border-border">{t.cod}</p>
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="font-serif text-2xl text-foreground py-4 border-b border-border"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-auto pt-8">
              <Link
                href="/boutique"
                className="block text-center font-sans text-label text-accent hover:text-foreground transition-colors duration-200"
              >
                {t.nav.shop}
              </Link>
            </div>
          </div>
        </nav>
      </div>

      <div className="h-16 md:h-[4.5rem]" aria-hidden />
    </>
  );
}

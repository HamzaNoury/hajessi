"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { BRAND, CONTACT } from "@/lib/config";
import { Container } from "./ui/Container";
import { t } from "@/lib/i18n";

const EXPLORE = [
  { href: "/boutique", label: t.nav.collection },
  { href: "/a-propos", label: t.nav.about },
  { href: "/contact", label: t.nav.contact },
];

const TRUST = [
  { href: "/livraison", label: t.legal.shipping.title },
  { href: "/faq", label: t.legal.faq.title },
  { href: "/confidentialite", label: t.legal.privacy.title },
  { href: "/conditions", label: t.legal.terms.title },
];

export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="bg-surface border-t border-border mt-auto">
      <Container className="py-14 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo size="md" />
            <p className="mt-4 text-sm text-secondary leading-relaxed max-w-xs">
              {BRAND.taglineAr}
            </p>
            <p className="mt-4 text-sm font-medium text-accent">{t.cod}</p>
            <a
              href={`tel:${CONTACT.phoneTel}`}
              className="mt-2 block text-sm text-secondary hover:text-accent transition-colors"
              dir="ltr"
            >
              {CONTACT.phone}
            </a>
            <a
              href={CONTACT.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block text-sm text-secondary hover:text-accent transition-colors"
            >
              واتساب
            </a>
          </div>

          <div>
            <p className="text-label text-foreground mb-4">{t.footer.explore}</p>
            <ul className="space-y-2.5">
              {EXPLORE.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-secondary hover:text-accent transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-label text-foreground mb-4">{t.footer.trust}</p>
            <ul className="space-y-2.5">
              {TRUST.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-secondary hover:text-accent transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-label text-foreground mb-4">{t.footer.follow}</p>
            <ul className="space-y-2.5 text-sm text-secondary">
              <li>
                <a
                  href={CONTACT.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-accent transition-colors"
                >
                  فيسبوك
                </a>
              </li>
              <li>
                <a
                  href={`tel:${CONTACT.phoneTel}`}
                  className="hover:text-accent transition-colors"
                  dir="ltr"
                >
                  {CONTACT.phone}
                </a>
              </li>
              <li className="text-secondary/80">{t.footer.location}</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row justify-between gap-4 text-xs text-secondary">
          <span>© {new Date().getFullYear()} {BRAND.name} — {t.footer.legal}</span>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {TRUST.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-accent transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  );
}

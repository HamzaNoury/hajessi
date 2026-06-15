"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { BRAND } from "@/lib/config";

const quickLinks = [
  { href: "/", label: "Accueil" },
  { href: "/boutique", label: "Boutique" },
  { href: "/a-propos", label: "À propos" },
  { href: "/contact", label: "Contact" },
];

export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="bg-bg-deep border-t border-gold/30 mt-auto">
      <div className="gold-line" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <Logo size="sm" />
            <p className="mt-4 text-cream/60 text-sm leading-relaxed">
              {BRAND.taglineFr}
              <br />
              <span dir="rtl" className="text-gold-light">
                {BRAND.taglineAr}
              </span>
            </p>
          </div>

          <div>
            <h3 className="font-serif text-gold text-sm tracking-widest uppercase mb-4">
              Liens rapides
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-cream/60 text-sm hover:text-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-gold text-sm tracking-widest uppercase mb-4">
              Suivez-nous
            </h3>
            <div className="flex gap-4">
              {[
                { name: "Instagram", href: "https://instagram.com" },
                { name: "Facebook", href: "https://facebook.com" },
                { name: "TikTok", href: "https://tiktok.com" },
              ].map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-gold/40 flex items-center justify-center text-gold hover:bg-gold/10 transition-colors"
                  aria-label={social.name}
                >
                  <span className="text-xs font-medium">
                    {social.name[0]}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="gold-line my-8" />
        <p className="text-center text-cream/40 text-xs tracking-wider">
          © {new Date().getFullYear()} {BRAND.name}. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}

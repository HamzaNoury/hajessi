"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { BRAND, CONTACT } from "@/lib/config";
import { Container } from "./ui/Container";
import { t } from "@/lib/i18n";

const LINKS = [
  { href: "/boutique", label: t.nav.collection },
  { href: "/a-propos", label: t.nav.about },
  { href: "/contact", label: t.nav.contact },
];

function IconFacebook() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

const SOCIAL = [
  { name: "Facebook", href: CONTACT.facebook, Icon: IconFacebook },
  { name: t.contact.phone, href: `tel:${CONTACT.phoneTel}`, Icon: IconPhone },
];

export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="bg-surface border-t border-border mt-auto">
      <Container className="py-14 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-5">
            <Logo size="md" />
            <p className="mt-6 text-sm text-secondary font-light leading-relaxed max-w-xs">
              {BRAND.taglineAr}
            </p>
            <p className="mt-4 text-label text-accent">{t.cod}</p>
            <a
              href={`tel:${CONTACT.phoneTel}`}
              className="mt-3 inline-block text-sm text-secondary hover:text-accent transition-colors"
              dir="ltr"
            >
              {CONTACT.phone}
            </a>
          </div>

          <div className="md:col-span-3 md:col-start-7">
            <p className="text-label text-secondary mb-5">{t.footer.explore}</p>
            <ul className="space-y-3">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-secondary hover:text-accent transition-colors duration-200"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <p className="text-label text-secondary mb-5">{t.footer.follow}</p>
            <ul className="flex gap-3">
              {SOCIAL.map(({ name, href, Icon }) => (
                <li key={name}>
                  <a
                    href={href}
                    target={href.startsWith("tel:") ? undefined : "_blank"}
                    rel={href.startsWith("tel:") ? undefined : "noopener noreferrer"}
                    aria-label={name}
                    className="flex items-center justify-center w-11 h-11 rounded-full border border-border text-secondary hover:text-accent hover:border-accent/40 transition-colors duration-200"
                  >
                    <Icon />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-border flex flex-col sm:flex-row justify-between gap-3 text-[0.7rem] text-secondary">
          <span>© {new Date().getFullYear()} {BRAND.name}</span>
          <span>{t.footer.location}</span>
        </div>
      </Container>
    </footer>
  );
}

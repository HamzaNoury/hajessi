import Link from "next/link";
import { getProducts } from "@/lib/products";
import { HomeHeroSlider } from "@/components/HomeHeroSlider";
import { ProductCard } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { SectionHeading } from "@/components/SectionHeading";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { BRAND, CONTACT } from "@/lib/config";
import { t } from "@/lib/i18n";

const TRUST_ICONS = [
  // delivery
  <svg key="d" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <path d="M1 3h15v13H1zM16 8h4l3 5v3h-7V8z" strokeLinejoin="round" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>,
  // COD
  <svg key="c" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <path d="M2 10h20" />
  </svg>,
  // quality
  <svg key="q" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinejoin="round" />
  </svg>,
  // handmade
  <svg key="h" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinejoin="round" />
  </svg>,
];

export default async function HomePage() {
  const products = await getProducts();
  const heroProduct = products[0];

  return (
    <>
      <HomeHeroSlider slides={products} />

      <section className="bg-surface border-b border-border" aria-label="ضماناتنا">
        <Container className="py-8 md:py-10">
          <ul className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {t.trust.map((item, i) => (
              <li
                key={item}
                className="flex flex-col items-center text-center gap-3 rounded-2xl border border-border/70 bg-background py-5 px-3"
              >
                <span className="flex items-center justify-center w-10 h-10 rounded-full border border-accent/20 bg-accent/5 text-accent">
                  {TRUST_ICONS[i]}
                </span>
                <span className="text-label text-secondary leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="py-16 md:py-24 bg-background">
        <Container>
          <SectionHeading
            eyebrow={t.home.selection}
            title={t.home.sliderAllTitle}
            description={t.home.sliderAllDesc}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 max-w-4xl mx-auto">
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} compact priority={i === 0} />
            ))}
          </div>
          <div className="text-center mt-12">
            <Button href="/boutique" variant="outline" size="lg">
              {t.home.allCollection}
            </Button>
          </div>
        </Container>
      </section>

      <section className="bg-accent/5 border-y border-accent/15 py-14 md:py-16">
        <Container className="text-center max-w-2xl">
          <p className="text-label text-accent mb-3">{t.home.orderBandTitle}</p>
          <p className="font-serif text-2xl md:text-3xl text-foreground mb-4 leading-snug">
            {t.codShort}
          </p>
          <p className="text-body text-secondary mb-8">{t.home.orderBandDesc}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button href="/boutique" size="lg">{t.home.ctaOrder}</Button>
            <Button href="/livraison" variant="outline">التوصيل والدفع</Button>
          </div>
        </Container>
      </section>

      <section className="py-14 md:py-20 bg-surface border-b border-border">
        <Container>
          <SectionHeading
            eyebrow={t.footer.trust}
            title={t.home.trustTitle}
            description={t.home.trustDesc}
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { href: "/livraison", title: t.legal.shipping.title, desc: "توصيل لجميع المغرب" },
              { href: "/faq", title: t.legal.faq.title, desc: "إجابات واضحة ومباشرة" },
              { href: "/confidentialite", title: t.legal.privacy.title, desc: "بياناتك محمية" },
              { href: "/conditions", title: t.legal.terms.title, desc: "شروط شفافة وعادلة" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="panel-trust p-5 hover:border-accent/40 transition-colors group"
              >
                <h3 className="font-serif text-lg text-foreground group-hover:text-accent transition-colors mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-secondary">{item.desc}</p>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-surface border-b border-border py-16 md:py-24">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center max-w-5xl mx-auto">
            <div className="rounded-2xl border border-border bg-background overflow-hidden shadow-sm product-stage">
              <ProductImage
                src={heroProduct.imageUrl}
                alt={`مجموعة ${BRAND.arabicName}`}
                hero
              />
            </div>
            <div>
              <SectionHeading
                eyebrow={t.home.aboutEyebrow}
                title={t.home.aboutTitle}
                description={t.home.aboutDesc}
                align="left"
              />
              <Button href="/a-propos" variant="outline">
                {t.home.ourStory}
              </Button>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-16 md:py-20 bg-muted/40">
        <Container>
          <blockquote className="max-w-2xl mx-auto text-center">
            <div className="gold-line gold-line-center mb-8 opacity-50" aria-hidden />
            <p className="font-serif text-2xl md:text-[2rem] text-foreground font-light leading-relaxed text-balance">
              {t.home.quote}
            </p>
            <footer className="mt-8 text-label text-accent tracking-widest">— {BRAND.arabicName}</footer>
          </blockquote>
        </Container>
      </section>

      <section className="py-16 md:py-24 bg-surface border-t border-border">
        <Container className="text-center max-w-xl mx-auto">
          <div className="gold-line gold-line-center mb-6" aria-hidden />
          <h2 className="font-serif text-display-sm text-foreground mb-5">
            {t.home.finalCtaTitle}
          </h2>
          <p className="text-body text-secondary mb-10">{t.home.finalCtaDesc}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button href="/boutique" size="lg">{t.home.ctaCollection}</Button>
            <Button href={CONTACT.whatsapp} variant="outline">
              {t.home.ctaWhatsapp}
            </Button>
            <Button href={`tel:${CONTACT.phoneTel}`} variant="outline">
              {t.home.ctaCall}
            </Button>
          </div>
          <p className="mt-8 text-sm text-secondary" dir="ltr">
            {CONTACT.phone}
          </p>
        </Container>
      </section>
    </>
  );
}

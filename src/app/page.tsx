import { getProducts } from "@/lib/products";
import { HomeHeroSlider } from "@/components/HomeHeroSlider";
import { ProductCard } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { SectionHeading } from "@/components/SectionHeading";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { BRAND, CONTACT } from "@/lib/config";
import { t } from "@/lib/i18n";

export default async function HomePage() {
  const products = await getProducts();
  const heroProduct = products[0];

  return (
    <>
      <HomeHeroSlider slides={products} />

      <section className="bg-surface border-b border-border" aria-label="ضماناتنا">
        <Container className="py-6 md:py-7">
          <ul className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {t.trust.map((item) => (
              <li
                key={item}
                className="text-center text-label text-secondary border border-border/60 rounded-xl py-3 px-2 bg-background"
              >
                {item}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="py-14 md:py-20 bg-surface">
        <Container>
          <SectionHeading
            eyebrow={t.home.selection}
            title={t.home.sliderAllTitle}
            description={t.home.sliderAllDesc}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 md:gap-6 max-w-4xl mx-auto">
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} compact priority={i === 0} />
            ))}
          </div>
          <div className="text-center mt-10">
            <Button href="/boutique" variant="outline">
              {t.home.allCollection}
            </Button>
          </div>
        </Container>
      </section>

      <section className="bg-accent/5 border-y border-accent/20">
        <Container className="py-10 md:py-12 text-center max-w-2xl">
          <p className="text-label text-accent mb-3">{t.home.orderBandTitle}</p>
          <p className="font-serif text-2xl md:text-3xl text-foreground mb-4">
            {t.codShort}
          </p>
          <p className="text-body text-secondary mb-8">{t.home.orderBandDesc}</p>
          <Button href="/boutique">{t.home.ctaOrder}</Button>
        </Container>
      </section>

      <section className="bg-background border-b border-border py-14 md:py-20">
        <Container>
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="rounded-2xl border border-border bg-background overflow-hidden">
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

      <section className="py-14 md:py-16 bg-muted/50">
        <Container>
          <blockquote className="max-w-2xl mx-auto text-center">
            <p className="font-serif text-2xl md:text-3xl text-foreground font-light leading-snug text-balance">
              {t.home.quote}
            </p>
            <footer className="mt-6 text-label text-accent">— {BRAND.arabicName}</footer>
          </blockquote>
        </Container>
      </section>

      <section className="py-14 md:py-20 bg-surface border-t border-border">
        <Container className="text-center max-w-xl mx-auto">
          <h2 className="font-serif text-display-sm text-foreground mb-4">
            {t.home.finalCtaTitle}
          </h2>
          <p className="text-body text-secondary mb-8">{t.home.finalCtaDesc}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button href="/boutique">{t.home.ctaCollection}</Button>
            <Button href={CONTACT.whatsapp} variant="outline">
              {t.home.ctaWhatsapp}
            </Button>
            <Button href={`tel:${CONTACT.phoneTel}`} variant="outline">
              {t.home.ctaCall}
            </Button>
          </div>
          <p className="mt-6 text-sm text-secondary" dir="ltr">
            {CONTACT.phone}
          </p>
        </Container>
      </section>
    </>
  );
}

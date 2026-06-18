import { ProductImage } from "@/components/ProductImage";
import { SectionHeading } from "@/components/SectionHeading";
import { Container } from "@/components/ui/Container";
import { BRAND } from "@/lib/config";
import { t } from "@/lib/i18n";

export const metadata = { title: "عن هاجسي" };

export default function AboutPage() {
  return (
    <div className="bg-background pb-20">
      <Container className="pt-10 md:pt-14">
        <SectionHeading
          eyebrow={t.about.eyebrow}
          title={t.about.title}
          description={t.about.description}
        />
      </Container>

      <Container>
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <ProductImage
            src="/images/perfumes/studio/niqaa.png"
            alt={`مجموعة ${BRAND.name}`}
            large
          />
          <div className="space-y-5 text-body text-secondary lg:pt-8">
            <p>
              {t.about.p1}{" "}
              <strong className="text-foreground font-medium">{BRAND.arabicName}</strong>{" "}
              {t.about.p1b}
            </p>
            <p>{t.about.p2}</p>
            <p>{t.about.p3}</p>
            <p className="font-serif text-xl text-foreground pt-4">
              {BRAND.arabicName} — {BRAND.taglineAr}
            </p>
            <p className="text-label text-accent pt-2">{t.cod}</p>
          </div>
        </div>
      </Container>
    </div>
  );
}

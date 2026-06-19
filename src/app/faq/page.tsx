import { LegalPage } from "@/components/LegalPage";
import { t } from "@/lib/i18n";

export const metadata = { title: t.legal.faq.title };

export default function FaqPage() {
  const p = t.legal.faq;
  return (
    <LegalPage
      eyebrow={p.eyebrow}
      title={p.title}
      description={p.description}
      sections={p.sections}
    />
  );
}

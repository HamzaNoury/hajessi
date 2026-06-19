import { LegalPage } from "@/components/LegalPage";
import { t } from "@/lib/i18n";

export const metadata = { title: t.legal.terms.title };

export default function TermsPage() {
  const p = t.legal.terms;
  return (
    <LegalPage
      eyebrow={p.eyebrow}
      title={p.title}
      description={p.description}
      sections={p.sections}
    />
  );
}

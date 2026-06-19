import { LegalPage } from "@/components/LegalPage";
import { t } from "@/lib/i18n";

export const metadata = { title: t.legal.privacy.title };

export default function PrivacyPage() {
  const p = t.legal.privacy;
  return (
    <LegalPage
      eyebrow={p.eyebrow}
      title={p.title}
      description={p.description}
      sections={p.sections}
    />
  );
}

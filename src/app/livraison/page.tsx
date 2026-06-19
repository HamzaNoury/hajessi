import { LegalPage } from "@/components/LegalPage";
import { t } from "@/lib/i18n";

export const metadata = { title: t.legal.shipping.title };

export default function ShippingPage() {
  const p = t.legal.shipping;
  return (
    <LegalPage
      eyebrow={p.eyebrow}
      title={p.title}
      description={p.description}
      sections={p.sections}
    />
  );
}

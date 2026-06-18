"use client";

import { useState } from "react";
import { SectionHeading } from "@/components/SectionHeading";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { CONTACT } from "@/lib/config";
import { t } from "@/lib/i18n";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          message: form.get("message"),
        }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
    } catch {
      setError(t.contact.error);
    } finally {
      setLoading(false);
    }
  }

  const contactItems = [
    { label: t.contact.address, value: t.contact.addressValue },
    {
      label: t.contact.phone,
      value: CONTACT.phone,
      href: `tel:${CONTACT.phoneTel}`,
    },
    {
      label: t.contact.facebook,
      value: "HAJESSI",
      href: CONTACT.facebook,
    },
  ] as const;

  return (
    <div className="bg-background pb-20">
      <Container className="pt-10 md:pt-14">
        <SectionHeading
          eyebrow={t.contact.eyebrow}
          title={t.contact.title}
          description={t.contact.description}
        />
      </Container>

      <Container>
        <div className="grid lg:grid-cols-2 gap-14 max-w-5xl mx-auto">
          <address className="not-italic space-y-8">
            {contactItems.map((item) => (
              <div key={item.label}>
                <p className="text-label text-accent mb-2">{item.label}</p>
                {"href" in item && item.href ? (
                  <a
                    href={item.href}
                    target={item.href.startsWith("tel:") ? undefined : "_blank"}
                    rel={item.href.startsWith("tel:") ? undefined : "noopener noreferrer"}
                    className="text-secondary font-light hover:text-accent transition-colors"
                    dir={item.href.startsWith("tel:") ? "ltr" : undefined}
                  >
                    {item.value}
                  </a>
                ) : (
                  <p className="text-secondary font-light">{item.value}</p>
                )}
              </div>
            ))}
          </address>

          <div>
            {sent ? (
              <div className="bg-surface border border-border p-10 text-center" role="status">
                <p className="font-serif text-2xl text-foreground mb-2">{t.contact.sent}</p>
                <p className="text-secondary text-sm">{t.contact.sentDesc}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-7" noValidate>
                <div>
                  <label htmlFor="name" className="text-label block mb-2">
                    {t.contact.name} <span className="text-accent">*</span>
                  </label>
                  <input id="name" name="name" required className="field-input" />
                </div>
                <div>
                  <label htmlFor="email" className="text-label block mb-2">
                    {t.contact.email} <span className="text-accent">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    className="field-input"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="text-label block mb-2">
                    {t.contact.message} <span className="text-accent">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    className="field-input resize-none"
                  />
                </div>
                {error && (
                  <p className="text-destructive text-sm" role="alert">
                    {error}
                  </p>
                )}
                <Button type="submit" disabled={loading}>
                  {loading ? t.contact.sending : t.contact.send}
                </Button>
              </form>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}

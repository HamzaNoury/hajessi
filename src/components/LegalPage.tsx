import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/SectionHeading";

interface LegalPageProps {
  eyebrow: string;
  title: string;
  description?: string;
  sections: readonly { title: string; body: string }[];
}

export function LegalPage({ eyebrow, title, description, sections }: LegalPageProps) {
  return (
    <div className="bg-background pb-20">
      <Container className="pt-10 md:pt-14 max-w-3xl">
        <SectionHeading eyebrow={eyebrow} title={title} description={description} />
        <div className="space-y-10">
          {sections.map((section) => (
            <section key={section.title} className="panel-trust p-6 md:p-8">
              <h2 className="font-serif text-xl text-foreground mb-4">{section.title}</h2>
              <p className="text-body text-secondary leading-relaxed whitespace-pre-line">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </Container>
    </div>
  );
}

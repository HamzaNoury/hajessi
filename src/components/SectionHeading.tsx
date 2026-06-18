interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  inverted?: boolean;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  inverted = false,
}: SectionHeadingProps) {
  return (
    <div
      className={`mb-12 md:mb-16 ${align === "center" ? "text-center mx-auto max-w-2xl" : ""}`}
    >
      <p
        className={`text-label mb-3 ${inverted ? "text-white/50" : "text-accent"}`}
      >
        {eyebrow}
      </p>
      <h2
        className={`font-serif text-display-sm md:text-display text-balance ${
          inverted ? "text-white" : "text-foreground"
        }`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`mt-4 text-body leading-relaxed ${
            inverted ? "text-white/60" : "text-secondary"
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
}

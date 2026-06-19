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
  const centered = align === "center";

  return (
    <div
      className={`mb-12 md:mb-16 ${centered ? "text-center mx-auto max-w-2xl" : ""}`}
    >
      <p
        className={`text-label mb-3 tracking-widest uppercase ${
          inverted ? "text-white/50" : "text-accent"
        }`}
      >
        {eyebrow}
      </p>
      <div
        className={`gold-line mb-5 ${centered ? "gold-line-center" : ""}`}
        aria-hidden
      />
      <h2
        className={`font-serif text-display-sm md:text-[2.75rem] text-balance leading-tight ${
          inverted ? "text-white" : "text-foreground"
        }`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`mt-5 text-body leading-relaxed max-w-lg ${
            centered ? "mx-auto" : ""
          } ${inverted ? "text-white/60" : "text-secondary"}`}
        >
          {description}
        </p>
      )}
    </div>
  );
}

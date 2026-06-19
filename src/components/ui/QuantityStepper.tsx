interface QuantityStepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  label?: string;
}

export function QuantityStepper({
  value,
  min = 1,
  max = 99,
  onChange,
  label,
}: QuantityStepperProps) {
  return (
    <div className="inline-flex items-center rounded-full border border-border bg-surface overflow-hidden">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="qty-btn"
        aria-label="تقليل"
      >
        −
      </button>
      <span
        className="min-w-[3rem] text-center tabular-nums font-medium text-sm"
        aria-live="polite"
        {...(label ? { "aria-label": label } : {})}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="qty-btn"
        aria-label="زيادة"
      >
        +
      </button>
    </div>
  );
}

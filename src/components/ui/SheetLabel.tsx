interface SheetLabelProps {
  sheet: string;
  title: string;
  className?: string;
}

/** The drawing-set device: each section is a numbered sheet in one set of plans. */
export function SheetLabel({ sheet, title, className = "" }: SheetLabelProps) {
  return (
    <p data-reveal="rise" className={`label flex items-center gap-3 ${className}`}>
      <span className="text-paper shrink-0">Sheet {sheet}</span>
      <span aria-hidden="true" className="bg-line-strong h-px w-10 shrink-0" />
      <span>{title}</span>
    </p>
  );
}

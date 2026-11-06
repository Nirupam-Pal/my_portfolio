interface SectionLabelProps {
  index: string;
  title: string;
  className?: string;
}

/** Numbers each section, in the order the story passes through the system. */
export function SectionLabel({ index, title, className = "" }: SectionLabelProps) {
  return (
    <p data-reveal="rise" className={`label flex items-center gap-3 ${className}`}>
      <span className="text-paper shrink-0">{index}</span>
      <span aria-hidden="true" className="bg-line-strong h-px w-10 shrink-0" />
      <span>{title}</span>
    </p>
  );
}

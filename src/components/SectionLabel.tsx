type Props = {
  children: React.ReactNode;
  /** Optional count shown on the right, used by the main list. */
  count?: number;
};

/** The small heading above the favourites grid and the bookmark list. */
export function SectionLabel({ children, count }: Props) {
  return (
    <h2 className="flex items-baseline justify-between px-3 pb-1.5 text-[11px] text-faint">
      <span>{children}</span>
      {count !== undefined && <span className="font-mono text-[10px]">{count}</span>}
    </h2>
  );
}

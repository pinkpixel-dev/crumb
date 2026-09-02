import { forwardRef } from "react";
import { Search, X } from "lucide-react";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export const SearchBar = forwardRef<HTMLInputElement, Props>(function SearchBar(
  { value, onChange },
  ref,
) {
  return (
    <div className="relative flex-1">
      <Search
        size={14}
        className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-faint"
        aria-hidden="true"
      />
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search bookmarks"
        aria-label="Search bookmarks"
        autoComplete="off"
        spellCheck={false}
        className="h-8 w-full rounded-md border border-line bg-surface pr-7 pl-7.5 text-ink
                   placeholder:text-faint focus:border-line-strong"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          title="Clear search"
          className="absolute top-1/2 right-1.5 grid size-5 -translate-y-1/2 place-items-center
                     rounded text-faint transition-colors hover:bg-hover hover:text-ink"
        >
          <X size={12} aria-hidden="true" />
        </button>
      )}
    </div>
  );
});

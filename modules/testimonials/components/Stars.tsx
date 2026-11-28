import { StarIcon } from "lucide-react";

/** 1–5 csillagos értékelés megjelenítése. */
export function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex" aria-label={`${value}/5`} title={`${value}/5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon
          key={n}
          aria-hidden
          className={
            n <= value
              ? "size-3.5 fill-amber-400 text-amber-400"
              : "text-muted-foreground/40 size-3.5"
          }
        />
      ))}
    </span>
  );
}

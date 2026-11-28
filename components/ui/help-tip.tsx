import { CircleHelpIcon } from "lucide-react";
import { Popover } from "radix-ui";
import { cn } from "@/lib/utils";

type Props = {
  /** A magyarázat (rövid bekezdések; a `\n\n` új bekezdést kezd). */
  children: string;
  /** Mihez tartozik – a gomb akadálymentes neve: „Súgó: <label>”. */
  label: string;
  className?: string;
};

/**
 * Kis „?” gomb egy mező mellett. Kattintásra/érintésre (mobilon is) és
 * billentyűzettel nyílik; a képernyőolvasó a gomb nevét és a szöveget is
 * felolvassa. Hover-tooltip helyett popover, mert érintőképernyőn az nem működik.
 */
export function HelpTip({ children, label, className }: Props) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={`Súgó: ${label}`}
          className={cn(
            "text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 inline-flex size-4 shrink-0 items-center justify-center rounded-full align-middle outline-none focus-visible:ring-3",
            className
          )}
        >
          <CircleHelpIcon className="size-3.5" aria-hidden />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="top"
          align="start"
          sideOffset={6}
          collisionPadding={12}
          className="bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=open]:fade-in-0 z-[60] flex max-w-[min(20rem,calc(100vw-2rem))] flex-col gap-2 rounded-lg border p-3 text-xs leading-relaxed shadow-md"
        >
          <p className="font-semibold">{label}</p>
          {children.split("\n\n").map((para, i) => (
            <p key={i}>{para}</p>
          ))}
          <Popover.Arrow className="fill-popover" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

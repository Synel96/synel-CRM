import { BedDoubleIcon, HouseIcon, MapPinIcon, RulerIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { rt } from "../i18n";
import { formatPrice } from "../format";
import { shortAddress } from "../logic";
import type { Property, PropertyStatus } from "../types";

const STATUS_VARIANT: Record<PropertyStatus, "accent" | "success" | "outline" | "default"> = {
  draft: "outline",
  active: "accent",
  reserved: "default",
  sold: "success",
  rented: "success",
  withdrawn: "outline",
};

export function StatusBadge({ status }: { status: PropertyStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{rt(`status.${status}`)}</Badge>;
}

type Props = { property: Property; matchCount: number; onOpen: () => void };

export function PropertyCard({ property: p, matchCount, onOpen }: Props) {
  const cover = p.photos[0];
  const rooms = (p.roomCount ?? 0) + (p.halfRoomCount ? ` + ${p.halfRoomCount}` : "");
  return (
    <li className="bg-card flex flex-col overflow-hidden rounded-xl border shadow-xs">
      <button
        type="button"
        onClick={onOpen}
        className="group flex flex-1 flex-col text-left"
        aria-label={p.title}
      >
        <div className="bg-muted relative aspect-[16/10] overflow-hidden">
          {cover ? (
            <img
              src={cover.url}
              alt={cover.caption || p.title}
              loading="lazy"
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="text-muted-foreground flex size-full flex-col items-center justify-center gap-1 text-xs">
              <HouseIcon className="size-8 opacity-40" />
              {rt("list.noPhoto")}
            </div>
          )}
          <span className="absolute top-2 left-2 flex gap-1">
            <StatusBadge status={p.status} />
            <Badge className="bg-background/90">{rt(`listing.${p.listingType}`)}</Badge>
          </span>
          {matchCount > 0 && (
            <Badge variant="success" className="absolute top-2 right-2 bg-emerald-600 text-white">
              {matchCount} {rt("match.count")}
            </Badge>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-3">
          <p className="text-base font-semibold tabular-nums">{formatPrice(p)}</p>
          <p className="line-clamp-2 text-sm font-medium group-hover:text-(--crm-accent)">
            {p.title}
          </p>
          <p className="text-muted-foreground flex items-center gap-1 text-xs">
            <MapPinIcon className="size-3.5 shrink-0" />
            <span className="truncate">{shortAddress(p, false) || "—"}</span>
          </p>
          <div className="text-muted-foreground mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs">
            <span>{rt(`type.${p.propertyType}`)}</span>
            {p.areaSize !== null && (
              <span className="flex items-center gap-1">
                <RulerIcon className="size-3.5" /> {p.areaSize} m²
              </span>
            )}
            {p.roomCount !== null && (
              <span className="flex items-center gap-1">
                <BedDoubleIcon className="size-3.5" /> {rooms} {rt("list.rooms")}
              </span>
            )}
            <span className="ml-auto font-mono text-[10px]">{p.ownId}</span>
          </div>
        </div>
      </button>
    </li>
  );
}

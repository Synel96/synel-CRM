import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ContentSheet, type ContentTarget } from "@/components/crm/content/ContentSheet";
import { useContent } from "@/components/crm/content/useContent";
import type { ContentData, ContentItem } from "@/src/crm/content/logic";
import { useCrm } from "@/src/crm/store";
import type { Id } from "@/src/crm/types";
import { L, projectsDef } from "../def";

/** A projekt szerkesztőjében: a hozzá kapcsolt vélemények (ha a bővítmény aktív). */
export function ProjectTestimonials({ item }: { item: ContentItem }) {
  const { data } = useCrm();
  const testimonials = data.addons.testimonials as ContentData | undefined;
  if (!testimonials) return null;
  const linked = testimonials.items.filter((t) => t.projectId === item.id);
  return (
    <section className="flex flex-col gap-2 border-t pt-4">
      <h3 className="text-sm font-semibold">
        {L.testimonials}{" "}
        <span className="text-muted-foreground font-normal">({linked.length})</span>
      </h3>
      {linked.length === 0 ? (
        <p className="text-muted-foreground text-sm">{L.none}</p>
      ) : (
        <ul className="divide-y text-sm">
          {linked.map((t) => (
            <li key={t.id} className="py-1.5">
              <a href={`/testimonials?id=${t.id}`} className="hover:underline">
                „{String(t.text ?? "")}” – {t.title}
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** A kapcsolat adatlapján: projektek, ahol ő a kapcsolattartó vagy a cége az ügyfél. */
export function ProjectsContactPanel({ contactId }: { contactId: Id }) {
  const { content, data } = useContent(projectsDef);
  const [target, setTarget] = useState<ContentTarget | null>(null);
  const contact = data.contacts.find((c) => c.id === contactId);
  const items = content.items.filter(
    (p) => p.contactId === contactId || (contact?.companyId && p.companyId === contact.companyId)
  );
  const company = data.companies.find((c) => c.id === contact?.companyId);
  return (
    <section className="flex flex-col gap-2 border-t pt-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">
          {L.panel} <span className="text-muted-foreground font-normal">({items.length})</span>
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setTarget({
              mode: "new",
              defaults: {
                contactId,
                companyId: contact?.companyId ?? null,
                client: company?.name ?? "",
              },
            })
          }
        >
          <PlusIcon /> {L.singular}
        </Button>
      </div>
      {items.length > 0 && (
        <ul className="divide-y text-sm">
          {items.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 py-1.5">
              <button
                type="button"
                onClick={() => setTarget({ mode: "edit", id: p.id })}
                className="min-w-0 truncate text-left hover:underline"
              >
                {p.title}
              </button>
              <span className="text-muted-foreground shrink-0 text-xs">{String(p.year ?? "")}</span>
            </li>
          ))}
        </ul>
      )}
      <ContentSheet def={projectsDef} target={target} onClose={() => setTarget(null)} />
    </section>
  );
}

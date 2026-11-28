import { PlusIcon } from "lucide-react";
import { useState } from "react";
import crmConfig from "@/crm.config";
import { Button } from "@/components/ui/button";
import { ContentSheet, type ContentTarget } from "@/components/crm/content/ContentSheet";
import { useContent } from "@/components/crm/content/useContent";
import { contactName } from "@/src/crm/operations";
import type { Id } from "@/src/crm/types";
import { L, rating, testimonialsDef } from "../def";
import { Stars } from "./Stars";

/** A kapcsolat adatlapján: tőle származó vélemények + új felvétele. */
export function TestimonialsContactPanel({ contactId }: { contactId: Id }) {
  const { content, data } = useContent(testimonialsDef);
  const [target, setTarget] = useState<ContentTarget | null>(null);
  const items = content.items.filter((i) => i.contactId === contactId);
  const contact = data.contacts.find((c) => c.id === contactId);
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
                title: contact ? contactName(contact, crmConfig.locale) : "",
                authorRole: contact?.jobTitle ?? "",
              },
            })
          }
        >
          <PlusIcon /> {L.add}
        </Button>
      </div>
      {items.length > 0 && (
        <ul className="divide-y text-sm">
          {items.map((i) => (
            <li key={i.id} className="flex items-start justify-between gap-3 py-1.5">
              <button
                type="button"
                onClick={() => setTarget({ mode: "edit", id: i.id })}
                className="min-w-0 text-left hover:underline"
              >
                <span className="line-clamp-2">„{String(i.text ?? "")}”</span>
              </button>
              <Stars value={rating(i)} />
            </li>
          ))}
        </ul>
      )}
      <ContentSheet def={testimonialsDef} target={target} onClose={() => setTarget(null)} />
    </section>
  );
}

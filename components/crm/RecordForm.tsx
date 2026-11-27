import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, NativeSelect, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { t } from "@/src/crm/i18n";
import { validate, type FormField, type FormValues } from "@/src/crm/fields";

type Props = {
  fields: FormField[];
  initialValues: FormValues;
  onSubmit: (values: FormValues) => void;
  onCancel?: () => void;
  onDelete?: () => void;
};

const INPUT_TYPE: Record<string, string> = {
  text: "text",
  email: "email",
  phone: "tel",
  url: "url",
  date: "date",
  number: "text",
  money: "text",
};

export function RecordForm({ fields, initialValues, onSubmit, onCancel, onDelete }: Props) {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formId = useId();

  const set = (name: string, value: string | boolean) => {
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors(({ [name]: _removed, ...rest }) => rest);
  };

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const errs = validate(values, fields);
        setErrors(errs);
        if (Object.keys(errs).length === 0) onSubmit(values);
      }}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {fields.map((f) => {
          const id = `${formId}-${f.name}`;
          const error = errors[f.name];
          const value = values[f.name];
          return (
            <div key={f.name} className={cn("flex flex-col gap-1.5", f.wide && "sm:col-span-2")}>
              {f.type === "boolean" ? (
                <label htmlFor={id} className="flex items-center gap-2 text-sm">
                  <input
                    id={id}
                    type="checkbox"
                    checked={value === true}
                    onChange={(e) => set(f.name, e.target.checked)}
                    className="size-4 accent-(--crm-accent)"
                  />
                  {f.label}
                </label>
              ) : (
                <>
                  <Label htmlFor={id}>
                    {f.label}
                    {f.required && <span className="text-destructive"> *</span>}
                  </Label>
                  <FieldInput field={f} id={id} value={String(value ?? "")} onChange={set} />
                </>
              )}
              {error && <p className="text-destructive text-xs">{error}</p>}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" className="bg-(--crm-accent) text-white hover:bg-(--crm-accent)/85">
          {t("common.save")}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
        )}
        {onDelete && (
          <Button
            type="button"
            variant="destructive"
            className="ml-auto"
            onClick={() => {
              if (window.confirm(t("common.confirmDelete"))) onDelete();
            }}
          >
            {t("common.delete")}
          </Button>
        )}
      </div>
    </form>
  );
}

function FieldInput({
  field: f,
  id,
  value,
  onChange,
}: {
  field: FormField;
  id: string;
  value: string;
  onChange: (name: string, value: string) => void;
}) {
  if (f.type === "textarea") {
    return <Textarea id={id} value={value} onChange={(e) => onChange(f.name, e.target.value)} />;
  }
  if (f.type === "select" || f.type === "relation") {
    return (
      <NativeSelect id={id} value={value} onChange={(e) => onChange(f.name, e.target.value)}>
        {(f.type === "relation" || !f.required) && <option value="">{t("common.none")}</option>}
        {f.type === "select" && f.required && value === "" && <option value="" disabled />}
        {f.options?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </NativeSelect>
    );
  }
  if (f.type === "tags") {
    const selected = value
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    const toggle = (tag: string) => {
      const next = selected.includes(tag) ? selected.filter((x) => x !== tag) : [...selected, tag];
      onChange(f.name, next.join(", "));
    };
    return (
      <div className="flex flex-col gap-2">
        {f.options && f.options.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {f.options.map((o) => (
              <button
                key={o.value}
                type="button"
                aria-pressed={selected.includes(o.value)}
                onClick={() => toggle(o.value)}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
                  selected.includes(o.value)
                    ? "border-transparent bg-(--crm-accent) text-white"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        )}
        <Input id={id} value={value} onChange={(e) => onChange(f.name, e.target.value)} />
      </div>
    );
  }
  return (
    <Input
      id={id}
      type={INPUT_TYPE[f.type] ?? "text"}
      inputMode={f.type === "number" || f.type === "money" ? "decimal" : undefined}
      value={value}
      onChange={(e) => onChange(f.name, e.target.value)}
    />
  );
}

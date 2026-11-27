import crmConfig from "@/crm.config";
import { customFieldsOf } from "@/src/crm/config";
import { customToFormField, type FormField } from "@/src/crm/fields";
import { contactName } from "@/src/crm/operations";
import type { CrmData } from "@/src/crm/types";
import { rt, type ReKey } from "./i18n";
import {
  CONDITIONS,
  HEATING_TYPES,
  LISTING_TYPES,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
} from "./types";

const options = (values: readonly string[], prefix: string) =>
  values.map((v) => ({ value: v, label: rt(`${prefix}.${v}` as ReKey) }));

const f = (
  name: string,
  labelKey: ReKey,
  type: FormField["type"],
  extra: Partial<FormField> = {}
): FormField => ({ name, label: rt(labelKey), type, required: false, ...extra });

function contactOptions(core: CrmData) {
  return core.contacts
    .map((c) => ({ value: c.id, label: contactName(c, crmConfig.locale) }))
    .sort((a, b) => a.label.localeCompare(b.label, crmConfig.locale));
}

export function propertyFields(core: CrmData): FormField[] {
  return [
    f("title", "f.title", "text", { required: true, wide: true }),
    f("listingType", "f.listingType", "select", {
      required: true,
      options: options(LISTING_TYPES, "listing"),
    }),
    f("propertyType", "f.propertyType", "select", {
      required: true,
      options: options(PROPERTY_TYPES, "type"),
    }),
    f("status", "f.status", "select", {
      required: true,
      options: options(PROPERTY_STATUSES, "status"),
    }),
    f("price", "f.price", "money", { required: true, hint: rt("f.priceHint") }),
    f("city", "f.city", "text", { required: true }),
    f("district", "f.district", "text"),
    f("street", "f.street", "text"),
    f("houseNumber", "f.houseNumber", "text"),
    f("hideAddress", "f.hideAddress", "boolean", { wide: true }),
    f("areaSize", "f.areaSize", "number", { nullable: true }),
    f("lotSize", "f.lotSize", "number", { nullable: true }),
    f("roomCount", "f.roomCount", "number", { nullable: true }),
    f("halfRoomCount", "f.halfRoomCount", "number", { nullable: true }),
    f("floor", "f.floor", "text"),
    f("condition", "f.condition", "relation", { options: options(CONDITIONS, "condition") }),
    f("heating", "f.heating", "relation", { options: options(HEATING_TYPES, "heating") }),
    f("hasElevator", "f.hasElevator", "boolean"),
    f("hasBalcony", "f.hasBalcony", "boolean"),
    f("description", "f.description", "textarea", { wide: true }),
    f("ownerContactId", "f.owner", "relation", { options: contactOptions(core), wide: true }),
    f("commissionPct", "f.commissionPct", "number", { nullable: true }),
    f("exclusive", "f.exclusive", "boolean"),
    f("ownId", "f.ownId", "text", { required: true, hint: rt("f.ownIdHint") }),
    ...customFieldsOf(crmConfig, "property").map(customToFormField),
    f("notes", "f.notes", "textarea", { wide: true }),
  ];
}

export function searchFields(core: CrmData): FormField[] {
  return [
    f("contactId", "f.contact", "relation", {
      required: true,
      options: contactOptions(core),
      wide: true,
    }),
    f("listingType", "f.listingType", "select", {
      required: true,
      options: options(LISTING_TYPES, "listing"),
    }),
    f("active", "f.active", "boolean"),
    f("propertyTypes", "f.propertyTypes", "tags", {
      options: options(PROPERTY_TYPES, "type"),
      optionsOnly: true,
      wide: true,
    }),
    f("cities", "f.cities", "tags", { wide: true, hint: rt("f.citiesHint") }),
    f("priceMin", "f.priceMin", "money", { nullable: true }),
    f("priceMax", "f.priceMax", "money", { nullable: true }),
    f("areaMin", "f.areaMin", "number", { nullable: true }),
    f("roomsMin", "f.roomsMin", "number", { nullable: true }),
    ...customFieldsOf(crmConfig, "buyerSearch").map(customToFormField),
    f("notes", "f.notes", "textarea", { wide: true }),
  ];
}

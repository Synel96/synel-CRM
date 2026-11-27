import crmConfig from "@/crm.config";

const hu = {
  "nav.dashboard": "Áttekintés",
  "nav.contacts": "Kapcsolatok",
  "nav.companies": "Cégek",
  "nav.deals": "Üzletek",
  "nav.tasks": "Feladatok",
  "nav.settings": "Beállítások",
  "nav.menu": "Menü",

  "common.new": "Új",
  "common.save": "Mentés",
  "common.cancel": "Mégse",
  "common.delete": "Törlés",
  "common.edit": "Szerkesztés",
  "common.search": "Keresés…",
  "common.none": "—",
  "common.yes": "Igen",
  "common.no": "Nem",
  "common.loading": "Betöltés…",
  "common.confirmDelete": "Biztosan törlöd? Ez nem vonható vissza.",
  "common.empty": "Még nincs itt semmi.",
  "common.noResults": "Nincs találat.",
  "common.required": "Kötelező mező",
  "common.invalidNumber": "Érvénytelen szám",
  "common.details": "Részletek",
  "common.moduleDisabled": "Ez a modul ennél az ügyfélnél ki van kapcsolva.",
  "common.saveError": "A mentés nem sikerült – ellenőrizd a böngésző tárhelyét.",

  "field.firstName": "Keresztnév",
  "field.lastName": "Vezetéknév",
  "field.name": "Név",
  "field.email": "E-mail",
  "field.phone": "Telefon",
  "field.jobTitle": "Beosztás",
  "field.company": "Cég",
  "field.contact": "Kapcsolattartó",
  "field.tags": "Címkék",
  "field.notes": "Megjegyzés",
  "field.website": "Weboldal",
  "field.address": "Cím",
  "field.industry": "Iparág",
  "field.title": "Megnevezés",
  "field.value": "Érték",
  "field.stage": "Fázis",
  "field.expectedCloseDate": "Várható zárás",
  "field.dueDate": "Határidő",
  "field.priority": "Prioritás",
  "field.related": "Kapcsolódik",

  "priority.low": "Alacsony",
  "priority.normal": "Normál",
  "priority.high": "Magas",

  "dashboard.contacts": "Kapcsolatok",
  "dashboard.openDeals": "Nyitott üzletek",
  "dashboard.pipeline": "Pipeline értéke",
  "dashboard.weighted": "Súlyozott érték",
  "dashboard.wonThisMonth": "Megnyert (e hónap)",
  "dashboard.overdue": "Lejárt feladat",
  "dashboard.byStage": "Pipeline fázisonként",
  "dashboard.upcomingTasks": "Közelgő feladatok",
  "dashboard.recentActivity": "Legutóbbi tevékenységek",

  "deals.board": "Tábla",
  "deals.dragHint": "Húzd a kártyákat a fázisok között.",

  "tasks.overdue": "Lejárt",
  "tasks.today": "Ma",
  "tasks.upcoming": "Később",
  "tasks.someday": "Határidő nélkül",
  "tasks.done": "Kész",
  "tasks.quickAdd": "Új feladat gyors felvétele…",

  "activity.title": "Tevékenységek",
  "activity.add": "Hozzáadás",
  "activity.placeholder": "Mi történt? (hívás, e-mail, találkozó, jegyzet)",
  "activity.note": "Jegyzet",
  "activity.call": "Hívás",
  "activity.email": "E-mail",
  "activity.meeting": "Találkozó",

  "settings.config": "Ügyfél-konfiguráció",
  "settings.configHint": "Ezek az értékek a crm.config.ts fájlból jönnek.",
  "settings.brand": "Márkanév",
  "settings.locale": "Nyelv",
  "settings.currency": "Pénznem",
  "settings.modules": "Modulok",
  "settings.pipeline": "Pipeline fázisok",
  "settings.customFields": "Egyedi mezők",
  "settings.addons": "Bővítmények",
  "settings.media": "Képtárhely",
  "settings.mediaLocal": "Böngésző (Cloudinary nincs beállítva)",
  "settings.data": "Adatok",
  "settings.dataHint": "Az adatok jelenleg ebben a böngészőben tárolódnak.",
  "settings.export": "Exportálás (JSON)",
  "settings.import": "Importálás (JSON)",
  "settings.importOk": "Az importálás sikerült.",
  "settings.importError": "Az importálás nem sikerült:",
  "settings.resetDemo": "Mintaadatok visszaállítása",
  "settings.clearAll": "Minden adat törlése",
  "settings.confirmReplace": "Ez felülírja a jelenlegi adatokat. Folytatod?",
} as const;

export type MessageKey = keyof typeof hu;

const en: Record<MessageKey, string> = {
  "nav.dashboard": "Overview",
  "nav.contacts": "Contacts",
  "nav.companies": "Companies",
  "nav.deals": "Deals",
  "nav.tasks": "Tasks",
  "nav.settings": "Settings",
  "nav.menu": "Menu",
  "common.new": "New",
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.delete": "Delete",
  "common.edit": "Edit",
  "common.search": "Search…",
  "common.none": "—",
  "common.yes": "Yes",
  "common.no": "No",
  "common.loading": "Loading…",
  "common.confirmDelete": "Delete this? This cannot be undone.",
  "common.empty": "Nothing here yet.",
  "common.noResults": "No results.",
  "common.required": "Required",
  "common.invalidNumber": "Invalid number",
  "common.details": "Details",
  "common.moduleDisabled": "This module is disabled for this client.",
  "common.saveError": "Saving failed – check the browser storage.",
  "field.firstName": "First name",
  "field.lastName": "Last name",
  "field.name": "Name",
  "field.email": "Email",
  "field.phone": "Phone",
  "field.jobTitle": "Job title",
  "field.company": "Company",
  "field.contact": "Contact",
  "field.tags": "Tags",
  "field.notes": "Notes",
  "field.website": "Website",
  "field.address": "Address",
  "field.industry": "Industry",
  "field.title": "Title",
  "field.value": "Value",
  "field.stage": "Stage",
  "field.expectedCloseDate": "Expected close",
  "field.dueDate": "Due date",
  "field.priority": "Priority",
  "field.related": "Related to",
  "priority.low": "Low",
  "priority.normal": "Normal",
  "priority.high": "High",
  "dashboard.contacts": "Contacts",
  "dashboard.openDeals": "Open deals",
  "dashboard.pipeline": "Pipeline value",
  "dashboard.weighted": "Weighted value",
  "dashboard.wonThisMonth": "Won (this month)",
  "dashboard.overdue": "Overdue tasks",
  "dashboard.byStage": "Pipeline by stage",
  "dashboard.upcomingTasks": "Upcoming tasks",
  "dashboard.recentActivity": "Recent activity",
  "deals.board": "Board",
  "deals.dragHint": "Drag cards between stages.",
  "tasks.overdue": "Overdue",
  "tasks.today": "Today",
  "tasks.upcoming": "Later",
  "tasks.someday": "No due date",
  "tasks.done": "Done",
  "tasks.quickAdd": "Quick add a task…",
  "activity.title": "Activity",
  "activity.add": "Add",
  "activity.placeholder": "What happened? (call, email, meeting, note)",
  "activity.note": "Note",
  "activity.call": "Call",
  "activity.email": "Email",
  "activity.meeting": "Meeting",
  "settings.config": "Client configuration",
  "settings.configHint": "These values come from crm.config.ts.",
  "settings.brand": "Brand name",
  "settings.locale": "Language",
  "settings.currency": "Currency",
  "settings.modules": "Modules",
  "settings.pipeline": "Pipeline stages",
  "settings.customFields": "Custom fields",
  "settings.addons": "Add-ons",
  "settings.media": "Image storage",
  "settings.mediaLocal": "Browser (Cloudinary not configured)",
  "settings.data": "Data",
  "settings.dataHint": "Data is currently stored in this browser.",
  "settings.export": "Export (JSON)",
  "settings.import": "Import (JSON)",
  "settings.importOk": "Import succeeded.",
  "settings.importError": "Import failed:",
  "settings.resetDemo": "Restore demo data",
  "settings.clearAll": "Delete all data",
  "settings.confirmReplace": "This will overwrite the current data. Continue?",
};

const dictionaries = { hu, en } as const;

const dict: Record<MessageKey, string> = dictionaries[crmConfig.locale];

/** A config `labels` mezője felülírja a menüpontok alapértelmezett nevét. */
export function t(key: MessageKey): string {
  if (key.startsWith("nav.")) {
    const override = crmConfig.labels[key.slice(4)];
    if (override) return override;
  }
  return dict[key];
}

/** Menüpont neve: config-felülírás, különben a megadott alapértelmezés. */
export function navLabel(id: string, fallback: string): string {
  return crmConfig.labels[id] ?? fallback;
}

export const locale = crmConfig.locale === "hu" ? "hu-HU" : "en-GB";

const money = new Intl.NumberFormat(locale, {
  style: "currency",
  currency: crmConfig.currency,
  maximumFractionDigits: 0,
});
const dateFmt = new Intl.DateTimeFormat(locale, {
  year: "numeric",
  month: "short",
  day: "numeric",
});
const dateTimeFmt = new Intl.DateTimeFormat(locale, {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export const formatMoney = (n: number) => money.format(n);

/** YYYY-MM-DD (helyi dátum) vagy ISO időbélyeg. */
export function formatDate(value: string | null) {
  if (!value) return t("common.none");
  const d = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
  return dateFmt.format(d);
}

export const formatDateTime = (iso: string) => dateTimeFmt.format(new Date(iso));

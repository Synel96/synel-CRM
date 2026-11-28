/*
 * A menü felépítése csoportokra bontva:
 *   (felül) Áttekintés · ÜZLET · TARTALOMKEZELÉS · RENDSZER
 * Egy csoport csak akkor jelenik meg, ha van benne menüpont. A bővítmények
 * a `group` mezővel döntik el, hova kerülnek (alapértelmezés: üzlet).
 */
import {
  BriefcaseIcon,
  Building2Icon,
  CheckSquareIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
import type { CrmAddon } from "./addons";
import type { CrmConfig } from "./config";
import { groupLabel, navLabel, t } from "./i18n";

/** Csoportok, amelyekbe bővítmény tehet menüpontot. */
export type NavGroup = "business" | "content";
export type NavSectionId = "top" | NavGroup | "system";

export type NavItem = { id: string; href: string; label: string; icon: LucideIcon };
export type NavSection = { id: NavSectionId; title: string | null; items: NavItem[] };

const ORDER: NavSectionId[] = ["top", "business", "content", "system"];

export function buildNav(config: CrmConfig, addons: CrmAddon[]): NavSection[] {
  const m = config.modules;
  const items: Record<NavSectionId, NavItem[]> = {
    top: [{ id: "dashboard", href: "/", label: t("nav.dashboard"), icon: LayoutDashboardIcon }],
    business: [
      { id: "contacts", href: "/contacts", label: t("nav.contacts"), icon: UsersIcon },
      ...(m.companies
        ? [{ id: "companies", href: "/companies", label: t("nav.companies"), icon: Building2Icon }]
        : []),
      ...(m.deals
        ? [{ id: "deals", href: "/deals", label: t("nav.deals"), icon: BriefcaseIcon }]
        : []),
      ...(m.tasks
        ? [{ id: "tasks", href: "/tasks", label: t("nav.tasks"), icon: CheckSquareIcon }]
        : []),
    ],
    content: [],
    system: [{ id: "settings", href: "/settings", label: t("nav.settings"), icon: SettingsIcon }],
  };

  for (const addon of addons) {
    for (const n of addon.nav()) {
      items[n.group ?? addon.group ?? "business"].push({
        id: n.id,
        href: n.href,
        label: navLabel(n.id, n.label),
        icon: n.icon,
      });
    }
  }

  return ORDER.filter((id) => items[id].length > 0).map((id) => ({
    id,
    title: id === "top" ? null : groupLabel(id),
    items: items[id],
  }));
}

/** Az aktív bővítmények csoportonként (pl. az Áttekintés widgetjeihez). */
export function addonsInGroup(addons: CrmAddon[], group: NavGroup): CrmAddon[] {
  return addons.filter((a) => (a.group ?? "business") === group);
}

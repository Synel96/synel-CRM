import {
  BriefcaseIcon,
  Building2Icon,
  CheckSquareIcon,
  LayoutDashboardIcon,
  MenuIcon,
  SettingsIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
import { useLayoutEffect, useState, type ReactNode } from "react";
import { usePageContext } from "vike-react/usePageContext";
import crmConfig from "@/crm.config";
import { Button } from "@/components/ui/button";
import {
  PushDrawer,
  PushDrawerBody,
  PushDrawerClose,
  PushDrawerContent,
  PushDrawerTitle,
  PushDrawerTrigger,
} from "@/components/ui/push-drawer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import { t } from "@/src/crm/i18n";
import { useCrm } from "@/src/crm/store";

type NavItem = { href: string; label: string; icon: LucideIcon };

function navItems(): NavItem[] {
  const m = crmConfig.modules;
  return [
    { href: "/", label: t("nav.dashboard"), icon: LayoutDashboardIcon },
    { href: "/contacts", label: t("nav.contacts"), icon: UsersIcon },
    ...(m.companies
      ? [{ href: "/companies", label: t("nav.companies"), icon: Building2Icon }]
      : []),
    ...(m.deals ? [{ href: "/deals", label: t("nav.deals"), icon: BriefcaseIcon }] : []),
    ...(m.tasks ? [{ href: "/tasks", label: t("nav.tasks"), icon: CheckSquareIcon }] : []),
    { href: "/settings", label: t("nav.settings"), icon: SettingsIcon },
  ];
}

function NavLinks({ onNavigate }: { onNavigate?: boolean }) {
  const { urlPathname } = usePageContext();
  const isActive = (href: string) =>
    href === "/" ? urlPathname === "/" : urlPathname.startsWith(href);

  return (
    <nav className="flex flex-col gap-0.5" aria-label={t("nav.menu")}>
      {navItems().map(({ href, label, icon: Icon }) => {
        const link = (
          <a
            key={href}
            href={href}
            aria-current={isActive(href) ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
              isActive(href)
                ? "bg-(--crm-accent)/12 font-medium text-(--crm-accent)"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {label}
          </a>
        );
        return onNavigate ? (
          <PushDrawerClose asChild key={href}>
            {link}
          </PushDrawerClose>
        ) : (
          link
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <a href="/" className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="flex size-7 items-center justify-center rounded-lg bg-(--crm-accent) text-xs text-white">
        {crmConfig.brand.name.slice(0, 1)}
      </span>
      {crmConfig.brand.name}
    </a>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { urlPathname } = usePageContext();
  const [menuPathname, setMenuPathname] = useState(urlPathname);
  if (menuPathname !== urlPathname) {
    setMenuPathname(urlPathname);
    setMenuOpen(false);
  }
  const { error } = useCrm();

  // A kiemelőszín a dokumentum gyökerén él, hogy a portálon renderelt
  // elemek (Sheet, Dialog, mobilmenü) is lássák.
  useLayoutEffect(() => {
    document.documentElement.style.setProperty("--crm-accent", crmConfig.brand.accentColor);
  }, []);

  return (
    <div className="flex min-h-screen">
      <a href="#page-content" className="skip-link">
        Skip to content
      </a>

      {/* Asztali oldalsáv */}
      <aside className="bg-sidebar sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-6 border-r p-4 md:flex">
        <Brand />
        <NavLinks />
        <div className="mt-auto">
          <ThemeToggle />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobil fejléc */}
        <header className="bg-background/95 sticky top-0 z-30 flex h-14 items-center justify-between border-b px-4 backdrop-blur md:hidden">
          <Brand />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <PushDrawer open={menuOpen} onOpenChange={setMenuOpen}>
              <PushDrawerTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={t("nav.menu")}>
                  <MenuIcon className="size-5" />
                </Button>
              </PushDrawerTrigger>
              <PushDrawerContent
                open={menuOpen}
                closeLabel={t("common.cancel")}
                aria-describedby={undefined}
                className="bg-sidebar"
              >
                <PushDrawerTitle className="sr-only">{t("nav.menu")}</PushDrawerTitle>
                <div className="mt-12 px-3">
                  <NavLinks onNavigate />
                </div>
              </PushDrawerContent>
            </PushDrawer>
          </div>
        </header>

        <PushDrawerBody open={menuOpen} className="flex flex-1 flex-col">
          {error && (
            <div role="alert" className="bg-destructive/10 text-destructive px-4 py-2 text-sm">
              {t("common.saveError")}
            </div>
          )}
          <main id="page-content" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-8">
            {children}
          </main>
        </PushDrawerBody>
      </div>
    </div>
  );
}

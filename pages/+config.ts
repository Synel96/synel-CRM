import type { Config } from "vike/types";
import vikeReact from "vike-react/config";

// https://vike.dev/config
const config: Config = {
  // A CRM belső alkalmazás: nincs szükség SSR-re/SEO-ra, minden a böngészőben
  // renderelődik (CSR). Az adatok is kliensoldalon élnek (src/crm/store.ts).
  ssr: false,

  // Buildkor minden oldalhoz egy üres HTML-héj készül, így statikus
  // hostingon (Vercel) szerver nélkül fut. https://vike.dev/prerender
  prerender: true,

  // Az oldalcímet a <CrmPage> állítja be a crm.config márkanevével.
  title: "CRM",

  extends: [vikeReact],
};

export default config;

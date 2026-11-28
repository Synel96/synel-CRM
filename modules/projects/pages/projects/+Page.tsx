import { ContentListPage } from "@/components/crm/content/ContentListPage";
import { ProjectTestimonials } from "../../components/ProjectPanels";
import { projectsDef } from "../../def";

const def = { ...projectsDef, Extra: ProjectTestimonials };

export default function Page() {
  return <ContentListPage def={def} />;
}

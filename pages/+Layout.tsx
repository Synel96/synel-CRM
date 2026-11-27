import "./Layout.css";
import { AppShell } from "../components/crm/AppShell";
import { PageLoading } from "../components/PageLoading";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageLoading />
      <AppShell>{children}</AppShell>
    </>
  );
}

import { PublicShell } from "@/components/public/public-shell";
import { loadPublicLayoutData } from "@/lib/public-home-data";

type PublicLayoutProps = {
  children: React.ReactNode;
};

export default async function PublicLayout({ children }: PublicLayoutProps) {
  const layoutData = await loadPublicLayoutData();

  return <PublicShell {...layoutData}>{children}</PublicShell>;
}

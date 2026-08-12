import { PublicShell } from "@/components/public/public-shell";
import { loadPublicPensionName } from "@/lib/public-home-data";

type PublicLayoutProps = {
  children: React.ReactNode;
};

export default async function PublicLayout({ children }: PublicLayoutProps) {
  const pensionName = await loadPublicPensionName();

  return <PublicShell pensionName={pensionName}>{children}</PublicShell>;
}

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { OperationsProvider } from "@/components/providers/operations-provider";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <OperationsProvider>
      <DashboardShell>{children}</DashboardShell>
    </OperationsProvider>
  );
}

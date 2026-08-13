"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { CmsShell } from "@/components/cms/cms-shell";
import { useAuth } from "@/components/providers/auth-provider";

type CmsLayoutProps = {
  children: React.ReactNode;
};

export default function CmsLayout({ children }: CmsLayoutProps) {
  const router = useRouter();
  const { isAdmin, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAdmin) {
      router.replace("/dashboard");
    }
  }, [isAdmin, isLoading, router]);

  if (isLoading || !isAdmin) {
    return null;
  }

  return <CmsShell>{children}</CmsShell>;
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { CmsManagement } from "@/components/cms/cms-management";
import { useAuth } from "@/components/providers/auth-provider";

export default function CmsPage() {
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

  return <CmsManagement />;
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/providers/auth-provider";
import { ReportsManagement } from "@/components/reports/reports-management";

export default function ReportsPage() {
  const router = useRouter();
  const { isAdmin, isAuthResolved } = useAuth();

  useEffect(() => {
    if (!isAuthResolved) {
      return;
    }

    if (!isAdmin) {
      router.replace("/dashboard");
    }
  }, [isAdmin, isAuthResolved, router]);

  if (!isAuthResolved || !isAdmin) {
    return null;
  }

  return <ReportsManagement />;
}


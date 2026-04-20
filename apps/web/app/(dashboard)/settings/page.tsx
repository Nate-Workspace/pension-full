"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/providers/auth-provider";
import { SettingsManagement } from "@/components/settings/settings-management";

export default function SettingsPage() {
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

  return <SettingsManagement />;
}

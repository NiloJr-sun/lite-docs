"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

/**
 * Gate a page behind the simulated session. Renders `children` only when a user
 * is signed in; otherwise redirects to the login page.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  return <>{children}</>;
}

"use client";

import { AuthUIProvider } from "@daveyplate/better-auth-ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { authClient } from "@/lib/auth-client";

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();

  return (
    <AuthUIProvider
      authClient={authClient}
      navigate={router.push}
      replace={router.replace}
      onSessionChange={() => {
        // Clear router cache (protected routes)
        router.refresh();
      }}
      Link={Link}
      additionalFields={{
        itemPerPage: {
          label: "Items per page",
          placeholder: "Items per page",
          description: "The number x item per page",
          required: false,
          type: "number",
        },
      }}
      account={{
        fields: ["itemPerPage", "age"],
      }}
    >
      {children}
    </AuthUIProvider>
  );
}

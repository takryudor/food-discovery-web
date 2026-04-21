"use client";

import { useEffect, type ReactNode } from "react";
import { LanguageProvider } from "@/components/providers/LanguageContext";
import { AuthProvider } from "@/components/auth/AuthContext";
import { useUIStore } from "@/store/uiStore";

function ThemeSync() {
  const theme = useUIStore((state) => state.theme);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      return;
    }
    document.documentElement.classList.remove("dark");
  }, [theme]);

  return null;
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ThemeSync />
        {children}
      </AuthProvider>
    </LanguageProvider>
  );
}

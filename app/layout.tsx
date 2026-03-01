import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/supabase/auth-context";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";

export const metadata: Metadata = {
  title: "Controle de Entregas Shopee",
  description: "Sistema de controle financeiro para entregas Shopee",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
          <ThemeSwitcher />
        </ThemeProvider>
      </body>
    </html>
  );
}

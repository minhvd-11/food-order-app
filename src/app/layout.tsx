import type { Metadata } from "next";
import { Navbar } from "@/components";
import "./globals.css";
import { Toaster } from "sonner";
import { UserProvider } from "@/contexts/UserContext";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Daily Lunch",
  description: "Just like in home",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <UserProvider>
            <Navbar />
            {children}
            <Toaster position="top-right" richColors />
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

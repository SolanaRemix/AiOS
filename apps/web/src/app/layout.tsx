import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AIOS - The AI Operating System",
    template: "%s | AIOS",
  },
  description:
    "AIOS is the enterprise AI Operating System. Build, deploy, and scale AI agents with LLM federation, multi-agent orchestration, and enterprise-grade security.",
  keywords: [
    "AI",
    "artificial intelligence",
    "LLM",
    "agents",
    "enterprise",
    "SaaS",
    "AI platform",
  ],
  authors: [{ name: "AIOS Team" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://aios.ai",
    siteName: "AIOS",
    title: "AIOS - The AI Operating System",
    description: "Build, Deploy, Scale AI at Enterprise Speed",
  },
  twitter: {
    card: "summary_large_image",
    title: "AIOS - The AI Operating System",
    description: "Build, Deploy, Scale AI at Enterprise Speed",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#080810" },
    { media: "(prefers-color-scheme: light)", color: "#080810" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[#080810] font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
            <Toaster
              theme="dark"
              position="bottom-right"
              richColors
              toastOptions={{
                style: {
                  background: "rgba(10, 10, 20, 0.95)",
                  border: "1px solid rgba(0, 245, 255, 0.2)",
                  color: "rgba(255, 255, 255, 0.9)",
                },
              }}
            />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

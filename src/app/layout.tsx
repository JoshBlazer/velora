import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#22d3ee",
};

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | Velora",
    default: "Velora — Visual Kanban for Creatives",
  },
  description: "A beautiful kanban platform for creative workflows. Organize projects with style.",
  keywords: ["kanban", "workflow", "creative", "project management", "design"],
  openGraph: {
    type: "website",
    siteName: "Velora",
    title: "Velora — Visual Kanban for Creatives",
    description: "A beautiful kanban platform for creative workflows.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Velora — Visual Kanban for Creatives",
    description: "A beautiful kanban platform for creative workflows.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Velora",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${plusJakarta.variable} antialiased`}>
        <ThemeProvider>
          <ServiceWorkerRegistration />
          {children}
          <Toaster
            theme="dark"
            position="bottom-right"
            toastOptions={{
              style: {
                background: "rgba(15, 23, 42, 0.9)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#ffffff",
                backdropFilter: "blur(12px)",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}

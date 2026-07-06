import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth/auth-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Afrikintel — Infrastructure Monitoring",
  description:
    "Real-time monitoring for websites, services, servers, and infrastructure. Customizable alerts, beautiful dashboards, and instant notifications.",
  keywords: [
    "monitoring", "uptime", "infrastructure", "server monitoring",
    "website monitoring", "alerts", "incidents", "Afrikintel",
  ],
  authors: [{ name: "Afrikintel" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Afrikintel",
    description: "Real-time infrastructure monitoring",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
        <SonnerToaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "oklch(0.17 0.006 240)",
              color: "oklch(0.96 0.005 240)",
              border: "1px solid oklch(1 0 0 / 0.08)",
            },
          }}
        />
      </body>
    </html>
  );
}

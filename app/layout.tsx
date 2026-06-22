import type { Metadata, Viewport } from "next";
import { CSS, wrap } from "@/lib/css";
import { RegisterSW } from "@/components/RegisterSW";

export const metadata: Metadata = {
  title: "Daily intake",
  description: "Calorie and macro tracker — log meals by photo or text, see what's left, export to Excel.",
  manifest: "/manifest.webmanifest",
  applicationName: "Daily intake",
  appleWebApp: {
    capable: true,
    title: "Intake",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#55654C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Scoped CSS from the artifact, injected once as a real style block. */}
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        {/* iOS standalone hints not covered by the metadata API. */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <div className="cal-app" style={wrap}>
          {children}
        </div>
        <RegisterSW />
      </body>
    </html>
  );
}

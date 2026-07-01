import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import { CSS, wrap } from "@/lib/css";
import { RegisterSW } from "@/components/RegisterSW";
import { LangProvider } from "@/components/LangProvider";
import { LANG_COOKIE, type Lang } from "@/lib/i18n";

// "The Grid" type system: Space Grotesk for display/headings/numbers, Space Mono
// for tabular data. Exposed as CSS variables consumed by lib/css.ts tokens.
const grotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-grotesk",
  display: "swap",
});
const mono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
  display: "swap",
});

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
  // No maximumScale: pinning it to 1 blocks pinch-zoom (an accessibility
  // regression) and, together with sub-16px inputs, made iOS auto-zoom on focus.
  // Inputs are now 16px, which is what actually stops the focus-zoom.
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const lang: Lang = cookies().get(LANG_COOKIE)?.value === "de" ? "de" : "en";
  return (
    <html lang={lang} className={`${grotesk.variable} ${mono.variable}`}>
      <head>
        {/* Scoped CSS from the artifact, injected once as a real style block. */}
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        {/* iOS standalone hints not covered by the metadata API. */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <LangProvider initial={lang}>
          <div className="cal-app" style={wrap}>
            {children}
          </div>
        </LangProvider>
        <RegisterSW />
      </body>
    </html>
  );
}

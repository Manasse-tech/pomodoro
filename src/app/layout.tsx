import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Focusly — Minuteur Pomodoro et outils de concentration",
    template: "%s — Focusly",
  },
  description:
    "Minuteur Pomodoro gratuit, gestionnaire de tâches, notes et guides sur la concentration. Sans compte, sans collecte de données.",
  keywords: [
    "Pomodoro",
    "minuteur Pomodoro",
    "concentration",
    "productivité",
    "gestion du temps",
    "minuteur en ligne",
    "Focusly",
  ],
  authors: [{ name: "Focusly" }],
  creator: "Focusly",
  applicationName: "Focusly",
  manifest: "/manifest.webmanifest",
  metadataBase: new URL("https://focusly.example"),
  openGraph: {
    title: "Focusly — Minuteur Pomodoro et outils de concentration",
    description:
      "Minuteur Pomodoro gratuit, gestionnaire de tâches, notes et guides sur la concentration. Sans compte, sans collecte de données.",
    siteName: "Focusly",
    type: "website",
    locale: "fr_FR",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Focusly" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Focusly — Minuteur Pomodoro et outils de concentration",
    description:
      "Minuteur Pomodoro gratuit, gestionnaire de tâches, notes et guides sur la concentration.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#0f1013",
  width: "device-width",
  initialScale: 1,
};

/** Applies the persisted theme + timer mode before paint to avoid a flash. */
const themeInit = `try{
  var raw=localStorage.getItem('focusly.v4');
  var t='dark',m='focus';
  if(raw){var s=JSON.parse(raw).state||{};if(s.theme==='light'||s.theme==='dark')t=s.theme;if(['focus','short','long'].includes(s.mode))m=s.mode;}
  document.documentElement.setAttribute('data-theme',t);
  document.body&&document.body.setAttribute('data-mode',m);
}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" data-theme="dark" suppressHydrationWarning>
      <body
        data-mode="focus"
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}

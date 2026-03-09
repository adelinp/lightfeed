import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { getSiteConfig } from "@/lib/site-config";

const themeInitScript = `
  (() => {
    const THEME_STORAGE_KEY = "lightfeed-theme";
    const THEME_MEDIA_QUERY = "(prefers-color-scheme: dark)";

    const normalizeThemeMode = (rawTheme) => {
      const value = String(rawTheme ?? "").trim().toLowerCase();
      if (value === "light" || value === "dark" || value === "system") {
        return value;
      }
      return "system";
    };

    const resolveTheme = (themeMode) => {
      if (themeMode === "system") {
        try {
          return window.matchMedia(THEME_MEDIA_QUERY).matches ? "dark" : "light";
        } catch (_error) {
          return "light";
        }
      }
      return themeMode;
    };

    try {
      const themeMode = normalizeThemeMode(localStorage.getItem(THEME_STORAGE_KEY));
      const theme = resolveTheme(themeMode);
      const root = document.documentElement;
      root.classList.toggle("dark", theme === "dark");
      root.setAttribute("data-theme", theme);
    } catch (_error) {
      const fallbackTheme = resolveTheme("system");
      document.documentElement.classList.toggle("dark", fallbackTheme === "dark");
      document.documentElement.setAttribute("data-theme", fallbackTheme);
    }
  })();
`;

const site = getSiteConfig();

export const metadata = {
  metadataBase: new URL(site.url),
  applicationName: site.name,
  title: {
    default: site.title,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: site.url,
    siteName: site.name,
    title: site.title,
    description: site.description,
    locale: site.locale,
    images: [
      {
        url: site.ogImage,
        alt: site.title,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
    images: [site.ogImage],
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icons/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/icons/icon-180.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
  },
  appleWebApp: {
    capable: true,
    title: site.name,
    statusBarStyle: "default",
  },
};

export const viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f2e7" },
    { media: "(prefers-color-scheme: dark)", color: "#111114" },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
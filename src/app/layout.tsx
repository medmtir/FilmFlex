import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FilmFlex - Regardez des films et séries en streaming 4K",
  description: "La plateforme de streaming nouvelle génération. Profitez de milliers de films, séries et exclusivités en 4K Ultra HD avec reprise de lecture automatique.",
  icons: {
    icon: "/icon.jpg",
    apple: "/icon-192.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body className="bg-[#141414] text-white min-h-screen antialiased selection:bg-[#E50914] selection:text-white">
        {children}
      </body>
    </html>
  );
}

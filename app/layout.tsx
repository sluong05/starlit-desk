import type { Metadata, Viewport } from "next";
import "@livekit/components-styles";
import "./globals.css";
import "./games-skins.css";
import "./call.css";

export const metadata: Metadata = {
  title: "Starlit Desk",
  description: "Study side by side with a friend, under the stars.",
};

export const viewport: Viewport = {
  themeColor: "#070b1f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="starlit" suppressHydrationWarning>
      <head>
        {/* Apply the saved theme before first paint so there's no flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("starlit:theme");if(t)document.documentElement.dataset.theme=t}catch(e){}`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,500&family=Nunito:wght@500;700;800&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

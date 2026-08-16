import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "same frequency — find people on your frequency",
  description: "Find Spotify users with music taste similar to yours."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
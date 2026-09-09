import "./globals.css";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fieldbook",
  description: "Private agronomy field management",
  robots: { index: false, follow: false, nocache: true }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BofA Sanctions Continuous Monitoring | Crowe LLP",
  description: "Sanctions audit continuous monitoring dashboard — Crowe AI Practice",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

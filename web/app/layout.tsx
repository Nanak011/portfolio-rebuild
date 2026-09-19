import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gurunanak Adhikari - Portfolio",
  description: "Cybersecurity projects, experience, and resume.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import BinaryClock from "@/components/BinaryClock";

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
      <body>
        {children}
        <BinaryClock />
      </body>
    </html>
  );
}
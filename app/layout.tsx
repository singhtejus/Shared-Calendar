import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppHeader } from "@/components/AppHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "Timeshare",
  description: "Group timelines for free/busy ranges and shared events."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppHeader />
        <main>{children}</main>
      </body>
    </html>
  );
}

import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppHeader } from "@/components/AppHeader";

export const metadata: Metadata = { title: "AITTS — All India Test Series", description: "A focused online test platform for serious JEE preparation." };
export default function RootLayout({children}:{children:ReactNode}){return <html lang="en" suppressHydrationWarning><body><ThemeProvider><AppHeader/>{children}</ThemeProvider></body></html>}

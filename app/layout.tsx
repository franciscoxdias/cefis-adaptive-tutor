import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CEFIS Compass · Adaptive Learning Tutor",
  description:
    "Camada adaptativa de aprendizagem com IA que ajuda o aluno a descobrir por onde começar, o que estudar e quais aulas reais da CEFIS consultar agora.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a2540",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

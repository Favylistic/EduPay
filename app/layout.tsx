import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Toaster } from "sonner"

import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
})

export const metadata: Metadata = {
  title: {
    default: "EduPay - School Payroll Management",
    template: "%s | EduPay",
  },
  description:
    "Comprehensive payroll management system for educational institutions. Manage employees, departments, attendance, and payroll with ease.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/logo.png",
  },
  openGraph: {
    title: "EduPay - School Payroll Management",
    description: "Streamline your school's payroll operations with a modern, secure, and efficient management system.",
    type: "website",
    url: "https://edupay.school",
    images: [
      {
        url: "/logo.png",
        width: 280,
        height: 280,
        alt: "EduPay Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "EduPay - School Payroll Management",
    description: "Streamline your school's payroll operations.",
    images: ["/logo.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "EduPay",
  },
}

export const viewport: Viewport = {
  themeColor: "#3d9e82",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}

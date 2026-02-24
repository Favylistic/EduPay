import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EduPay - School Payroll Management",
    short_name: "EduPay",
    description: "Comprehensive payroll management system for educational institutions",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    theme_color: "#3d9e82",
    background_color: "#ffffff",
    categories: ["education", "business", "productivity"],
    screenshots: [
      {
        src: "/logo.png",
        sizes: "280x280",
        type: "image/png",
        form_factor: "wide",
      },
      {
        src: "/logo.png",
        sizes: "280x280",
        type: "image/png",
        form_factor: "narrow",
      },
    ],
    icons: [
      {
        src: "/favicon.ico",
        sizes: "32x32",
        type: "image/x-icon",
      },
      {
        src: "/logo.png",
        sizes: "280x280",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo.png",
        sizes: "280x280",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}

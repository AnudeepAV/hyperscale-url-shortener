import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "HyperScale — Production-Grade URL Shortener",
  description:
    "Shorten URLs with real-time analytics. Built for scale with Redis caching, Celery workers, and WebSocket-powered live dashboards.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "rgba(13, 15, 20, 0.95)",
              color: "#fff",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(10px)",
            },
          }}
        />
      </body>
    </html>
  );
}

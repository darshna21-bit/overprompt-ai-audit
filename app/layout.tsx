import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Overprompt",
  description:
    "AI spend audit platform for startups and engineering teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html
      lang="en"
      className="h-full"
    >

      <body className="min-h-full bg-black text-white antialiased">

        {children}

      </body>

    </html>
  );
}
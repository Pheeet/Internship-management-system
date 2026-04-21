import "./globals.css";
import { Prompt } from "next/font/google";

const prompt = Prompt({
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata = {
  title: "Internship Management System",
  description: "CMU Internship Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className={`${prompt.className} bg-background min-h-screen antialiased`}>
        {children}
      </body>
    </html>
  );
}

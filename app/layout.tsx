import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Taste / League',
  description: 'Minimalist League of Legends Account Manager',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#0a0a0c] text-[#ededed]">{children}</body>
    </html>
  );
}

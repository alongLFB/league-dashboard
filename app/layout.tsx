import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';

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
      <body className="antialiased bg-[#0a0a0c] text-[#ededed]">
        {children}
        <Toaster theme="dark" position="top-center" toastOptions={{ className: 'border border-gray-800 bg-[#0d1117] text-gray-200 shadow-2xl' }} />
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import '@/app/globals.css';
import { Toaster } from 'sonner';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

export const metadata: Metadata = {
  title: 'Taste / League',
  description: 'Minimalist League of Legends Account Manager',
};

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="antialiased bg-[#0a0a0c] text-[#ededed]">
        <NextIntlClientProvider messages={messages}>
          {children}
          <Toaster theme="dark" position="top-center" toastOptions={{ className: 'border border-gray-800 bg-[#0d1117] text-gray-200 shadow-2xl' }} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

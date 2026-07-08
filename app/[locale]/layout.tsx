import type { Metadata } from 'next';
import '@/app/globals.css';
import { Toaster } from 'sonner';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

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

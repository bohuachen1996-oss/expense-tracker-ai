import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { Sidebar, MobileNav } from '@/components/layout/Navigation';

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Expensify — Expense Tracker',
  description: 'Track your personal expenses with ease',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geist.variable} antialiased`}>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <MobileNav />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}

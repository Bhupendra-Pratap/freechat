import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FreeChatCU — Campus Anonymous Chat',
  description: 'Anonymous chat for university students. Pick a nickname, choose your department, and chat freely.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

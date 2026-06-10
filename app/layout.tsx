import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AssistIQ Banking Copilot',
  description: 'AI-powered banking hardship review copilot demo',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

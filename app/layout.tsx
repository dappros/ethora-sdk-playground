import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ethora SDK Playground',
  description: 'Interactive playground for testing and configuring Ethora SDK and Chat Component',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


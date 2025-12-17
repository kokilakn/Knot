import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Knot – Find Yourself in Every Photo',
  description: 'Organize and discover your photos with face recognition',
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

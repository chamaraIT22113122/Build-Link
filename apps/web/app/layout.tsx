import type { Metadata } from 'next';
import '../styles/globals.css';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { DockedMessenger } from '../components/DockedMessenger';
import { AuthProvider } from '../context/AuthContext';

export const metadata: Metadata = {
  title: 'BuildLink | Connect. Build. Grow. - Construction Community & Verified Engineers',
  description:
    'BuildLink connects homeowners, builders, and construction enthusiasts with qualified, verified engineers and industry specialists. Ask questions, discover verified experts, and manage consultations.',
  icons: {
    icon: '/favicon.svg',
  },
  keywords: [
    'BuildLink',
    'construction',
    'civil engineer',
    'structural engineer',
    'waterproofing',
    'Sri Lanka construction',
    'building consultation',
    'home renovation',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-brand-bg text-brand-text min-h-screen flex flex-col antialiased">
        <AuthProvider>
          <Navbar />
          <main className="flex-grow">{children}</main>
          <DockedMessenger />
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}


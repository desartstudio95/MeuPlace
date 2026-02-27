import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { BackButton } from '@/components/ui/BackButton';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <BackButton />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
}

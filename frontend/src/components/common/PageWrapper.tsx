// ============================================
// PAGE WRAPPER - COMMON PAGE LAYOUT
// ============================================

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { cn } from '@/lib/utils';

interface PageWrapperProps {
  children: React.ReactNode;
  isAuthenticated?: boolean;
  isAdmin?: boolean;
  className?: string;
  showHeader?: boolean;
  showFooter?: boolean;
}

export const PageWrapper = ({
  children,
  isAuthenticated = false,
  isAdmin = false,
  className = '',
  showHeader = true,
  showFooter = true,
}: PageWrapperProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8F0]">
      {showHeader && (
        <Header isAuthenticated={isAuthenticated} isAdmin={isAdmin} />
      )}
      <main className={cn('flex-1', className)}>{children}</main>
      {showFooter && <Footer />}
    </div>
  );
};

export default PageWrapper;

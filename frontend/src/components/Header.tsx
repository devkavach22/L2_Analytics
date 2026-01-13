// ============================================
// HEADER COMPONENT
// ============================================

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, LogOut, Settings, Menu, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Kavachlogo from '@/assets/KavachLogo.png';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logoutUser } from '@/store/slices/authSlice';
import { PUBLIC_MENU_ITEMS, USER_MENU_ITEMS, ADMIN_MENU_ITEMS } from '@/constants/menu';
import type { MenuItem } from '@/types';

interface HeaderProps {
  isAuthenticated?: boolean;
  isAdmin?: boolean;
}

export const Header = ({ isAuthenticated = false, isAdmin = false }: HeaderProps) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Logout handler
  const handleLogout = useCallback(async () => {
    await dispatch(logoutUser());
    navigate('/auth');
  }, [dispatch, navigate]);

  // Get menu items based on auth state
  const getMenuItems = (): MenuItem[] => {
    if (!isAuthenticated) return PUBLIC_MENU_ITEMS;
    return isAdmin ? ADMIN_MENU_ITEMS : USER_MENU_ITEMS;
  };

  const menuItems = getMenuItems();

  const isActive = (path: string) => {
    if (path === '/' && currentPath !== '/') return false;
    return currentPath === path || currentPath.startsWith(`${path}/`);
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b',
        scrolled
          ? 'bg-white/80 backdrop-blur-xl border-orange-200 py-3 shadow-sm shadow-orange-900/5'
          : 'bg-transparent border-transparent py-5'
      )}
    >
      <div className="container flex items-center justify-between px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center group relative z-50">
          <img
            src={Kavachlogo}
            className="h-16 w-auto ml-6 object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-sm"
            alt="Kavach Logo"
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <nav className="flex items-center p-1.5 rounded-full bg-white/70 border border-orange-100/60 backdrop-blur-md shadow-lg shadow-orange-500/5">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="relative px-5 py-2 rounded-full text-sm font-bold transition-colors group"
              >
                {isActive(item.href) && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-full shadow-lg shadow-orange-500/30"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span
                  className={cn(
                    'relative z-10 flex items-center gap-2 transition-colors duration-200',
                    isActive(item.href)
                      ? 'text-white'
                      : 'text-slate-600 group-hover:text-orange-600'
                  )}
                >
                  <item.icon
                    className={cn(
                      'w-4 h-4',
                      isActive(item.href)
                        ? 'text-white'
                        : 'text-slate-400 group-hover:text-orange-500'
                    )}
                  />
                  {item.title}
                </span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4 relative z-50">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full border border-orange-200 bg-orange-50/50 text-orange-600 hover:bg-orange-100 hover:text-orange-700 hover:shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all duration-300"
                >
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-white/95 border-orange-100 text-slate-700 backdrop-blur-xl p-2 shadow-xl shadow-orange-500/10 rounded-2xl"
              >
                <div className="px-2 py-1.5 text-sm font-semibold text-orange-800 bg-orange-50/50 rounded-lg mb-1">
                  My Account
                </div>
                <DropdownMenuItem
                  asChild
                  className="focus:bg-orange-50 focus:text-orange-700 cursor-pointer rounded-xl"
                >
                  <Link to="/profile" className="flex items-center py-2.5 font-medium">
                    <User className="mr-2 h-4 w-4 text-orange-400" /> Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  asChild
                  className="focus:bg-orange-50 focus:text-orange-700 cursor-pointer rounded-xl"
                >
                  <Link to="/settings" className="flex items-center py-2.5 font-medium">
                    <Settings className="mr-2 h-4 w-4 text-orange-400" /> Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-orange-100 my-1" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer rounded-xl py-2.5 font-medium"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              asChild
              className="hidden md:flex h-10 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-full font-bold px-6 shadow-lg shadow-orange-500/20 transition-all duration-300 hover:scale-105 border-0"
            >
              <Link to="/auth" className="flex items-center gap-2">
                Get Started <Sparkles size={14} className="text-orange-100" />
              </Link>
            </Button>
          )}

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-slate-600 hover:text-orange-600 hover:bg-orange-50"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#FFF8F0]/95 backdrop-blur-xl border-b border-orange-100 overflow-hidden"
          >
            <div className="flex flex-col p-4 gap-2">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-bold',
                    isActive(item.href)
                      ? 'bg-orange-100 text-orange-700 border border-orange-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  )}
                >
                  <item.icon
                    className={cn(
                      'w-5 h-5',
                      isActive(item.href) ? 'text-orange-600' : 'text-slate-400'
                    )}
                  />
                  {item.title}
                </Link>
              ))}

              {!isAuthenticated && (
                <div className="mt-4 pt-4 border-t border-orange-100">
                  <Link
                    to="/auth"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center w-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-500/20"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Header;

// ============================================
// MENU CONSTANTS
// ============================================

import {
  Home,
  Zap,
  CreditCard,
  Code,
  Blocks,
  LayoutDashboard,
  Sparkles,
  FolderOpen,
  Users,
  Settings,
} from 'lucide-react';
import type { MenuItem } from '@/types';

export const PUBLIC_MENU_ITEMS: MenuItem[] = [
  { title: 'Overview', icon: Home, href: '/' },
  { title: 'Features', icon: Zap, href: '/features' },
  { title: 'Pricing', icon: CreditCard, href: '/pricing' },
  { title: 'API', icon: Code, href: '/api-working' },
  { title: 'Integration', icon: Blocks, href: '/integration' },
];

export const USER_MENU_ITEMS: MenuItem[] = [
  { title: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { title: 'AI Search', icon: Sparkles, href: '/ai-search' },
  { title: 'Reports', icon: FolderOpen, href: '/files' },
];

export const ADMIN_MENU_ITEMS: MenuItem[] = [
  { title: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
  { title: 'Manage Users', icon: Users, href: '/manage-user' },
  { title: 'System Settings', icon: Settings, href: '/system-setting' },
];

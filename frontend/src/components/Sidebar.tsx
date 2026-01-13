import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  FolderOpen,
  Settings,
  FileText,
  User,
  // LogOut, 
} from "lucide-react";
import { Button } from "@/components/ui/button"; 
import { cn } from "@/lib/utils"; 

interface SidebarProps {
  isAdmin?: boolean;
  onLogout?: () => void;
  currentPath?: string; // New prop to control active state externally
  onNavigate?: (path: string) => void; // New prop to handle navigation externally
}

export const Sidebar = ({ 
  isAdmin = false, 
  onLogout, 
  currentPath = "/dashboard", // Default to dashboard if not provided
  onNavigate 
}: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  // We use the prop 'currentPath' if provided, otherwise we could have used internal state for standalone usage.

  const menuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      href: isAdmin ? "/admin" : "/dashboard",
    },
    {
      title: "Tools",
      icon: FileText,
      href: "/tools",
    },
    {
      title: "Files",
      icon: FolderOpen,
      href: "/files",
    },
    {
      title: "Profile",
      icon: User,
      href: "/profile",
    },
    {
      title: "Settings",
      icon: Settings,
      href: "/settings",
    },
  ];

  const isActive = (path: string) => currentPath === path;

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(path);
    }
  };
  
  const handleLogoutClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (onLogout) onLogout();
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-card border-r border-border transition-all duration-300 z-40 shadow-lg",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-4 h-6 w-6 rounded-full border border-border bg-background shadow-md hover:bg-muted z-50"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>

      {/* Menu Items */}
      <nav
        className={cn(
          "space-y-2 transition-all duration-300",
          collapsed ? "p-2" : "p-4"
        )}
      >
        {menuItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            onClick={(e) => handleLinkClick(e, item.href)}
          >
            <div
              className={cn(
                "group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 relative",
                isActive(item.href)
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground",
                collapsed && "justify-center"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span
                className={cn(
                  "font-medium transition-all duration-300",
                  collapsed ? "opacity-0 w-0" : "opacity-100 w-auto"
                )}
              >
                {item.title}
              </span>

              {collapsed && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {item.title}
                </div>
              )}
            </div>
          </a>
        ))}

        {/* Logout Button */}
        <button
          onClick={handleLogoutClick}
          className={cn(
            "group w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 relative hover:bg-destructive/10 text-muted-foreground hover:text-destructive",
            collapsed && "justify-center"
          )}
        >
          {/* <LogOut className="h-5 w-5 flex-shrink-0" /> */}
          <span
            className={cn(
              "font-medium transition-all duration-300",
              collapsed ? "opacity-0 w-0" : "opacity-100 w-auto"
            )}
          >
            Logout
          </span>

          {collapsed && (
            <div className="absolute left-full ml-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              Logout
            </div>
          )}
        </button>
      </nav>
    </aside>
  );
};
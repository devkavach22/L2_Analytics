import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  Activity,
  TrendingUp,
  RefreshCw,
  BarChartHorizontal,
  LayoutDashboard,
  Menu,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// --- IMPORT YOUR NEW PAGE COMPONENTS ---
// (Assuming you place them in a new 'src/components/admin' folder)
import DashboardContent from "@/components/DashboardContent";
import ActivityLogPage from "@/pages/ActivityLogPage";
import UserListPage from "@/pages/UserListPage";
import UserReportsPage from "@/pages/UserReportsPage";

// Define the possible views
type AdminView = "dashboard" | "logs" | "users" | "reports";

export default function AdminDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState<AdminView>("dashboard");

  // Helper function to render the active component
  const renderActiveView = () => {
    switch (activeView) {
      case "dashboard":
        return <DashboardContent />;
      case "logs":
        return <ActivityLogPage />;
      case "users":
        return <UserListPage />;
      case "reports":
        return <UserReportsPage />;
      default:
        return <DashboardContent />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-neutral-950">
      <Header isAuthenticated isAdmin onLogout={() => console.log("Logout")} />

      <div className="flex flex-1">
        {/* --- Sidebar --- */}
        <aside
          className={`w-64 flex-col border-r bg-card text-card-foreground p-4 transition-all duration-300 overflow-y-auto ${
            isSidebarOpen ? "flex" : "hidden"
          }`}
        >
          <nav className="flex flex-col space-y-2">
            <h3 className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Menu
            </h3>
            <Button
              variant={activeView === "dashboard" ? "secondary" : "ghost"}
              className="w-full justify-start gap-2 text-base"
              onClick={() => setActiveView("dashboard")}
            >
              <LayoutDashboard className="w-5 h-5" /> Dashboard
            </Button>
            <Button
              variant={activeView === "logs" ? "secondary" : "ghost"}
              className="w-full justify-start gap-2 text-base"
              onClick={() => setActiveView("logs")}
            >
              <Activity className="w-5 h-5" /> Activity Logs
            </Button>
            <Button
              variant={activeView === "users" ? "secondary" : "ghost"}
              className="w-full justify-start gap-2 text-base"
              onClick={() => setActiveView("users")}
            >
              <Users className="w-5 h-5" /> User List
            </Button>
            <Button
              variant={activeView === "reports" ? "secondary" : "ghost"}
              className="w-full justify-start gap-2 text-base"
              onClick={() => setActiveView("reports")}
            >
              <BarChartHorizontal className="w-5 h-5" /> User Reports
            </Button>
          </nav>
        </aside>

        {/* --- Main Content --- */}
        <main className="flex-1 p-6 md:p-10 space-y-8 overflow-auto">
          {/* Dashboard Header */}
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              size="icon"
              className="shadow-card"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex-1">
              <h1 className="text-3xl font-bold tracking-tight">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Overview of your PDF utility platform.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 self-center"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Data</span>
            </Button>
          </div>

          {/* --- CONDITIONAL CONTENT RENDERED HERE --- */}
          {renderActiveView()}
        </main>
      </div>

      <Footer />
    </div>
  );
}
import {
  Users,
  FileText,
  Activity,
  TrendingUp,
  FileUp,
  Scissors,
  FileDown,
  Lock,
  ImageIcon,
  FileCog,
  Server,
  Database,
  AlertTriangle,
} from "lucide-react";
import { KPICard } from "@/components/KPICard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

// --- STATIC DATA ---
const kpiData = [
  { title: "Total Users", value: "2,543", icon: Users, trend: { value: 12.5, isPositive: true } },
  { title: "Documents Processed", value: "15,432", icon: FileText, trend: { value: 8.2, isPositive: true } },
  { title: "Active Sessions", value: "342", icon: Activity, trend: { value: 3.1, isPositive: false } },
  { title: "Monthly Growth", value: "24%", icon: TrendingUp, trend: { value: 5.4, isPositive: true } }
];

const recentUsers = [
  { id: 1, name: "John Doe", email: "john@example.com", status: "active", joined: "2024-01-15" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", status: "active", joined: "2024-01-14" },
  { id: 3, name: "Bob Johnson", email: "bob@example.com", status: "inactive", joined: "2024-01-13" },
  { id: 4, name: "Alice Brown", email: "alice@example.com", status: "active", joined: "2024-01-12" },
  { id: 5, name: "Charlie Wilson", email: "charlie@example.com", status: "active", joined: "2024-01-11" },
];

const activityLog = [
  { id: 1, user: "John Doe", action: "Merged PDF", time: "2 minutes ago", actionType: "merge" },
  { id: 2, user: "Jane Smith", action: "Split PDF", time: "5 minutes ago", actionType: "split" },
];

const toolPopularityData = [
  { name: "Merge PDF", usage: 4500, percentage: 45 },
  { name: "Compress PDF", usage: 2500, percentage: 25 },
  { name: "Split PDF", usage: 1500, percentage: 15 },
  { name: "PDF to Image", usage: 1000, percentage: 10 },
  { name: "Lock PDF", usage: 500, percentage: 5 },
];

const getActivityIcon = (actionType: string) => {
  switch (actionType) {
    case "merge": return <FileUp className="w-5 h-5 text-blue-500" />;
    case "split": return <Scissors className="w-5 h-5 text-green-500" />;
    case "compress": return <FileDown className="w-5 h-5 text-yellow-500" />;
    case "lock": return <Lock className="w-5 h-5 text-red-500" />;
    case "convert": return <ImageIcon className="w-5 h-5 text-purple-500" />;
    default: return <FileCog className="w-5 h-5 text-gray-500" />;
  }
};
// --- END STATIC DATA ---

export default function DashboardContent() {
  return (
    <>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => (
          <div
            key={kpi.title}
            className="animate-fade-in-up transform transition-transform duration-300 hover:-translate-y-1.5"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <KPICard {...kpi} />
          </div>
        ))}
      </div>

      {/* System Metrics & Tool Popularity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="shadow-lg rounded-2xl border-0">
          <CardHeader><CardTitle>System Metrics</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Server className="w-6 h-6 text-green-500" />
                <div>
                  <p className="font-medium">Server Load</p>
                  <p className="text-xs text-muted-foreground">Current CPU Utilization</p>
                </div>
              </div>
              <Badge variant="outline" className="text-green-500 border-green-500">14%</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="w-6 h-6 text-blue-500" />
                <div>
                  <p className="font-medium">Storage Used</p>
                  <p className="text-xs text-muted-foreground">Total blob storage</p>
                </div>
              </div>
              <Badge variant="outline" className="text-blue-500 border-blue-500">4.2 TB</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                <div>
                  <p className="font-medium">API Errors (24h)</p>
                  <p className="text-xs text-muted-foreground">Failed 5xx responses</p>
                </div>
              </div>
              <Badge variant="outline" className="text-red-500 border-red-500">8</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg rounded-2xl border-0 lg:col-span-2">
          <CardHeader><CardTitle>Tool Popularity</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {toolPopularityData.map((tool) => (
              <div key={tool.name} className="space-y-1">
                <div className="flex justify-between items-center text-sm font-medium">
                  <span>{tool.name}</span>
                  <span className="text-muted-foreground">{tool.usage.toLocaleString()} uses</span>
                </div>
                <Progress value={tool.percentage} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* User List & Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="shadow-lg rounded-2xl border-0 lg:col-span-2">
          <CardHeader><CardTitle>Recent Users</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead className="hidden md:table-cell">Joined</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground sm:hidden">{user.email}</div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{user.email}</TableCell>
                    <TableCell className="hidden md:table-cell">{user.joined}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={user.status === "active" ? "default" : "secondary"} className="capitalize">
                        {user.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="shadow-lg rounded-2xl border-0">
          <CardHeader><CardTitle>Activity Log</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-6">
              {activityLog.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4">
                  <div className="bg-gray-100 dark:bg-neutral-800 p-3 rounded-full flex-shrink-0">
                    {getActivityIcon(activity.actionType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{activity.user}</p>
                    <p className="text-sm text-muted-foreground truncate">{activity.action}</p>
                  </div>
                  <span className="text-xs text-muted-foreground pt-1 flex-shrink-0">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
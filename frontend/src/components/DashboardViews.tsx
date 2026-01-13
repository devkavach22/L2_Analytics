import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Image,
  Video,
  Folder,
  Clock,
  Rocket, // For Optimize/Boost
  GitMerge, // For Merge
  Scissors, // For Split
  Lock, // For Lock
  Zap, // For Quick Action
  TrendingUp, // New: For Activity Chart
  PieChart as PieChartIcon, // New: For Pie Chart
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"; // New: Recharts imports

// Mock data for the dashboard
const stats = [
  {
    name: "Documents",
    value: "1,280",
    size: "5.4 GB",
    icon: FileText,
    color: "text-blue-500",
  },
  {
    name: "Images",
    value: "8,320",
    size: "10.2 GB",
    icon: Image,
    color: "text-green-500",
  },
  {
    name: "Video & Audio",
    value: "451",
    size: "25.1 GB",
    icon: Video,
    color: "text-red-500",
  },
  {
    name: "Others",
    value: "65",
    size: "2.3 GB",
    icon: Folder,
    color: "text-yellow-500",
  },
];

const recentFiles = [
  {
    name: "Annual_Report_2024.pdf",
    type: "Document",
    modified: "10 mins ago",
  },
  {
    name: "Team_Photoshoot.zip",
    type: "Archive",
    modified: "45 mins ago",
  },
  {
    name: "Product_Demo.mp4",
    type: "Video",
    modified: "1H ago",
  },
  {
    name: "system_diagram.png",
    type: "Image",
    modified: "3H ago",
  },
  {
    name: "Contract_v2.pdf",
    type: "Document",
    modified: "5H ago",
  },
];

// Data for the storage breakdown
const storage = {
  total: 100,
  used: 43,
  percent: 43,
  breakdown: [
    { name: "Video", percent: 58.4, color: "bg-red-500" }, // 25.1 GB
    { name: "Images", percent: 23.7, color: "bg-green-500" }, // 10.2 GB
    { name: "Docs", percent: 12.6, color: "bg-blue-500" }, // 5.4 GB
    { name: "Others", percent: 5.3, color: "bg-yellow-500" }, // 2.3 GB
  ],
};

// Quick Actions
const quickActions = [
  { name: "Optimize", icon: Rocket, variant: "outline" },
  { name: "Merge PDFs", icon: GitMerge, variant: "outline" },
  { name: "Split PDF", icon: Scissors, variant: "outline" },
  { name: "Lock PDF", icon: Lock, variant: "outline" },
];

// --- NEW MOCK DATA FOR CHARTS ---

// 1. Data for Weekly Activity Bar Chart
const weeklyActivityData = [
  { name: "Mon", Files: 32 },
  { name: "Tue", Files: 45 },
  { name: "Wed", Files: 28 },
  { name: "Thu", Files: 51 },
  { name: "Fri", Files: 62 },
  { name: "Sat", Files: 18 },
  { name: "Sun", Files: 25 },
];

// 2. Data for Tool Usage Pie Chart
const toolUsageData = [
  { name: "Merge PDFs", value: 400 },
  { name: "Split PDF", value: 300 },
  { name: "Lock PDF", value: 300 },
  { name: "Optimize", value: 200 },
];
const PIE_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

// --- END OF NEW MOCK DATA ---

export function DashboardView() {
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* 1. Stat Cards Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <Card key={item.name} className="shadow-card hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {item.name}
              </CardTitle>
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value} files</div>
              <p className="text-xs text-muted-foreground">{item.size}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 2. Quick Actions */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Start one of your most common tasks right away.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Button
              key={action.name}
              variant={action.variant as "outline"}
              className="flex flex-col h-24 gap-2 text-base"
            >
              <action.icon className="h-6 w-6" />
              {action.name}
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* --- NEW: 3. CHARTS ROW (Insights) --- */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Weekly Activity Bar Chart */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Weekly File Activity
            </CardTitle>
            <CardDescription>Files processed in the last 7 days.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyActivityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Files" fill="#8884d8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Popular Tools Pie Chart */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-green-500" />
              Popular Tools
            </CardTitle>
            <CardDescription>Breakdown of your most used actions.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={toolUsageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={110}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={(props) => `${(props.percent * 100).toFixed(0)}%`}
                >
                  {toolUsageData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      {/* --- END OF NEW CHARTS ROW --- */}


      {/* 4. Storage & Recent Files (Was section 3) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Storage Breakdown Card */}
        <Card className="lg:col-span-1 shadow-card">
          <CardHeader>
            <CardTitle>Storage Breakdown</CardTitle>
            <CardDescription>
              {storage.used} GB used of {storage.total} GB
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Visual Bar */}
            <div className="flex h-3 w-full overflow-hidden rounded-full">
              {storage.breakdown.map((item) => (
                <div
                  key={item.name}
                  className={`${item.color}`}
                  style={{ width: `${item.percent}%` }}
                  title={`${item.name} (${item.percent}%)`}
                ></div>
              ))}
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {storage.breakdown.map((item) => (
                <div key={item.name} className="flex items-center text-sm">
                  <span
                    className={`h-3 w-3 rounded-full ${item.color} mr-2`}
                  ></span>
                  <span>{item.name}</span>
                  <span className="ml-auto text-muted-foreground">
                    {item.percent.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 5. Recent Files Card (Was section 4) */}
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Files
            </CardTitle>
            <CardDescription>
              Your most recently accessed or modified files.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Type</TableHead>
                  <TableHead>Modified</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentFiles.map((file) => (
                  <TableRow key={file.name} className="hover:bg-muted/50">
                    <TableCell className="font-medium truncate max-w-xs">
                      {file.name}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {file.type}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {file.modified}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
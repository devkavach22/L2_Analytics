import {
  FileUp,
  Scissors,
  FileDown,
  Lock,
  ImageIcon,
  FileCog,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// --- STATIC DATA (Expand this with more logs for a real page) ---
const activityLog = [
  { id: 1, user: "John Doe", action: "Merged PDF", time: "2 minutes ago", actionType: "merge" },
  { id: 2, user: "Jane Smith", action: "Split PDF", time: "5 minutes ago", actionType: "split" },
  { id: 3, user: "Bob Johnson", action: "Compressed PDF", time: "1 hour ago", actionType: "compress" },
  { id: 4, user: "Alice Brown", action: "Locked PDF", time: "3 hours ago", actionType: "lock" },
  { id: 5, user: "John Doe", action: "Converted PDF to JPG", time: "1 day ago", actionType: "convert" },
  { id: 6, user: "Jane Smith", action: "Merged PDF", time: "1 day ago", actionType: "merge" },
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

export default function ActivityLogPage() {
  return (
    
    <Card className="shadow-lg rounded-2xl border-0">
      <CardHeader>
        <CardTitle>Full Activity Log</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* You would add pagination controls here in a real app */}
          {activityLog.map((activity) => (
            <div key={activity.id} className="flex items-start gap-4">
              <div className="bg-gray-100 dark:bg-neutral-800 p-3 rounded-full flex-shrink-0">
                {getActivityIcon(activity.actionType)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{activity.user}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {activity.action}
                </p>
              </div>
              <span className="text-xs text-muted-foreground pt-1 flex-shrink-0">
                {activity.time}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChartHorizontal } from "lucide-react";

export default function UserReportsPage() {
  return (
    <Card className="shadow-lg rounded-2xl border-0">
      <CardHeader>
        <CardTitle>User Reports</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center min-h-[300px] text-muted-foreground">
          <BarChartHorizontal className="w-16 h-16 mb-4" />
          <h3 className="text-lg font-medium">User Reports & Analytics</h3>
          <p className="text-sm">
            Detailed charts and data visualizations will be displayed here.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
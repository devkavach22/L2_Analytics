import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export const KPICard = ({ title, value, icon: Icon, trend }: KPICardProps) => {
  return (
    <Card className="hover-lift shadow-card flex flex-col h-full ">
      {/* - Added `flex flex-col h-full` to the Card.
        - `h-full` makes the card stretch to the tallest height in its row (if in a grid/flex container).
        - `flex flex-col` ensures content inside flows vertically.
      */}
      <CardContent className="p-6 flex-grow">
        {/* `flex-grow` allows this section to expand and fill the available vertical space */}
        <div className="flex items-center justify-between h-full">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {trend ? (
              <p className={`text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </p>
            ) : (
              // This placeholder maintains the height even if no trend data is present
              <p className="text-sm opacity-0 select-none">&nbsp;</p>
            )}
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-800">
            <Icon className="h-6 w-6 text-primary-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Folder } from "lucide-react";

export function OthersView() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Others</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Other Files
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>This section will display all your other miscellaneous files.</p>
        </CardContent>
      </Card>
    </div>
  );
}
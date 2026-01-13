import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Image } from "lucide-react";

export function ImagesView() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Images</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Image Files
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>This section will display all your image files.</p>
        </CardContent>
      </Card>
    </div>
  );
}
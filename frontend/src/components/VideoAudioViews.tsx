import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Video } from "lucide-react";

export function VideoAudioView() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Video & Audio</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Media Files
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>This section will display all your video and audio files.</p>
        </CardContent>
      </Card>
    </div>
  );
}
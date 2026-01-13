    import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  ArrowUpDown,
  LayoutGrid,
  List,
  MoreHorizontal,
  Download,
  Trash2,
  Eye,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// File data is now local to this component
const files = [
  {
    id: 1,
    name: "Annual_Report_2024.pdf",
    size: "3.2 MB",
    modified: "10:09pm, 10 Oct",
  },
  {
    id: 2,
    name: "Contract_Agreement.pdf",
    size: "1.8 MB",
    modified: "10:09pm, 10 Oct",
  },
  {
    id: 3,
    name: "Presentation_Slides.pdf",
    size: "5.4 MB",
    modified: "10:09pm, 10 Oct",
  },
  {
    id: 4,
    name: "Invoice_January.pdf",
    size: "856 KB",
    modified: "10:09pm, 10 Oct",
  },
  {
    id: 5,
    name: "Marketing_Plan.pdf",
    size: "2.1 MB",
    modified: "10:09pm, 10 Oct",
  },
  {
    id: 6,
    name: "My_CV.pdf",
    size: "1.2 MB",
    modified: "10:09pm, 10 Oct",
  },
];

export function DocumentsView() {
  return (
    <div className="space-y-6">
      {/* Content Header (Documents, Sort, View) */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Documents</h1>
        <div className="flex items-center gap-4">
          <Button variant="outline" className="shadow-card">
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg shadow-card">
            <Button variant="ghost" size="icon" className="bg-background">
              <LayoutGrid className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <List className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Files Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {files.map((file, index) => (
          <Card
            key={file.id}
            className="hover-lift shadow-card animate-fade-in-up"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200 flex-shrink-0">
                <FileText className="h-5 w-5 text-gray-800" />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <h3 className="text-base font-semibold truncate">{file.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {file.size}
              </p>
              <p className="text-sm text-muted-foreground">
                {file.modified}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
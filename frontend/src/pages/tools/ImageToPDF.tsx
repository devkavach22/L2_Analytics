import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Instance from "@/lib/axiosInstance";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  FileImage,
  ArrowLeft,
  GripVertical,
  X,
  Download,
  Plus,
  RectangleHorizontal,
  RectangleVertical,
  Loader2,
  CheckCircle,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// --- Types ---
type SortableFile = {
  id: string;
  file: File;
  url: string;
};

type PageOrientation = "portrait" | "landscape";
type PageMargin = "no" | "small" | "big";
type PageSize = "a4" | "letter";

interface ConvertedFileDetails {
  outputFile: string;
  message: string;
}

// --- Sortable Item Component ---
function SortableImageItem({
  id,
  file,
  url,
  removeFile,
}: {
  id: string;
  file: File;
  url: string;
  removeFile: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : "auto",
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group w-full aspect-square border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white"
    >
      <img
        src={url}
        alt={file.name}
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-0 left-0 right-0 bg-white/90 p-2 text-slate-900 text-xs truncate border-t border-slate-100">
        {file.name}
      </div>
      <button
        {...listeners}
        {...attributes}
        className="absolute top-1 left-1 p-1.5 bg-white/80 rounded-full text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab hover:text-orange-600 shadow-sm"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <Button
        variant="destructive"
        size="icon"
        className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 shadow-sm"
        onClick={removeFile}
      >
        <X className="h-4 w-4 text-white" />
      </Button>
    </div>
  );
}

// --- Main Component ---
export default function ImageToPDF() {
  const [files, setFiles] = useState<SortableFile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // Options State
  const [orientation, setOrientation] = useState<PageOrientation>("portrait");
  const [pageSize, setPageSize] = useState<PageSize>("a4");
  const [margin, setMargin] = useState<PageMargin>("small");

  // Logic State
  const [isConverting, setIsConverting] = useState(false);
  const [convertedFile, setConvertedFile] = useState<ConvertedFileDetails | null>(null);

  const { toast } = useToast();
  const isAuthenticated = true;
  const isAdmin = false;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fileIds = useMemo(() => files.map((f) => f.id), [files]);
  const activeFile = useMemo(() => files.find((f) => f.id === activeId), [files, activeId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles: SortableFile[] = Array.from(e.target.files).map(
        (file) => ({
          id: self.crypto.randomUUID(),
          file: file,
          url: URL.createObjectURL(file),
        })
      );
      setFiles((currentFiles) => [...currentFiles, ...newFiles]);
      
      // Reset converted state if user adds more files after a conversion
      if (convertedFile) {
        setConvertedFile(null);
      }
      toast({ title: "Files added", description: `${newFiles.length} image(s) added` });
      e.target.value = "";
    }
  };

  const removeFile = (id: string) => {
    setFiles((currentFiles) => {
      const fileToRemove = currentFiles.find(file => file.id === id);
      if (fileToRemove) URL.revokeObjectURL(fileToRemove.url);
      return currentFiles.filter((file) => file.id !== id);
    });
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFiles((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
    setActiveId(null);
  };

  const handleReset = () => {
    setFiles([]);
    setConvertedFile(null);
    setIsConverting(false);
  };

  const handleConvert = async () => {
    if (files.length === 0) {
      toast({ title: "Error", description: "Please select images first", variant: "destructive" });
      return;
    }

    setIsConverting(true);

    try {
      const formData = new FormData();
      files.forEach((f) => {
        formData.append('files', f.file);
      });
      
      formData.append('orientation', orientation);
      formData.append('size', pageSize.toUpperCase()); 
      formData.append('margin', margin);

      const token = localStorage.getItem("authToken");

      const response = await Instance.post('/pdf/image-to-pdf', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': token ? `${token}` : '',
        }
      });
      
      console.log("Full API Response:", response); // For debugging

      // --- ROBUST RESPONSE HANDLING ---
      let detectedPath = null;
      const data = response.data;

      if (data) {
        // 1. Check specifically for 'downloadUrl' (Found in your Postman screenshot)
        if (data.downloadUrl) {
            detectedPath = data.downloadUrl;
        } 
        // 2. Check for 'outputFile' (Found in CompressPDF logic)
        else if (data.outputFile) {
            detectedPath = data.outputFile;
        }
        // 3. Fallback to check inside a 'files' array
        else if (Array.isArray(data.files) && data.files.length > 0) {
            const firstFile = data.files[0];
            detectedPath = firstFile.outputFile || firstFile.path || firstFile.filename || firstFile.downloadUrl;
        }
      }

      if (detectedPath) {
        setConvertedFile({
            outputFile: detectedPath,
            message: data.message || "Images combined successfully!"
        });
        toast({ title: "Success", description: "PDF generated successfully." });
      } else {
        console.error("Structure mismatch. Response Data:", data);
        throw new Error("Could not find a valid file path in the server response.");
      }

    } catch (error) {
      console.error("Conversion Error:", error);
      toast({ title: "Conversion Failed", description: "Could not generate PDF.", variant: "destructive" });
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = async () => {
    if (!convertedFile || !convertedFile.outputFile) {
        toast({ title: "Error", description: "No file to download", variant: "destructive" });
        return;
    }

    // rawPath will be something like "/outputs/images_to_pdf_1764569780210.pdf"
    const rawPath = convertedFile.outputFile;
    // Extract filename: "images_to_pdf_1764569780210.pdf"
    const filenameToDownload = rawPath.split(/[/\\]/).pop();

    if (!filenameToDownload) {
        toast({ title: "Error", description: "Invalid filename", variant: "destructive" });
        return;
    }

    const token = localStorage.getItem("authToken");

    try {
        toast({ title: "Download Started", description: "Fetching your PDF..." });

        const response = await Instance.get(`/pdf/download/${filenameToDownload}`, {
            headers: { 'Authorization': token ? `${token}` : '' },
            responseType: 'blob',
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filenameToDownload);
        
        document.body.appendChild(link);
        link.click();
        
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast({ title: "Download Complete", description: "File saved to your device." });

    } catch (error) {
        console.error("Download failed", error);
        toast({ title: "Download Failed", description: "Could not retrieve the file.", variant: "destructive" });
    }
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-orange-100 selection:text-orange-900 overflow-x-hidden">
       {/* --- AMBIENT BACKGROUND --- */}
       <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-slate-50 to-slate-100" />
        <motion.div animate={{ opacity: [0.4, 0.6, 0.4], scale: [1, 1.1, 1], rotate: [0, 5, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} className="absolute -top-[20%] left-[10%] w-[60vw] h-[60vw] bg-orange-200/40 rounded-full blur-[120px]" />
        <motion.div animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.2, 1], rotate: [0, -5, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }} className="absolute -bottom-[10%] right-[0%] w-[50vw] h-[50vw] bg-red-200/40 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-multiply" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header isAuthenticated={isAuthenticated} isAdmin={isAdmin} onLogout={() => console.log("Logout")} />
        
        <main className="flex-1 flex-col py-16">
          <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">
            
             <Link
              to="/tools"
              className="inline-flex items-center bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-700 gap-2 text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm"
            >
              <ArrowLeft className="h-4 w-4 text-slate-500" />
              <span className="text-slate-600">Back to Tools</span>
            </Link>

            <div className="text-center space-y-3">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 border border-orange-200 animate-float">
                <FileImage className="h-8 w-8 text-orange-500" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-amber-500 animate-gradient-x">Image to PDF</span>
              </h1>
              <p className="text-lg text-slate-500 max-w-xl mx-auto">
                Combine JPG, PNG, and other images into a single PDF file
              </p>
            </div>

            {/* --- VIEW LOGIC --- */}
            
            {convertedFile ? (
                // --- STATE 3: DOWNLOAD (SUCCESS) ---
                <div className="max-w-2xl mx-auto mt-8">
                    <Card className="bg-emerald-50 backdrop-blur-md shadow-xl border border-emerald-200 overflow-hidden relative">
                         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-400" />
                         <CardHeader className="text-center pb-2">
                             <div className="mx-auto bg-white p-3 rounded-full mb-4 shadow-sm">
                                 <CheckCircle className="h-8 w-8 text-emerald-600" />
                             </div>
                             <CardTitle className="text-emerald-900 text-2xl">Conversion Complete!</CardTitle>
                             <CardDescription className="text-emerald-700 text-base">
                                 {convertedFile.message}
                             </CardDescription>
                         </CardHeader>
                         <CardContent className="space-y-6 pt-4">
                             <div className="bg-white/60 rounded-xl p-6 border border-emerald-100 flex items-center justify-between">
                                  <span className="text-emerald-800 font-medium text-sm uppercase tracking-wider">File Name</span>
                                  <span className="text-emerald-900 font-mono text-sm truncate max-w-[250px]">
                                    {convertedFile.outputFile.split(/[/\\]/).pop()}
                                  </span>
                             </div>

                             <div className="flex flex-col sm:flex-row gap-4">
                                <Button 
                                    onClick={handleDownload} 
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-6 rounded-xl font-semibold shadow-lg shadow-green-900/10 transition-all hover:scale-[1.02]"
                                >
                                    <Download className="mr-2 h-5 w-5" />
                                    Download PDF
                                </Button>
                                <Button 
                                    variant="outline" 
                                    onClick={handleReset} 
                                    className="bg-white border-slate-300 text-slate-700 hover:bg-slate-100 py-6 rounded-xl"
                                >
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Start Over
                                </Button>
                             </div>
                         </CardContent>
                    </Card>
                </div>

            ) : files.length === 0 ? (
              // --- STATE 1: UPLOAD ---
              <Card className="bg-white/80 backdrop-blur-md shadow-xl border border-slate-200 max-w-4xl mx-auto mt-8">
                <CardHeader>
                  <CardTitle className="text-slate-900">Upload Image Files</CardTitle>
                  <CardDescription className="text-slate-500">
                    Select one or more images to combine into a PDF
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed rounded-xl p-12 text-center border-slate-300 hover:border-orange-500 transition-colors bg-slate-50">
                    <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                    <label htmlFor="file-upload" className="cursor-pointer">
                       <span className="text-orange-600 font-semibold hover:text-orange-500 transition-colors">Choose files</span>
                      {" "}<span className="text-slate-500">or drag and drop</span>
                      <input
                        id="file-upload"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleFileSelect}
                        multiple
                      />
                    </label>
                    <p className="text-sm text-slate-500 mt-2">.jpg, .png, .webp files only</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              // --- STATE 2: EDIT / SORT ---
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                <div className="md:col-span-2">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={(e) => setActiveId(e.active.id as string)}
                    onDragEnd={handleDragEnd}
                    onDragCancel={() => setActiveId(null)}
                  >
                    <SortableContext items={fileIds} strategy={rectSortingStrategy}>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {files.map((fileItem) => (
                          <SortableImageItem
                            key={fileItem.id}
                            id={fileItem.id}
                            file={fileItem.file}
                            url={fileItem.url}
                            removeFile={() => removeFile(fileItem.id)}
                          />
                        ))}
                        <label 
                          htmlFor="file-upload-more"
                          className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-orange-500 hover:bg-slate-50 transition-colors"
                        >
                          <Plus className="h-10 w-10 text-slate-400 group-hover:text-orange-500" />
                          <span className="text-sm font-medium text-slate-500 mt-2">Add more</span>
                          <input
                            id="file-upload-more"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={handleFileSelect}
                            multiple
                          />
                        </label>
                      </div>
                    </SortableContext>
                    <DragOverlay>
                      {activeFile ? (
                        <div className="relative group w-full aspect-square border border-orange-500 rounded-xl overflow-hidden shadow-2xl cursor-grabbing" style={{ transform: 'scale(1.05)' }}>
                           <img src={activeFile.url} alt={activeFile.file.name} className="w-full h-full object-cover" />
                        </div>
                      ) : null}
                    </DragOverlay>
                  </DndContext>
                </div>

                {/* --- Right Sidebar --- */}
                <div className="md:col-span-1">
                  <Card className={`bg-white/80 backdrop-blur-md shadow-xl border border-slate-200 sticky top-24 transition-opacity ${isConverting ? 'opacity-70 pointer-events-none' : ''}`}>
                    <CardHeader>
                      <CardTitle className="text-slate-900">Options</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      
                      <div className="space-y-2">
                        <label className="font-medium text-slate-700">Orientation</label>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant={orientation === "portrait" ? "default" : "outline"}
                            className={cn("w-full", orientation === "portrait" ? "bg-orange-600 hover:bg-orange-700 text-white" : "bg-transparent border-slate-300 text-slate-700 hover:bg-slate-100")}
                            onClick={() => setOrientation("portrait")}
                          >
                            <RectangleVertical className="mr-2 h-4 w-4" /> Portrait
                          </Button>
                          <Button
                            variant={orientation === "landscape" ? "default" : "outline"}
                             className={cn("w-full", orientation === "landscape" ? "bg-orange-600 hover:bg-orange-700 text-white" : "bg-transparent border-slate-300 text-slate-700 hover:bg-slate-100")}
                            onClick={() => setOrientation("landscape")}
                          >
                            <RectangleHorizontal className="mr-2 h-4 w-4" /> Landscape
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="font-medium text-slate-700">Size</label>
                        <Select value={pageSize} onValueChange={(val: PageSize) => setPageSize(val)}>
                          <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-slate-200 text-slate-900">
                            <SelectItem value="a4">A4 (210x297 mm)</SelectItem>
                            <SelectItem value="letter">Letter (216x279 mm)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="font-medium text-slate-700">Margin</label>
                        <div className="grid grid-cols-3 gap-2">
                          {['no', 'small', 'big'].map((m) => (
                            <Button
                            key={m}
                            variant={margin === m ? "default" : "outline"}
                            className={cn("w-full capitalize text-xs px-1", margin === m ? "bg-orange-600 hover:bg-orange-700 text-white" : "bg-transparent border-slate-300 text-slate-700 hover:bg-slate-100")}
                            onClick={() => setMargin(m as PageMargin)}
                          >
                             {m}
                          </Button>
                          ))}
                        </div>
                      </div>

                      <Button 
                        onClick={handleConvert} 
                        disabled={files.length === 0 || isConverting}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-lg py-6 rounded-xl font-semibold transition-colors mt-4 text-white shadow-lg shadow-orange-500/20"
                      >
                         {isConverting ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Converting...
                          </>
                        ) : (
                          <>
                            <Download className="mr-2 h-5 w-5" />
                            Convert PDF
                          </>
                        )}
                      </Button>

                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
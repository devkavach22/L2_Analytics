import { useState } from "react";
import { Link } from "react-router-dom";
import Instance from "@/lib/axiosInstance"; 
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Upload, Download, X, GripVertical, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";

type SortableFile = {
  id: string;
  file: File;
};

function SortableFileItem({ id, file, removeFile }: { id: string, file: File, removeFile: () => void }) {
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
    zIndex: isDragging ? 100 : 'auto',
    opacity: isDragging ? 0.9 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white shadow-sm hover:bg-slate-50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <button {...listeners} {...attributes} className="cursor-grab text-slate-400 hover:text-orange-600">
           <GripVertical className="h-5 w-5" />
        </button>
        <FileText className="h-5 w-5 text-orange-600" />
        <span className="font-medium text-slate-900 truncate max-w-[200px] sm:max-w-md">{file.name}</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={removeFile}
        className="text-slate-400 hover:text-red-500 hover:bg-red-50"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function MergePDF() {
  const [files, setFiles] = useState<SortableFile[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const { toast } = useToast();
  const isAuthenticated = true;
  const isAdmin = false;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles: SortableFile[] = Array.from(e.target.files).map((file) => ({
        id: self.crypto.randomUUID(),
        file: file,
      }));
      setFiles((currentFiles) => [...currentFiles, ...newFiles]);
      toast({ title: "Files added", description: `${newFiles.length} file(s) added successfully` });
    }
  };

  const removeFile = (id: string) => {
    setFiles((currentFiles) => currentFiles.filter((file) => file.id !== id));
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
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      toast({ title: "Error", description: "Please select at least 2 PDF files to merge", variant: "destructive" });
      return;
    }

    setIsMerging(true);
    toast({ title: "Merging PDFs", description: "Processing your files..." });

    try {
      const formData = new FormData();
      files.forEach((fileItem) => {
        formData.append('files', fileItem.file);
      });

      const token = localStorage.getItem("authToken");

      const response = await Instance.post('/pdf/merge-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': token ? `${token}` : '',
        }
      });

      const mergedFileData = response.data.files && response.data.files[0];
      
      if (!mergedFileData || !mergedFileData.outputFile) {
        throw new Error("Could not retrieve merged file info from server.");
      }

      const rawPath = mergedFileData.outputFile;
      const filenameToDownload = rawPath.split(/[/\\]/).pop();

      if (!filenameToDownload) {
         throw new Error("Invalid filename received.");
      }

      toast({ title: "Merge Successful", description: "Downloading your merged PDF..." });

      const downloadResponse = await Instance.get(`/pdf/download/${filenameToDownload}`, {
        headers: { 'Authorization': token ? `${token}` : '' },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([downloadResponse.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filenameToDownload);
      document.body.appendChild(link);
      link.click();
      
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({ title: "Complete", description: "Your merged PDF has been downloaded." });

    } catch (error) {
      console.error("Merge Error:", error);
      toast({ 
        title: "Merge Failed", 
        description: "There was an error merging your files. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-white font-sans text-slate-900 selection:bg-orange-200 selection:text-orange-900 overflow-x-hidden">
      
       {/* --- ENHANCED AMBIENT BACKGROUND --- */}
       <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-white" />
        
        {/* Top-Left Vibrant Glow */}
        <motion.div 
          animate={{ opacity: [0.4, 0.6, 0.4], scale: [1, 1.2, 1], rotate: [0, 10, 0] }} 
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} 
          className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] bg-gradient-to-br from-orange-300/40 via-amber-200/40 to-transparent rounded-full blur-[100px]" 
        />
        
        {/* Bottom-Right Warm Glow */}
        <motion.div 
          animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.3, 1], rotate: [0, -10, 0] }} 
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} 
          className="absolute -bottom-[15%] -right-[5%] w-[50vw] h-[50vw] bg-gradient-to-tl from-red-200/40 via-orange-200/40 to-transparent rounded-full blur-[100px]" 
        />
        
        {/* Center/Top Title Highlight Glow (New) */}
        <motion.div
           animate={{ opacity: [0.2, 0.4, 0.2], scale: [0.9, 1.1, 0.9] }}
           transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
           className="absolute top-[5%] left-[20%] right-[20%] h-[40vh] bg-gradient-to-b from-orange-100/60 via-amber-100/30 to-transparent rounded-full blur-[80px]"
        />

        {/* Noise overlay for texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-multiply" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header isAuthenticated={isAuthenticated} isAdmin={isAdmin} onLogout={() => console.log("Logout")} />
        
        {/* Main Content with Spacing Fixes */}
        <main className="flex-1 flex-col pt-32 pb-20">
          <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8"> 
            
             <Link
              to="/tools"
              className="inline-flex items-center bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-700 gap-2 text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm"
            >
              <ArrowLeft className="h-4 w-4 text-slate-500" />
              <span className="text-slate-600">Back to Tools</span>
            </Link>

            <div className="text-center space-y-4 relative z-10">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-amber-500 animate-gradient-x">Merge PDF Files</span>
              </h1>
              <p className="text-lg text-slate-500 max-w-xl mx-auto">
                Combine multiple PDF documents into one file
              </p>
            </div>

            {/* Steps */}
            <div className="space-y-6 py-2">
               <div className="relative max-w-4xl mx-auto">
                <div className="absolute left-0 right-0 top-5 h-0.5 border-t-2 border-dashed border-slate-200 -z-10 hidden md:block" />
                <div className="flex flex-col md:flex-row gap-6 justify-between px-4">
                   {[
                    { step: 1, title: "Upload", desc: "Select PDF files" },
                    { step: 2, title: "Arrange", desc: "Drag to order" },
                    { step: 3, title: "Merge", desc: "Download PDF" }
                  ].map((item) => (
                    <div key={item.step} className="flex flex-col items-center text-center flex-1">
                       <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white border-2 border-orange-200 text-orange-600 font-bold text-base flex-shrink-0 z-10 shadow-sm">
                        {item.step}
                      </div>
                      <h4 className="font-semibold mb-0.5 mt-2 text-slate-900 text-sm">{item.title}</h4>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Upload Card */}
            <Card className="bg-white/80 backdrop-blur-md shadow-xl border border-slate-200 max-w-5xl mx-auto">
              <CardHeader className="pb-4">
                <CardTitle className="text-slate-900 text-xl">Upload & Arrange</CardTitle>
                <CardDescription className="text-slate-500">
                  Select multiple PDF files to merge them into a single document
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 <div className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors bg-slate-50/50 ${isMerging ? 'opacity-50 pointer-events-none border-slate-300' : 'border-slate-300 hover:border-orange-500 hover:bg-orange-50/10'}`}>
                  <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-orange-600 font-semibold hover:text-orange-500 transition-colors text-lg">Choose files</span>
                    {" "}<span className="text-slate-500 text-lg">or drag and drop</span>
                    <input
                      id="file-upload"
                      type="file"
                      accept=".pdf"
                      multiple
                      className="hidden"
                      onChange={handleFileSelect}
                      disabled={isMerging}
                    />
                  </label>
                  <p className="text-sm text-slate-500 mt-2">PDF files only</p>
                </div>

                {files.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-orange-600">Selected Files ({files.length})</h3>
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={files.map(f => f.id)}
                        strategy={verticalListSortingStrategy}
                        disabled={isMerging}
                      >
                        <div className="space-y-2">
                          {files.map((fileItem) => (
                            <SortableFileItem
                              key={fileItem.id}
                              id={fileItem.id}
                              file={fileItem.file}
                              removeFile={() => removeFile(fileItem.id)}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </div>
                )}

                <Button 
                  onClick={handleMerge} 
                  disabled={files.length < 2 || isMerging}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-lg py-4 h-auto rounded-xl font-semibold transition-colors text-white disabled:opacity-70 shadow-lg shadow-orange-500/20"
                >
                  {isMerging ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Merging & Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-5 w-5" />
                      Merge PDF Files
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
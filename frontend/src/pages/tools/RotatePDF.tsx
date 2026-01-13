import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Instance from "@/lib/axiosInstance";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, RotateCcw, RotateCw, RefreshCcw, ArrowLeft, File as FileIcon, Loader2, Download, CheckCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { motion } from "framer-motion";

interface RotatedFileDetails {
  originalName: string;
  outputFile: string;
  originalSize: number;
  rotatedSize: number;
  message: string;
}

const STORAGE_KEY = "kavach_rotated_file";

export default function RotatePDF() {
  const [file, setFile] = useState<File | null>(null);
  const [rotation, setRotation] = useState("right");
  const [isRotating, setIsRotating] = useState(false);
  const [rotatedFile, setRotatedFile] = useState<RotatedFileDetails | null>(null);
  
  const { toast } = useToast();
  const isAuthenticated = true;
  const isAdmin = false;

  useEffect(() => {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      try {
        const parsedData: RotatedFileDetails = JSON.parse(storedData);
        setRotatedFile(parsedData);
      } catch (error) {
        console.error("Failed to parse stored rotated file data", error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setRotatedFile(null);
      localStorage.removeItem(STORAGE_KEY);
      
      toast({ 
        title: "File uploaded", 
        description: `${e.target.files[0].name} ready` 
      });
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const handleRotate = async () => {
    if (!file) { 
      toast({ title: "Error", description: "Please select a PDF file first", variant: "destructive" }); 
      return; 
    }

    setIsRotating(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const angle = rotation === 'right' ? 90 : 270;
      
      const ranges = JSON.stringify([
        { 
          from: 1, 
          to: 10000, 
          rotation: angle 
        }
      ]);
      
      formData.append('ranges', ranges);

      const token = localStorage.getItem("authToken");

      const response = await Instance.post('/pdf/rotate-pdf', formData, {
        headers: {
            'Content-Type': 'multipart/form-data', 
            'Authorization': token ? `${token}` : '',
        }
      });

      const responseData = response.data.files ? response.data.files[0] : response.data;
      
      if (responseData) {
        const fileData: RotatedFileDetails = {
            originalName: file.name,
            outputFile: responseData.outputFile || responseData.filename,
            originalSize: file.size,
            rotatedSize: responseData.size || file.size,
            message: "Rotation successful"
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(fileData));
        setRotatedFile(fileData);
        toast({ title: "Success!", description: "PDF Rotated successfully." });
      } else {
        throw new Error("Invalid response structure from server");
      }

    } catch (error) {
      console.error(error);
      toast({ title: "Rotation Failed", description: "There was an error rotating your file.", variant: "destructive" });
    } finally {
      setIsRotating(false);
    }
  };

  const handleDownload = async () => {
    const storedData = localStorage.getItem(STORAGE_KEY);
    let fileDetails: RotatedFileDetails | null = null;

    if (storedData) fileDetails = JSON.parse(storedData);
    else if (rotatedFile) fileDetails = rotatedFile;

    if (!fileDetails || !fileDetails.outputFile) {
      toast({ title: "Download Error", description: "No rotated file record found.", variant: "destructive" });
      return;
    }

    const rawPath = fileDetails.outputFile;
    const filenameToDownload = rawPath.split(/[/\\]/).pop();

    if (!filenameToDownload) {
        toast({ title: "Error", description: "Could not parse filename", variant: "destructive" });
        return;
    }

    const token = localStorage.getItem("authToken");
    
    try {
      toast({ title: "Download Started", description: "Fetching your rotated file..." });

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
      console.error("Download Error:", error);
      toast({ title: "Download Failed", description: "Could not download the file.", variant: "destructive" });
    }
  };

  const handleReset = () => {
    setFile(null);
    setRotatedFile(null);
    localStorage.removeItem(STORAGE_KEY);
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-gray-50 font-sans text-slate-900 selection:bg-orange-100 selection:text-orange-900 overflow-x-hidden">
       {/* Ambient BG */}
       <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-white" />
        <motion.div animate={{ opacity: [0.4, 0.6, 0.4] }} transition={{ duration: 20, repeat: Infinity }} className="absolute -top-[20%] left-[10%] w-[60vw] h-[60vw] bg-orange-200/30 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header isAuthenticated={isAuthenticated} isAdmin={isAdmin} onLogout={() => console.log("Logout")} />
        <br/>
        <br/>
        <br/>
        <main className="flex-1 flex-col py-10">
          <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">
            <Link to="/tools" className="inline-flex items-center bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-700 gap-2 text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
              <ArrowLeft className="h-4 w-4 text-slate-500" /><span className="text-slate-600">Back to Tools</span>
            </Link>

            <div className="text-center space-y-2 mb-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 border border-orange-200 animate-float">
                <RefreshCcw className="h-8 w-8 text-orange-600" />
              </div>
              <h1 className="text-4xl font-bold text-slate-900">Rotate PDF</h1>
              <p className="text-lg text-slate-500">Change the orientation of your PDF pages</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
              <div className="lg:col-span-2">
                {!rotatedFile ? (
                  <Card className="bg-white shadow-xl border border-slate-200 h-full">
                    <CardHeader>
                      <CardTitle className="text-slate-900">Upload PDF File</CardTitle>
                      <CardDescription className="text-slate-500">Select the PDF file you want to rotate</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className={`border-2 border-dashed rounded-xl p-16 text-center transition-colors bg-slate-50/50 ${isRotating ? 'opacity-50 pointer-events-none border-slate-300' : 'border-slate-300 hover:border-orange-500'}`}>
                        <Upload className="mx-auto h-12 w-12 text-slate-400 mb-2" />
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <span className="text-orange-600 font-semibold hover:text-orange-500">Choose file</span> <span className="text-slate-500">or drag and drop</span>
                          <input id="file-upload" type="file" accept=".pdf" disabled={isRotating} className="hidden" onChange={handleFileSelect} />
                        </label>
                        <p className="text-sm text-slate-500 mt-2">PDF files only</p>
                      </div>

                      {file && (
                        <div className="mt-4 p-4 rounded-xl border bg-slate-50 border-orange-200 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <FileIcon className="h-5 w-5 text-orange-600" />
                             <div>
                               <p className="font-medium text-slate-900">{file.name}</p>
                               <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
                             </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => setFile(null)} disabled={isRotating} className="text-slate-400 hover:text-red-500">
                            Remove
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-emerald-50 backdrop-blur-md shadow-xl border border-emerald-200 h-full relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-400" />
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <CheckCircle className="h-6 w-6 text-emerald-600" />
                        <CardTitle className="text-emerald-900">Rotation Complete!</CardTitle>
                      </div>
                      <CardDescription className="text-emerald-700">
                        Your file has been processed successfully.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="bg-white/60 rounded-xl p-6 border border-emerald-100 space-y-4">
                        <div className="flex items-center justify-between p-3 bg-emerald-100/50 rounded-lg">
                          <span className="text-emerald-700 text-sm">File Name</span>
                          <span className="text-emerald-900 font-mono text-sm truncate max-w-[200px]">
                            {rotatedFile.outputFile.split(/[/\\]/).pop()}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4">
                         <Button onClick={handleDownload} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-6 rounded-xl font-semibold shadow-lg shadow-green-900/10 transition-all hover:scale-[1.02]">
                            <Download className="mr-2 h-5 w-5" />
                            Download PDF
                         </Button>
                         <Button variant="outline" onClick={handleReset} className="bg-white border-slate-300 text-slate-700 hover:bg-slate-100 py-6 rounded-xl">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Rotate Another
                         </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="lg:col-span-1 space-y-4">
                <Card className={`bg-white shadow-xl border border-slate-200 transition-opacity duration-300 ${rotatedFile ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-slate-900">Rotation</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <RadioGroup value={rotation} onValueChange={setRotation} className="flex flex-col gap-3" disabled={!file || isRotating}>
                      <Label htmlFor="right" className={`flex items-center space-x-3 p-3 border rounded-xl cursor-pointer transition-all ${rotation === 'right' ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-orange-500/50 bg-slate-50'}`}>
                        <RadioGroupItem value="right" id="right" className="text-orange-600 border-slate-400" />
                        <RotateCw className="h-5 w-5 text-slate-500" />
                        <p className="font-medium text-slate-700">RIGHT (90°)</p>
                      </Label>
                      <Label htmlFor="left" className={`flex items-center space-x-3 p-3 border rounded-xl cursor-pointer transition-all ${rotation === 'left' ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-orange-500/50 bg-slate-50'}`}>
                        <RadioGroupItem value="left" id="left" className="text-orange-600 border-slate-400" />
                        <RotateCcw className="h-5 w-5 text-slate-500" />
                        <p className="font-medium text-slate-700">LEFT (270°)</p>
                      </Label>
                    </RadioGroup>
                  </CardContent>
                </Card>
                
                {!rotatedFile && (
                  <Button 
                    onClick={handleRotate} 
                    disabled={!file || isRotating} 
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white text-base py-6 rounded-xl font-semibold shadow-lg shadow-orange-500/20 disabled:opacity-50"
                  >
                    {isRotating ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Rotating...
                      </>
                    ) : (
                      <>
                        <RefreshCcw className="mr-2 h-5 w-5" /> 
                        Rotate PDF
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
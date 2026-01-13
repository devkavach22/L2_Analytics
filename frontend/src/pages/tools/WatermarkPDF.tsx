import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Instance from "@/lib/axiosInstance";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Upload, Download, ArrowLeft, X, FileText, Image as ImageIcon, Type, Loader2, CheckCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";

interface WatermarkedFileResponse {
  originalName: string;
  outputFile: string;
  message: string;
}

const STORAGE_KEY = "kavach_watermarked_file";

export default function WatermarkPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState("text"); 
  const [watermarkText, setWatermarkText] = useState("KAVACH");
  const [rotation, setRotation] = useState("-45");
  const [pages, setPages] = useState("all");
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [watermarkedFile, setWatermarkedFile] = useState<WatermarkedFileResponse | null>(null);
  
  const { toast } = useToast();
  const isAuthenticated = true;
  const isAdmin = false;

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setWatermarkedFile(null);
      
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(objectUrl);

      toast({ 
        title: "File uploaded", 
        description: `${selectedFile.name} ready to watermark` 
      });
    }
  };

  const handleWatermark = async () => {
    if (!file) { 
      toast({ title: "Error", description: "Please upload a PDF first.", variant: "destructive" }); 
      return; 
    }

    setIsProcessing(true);
    const token = localStorage.getItem("authToken");

    try {
      const formData = new FormData();
      formData.append('file', file);

      const configObj = {
        type: activeTab, 
        text: activeTab === 'text' ? watermarkText : "",
        pages: pages,
        rotation: parseInt(rotation)
      };

      formData.append('config', JSON.stringify(configObj));

      const response = await Instance.post('/pdf/watermark-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': token ? `${token}` : '',
        }
      });

      if (response.data) {
        const resultData = response.data.files ? response.data.files[0] : response.data;
        
        setWatermarkedFile({
          originalName: file.name,
          outputFile: resultData.outputFile || resultData.filename, 
          message: "Watermark applied successfully"
        });
        
        toast({ title: "Success!", description: "Watermark added to PDF." });
      }

    } catch (error) {
      console.error("Watermark Error:", error);
      toast({ 
        title: "Processing Failed", 
        description: "Could not watermark the PDF. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!watermarkedFile || !watermarkedFile.outputFile) return;

    const rawPath = watermarkedFile.outputFile;
    const filenameToDownload = rawPath.split(/[/\\]/).pop();

    if (!filenameToDownload) {
      toast({ title: "Error", description: "Invalid filename", variant: "destructive" });
      return;
    }

    const token = localStorage.getItem("authToken");

    try {
      toast({ title: "Download Started", description: "Fetching your file..." });

      const response = await Instance.get(`/pdf/download/${filenameToDownload}`, {
        headers: { 'Authorization': token ? `${token}` : '' },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `watermarked_${filenameToDownload}`);
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
    setPreviewUrl(null);
    setWatermarkedFile(null);
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-gray-50 font-sans text-slate-900 overflow-x-hidden">
       <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-white" />
        <motion.div animate={{ opacity: [0.4, 0.6, 0.4] }} transition={{ duration: 20, repeat: Infinity }} className="absolute -top-[20%] left-[10%] w-[60vw] h-[60vw] bg-orange-200/30 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header isAuthenticated={isAuthenticated} isAdmin={isAdmin} onLogout={() => console.log("Logout")} />
        <br/>
        <br/>
        <br/>
         {/* --- IGNORE ABOVE --- */}
        <main className="flex-1 py-10">
          <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">
            <Link to="/tools" className="inline-flex items-center bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-700 gap-2 text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
              <ArrowLeft className="h-4 w-4 text-slate-500" /><span className="text-slate-600">Back to Tools</span>
            </Link>

            <div className="text-center space-y-3 mb-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 border border-orange-200 animate-float">
                <FileText className="h-8 w-8 text-orange-600" />
              </div>
              <h1 className="text-4xl font-bold text-slate-900">Watermark PDF</h1>
              <p className="text-lg text-slate-500">Secure your document with text or image overlays</p>
            </div>

            {/* Success View */}
            {watermarkedFile ? (
               <Card className="max-w-2xl mx-auto bg-emerald-50 backdrop-blur-md shadow-xl border border-emerald-200 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-400" />
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle className="h-6 w-6 text-emerald-600" />
                    <CardTitle className="text-emerald-900">Watermark Applied!</CardTitle>
                  </div>
                  <CardDescription className="text-emerald-700">
                    Your document is ready for download.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                   <div className="flex flex-col sm:flex-row gap-4">
                      <Button onClick={handleDownload} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-6 rounded-xl font-semibold shadow-lg shadow-green-900/10">
                         <Download className="mr-2 h-5 w-5" />
                         Download PDF
                      </Button>
                      <Button variant="outline" onClick={handleReset} className="bg-white border-slate-300 text-slate-700 hover:bg-slate-100 py-6 rounded-xl">
                         <RefreshCw className="mr-2 h-4 w-4" />
                         Start Over
                      </Button>
                   </div>
                </CardContent>
              </Card>
            ) : (
              // Upload & Config View
              !file ? (
                 <Card className="bg-white shadow-xl border border-slate-200 max-w-6xl mx-auto">
                    <CardHeader>
                      <CardTitle className="text-slate-900">Upload PDF File</CardTitle>
                      <CardDescription className="text-slate-500">Select a PDF to add a watermark</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="border-2 border-dashed rounded-xl p-24 text-center border-slate-300 hover:border-orange-500/50 transition-colors bg-slate-50/50">
                        <Upload className="mx-auto h-16 w-16 text-slate-400 mb-4" />
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <span className="text-orange-600 font-semibold hover:text-orange-500 text-lg">Choose file</span> 
                          <span className="text-slate-500 text-lg"> or drag and drop</span>
                          <input id="file-upload" type="file" accept=".pdf" className="hidden" onChange={handleFileSelect} />
                        </label>
                      </div>
                    </CardContent>
                 </Card>
              ) : (
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Left Column: Preview */}
                  <div className="flex-1 space-y-4">
                    <Card className="bg-white shadow-xl border border-slate-200">
                      <CardContent className="p-4 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-orange-600" />
                          <span className="font-medium text-slate-900">{file.name}</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => { setFile(null); setPreviewUrl(null); }} className="text-slate-400 hover:text-red-500">
                          <X className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                    
                    {/* Native PDF Preview */}
                    <div className="w-full h-[600px] bg-slate-100 rounded-xl border border-slate-200 overflow-hidden shadow-inner relative">
                      {previewUrl ? (
                         <object data={previewUrl} type="application/pdf" width="100%" height="100%" className="w-full h-full">
                           <div className="flex flex-col items-center justify-center h-full text-slate-400">
                              <p>PDF Preview not supported in this browser.</p>
                           </div>
                         </object>
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-400">
                          Loading Preview...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Controls */}
                  <Card className="w-full lg:w-96 bg-white shadow-xl border border-slate-200 h-fit">
                    <CardHeader>
                      <CardTitle className="text-slate-900">Watermark Options</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-slate-100 text-slate-600 mb-4">
                          <TabsTrigger value="text" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <Type className="h-4 w-4 mr-2" />Text
                          </TabsTrigger>
                          <TabsTrigger value="image" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <ImageIcon className="h-4 w-4 mr-2" />Image
                          </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="text" className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-slate-700">Watermark Text</Label>
                            <Input 
                              placeholder="KAVACH" 
                              value={watermarkText} 
                              onChange={(e) => setWatermarkText(e.target.value)} 
                              className="bg-white border-slate-300 text-slate-900" 
                            />
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="image" className="space-y-4">
                          <div className="p-4 bg-yellow-50 text-yellow-800 text-sm rounded-lg border border-yellow-200">
                            Image watermark functionality coming soon.
                          </div>
                        </TabsContent>
                      </Tabs>

                      {/* Common Options */}
                      <div className="space-y-4 border-t pt-4 border-slate-100">
                        <div className="space-y-2">
                          <Label className="text-slate-700">Rotation</Label>
                          <Select value={rotation} onValueChange={setRotation}>
                            <SelectTrigger className="bg-white border-slate-300">
                              <SelectValue placeholder="Select rotation" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">0° (Horizontal)</SelectItem>
                              <SelectItem value="-45">-45° (Diagonal)</SelectItem>
                              <SelectItem value="-90">-90° (Vertical)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-slate-700">Pages</Label>
                          <Select value={pages} onValueChange={setPages}>
                            <SelectTrigger className="bg-white border-slate-300">
                              <SelectValue placeholder="Select pages" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Pages</SelectItem>
                              <SelectItem value="first">First Page Only</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                    </CardContent>
                    <CardFooter>
                      <Button 
                        onClick={handleWatermark} 
                        disabled={isProcessing} 
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white text-lg py-6 rounded-xl font-semibold shadow-lg shadow-orange-500/20"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Download className="mr-2 h-5 w-5" />
                            Add Watermark
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              )
            )}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
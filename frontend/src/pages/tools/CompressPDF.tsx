import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Instance from "@/lib/axiosInstance"; 
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDown, Upload, Download, ArrowLeft, Loader2, CheckCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { motion } from "framer-motion";

interface CompressedFileDetails {
  originalName: string;
  outputFile: string;
  originalSize: number;
  compressedSize: number;
  reduction: string;
  message: string;
}

const STORAGE_KEY = "kavach_compressed_file";

export default function CompressPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [compressionLevel, setCompressionLevel] = useState("medium");
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressedFile, setCompressedFile] = useState<CompressedFileDetails | null>(null);
  
  const { toast } = useToast();

  const isAuthenticated = true;
  const isAdmin = false;

  useEffect(() => {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      try {
        const parsedData: CompressedFileDetails = JSON.parse(storedData);
        setCompressedFile(parsedData);
      } catch (error) {
        console.error("Failed to parse stored compressed file data", error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setCompressedFile(null); 
      localStorage.removeItem(STORAGE_KEY);
      
      toast({
        title: "File uploaded",
        description: `${e.target.files[0].name} ready to compress`,
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

  const handleCompress = async () => {
    if (!file) {
      toast({ title: "Error", description: "Please select a PDF file first", variant: "destructive" });
      return;
    }

    setIsCompressing(true);
    
    try {
      const formData = new FormData();
      formData.append('files', file);
      formData.append('level', compressionLevel); 
      const token = localStorage.getItem("authToken");

      const response = await Instance.post('/pdf/compress-pdf', formData, {
        headers: {
            'Content-Type': 'multipart/form-data', 
            'Authorization': token ? `${token}` : '',
        }
      });

      if (response.data.files && response.data.files.length > 0) {
        const fileData: CompressedFileDetails = response.data.files[0];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fileData));
        setCompressedFile(fileData); 
        toast({ title: "Success!", description: `Reduced by ${fileData.reduction}` });
      } else {
        throw new Error("Invalid response structure from server");
      }

    } catch (error) {
      console.error(error);
      toast({ title: "Compression Failed", description: "There was an error compressing your file.", variant: "destructive" });
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDownload = async () => {
    const storedData = localStorage.getItem(STORAGE_KEY);
    let fileDetails: CompressedFileDetails | null = null;

    if (storedData) fileDetails = JSON.parse(storedData);
    else if (compressedFile) fileDetails = compressedFile;

    if (!fileDetails || !fileDetails.outputFile) {
      toast({ title: "Download Error", description: "No compressed file record found.", variant: "destructive" });
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
      toast({ title: "Download Started", description: "Fetching your compressed file..." });

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
    setCompressedFile(null);
    localStorage.removeItem(STORAGE_KEY);
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-orange-100 selection:text-orange-900 overflow-x-hidden">
      
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-slate-50 to-slate-100" />
        <motion.div animate={{ opacity: [0.4, 0.6, 0.4], scale: [1, 1.1, 1], rotate: [0, 5, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} className="absolute -top-[20%] left-[10%] w-[60vw] h-[60vw] bg-orange-200/40 rounded-full blur-[120px]" />
        <motion.div animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.2, 1], rotate: [0, -5, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }} className="absolute -bottom-[10%] right-[0%] w-[50vw] h-[50vw] bg-red-200/40 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-multiply" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header isAuthenticated={isAuthenticated} isAdmin={isAdmin} onLogout={() => console.log("Logout clicked")} />
        <br/>
        <br/>
        <br/>
        <main className="flex-1 flex-col py-16">
          <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">
            
            <Link to="/tools" className="inline-flex items-center bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-700 gap-2 text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
              <ArrowLeft className="h-4 w-4 text-slate-500" />
              <span className="text-slate-600">Back to Tools</span>
            </Link>

            <div className="text-center space-y-3 mb-12">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 border border-orange-200 animate-float">
                <FileDown className="h-8 w-8 text-orange-500" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-amber-500 animate-gradient-x">
                  Compress PDF
                </span>
              </h1>
              <p className="text-lg text-slate-500 max-w-xl mx-auto">
                Reduce PDF file size while maintaining quality
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
              
              <div className="lg:col-span-2">
                {!compressedFile ? (
                  <Card className="bg-white/80 backdrop-blur-md shadow-xl border border-slate-200 h-full">
                    <CardHeader>
                      <CardTitle className="text-slate-900">Upload PDF File</CardTitle>
                      <CardDescription className="text-slate-500">
                        Select the PDF file you want to compress
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors bg-slate-50 ${isCompressing ? 'opacity-50 pointer-events-none border-slate-300' : 'border-slate-300 hover:border-orange-500'}`}>
                        <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <span className="text-orange-600 font-semibold hover:text-orange-500 transition-colors">Choose file</span>
                          {" "}<span className="text-slate-500">or drag and drop</span>
                          <input id="file-upload" type="file" accept=".pdf" disabled={isCompressing} className="hidden" onChange={handleFileSelect} />
                        </label>
                        <p className="text-sm text-slate-500 mt-2">PDF files only</p>
                      </div>

                      {file && (
                        <div className="p-4 rounded-xl border bg-white border-orange-200 shadow-sm flex items-center justify-between">
                          <div>
                            <p className="font-medium text-slate-900 truncate max-w-[200px] sm:max-w-md">{file.name}</p>
                            <p className="text-sm text-slate-500">
                              Size: {formatBytes(file.size)}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => setFile(null)} disabled={isCompressing} className="text-slate-400 hover:text-red-500">
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
                        <CardTitle className="text-emerald-900">Compression Complete!</CardTitle>
                      </div>
                      <CardDescription className="text-emerald-700">
                        {compressedFile.message}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="bg-white/60 rounded-xl p-6 border border-emerald-100 space-y-4">
                        <div className="flex items-center justify-between p-3 bg-emerald-100/50 rounded-lg">
                          <span className="text-emerald-700 text-sm">File Name</span>
                          <span className="text-emerald-900 font-mono text-sm truncate max-w-[200px]">
                            {compressedFile.outputFile.split(/[/\\]/).pop()}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 bg-red-100 border border-red-200 rounded-lg text-center">
                              <p className="text-[10px] sm:text-xs text-red-700 uppercase">Original</p>
                              <p className="text-sm sm:text-lg font-bold text-slate-900">{formatBytes(compressedFile.originalSize)}</p>
                            </div>
                            <div className="p-3 bg-green-100 border border-green-200 rounded-lg text-center">
                              <p className="text-[10px] sm:text-xs text-green-700 uppercase">Compressed</p>
                              <p className="text-sm sm:text-lg font-bold text-green-700">{formatBytes(compressedFile.compressedSize)}</p>
                            </div>
                            <div className="p-3 bg-blue-100 border border-blue-200 rounded-lg text-center">
                              <p className="text-[10px] sm:text-xs text-blue-700 uppercase">Reduction</p>
                              <p className="text-sm sm:text-lg font-bold text-blue-700">{compressedFile.reduction}</p>
                            </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4">
                         <Button onClick={handleDownload} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-6 rounded-xl font-semibold shadow-lg shadow-green-900/10 transition-all hover:scale-[1.02]">
                            <Download className="mr-2 h-5 w-5" />
                            Download PDF
                         </Button>
                         <Button variant="outline" onClick={handleReset} className="bg-white border-slate-300 text-slate-700 hover:bg-slate-100 py-6 rounded-xl">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Compress Another
                         </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="lg:col-span-1 space-y-6">
                
                <Card className={`bg-white/80 backdrop-blur-md shadow-xl border border-slate-200 transition-opacity duration-300 ${compressedFile ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                  <CardHeader>
                    <CardTitle className="text-slate-900">Compression Level</CardTitle>
                    <CardDescription className="text-slate-500">
                      Choose your desired setting
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={compressionLevel} onValueChange={setCompressionLevel} className="flex flex-col gap-3" disabled={isCompressing}>
                      {['low', 'medium', 'high'].map((level) => (
                        <Label 
                          key={level}
                          htmlFor={level} 
                          className={`flex flex-col space-y-1 p-4 border rounded-xl cursor-pointer transition-all duration-200 
                            ${compressionLevel === level
                              ? 'border-orange-500 bg-orange-50' 
                              : 'border-slate-300 hover:border-orange-300 hover:bg-slate-50'
                            }`}
                        >
                          <div className="flex items-center space-x-3">
                            <RadioGroupItem value={level} id={level} className="border-slate-400 text-orange-600" />
                            <p className={`font-medium capitalize ${compressionLevel === level ? 'text-orange-600' : 'text-slate-900'}`}>
                              {level} Compression
                            </p>
                          </div>
                          <p className="text-sm text-slate-500 pl-7">
                            {level === 'low' && "Best quality, larger file size"}
                            {level === 'medium' && "Balanced quality and size"}
                            {level === 'high' && "Smaller file size, good quality"}
                          </p>
                        </Label>
                      ))}
                    </RadioGroup>
                  </CardContent>
                </Card>

                {!compressedFile && (
                  <Button
                    onClick={handleCompress}
                    disabled={!file || isCompressing}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white text-lg py-6 rounded-xl font-semibold disabled:opacity-50 disabled:pointer-events-none transition-all hover:scale-[1.02] shadow-lg shadow-orange-500/20"
                  >
                    {isCompressing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Compressing...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-5 w-5" />
                        Compress PDF
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
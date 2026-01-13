import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import Instance from "@/lib/axiosInstance"; 
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Upload, ArrowLeft, X, FileText, Lock, Eye, EyeOff, Loader2, CheckCircle, RefreshCw, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";

interface ProtectedFileDetails {
  originalName: string;
  outputFile: string;
  message: string;
}

const STORAGE_KEY = "kavach_protected_file";

export default function LockPDF() {
  const [file, setFile] = useState<File | null>(null);
  
  // Settings State
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  // Processing State
  const [isProtecting, setIsProtecting] = useState(false);
  const [protectedFile, setProtectedFile] = useState<ProtectedFileDetails | null>(null);

  const { toast } = useToast();
  const isAuthenticated = true;
  const isAdmin = false;

  // Create a preview URL for the uploaded PDF
  const previewUrl = useMemo(() => {
    return file ? URL.createObjectURL(file) : null;
  }, [file]);

  // Load previous session if exists
  useEffect(() => {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      try {
        const parsedData: ProtectedFileDetails = JSON.parse(storedData);
        setProtectedFile(parsedData);
      } catch (error) {
        console.error("Failed to parse stored protected file data", error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setProtectedFile(null); 
      localStorage.removeItem(STORAGE_KEY);
      
      toast({
        title: "File uploaded",
        description: `${selectedFile.name} ready to protect`,
      });
    }
  };
  
  const removeFile = () => {
    setFile(null);
    setPassword("");
    setProtectedFile(null);
    localStorage.removeItem(STORAGE_KEY);
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  const handleLockPDF = async () => {
    if (!file) {
      toast({ title: "Error", description: "Please select a PDF file first", variant: "destructive" });
      return;
    }
    
    if (!password) {
      toast({ title: "Error", description: "Please enter a password to lock the file.", variant: "destructive" });
      return;
    }

    setIsProtecting(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('password', password); 
      
      const token = localStorage.getItem("authToken");

      const response = await Instance.post('/pdf/protect-pdf', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': token ? `${token}` : '',
        }
      });

      if (response.data) {
        const outputFileName = response.data.file || response.data.downloadUrl;
        
        if (!outputFileName) {
            throw new Error("Output filename not found in response");
        }

        const fileData: ProtectedFileDetails = {
           originalName: file.name,
           outputFile: outputFileName, 
           message: response.data.message || "File protected successfully"
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(fileData));
        setProtectedFile(fileData);
        toast({ title: "Success!", description: "Your PDF has been password protected." });
      }

    } catch (error) {
      console.error("Protection Error:", error);
      toast({ 
        title: "Protection Failed", 
        description: "There was an error processing your request.", 
        variant: "destructive" 
      });
    } finally {
      setIsProtecting(false);
    }
  };

  const handleDownload = async () => {
    const storedData = localStorage.getItem(STORAGE_KEY);
    let fileDetails: ProtectedFileDetails | null = null;

    if (storedData) fileDetails = JSON.parse(storedData);
    else if (protectedFile) fileDetails = protectedFile;

    if (!fileDetails || !fileDetails.outputFile) {
      toast({ title: "Download Error", description: "No protected file record found.", variant: "destructive" });
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
      toast({ title: "Download Started", description: "Fetching your protected file..." });

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
  
  return (
    <div className="relative flex flex-col min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-orange-100 selection:text-orange-900 overflow-x-hidden">
      
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-slate-50 to-slate-100" />
        <motion.div animate={{ opacity: [0.4, 0.6, 0.4], scale: [1, 1.1, 1], rotate: [0, 5, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} className="absolute -top-[20%] left-[10%] w-[60vw] h-[60vw] bg-orange-200/40 rounded-full blur-[120px]" />
        <motion.div animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.2, 1], rotate: [0, -5, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }} className="absolute -bottom-[10%] right-[0%] w-[50vw] h-[50vw] bg-red-200/40 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-multiply" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header isAuthenticated={isAuthenticated} isAdmin={isAdmin} onLogout={() => console.log("Logout")} />
        <br/>
        <br/>
        <br/>
         {/* --- IGNORE ABOVE --- */}
        <main className="flex-1 flex-col py-12">
          <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">
          
            <Link
              to="/tools"
              className="inline-flex items-center bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-700 gap-2 text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm"
            >
              <ArrowLeft className="h-4 w-4 text-slate-500" />
              <span className="text-slate-600">Back to Tools</span>
            </Link>

            {/* === STATE 1: UPLOAD UI (No File Selected) === */}
            {!file && !protectedFile && (
              <div className="space-y-12">
                <div className="text-center space-y-3">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 border border-orange-200 animate-float">
                    <Lock className="h-8 w-8 text-orange-500" />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-amber-500 animate-gradient-x">
                      Protect PDF File
                    </span>
                  </h1>
                  <p className="text-lg text-slate-500 max-w-xl mx-auto">
                    Secure your PDF with a password
                  </p>
                </div>

                <Card className="bg-white/80 backdrop-blur-md shadow-xl border border-slate-200 max-w-6xl mx-auto">
                  <CardHeader>
                    <CardTitle className="text-slate-900">Upload PDF File</CardTitle>
                    <CardDescription className="text-slate-500">
                      Select a single PDF file to protect
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="border-2 border-dashed rounded-xl p-24 text-center border-slate-300 hover:border-orange-500 transition-colors bg-slate-50">
                      <Upload className="mx-auto h-16 w-16 text-slate-400 mb-4" />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="text-orange-600 font-semibold hover:text-orange-500 transition-colors text-lg">Choose file</span>
                        {" "}<span className="text-slate-500 text-lg">or drag and drop</span>
                        <input
                          id="file-upload"
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          onChange={handleFileSelect}
                        />
                      </label>
                      <p className="text-sm text-slate-500 mt-2">PDF files only</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* === STATE 2: EDITOR UI (File Selected) === */}
            {file && !protectedFile && (
              <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-250px)] min-h-[600px]">
                
                {/* === Main Content (Left - Preview) === */}
                <div className="flex-1 flex flex-col space-y-4">
                  <Card className="flex-none bg-white/80 backdrop-blur-md shadow-xl border border-slate-200">
                    <CardContent className="p-4 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <FileText className="h-5 w-5 text-orange-500" />
                        </div>
                        <span className="font-medium text-slate-800">{file.name}</span>
                      </div>
                      <Button variant="ghost" size="icon" onClick={removeFile} disabled={isProtecting} className="text-slate-400 hover:text-red-500 hover:bg-red-50">
                        <X className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                  
                  {/* Real PDF Preview */}
                  <div className="flex-1 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden relative shadow-inner">
                    {previewUrl ? (
                      <iframe 
                        src={`${previewUrl}#toolbar=0&navpanes=0`} 
                        className="w-full h-full"
                        title="PDF Preview"
                      />
                    ) : (
                       <div className="flex items-center justify-center h-full text-slate-400">
                         Loading preview...
                       </div>
                    )}
                  </div>
                </div>

                {/* === Sidebar (Right - Controls) === */}
                <Card className="w-full lg:w-96 bg-white/90 backdrop-blur-md shadow-xl border border-slate-200 h-fit">
                  <CardHeader>
                    <CardTitle className="text-slate-900">Security Settings</CardTitle>
                    <CardDescription>Set a password to open this file</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    
                    {/* === Password Input === */}
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-slate-700">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPass ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={isProtecting}
                          placeholder="Enter strong password"
                          className="pr-10 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:ring-orange-200"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1 h-7 w-7 text-slate-400 hover:text-orange-500 hover:bg-transparent"
                          onClick={() => setShowPass(!showPass)}
                          disabled={isProtecting}
                        >
                          {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-slate-500">
                        This password will be required to open the PDF.
                      </p>
                    </div>

                    <Separator className="bg-slate-200" />
                    
                  </CardContent>
                  <CardFooter className="flex flex-col gap-3 pt-2">
                    <Button 
                      onClick={handleLockPDF} 
                      disabled={!file || !password || isProtecting}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-lg py-6 rounded-xl font-semibold transition-colors text-white shadow-lg shadow-orange-500/20"
                    >
                      {isProtecting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Protecting...
                        </>
                      ) : (
                        <>
                          <Lock className="mr-2 h-5 w-5" />
                          Lock PDF
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )}

            {/* === STATE 3: SUCCESS UI (File Protected) === */}
            {protectedFile && (
              <div className="max-w-2xl mx-auto mt-10">
                <Card className="bg-emerald-50 backdrop-blur-md shadow-xl border border-emerald-200 h-full relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-400" />
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <CheckCircle className="h-6 w-6 text-emerald-600" />
                      <CardTitle className="text-emerald-900">Protection Complete!</CardTitle>
                    </div>
                    <CardDescription className="text-emerald-700">
                      {protectedFile.message}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    
                    <div className="bg-white/60 rounded-xl p-6 border border-emerald-100">
                      <div className="flex items-center justify-between p-3 bg-emerald-100/50 rounded-lg mb-4">
                        <span className="text-emerald-700 text-sm">File Name</span>
                        <span className="text-emerald-900 font-mono text-sm truncate max-w-[200px]">
                          {protectedFile.outputFile.split(/[/\\]/).pop()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-emerald-800 bg-emerald-100/30 p-3 rounded-lg border border-emerald-100">
                         <Lock className="h-4 w-4" />
                         <span>Secured with password</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button onClick={handleDownload} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-6 rounded-xl font-semibold shadow-lg shadow-green-900/10 transition-all hover:scale-[1.02]">
                          <Download className="mr-2 h-5 w-5" />
                          Download PDF
                        </Button>
                        <Button variant="outline" onClick={removeFile} className="bg-white border-slate-300 text-slate-700 hover:bg-slate-100 py-6 rounded-xl">
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Protect Another
                        </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
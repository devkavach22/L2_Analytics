import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import Tools from "./pages/Tools";
import MergePDF from "./pages/tools/MergePDF";
import SplitPDF from "./pages/tools/SplitPDF";
import FileManagement from "./pages/FileManagement";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
// import CompressPDF from "./pages/tools/CompressPDF";
// import RotatePDF from "./pages/tools/RotatePDF";
// import OptimizePDF from "./pages/tools/OptimizePDF";
// import PDFToWord from "./pages/tools/PDFToWord";
// import PDFToPowerPoint from "./pages/tools/PDFToPowerPoint";
// import PDFToExcel from "./pages/tools/PDFToExcel";
// import PDFToImage from "./pages/tools/PDFToImage";
// import WordToPDF from "./pages/tools/WordToPDF";
// import ImageToPDF from "./pages/tools/ImageToPDF";
// import EditPDF from "./pages/tools/EditPDF";
// import SignaturePDF from "./pages/tools/SignaturePDF";
// import WatermarkPDF from "./pages/tools/WatermarkPDF";
// import LockPDF from "./pages/tools/LockPDF";
// import UnlockPDF from "./pages/tools/UnlockPDF";
import ManageUsersPage from "./pages/ManageUsers";
import SystemSettingsPage from "./pages/SystemSettings";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Features from "./pages/Features";
import APIPage from "./pages/API";
import Integrations from "./pages/Integrations";
import CookiesPolicy from "./pages/CookiesPolicy";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsServices from "./pages/TermsServices";
import Security from "./pages/Security";
import Pricing from "./pages/Pricing";
import AISearch from "./pages/AISearchPage";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          {/* <Route path="/dashboard" element={<UserDashboard />} /> */}
          <Route path="/manage-user" element={<ManageUsersPage />} />
          <Route path="/system-setting" element={<SystemSettingsPage />} />
          <Route path="/tools" element={<Tools />} />
          {/* <Route path="/forgot-password" element={<ForgotPassword />} /> */}
          <Route path="/forgot_password" element={<ForgotPassword />} />

          <Route path="/reset-password" element={<ResetPassword />} />
          {/* <Route path="/tools/merge" element={<MergePDF />} />
          <Route path="/tools/split" element={<SplitPDF />} />
          <Route path="/tools/compress" element={<CompressPDF />} />
          <Route path="/tools/rotate" element={<RotatePDF />} />
          <Route path="/tools/optimize" element={<OptimizePDF />} />
          <Route path="/tools/pdf-word" element={<PDFToWord />} />
          <Route path="/tools/pdf-ppt" element={<PDFToPowerPoint />} />
          <Route path="/tools/pdf-excel" element={<PDFToExcel />} />
          <Route path="/tools/pdf-image" element={<PDFToImage />} />
          <Route path="/tools/word-pdf" element={<WordToPDF />} />
          <Route path="/tools/image-pdf" element={<ImageToPDF />} />
          <Route path="/tools/edit-pdf" element={<EditPDF />} />
          <Route path="/tools/pdf-sign" element={<SignaturePDF />} />
          <Route path="/tools/pdf-watermark" element={<WatermarkPDF />} />
          <Route path="/tools/pdf-lock" element={<LockPDF />} />
          <Route path="/tools/pdf-unlock" element={<UnlockPDF />} /> */}
          <Route path="/files" element={<FileManagement />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/features" element={<Features />} />
          <Route path="/api-working" element={<APIPage />} />
          <Route path="/integration" element={<Integrations />} />
          <Route path="/cookie-policy" element={<CookiesPolicy />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-services" element={<TermsServices />} />
          <Route path="/security" element={<Security />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/ai-search" element={<AISearch />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Shield, Lock, FileText, Server, Globe } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- COMPONENT: GLASS CARD ---
const GlassCard = ({ children, className = "" }: any) => {
  return (
    <div className={cn("relative overflow-hidden rounded-[32px] border border-orange-100/60 bg-white/60 backdrop-blur-xl shadow-xl shadow-orange-900/5", className)}>
       <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/40 to-transparent opacity-50" />
       {children}
    </div>
  );
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8F0] text-slate-900 font-sans overflow-x-hidden relative selection:bg-orange-200 selection:text-orange-900">
      
      {/* --- BACKGROUND EFFECTS --- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div 
            animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-r from-orange-200 to-amber-100 rounded-full blur-[100px] opacity-50" 
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-soft-light"></div>
      </div>

      <div className="relative z-50"><Header /></div>

      <main className="relative z-10 pt-32 pb-24 px-6">
        <div className="container max-w-4xl mx-auto">
          
          {/* Header Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16 border-b border-orange-100 pb-12"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-600 text-sm font-bold mb-6">
              <Shield size={14} />
              <span>Your Data is Secure</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">Privacy Policy</h1>
            <p className="text-slate-600 text-lg leading-relaxed font-medium">
              At Kavach, trust is our currency. This document outlines exactly how we handle your documents, your data, and your rights. <br />
              <span className="text-orange-600 font-bold">Last Updated: November 21, 2025</span>
            </p>
          </motion.div>

          {/* Content Section */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-12"
          >
            {/* Section 1 */}
            <GlassCard className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-100"><FileText size={24} /></div>
                <h2 className="text-2xl font-bold text-slate-900">1. The Core Principle: File Processing</h2>
              </div>
              <div className="pl-4 md:pl-14 space-y-4 text-slate-600 leading-relaxed font-medium">
                <p>
                  Our primary function is processing PDF documents. We adhere to a strict processing protocol:
                </p>
                <ul className="list-disc pl-5 space-y-3">
                  <li>
                    <strong className="text-slate-900">Client-Side Processing:</strong> Whenever possible (e.g., merging, splitting), files are processed in your browser using WebAssembly. <span className="text-red-600 font-bold">Files never leave your device.</span>
                  </li>
                  <li>
                    <strong className="text-slate-900">Server-Side Processing:</strong> For complex tasks, files are transmitted via TLS 1.3 encryption.
                  </li>
                  <li>
                    <strong className="text-slate-900">Automatic Deletion:</strong> Any uploaded file is automatically and permanently deleted <strong>1 hour</strong> after processing.
                  </li>
                </ul>
              </div>
            </GlassCard>

            {/* Section 2 */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-red-50 text-red-600 border border-red-100"><Lock size={24} /></div>
                <h2 className="text-2xl font-bold text-slate-900">2. Data Collection & Usage</h2>
              </div>
              <div className="pl-4 md:pl-14 space-y-4 text-slate-600 leading-relaxed font-medium">
                <p>We collect minimal data to ensure the service functions correctly:</p>
                <div className="grid md:grid-cols-2 gap-6 mt-6">
                    <GlassCard className="p-6 bg-white/40">
                        <h4 className="text-slate-900 font-bold mb-3">What We Collect</h4>
                        <ul className="text-sm space-y-2 font-medium">
                            <li>• Account info (Email, Name)</li>
                            <li>• Usage metadata (timestamps)</li>
                            <li>• Payment processing data (Stripe)</li>
                        </ul>
                    </GlassCard>
                    <GlassCard className="p-6 bg-white/40">
                        <h4 className="text-slate-900 font-bold mb-3">What We DO NOT Collect</h4>
                        <ul className="text-sm space-y-2 font-medium">
                            <li>• The content of your PDF files</li>
                            <li>• Passwords used to encrypt your PDFs</li>
                            <li>• Biometric data from e-signatures</li>
                        </ul>
                    </GlassCard>
                </div>
              </div>
            </section>

             {/* Section 3 */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100"><Globe size={24} /></div>
                <h2 className="text-2xl font-bold text-slate-900">3. Third-Party Sharing</h2>
              </div>
              <div className="pl-4 md:pl-14 space-y-4 text-slate-600 leading-relaxed font-medium">
                <p>
                  We do not sell, trade, or rent your personal identification information. We use these providers:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Google Analytics:</strong> For understanding website traffic (anonymized).</li>
                    <li><strong>Stripe:</strong> For secure payment processing.</li>
                    <li><strong>AWS:</strong> For secure cloud infrastructure hosting.</li>
                </ul>
              </div>
            </section>

            {/* Contact */}
            <GlassCard className="p-8 bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Privacy Officer Contact</h3>
                <p className="text-slate-600 mb-4 font-medium">
                    If you have questions regarding this policy or your personal data, please contact us.
                </p>
                <Link to="/contact" className="text-orange-600 font-bold hover:text-orange-500 transition-colors underline">
                    security@kavach.io
                </Link>
            </GlassCard>

          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
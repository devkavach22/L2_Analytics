import { useNavigate } from "react-router-dom"; 
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { 
  FileText, PieChart, Clock, Share2, 
  LayoutTemplate, FileCheck, Sparkles, BarChart3 
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- COMPONENT: GLOW CARD ---
const GlowCard = ({ children, className = "" }: any) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className={cn(
        "relative overflow-hidden rounded-[24px] border border-orange-100/50 bg-white/40 backdrop-blur-xl shadow-xl shadow-orange-900/5 cursor-default group",
        className
      )}
    >
      <div className="absolute -inset-2 bg-gradient-to-r from-orange-400/20 via-amber-200/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};

const reportFeatures = [
  { title: "AI Executive Summaries", desc: "Instantly turn 50+ page PDF documents into concise, actionable 1-page executive briefs using advanced LLMs.", icon: Sparkles, color: "text-orange-600", bg: "bg-orange-100" },
  { title: "Visual Data Storytelling", desc: "Automatically extract tabular data and convert it into beautiful, interactive charts and graphs for your presentations.", icon: PieChart, color: "text-amber-600", bg: "bg-amber-100" },
  { title: "Scheduled Reporting", desc: "Set it and forget it. Schedule daily, weekly, or monthly intelligence reports delivered straight to your inbox.", icon: Clock, color: "text-red-500", bg: "bg-red-50" },
  { title: "Compliance Audits", desc: "Generate standardized audit logs and compliance reports (GDPR, SOC2) from your unstructured data streams.", icon: FileCheck, color: "text-orange-500", bg: "bg-orange-50" },
  { title: "Custom Templates", desc: "Design your own report structures. Drag and drop widgets to create the perfect layout for your stakeholders.", icon: LayoutTemplate, color: "text-amber-500", bg: "bg-amber-50" },
  { title: "Multi-Channel Delivery", desc: "Push your generated reports directly to Slack channels, Microsoft Teams, or trigger webhooks.", icon: Share2, color: "text-orange-600", bg: "bg-orange-50" },
];

export default function Features() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFFAF4] text-slate-900 font-sans overflow-x-hidden selection:bg-orange-200 selection:text-orange-900">
      
      {/* --- AMBIENT GLOW --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <motion.div 
            animate={{ opacity: [0.4, 0.6, 0.4], scale: [1, 1.1, 1] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-orange-300/30 rounded-full blur-[120px]" 
        />
        <motion.div 
            animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.2, 1] }}
            transition={{ duration: 10, repeat: Infinity, delay: 2 }}
            className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-amber-200/40 rounded-full blur-[100px]" 
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      <div className="relative z-50"><Header /></div>

      <main className="relative z-10 pt-32 pb-20 px-6">
        <div className="container max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 text-orange-700 text-xs font-bold uppercase tracking-wider mb-6 shadow-sm">
              <BarChart3 size={14} /> Intelligent Reporting
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
              Turn Data into <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-500 to-red-500">Decisions.</span>
            </h1>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg font-medium leading-relaxed">
              Automate the creation of stunning, data-driven reports. From raw text to executive insights in seconds.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reportFeatures.map((feat, idx) => (
              <GlowCard
                key={idx}
                className="p-8 flex flex-col h-full"
              >
                <div className={`w-14 h-14 rounded-2xl ${feat.bg} flex items-center justify-center mb-6 ${feat.color} shadow-inner`}>
                  <feat.icon size={28} strokeWidth={2} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-orange-600 transition-colors">
                  {feat.title}
                </h3>
                <p className="text-slate-500 leading-relaxed font-medium">
                  {feat.desc}
                </p>
              </GlowCard>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
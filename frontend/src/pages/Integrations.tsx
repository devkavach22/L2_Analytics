import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- BRAND SVGS ---
const Icons = {
  Elastic: () => (
    <svg viewBox="0 0 32 32" className="w-6 h-6 fill-current">
      <path d="M16 0C7.163 0 0 7.163 0 16s7.163 16 16 16 16-7.163 16-16S24.837 0 16 0zm8.5 22.5c-1.5 1.5-4 2.5-6.5 2.5s-5-1-6.5-2.5c-1-1-1.5-2.5-1.5-4s.5-3 1.5-4c1.5-1.5 4-2.5 6.5-2.5s5 1 6.5 2.5c1 1 1.5 2.5 1.5 4s-.5 3-1.5 4z" fill="#005571"/>
      <path d="M16 11c-2.5 0-4.5 1-6 2.5C9 14.5 8.5 16 8.5 17.5s.5 3 1.5 4.5C11.5 23.5 13.5 24.5 16 24.5s4.5-1 6-2.5c1-1.5 1.5-3 1.5-4.5s-.5-3-1.5-4.5C20.5 12 18.5 11 16 11z" fill="#F04E98"/>
      <path d="M16 6.5C11 6.5 7 10.5 7 16s4 9.5 9 9.5 9-4 9-9.5-4-9.5-9-9.5z" fill="#FEC514"/>
    </svg>
  ),
  Mongo: () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current text-green-600">
      <path d="M17.193 10.662c-1.89-4.838-4.226-7.51-5.185-10.662-.976 3.16-3.328 5.842-5.195 10.662-1.274 3.284-.667 8.04 5.196 9.16 5.84-1.127 6.452-5.867 5.184-9.16zm-5.185 8.164c-1.066-.632-1.876-1.928-1.583-4.103.225-1.67.925-3.088 1.583-4.867.65 1.772 1.34 3.19 1.565 4.852.3 2.18-.507 3.48-1.565 4.118z"/>
    </svg>
  ),
  Notion: () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current text-slate-800">
      <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l9.832-.653c1.12-.075 1.773.28 1.773 1.446v11.755c0 1.213-.606 1.353-1.493 1.26l-9.318-.934c-1.26-.14-1.68-.653-1.68-1.586V6.028L4.225 6.448c-.28.047-.56-.14-.56-.42v-.98c0-.326.233-.653.794-.84zM16.918 17.652V6.028l-3.36 3.64v9.894l3.36-1.91z"/>
    </svg>
  ),
  Drive: () => (
    <svg viewBox="0 0 87.3 78" className="w-6 h-6">
      <path d="M6.6 66.85l25.3-43.8 25.3 43.8H6.6z" fill="#0066da"/>
      <path d="M43.65 23.05l25.3 43.8 25.3-43.8h-50.6z" fill="#43d35c"/>
      <path d="M80.6 66.85H30l-12.65-21.9 25.3-43.8h37.95l-12.65 21.9 12.65 43.8z" fill="#ffd400"/>
    </svg>
  ),
  OpenAI: () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current text-slate-900">
      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a1.558 1.558 0 0 1 .6947 1.3526v5.6367a4.462 4.462 0 0 1-5.1512 3.1401zm-9.6173-5.513a4.4716 4.4716 0 0 1-.5393-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a1.558 1.558 0 0 1-.6995 1.3526l-4.888 2.8237a4.48 4.48 0 0 1-5.4216-.9699zm-1.0264-10.4682a4.466 4.466 0 0 1 3.4162-.0096l-.142.0804-4.7783 2.7582a.7948.7948 0 0 0-.3927.6813v6.7369l-2.02-1.1686a1.558 1.558 0 0 1-.6947-1.3526V8.2995a4.462 4.462 0 0 1 4.6115-3.8553zm17.6186 2.4996a4.4809 4.4809 0 0 1 .5393 3.0137l-.142-.0852-4.783-2.7582a.7712.7712 0 0 0-.7806 0l-5.8428 3.3685v-2.3324a1.558 1.558 0 0 1 .6995-1.3526l4.888-2.8237a4.48 4.48 0 0 1 5.4216.9699zM9.3408 3.0694a4.4856 4.4856 0 0 1 2.378-.6764 4.4707 4.4707 0 0 1 2.7732 3.8166v2.5535l-2.02-1.1686a1.558 1.558 0 0 1-.6947-1.3526V.6052a4.462 4.462 0 0 1 4.6115 3.8553l-.1419-.0804-4.7783 2.7582a.7948.7948 0 0 0-.3927.6813v6.7369l-2.02-1.1686a1.558 1.558 0 0 1-.6947-1.3526V3.0694z"/>
    </svg>
  ),
  HuggingFace: () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current text-yellow-500">
      <path d="M2 12C2 6.48 6.48 2 12 2s10 4.48 10 10-4.48 10-10 10S2 17.52 2 12zm10 6c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-4-7c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm8 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/>
    </svg>
  ),
  Python: () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current text-blue-500">
       <path d="M14.25.75l-.975 2.15H7.725L6.75.75H14.25zM21.75 8.25l-2.15.975v5.55l2.15.975V8.25zM9.75 23.25l.975-2.15h5.55l.975 2.15H9.75zM2.25 15.75l2.15-.975V9.225L2.25 8.25v7.5zM7.5 7.5h9v9h-9v-9z"/>
    </svg>
  ),
  Cohere: () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current text-purple-600">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 7l-5 9h10l-5-9z" fill="white"/>
    </svg>
  )
};

const IntegrationCard = ({ name, icon: Icon, bg, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.5, ease: "easeOut" }}
    whileHover={{ scale: 1.05, boxShadow: "0 20px 40px -10px rgba(251, 146, 60, 0.2)" }}
    className="bg-white/70 backdrop-blur-xl border border-orange-100/60 rounded-3xl p-6 flex items-center gap-4 cursor-pointer hover:border-orange-300 transition-all shadow-lg shadow-orange-900/5 group"
  >
    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110", bg)}>
      <Icon />
    </div>
    <span className="font-bold text-slate-800 text-lg group-hover:text-orange-600 transition-colors">{name}</span>
  </motion.div>
);

export default function Integrations() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFFAF4] text-slate-900 font-sans relative overflow-hidden selection:bg-orange-200 selection:text-orange-900">
      
      {/* --- BACKGROUND --- */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-200/40 via-[#FFFAF4] to-[#FFFAF4]" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      
      <div className="relative z-50"><Header /></div>

      <main className="relative z-10 pt-32 pb-24 px-6">
        <div className="container max-w-6xl mx-auto">
           <div className="text-center mb-20">
             <motion.h1 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="text-5xl md:text-7xl font-black text-slate-900 mb-6"
             >
               Unified <span className="text-orange-600">Dataverse</span>
             </motion.h1>
             <p className="text-slate-600 text-xl font-medium max-w-2xl mx-auto">
               Connect your Elastic Search clusters, SQL databases, and cloud storage to the world's most powerful AI engines.
             </p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start relative">
              
              {/* Connector Line (Desktop) */}
              <div className="hidden md:block absolute left-1/2 top-24 bottom-0 w-px bg-gradient-to-b from-orange-200 to-transparent -translate-x-1/2 border-l border-dashed border-orange-300/50" />

              {/* LEFT: SOURCES */}
              <div>
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="flex items-center gap-3 mb-8 pl-2"
                >
                    <div className="h-px flex-1 bg-slate-200"></div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Knowledge Base</h3>
                    <div className="h-px flex-1 bg-slate-200"></div>
                </motion.div>

                <div className="space-y-4">
                  <IntegrationCard name="Elasticsearch" icon={Icons.Elastic} bg="bg-white" delay={0.1} />
                  <IntegrationCard name="MongoDB Atlas" icon={Icons.Mongo} bg="bg-green-50" delay={0.2} />
                  <IntegrationCard name="Google Drive" icon={Icons.Drive} bg="bg-blue-50" delay={0.3} />
                  <IntegrationCard name="Notion Wiki" icon={Icons.Notion} bg="bg-slate-50" delay={0.4} />
                </div>
              </div>

              {/* RIGHT: AI ENGINES */}
              <div>
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="flex items-center gap-3 mb-8 pl-2"
                >
                    <div className="h-px flex-1 bg-orange-200"></div>
                    <h3 className="text-sm font-bold text-orange-500 uppercase tracking-widest">AI & Inference</h3>
                    <div className="h-px flex-1 bg-orange-200"></div>
                </motion.div>

                <div className="space-y-4">
                  <IntegrationCard name="OpenAI GPT-4" icon={Icons.OpenAI} bg="bg-teal-50" delay={0.5} />
                  <IntegrationCard name="Hugging Face" icon={Icons.HuggingFace} bg="bg-yellow-50" delay={0.6} />
                  <IntegrationCard name="Python (Pandas)" icon={Icons.Python} bg="bg-blue-50" delay={0.7} />
                  <IntegrationCard name="Cohere Command" icon={Icons.Cohere} bg="bg-purple-50" delay={0.8} />
                </div>
              </div>
           </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
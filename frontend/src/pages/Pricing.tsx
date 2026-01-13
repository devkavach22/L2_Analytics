import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { Check, Zap, Building2, Rocket } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const plans = [
    { 
      name: "Starter", 
      monthlyPrice: 2999, 
      yearlyPrice: 2499, // Effective monthly price when billed yearly
      icon: Rocket,
      desc: "Perfect for startups and small teams.", 
      features: ["Generate 50 Reports / month", "Basic NLP Summarization", "3 Team Members", "Email Support", "Standard Export (PDF)"], 
      highlight: false 
    },
    { 
      name: "Growth", 
      monthlyPrice: 8999,
      yearlyPrice: 7499,
      icon: Zap,
      desc: "For scaling businesses needing deep insights.", 
      features: ["Unlimited Reports", "Advanced Sentiment Analysis", "Custom Branding", "Priority Support", "API Access (100k calls)"], 
      highlight: true, 
      badge: "Most Popular" 
    },
    { 
      name: "Enterprise", 
      monthlyPrice: "Custom", 
      yearlyPrice: "Custom",
      icon: Building2,
      desc: "Bank-grade security & dedicated infrastructure.", 
      features: ["Unlimited API Volume", "On-Premise Deployment", "Dedicated Success Manager", "SSO & Audit Logs", "99.99% Uptime SLA"], 
      highlight: false 
    },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(true);

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFAF4] text-slate-900 font-sans relative overflow-x-hidden">
      
      {/* --- GLOW EFFECTS --- */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-orange-100/50 to-transparent pointer-events-none" />
      
      <div className="relative z-50"><Header /></div>

      <main className="relative z-10 pt-32 pb-24 px-6">
        <div className="container max-w-7xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-black text-slate-900 mb-6"
          >
            Simple, Transparent <span className="text-orange-600">Pricing</span>
          </motion.h1>
          <p className="text-slate-500 mb-10 text-xl font-medium">
            Choose the plan that fits your growth. Prices in INR (₹).
          </p>

          {/* Toggle */}
          <div className="flex justify-center items-center gap-4 mb-16">
            <span className={`text-sm font-bold ${!annual ? 'text-slate-900' : 'text-slate-400'}`}>Monthly</span>
            <button onClick={() => setAnnual(!annual)} className="w-14 h-7 rounded-full bg-slate-200 p-1 relative transition-colors hover:bg-slate-300">
                <motion.div 
                  animate={{ x: annual ? 28 : 0 }} 
                  className="w-5 h-5 rounded-full bg-orange-500 shadow-md" 
                />
            </button>
            <span className={`text-sm font-bold ${annual ? 'text-slate-900' : 'text-slate-400'}`}>Yearly <span className="text-orange-600 text-xs ml-1 font-extrabold">(Save ~17%)</span></span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
            {plans.map((plan, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={cn(
                  "relative p-8 rounded-[32px] text-left flex flex-col h-full border transition-all duration-300",
                  plan.highlight 
                    ? "bg-white shadow-2xl shadow-orange-500/20 border-orange-200 scale-105 z-10" 
                    : "bg-white/60 backdrop-blur-md border-orange-100 hover:border-orange-200"
                )}
              >
                {plan.highlight && (
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-orange-500 to-red-500" />
                )}
                {plan.highlight && <div className="absolute top-5 right-5 px-3 py-1 bg-orange-100 text-orange-700 text-[10px] font-bold uppercase tracking-widest rounded-full">{plan.badge}</div>}
                
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${plan.highlight ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600'}`}>
                    <plan.icon size={24} />
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                
                <div className="flex items-baseline gap-1 mb-2">
                   {typeof plan.monthlyPrice === 'number' ? (
                     <>
                       <span className="text-4xl font-black text-slate-900">
                         ₹{annual ? plan.yearlyPrice.toLocaleString('en-IN') : plan.monthlyPrice.toLocaleString('en-IN')}
                       </span>
                       <span className="text-slate-500 font-bold">/mo</span>
                     </>
                   ) : (
                     <span className="text-4xl font-black text-slate-900">{plan.monthlyPrice}</span>
                   )}
                </div>
                
                {annual && typeof plan.monthlyPrice === 'number' && (
                    <p className="text-xs text-orange-600 font-bold mb-8">
                        Billed ₹{(plan.yearlyPrice * 12).toLocaleString('en-IN')} yearly
                    </p>
                )}
                {!annual && typeof plan.monthlyPrice === 'number' && (
                    <p className="text-xs text-slate-400 font-bold mb-8">
                        Billed monthly
                    </p>
                )}
                {typeof plan.monthlyPrice !== 'number' && <div className="mb-8"></div>}
                
                <p className="text-slate-500 text-sm mb-6 font-medium border-t border-slate-100 pt-6">{plan.desc}</p>
                
                <ul className="space-y-4 mb-8 flex-1">
                    {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-slate-700 font-medium">
                            <Check className="w-5 h-5 shrink-0 text-orange-500" /> 
                            {f}
                        </li>
                    ))}
                </ul>
                
                <button className={cn(
                    "w-full py-4 rounded-xl font-bold transition-all",
                    plan.highlight 
                        ? "bg-gradient-to-r from-orange-600 to-red-600 text-white hover:shadow-lg hover:shadow-orange-500/30" 
                        : "bg-slate-50 text-slate-700 hover:bg-orange-50 hover:text-orange-700"
                )}>
                    {plan.name === "Enterprise" ? "Contact Sales" : "Get Started"}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
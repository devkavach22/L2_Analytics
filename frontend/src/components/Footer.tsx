import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Facebook,
  Twitter,
  Linkedin,
  Github,
  Mail,
  Send,
  MapPin,
  Phone,
  Globe,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import Kavachlogo from "@/assets/KavachLogo.png"; 
import { motion } from "framer-motion";

export const Footer = () => {  
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const location = useLocation();
  const isHomePage = location.pathname === "/";

  const currentYear = new Date().getFullYear();

  const handleSubscribe = (e: any) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setEmail("");
      alert("Thanks for subscribing!");
    }, 1500);
  };

  const socialLinks = [
    { icon: Twitter, href: "#", label: "Twitter", color: "hover:bg-sky-500 hover:border-sky-500 hover:text-white" },
    { icon: Linkedin, href: "#", label: "LinkedIn", color: "hover:bg-blue-600 hover:border-blue-600 hover:text-white" },
    { icon: Github, href: "#", label: "GitHub", color: "hover:bg-slate-800 hover:border-slate-800 hover:text-white" },
    { icon: Facebook, href: "#", label: "Facebook", color: "hover:bg-blue-500 hover:border-blue-500 hover:text-white" },
  ];

  const footerSections = [
    {
      title: "Product",
      links: [
        { label: "Features", path: "/features" },
        { label: "Pricing", path: "/pricing" },
        { label: "API", path: "/api-working" },
        { label: "Integrations", path: "/integration" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", path: "/privacy-policy" },
        { label: "Terms of Service", path: "/terms-services" },
        { label: "Cookie Policy", path: "/cookie-policy" },
        { label: "Security", path: "/security" },
      ],
    },
  ];

  const contactInfo = [
    {
      icon: MapPin,
      text: "A/53, 5th floor, New York Tower, Thaltej, Ahmedabad - 380015",
    },
    { icon: Phone, text: "+91 98981 44606" },
    { icon: Mail, text: "info@kavachglobal.com" },
    { icon: Globe, text: "www.kavachservices.com" },
  ];

  return (
    <footer className="relative bg-[#FFF8F0] text-slate-900 overflow-hidden font-sans border-t border-orange-100">

      {/* --- BACKGROUND EFFECTS (Matched to Landing/FileManagement) --- */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Animated Blobs */}
        <motion.div 
            animate={{ scale: [1, 1.2, 1], rotate: [0, 45, 0], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-[50%] -left-[10%] w-[60vw] h-[60vw] bg-gradient-to-r from-orange-200 to-amber-100 rounded-full blur-[120px] opacity-40 mix-blend-multiply" 
        />
        <motion.div 
            animate={{ scale: [1, 1.3, 1], rotate: [0, -45, 0], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear", delay: 2 }}
            className="absolute -bottom-[50%] -right-[10%] w-[60vw] h-[60vw] bg-gradient-to-l from-red-200 to-orange-100 rounded-full blur-[120px] opacity-40 mix-blend-multiply" 
        />
        {/* Grain Overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-soft-light"></div>
      </div>

      <div className="container mx-auto px-6 md:px-12 lg:px-16 py-20 relative z-10">

        {/* 1. Newsletter Section (Glass Card Style) */}
        {isHomePage && (
          <div className="mb-24 pb-20 border-b border-orange-200/60">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 bg-orange-50 border border-orange-100 text-orange-600 px-4 py-2 rounded-full text-sm font-bold mb-4 shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                <span>Stay Connected</span>
              </motion.div>

              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
                Ready to Transform <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-amber-500">
                  Your Workflow?
                </span>
              </h2>

              <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
                Subscribe for the latest security updates, API features, and developer resources.
              </p>

              <motion.form 
                 initial={{ opacity: 0, scale: 0.95 }}
                 whileInView={{ opacity: 1, scale: 1 }}
                 viewport={{ once: true }}
                 onSubmit={handleSubscribe} 
                 className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto mt-8 p-2 bg-white/60 backdrop-blur-xl border border-orange-100 rounded-full shadow-xl shadow-orange-500/5"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="flex-1 px-6 py-3 rounded-full bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative px-8 py-3 rounded-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/30 disabled:opacity-50"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isSubmitting ? "Subscribing..." : "Subscribe"}
                    {!isSubmitting && <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                  </span>
                </button>
              </motion.form>
            </div>
          </div>
        )}

        {/* 2. Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-16">

          {/* Brand & Description (Span 5) */}
          <div className="lg:col-span-5 space-y-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-2xl border border-orange-100 shadow-sm">
                <img
                  src={Kavachlogo}
                  alt="Kavach Logo"
                  className="h-10 w-auto object-contain"
                />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-wide">KAVACH</h3>
                <p className="text-xs text-orange-600 uppercase tracking-widest font-bold">Document Security</p>
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed max-w-md text-base font-medium">
              Enterprise-grade document security and manipulation tools.
              Designed for speed, built for privacy, and engineered for developers who demand the best.
            </p>

            {/* Social Icons */}
            <div className="flex gap-3">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  className={`w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-500 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-1 hover:border-transparent hover:shadow-lg ${social.color} group`}
                >
                  <social.icon className="w-5 h-5 transition-colors" />
                </a>
              ))}
            </div>
          </div>

          {/* Contact Info (Span 3) */}
          <div className="lg:col-span-3 space-y-6">
            <h4 className="font-bold text-lg text-slate-900">Contact Us</h4>
            <div className="space-y-4">
              {contactInfo.map((info, index) => (
                <div key={index} className="flex items-start gap-3 text-sm text-slate-600 hover:text-orange-600 transition-colors group cursor-default font-medium">
                  <div className="p-2 rounded-lg bg-orange-50 text-orange-500 group-hover:bg-orange-100 transition-colors">
                    <info.icon className="w-4 h-4" />
                  </div>
                  <span className="leading-relaxed py-1.5">{info.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Links Sections (Span 2 each) */}
          {footerSections.map((section) => (
            <div key={section.title} className="lg:col-span-2 space-y-6">
              <h4 className="font-bold text-lg text-slate-900">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.path}
                      className="text-slate-600 hover:text-orange-600 transition-all duration-300 group flex items-center gap-2 text-sm font-medium"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-orange-500 transition-colors" />
                      <span className="group-hover:translate-x-1 transition-transform">
                        {link.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* 3. Bottom Bar */}
        <div className="pt-8 border-t border-orange-200/60">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-sm text-slate-500 font-medium text-center md:text-left">
              © {currentYear} Kavach. All rights reserved.
            </p>

            <div className="flex flex-wrap gap-6 text-sm justify-center">
              {["Privacy Policy", "Terms of Service", "Sitemap"].map((item, index) => (
                <Link
                  key={index}
                  to="#"
                  className="text-slate-500 hover:text-orange-600 transition-colors font-medium flex items-center gap-1 group"
                >
                  {item}
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity -ml-1 group-hover:ml-0" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
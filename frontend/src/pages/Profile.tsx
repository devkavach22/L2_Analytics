import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Lock, Bell, Save } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import { AnimatedBackground, GlassCard } from "@/components/common";
import { FormInput, FormPasswordInput, FormButton } from "@/components/form";

export default function Profile() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8F0] text-slate-900 font-sans selection:bg-orange-200 selection:text-orange-900 relative overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-50"><Header isAuthenticated={true} /></div>

      <main className="flex-1 container mx-auto py-32 px-6 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Profile Settings</h1>
            <p className="text-slate-500 mt-2 font-medium">Manage your account settings and preferences</p>
          </div>

          {/* Profile Information */}
          <GlassCard>
            <div className="p-8">
              <div className="mb-6">
                 <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2"><User className="w-5 h-5 text-orange-500" /> Profile Information</h2>
                 <p className="text-slate-500 text-sm font-medium">Update your personal details</p>
              </div>
              
              <div className="space-y-8">
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24 border-4 border-orange-100 shadow-xl">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-orange-500 to-red-600 text-white">JD</AvatarFallback>
                  </Avatar>
                  <div>
                    <FormButton variant="outline" size="sm">Change Avatar</FormButton>
                    <p className="text-sm text-slate-400 mt-2 font-medium">JPG, PNG or GIF. Max size 2MB</p>
                  </div>
                </div>

                <div className="grid gap-6 max-w-xl">
                  <FormInput
                    id="name"
                    label="Full Name"
                    icon={User}
                    defaultValue="John Doe"
                  />
                  <FormInput
                    id="email"
                    type="email"
                    label="Email"
                    icon={Mail}
                    defaultValue="john@example.com"
                  />
                  <FormButton icon={Save} className="w-fit">
                    Save Changes
                  </FormButton>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Security */}
          <GlassCard>
            <div className="p-8">
              <div className="mb-6">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2"><Lock className="w-5 h-5 text-red-500" /> Security</h2>
                  <p className="text-slate-500 text-sm font-medium">Manage your password and security settings</p>
              </div>
              <div className="space-y-6 max-w-xl">
                <FormPasswordInput
                  id="current-password"
                  label="Current Password"
                />
                <FormPasswordInput
                  id="new-password"
                  label="New Password"
                />
                <FormButton variant="outline" className="w-fit">
                  Update Password
                </FormButton>
              </div>
            </div>
          </GlassCard>

          {/* Notifications */}
          <GlassCard>
            <div className="p-8">
              <div className="mb-6">
                 <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2"><Bell className="w-5 h-5 text-amber-500" /> Notifications</h2>
                 <p className="text-slate-500 text-sm font-medium">Manage your notification preferences</p>
              </div>
              <div className="space-y-4">
                {[
                  { title: "Email Notifications", desc: "Receive email updates about your documents" },
                  { title: "Processing Alerts", desc: "Get notified when document processing is complete" },
                  { title: "Marketing Emails", desc: "Receive updates about new features and tips" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-orange-50/50 border border-orange-100 hover:border-orange-200 transition-colors">
                    <div>
                      <p className="font-bold text-slate-800">{item.title}</p>
                      <p className="text-sm text-slate-500 font-medium">{item.desc}</p>
                    </div>
                    <Switch className="data-[state=checked]:bg-orange-500" defaultChecked={i < 2} />
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
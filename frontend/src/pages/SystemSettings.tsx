import React from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const SystemSettingsPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-neutral-950">
      <Header isAuthenticated isAdmin onLogout={() => console.log("Logout")} />

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 space-y-8 overflow-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              System Settings
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure API keys, email, and site-wide behaviors.
            </p>
          </div>
        </div>

        {/* Removed max-w-2xl from this wrapper div */}
        <div>
          <form
            onSubmit={(e) => e.preventDefault()} // Prevent actual submit
            className="space-y-6"
          >
            {/* --- Card 1: API Configuration --- */}
            <Card>
              <CardHeader>
                <CardTitle>API Configuration</CardTitle>
                <CardDescription>
                  Enter your public and secret API keys for integrations.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">Public API Key</Label>
                  <Input id="apiKey" type="text" placeholder="pk_live_..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secretKey">Secret API Key</Label>
                  <Input
                    id="secretKey"
                    type="password"
                    placeholder="sk_live_..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* --- NEW Card 2: Email Configuration --- */}
            <Card>
              <CardHeader>
                <CardTitle>Email Configuration</CardTitle>
                <CardDescription>
                  Configure SMTP settings for sending transactional emails.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="smtpServer">SMTP Server</Label>
                    <Input
                      id="smtpServer"
                      type="text"
                      placeholder="smtp.example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">SMTP Port</Label>
                    <Input id="smtpPort" type="number" placeholder="587" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpUser">SMTP Username</Label>
                    <Input
                      id="smtpUser"
                      type="text"
                      placeholder="user@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPass">SMTP Password</Label>
                    <Input
                      id="smtpPass"
                      type="password"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* --- Card 3: Maintenance --- */}
              <Card>
                <CardHeader>
                  <CardTitle>Maintenance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-md border">
                    <div>
                      <Label
                        htmlFor="maintenance-mode"
                        className="font-medium"
                      >
                        Enable Maintenance Mode
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        This will take the public-facing site offline.
                      </p>
                    </div>
                    <Switch id="maintenance-mode" />
                  </div>
                </CardContent>
              </Card>

              {/* --- NEW Card 4: User Settings --- */}
              <Card>
                <CardHeader>
                  <CardTitle>User Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-md border">
                    <div>
                      <Label
                        htmlFor="user-registration"
                        className="font-medium"
                      >
                        Allow New User Registration
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Controls whether new users can sign up.
                      </p>
                    </div>
                    <Switch id="user-registration" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* --- Global Save Button --- */}
            <div className="flex justify-end pt-6 border-t">
              <Button type="submit" size="lg">
                Save All Settings
              </Button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SystemSettingsPage;
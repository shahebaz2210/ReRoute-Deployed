"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Radio,
  Lock,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Truck,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Info,
} from "lucide-react";

export default function DispatcherLoginPage() {
  const router = useRouter();

  // Saved default credentials in codebase as requested
  const [username, setUsername] = useState("dispatcher");
  const [password, setPassword] = useState("123456");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const fillDefaultCredentials = () => {
    setUsername("dispatcher");
    setPassword("123456");
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(
          data?.message || "Invalid dispatcher credentials. Please verify username and password."
        );
        setIsLoading(false);
        return;
      }

      setSuccessMessage(
        `Authenticated as ${data.user?.name || "Dispatcher"}. Launching Fleet Control Room...`
      );

      // Smooth transition to operations dashboard
      setTimeout(() => {
        router.push("/");
      }, 700);
    } catch (err: any) {
      setErrorMessage(err?.message || "Connection failure. Please ensure dev server is active.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-neutral-950 text-neutral-100 relative overflow-hidden select-none">
      {/* Background ambient aesthetic */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-800/40 via-neutral-950 to-neutral-950 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-sky-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Top minimal brand bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link
          href="/landing"
          className="flex items-center gap-2.5 font-bold text-base tracking-tight text-white hover:opacity-90 transition-opacity"
        >
          <div className="h-8 w-8 rounded-xl bg-white text-neutral-950 flex items-center justify-center shadow-md">
            <Radio className="h-4 w-4" />
          </div>
          <span>Dispatch<span className="text-neutral-400">X</span></span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/landing"
            className="text-xs text-neutral-400 hover:text-white transition-colors"
          >
            ← Back to SaaS Landing
          </Link>
          <Badge variant="outline" className="hidden sm:inline-flex border-neutral-800 text-neutral-400 gap-1.5 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Dispatch Ops v3.0
          </Badge>
        </div>
      </header>

      {/* Main Login Card Section */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Default Saved Credentials Notification Callout */}
          <div className="mb-4 rounded-xl border border-sky-500/30 bg-sky-950/40 backdrop-blur-md p-3.5 shadow-lg flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Sparkles className="h-4 w-4 text-sky-400 mt-0.5 shrink-0" />
              <div className="text-xs">
                <div className="font-semibold text-sky-200">Default Codebase Credentials</div>
                <div className="text-sky-300/80 mt-0.5 font-mono text-[11px]">
                  username: <span className="font-bold text-white bg-sky-900/60 px-1 py-0.5 rounded">dispatcher</span>
                  {"  "}•{"  "}
                  password: <span className="font-bold text-white bg-sky-900/60 px-1 py-0.5 rounded">123456</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={fillDefaultCredentials}
              className="text-[11px] font-semibold text-sky-300 hover:text-white bg-sky-800/50 hover:bg-sky-700/60 px-2.5 py-1 rounded-lg border border-sky-600/40 transition-all cursor-pointer shrink-0"
            >
              Autofill
            </button>
          </div>

          {/* shadcn Card Container */}
          <Card className="border-neutral-800/90 bg-neutral-900/90 text-neutral-100 shadow-2xl backdrop-blur-xl">
            <CardHeader className="space-y-1.5 pb-5">
              <div className="flex items-center justify-between mb-1">
                <Badge className="bg-neutral-800 text-neutral-300 hover:bg-neutral-800 border-neutral-700 text-[10px] uppercase font-mono tracking-wider">
                  Carrier Authentication
                </Badge>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Secure SSL</span>
                </div>
              </div>

              <CardTitle className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Dispatcher Sign In</span>
              </CardTitle>
              <CardDescription className="text-neutral-400 text-xs">
                Enter your credentials to enter the live fleet operations console and dynamic reroute engine.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {errorMessage && (
                  <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-950/40 text-rose-200 text-xs flex items-center gap-2 animate-in fade-in duration-200">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {successMessage && (
                  <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/40 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in duration-200">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {/* Username Input */}
                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-neutral-300 text-xs font-medium">
                    Dispatcher Username or Email
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                    <input
                      id="username"
                      type="text"
                      autoComplete="username"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. dispatcher"
                      className="w-full h-10 pl-9 pr-3 rounded-xl border border-neutral-800 bg-neutral-950/80 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-neutral-600 transition-colors"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-neutral-300 text-xs font-medium">
                      Password
                    </Label>
                    <button
                      type="button"
                      onClick={() => {
                        setPassword("123456");
                      }}
                      className="text-[11px] text-neutral-400 hover:text-white transition-colors"
                    >
                      Default: 123456
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full h-10 pl-9 pr-10 rounded-xl border border-neutral-800 bg-neutral-950/80 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-neutral-600 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 transition-colors"
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Session remember checkbox */}
                <div className="flex items-center justify-between text-xs text-neutral-400 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-neutral-700 bg-neutral-800 text-white focus:ring-0 cursor-pointer h-3.5 w-3.5"
                    />
                    <span>Keep signed in for 8 hours</span>
                  </label>
                  <span className="text-[11px] text-neutral-500">Carrier Hub #DEPOT-SWARGATE</span>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-white hover:bg-neutral-200 text-neutral-950 font-semibold rounded-xl text-sm transition-all shadow-md active:scale-[0.99] cursor-pointer"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                      Authenticating Dispatcher...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <span>Sign In to Dispatch Console</span>
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>

                {/* Subtle Divider */}
                <div className="relative w-full my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-neutral-800" />
                  </div>
                  <div className="relative flex justify-center text-[11px] uppercase tracking-wider text-neutral-500">
                    <span className="bg-neutral-900 px-2">New Carrier Access</span>
                  </div>
                </div>

                {/* Fake Register Button at the Bottom as requested */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRegisterModal(true)}
                  className="w-full h-10 border-neutral-800 bg-neutral-950/60 hover:bg-neutral-800 text-neutral-300 hover:text-white font-medium rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Register New Dispatcher Account
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>

      {/* Fake Register Modal Dialog */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl text-left">
            <div className="h-10 w-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-4 border border-sky-500/20">
              <Truck className="h-5 w-5" />
            </div>

            <h3 className="text-lg font-bold text-white tracking-tight">
              Enterprise Dispatcher Registration
            </h3>

            <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
              Public self-registration is restricted for security compliance. Fleet operator accounts are pre-configured through your TMS administrator or enterprise SSO directory.
            </p>

            <div className="mt-4 p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs space-y-1.5">
              <div className="text-[11px] uppercase font-mono text-neutral-500">Active Test Credentials:</div>
              <div className="font-mono text-neutral-200">
                Username: <span className="text-sky-300 font-bold">dispatcher</span>
              </div>
              <div className="font-mono text-neutral-200">
                Password: <span className="text-sky-300 font-bold">123456</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                onClick={() => setShowRegisterModal(false)}
                className="h-9 px-4 text-xs border-neutral-800 text-neutral-300 hover:text-white bg-neutral-900"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  fillDefaultCredentials();
                  setShowRegisterModal(false);
                }}
                className="h-9 px-4 text-xs bg-white text-neutral-950 hover:bg-neutral-200 font-semibold"
              >
                Autofill Credentials
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-500 gap-2">
        <div>© 2026 DispatchX Inc. Multi-Vehicle Disruption Replanning System.</div>
        <div className="flex items-center gap-4">
          <Link href="/landing" className="hover:text-neutral-300 transition-colors">Platform Overview</Link>
          <span className="text-neutral-800">•</span>
          <span>Security & Compliance</span>
          <span className="text-neutral-800">•</span>
          <span>Swargate Central Depot</span>
        </div>
      </footer>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Radio,
  ArrowRight,
  ChevronDown,
  Plus,
  Minus,
  CheckCircle2,
  TrendingUp,
  Shield,
  Zap,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Gauge,
  Activity,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SaaSPlatformLandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [subscribedEmail, setSubscribedEmail] = useState("");
  const [subscribeSuccess, setSubscribeSuccess] = useState(false);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscribedEmail) return;
    setSubscribeSuccess(true);
    setSubscribedEmail("");
    setTimeout(() => setSubscribeSuccess(false), 4000);
  };

  const faqs = [
    {
      q: "How quickly can I start using your solution?",
      a: "Our solutions are easy to implement and can be up and running in just a few days, depending on your fleet size and telematics system integration needs. You can test it immediately using the 'Try Now' dispatcher demo.",
    },
    {
      q: "Which types of vehicles are compatible with your system?",
      a: "DispatchX is vehicle-agnostic. We support heavy semi-trailers, medium-duty delivery vans, commercial EV fleets, refrigerated units, and urban parcel carriers across all major manufacturers.",
    },
    {
      q: "Can I integrate your systems with existing hardware?",
      a: "Yes. Our platform connects directly with Geotab, Samsara, Motive (KeepTruckin), OBD-II ports, and standard J1939 CAN bus telematics without replacing your existing fleet hardware.",
    },
    {
      q: "How can I access fleet data?",
      a: "Fleet data is streamed live via WebSockets, gRPC, and REST APIs, accessible securely through the web control room, mobile dispatcher apps, or automated warehouse export pipelines.",
    },
    {
      q: "Do you provide technical support?",
      a: "Yes, our tier-1 logistics engineering specialists offer 24/7 dedicated support with SLA response guarantees under 15 minutes for mission-critical dispatches.",
    },
    {
      q: "How do your solutions help reduce costs?",
      a: "By minimizing empty miles, balancing vehicle payload capacity, mitigating traffic bottleneck congestion with real-time dynamic rerouting, and reducing fuel waste by up to 30%.",
    },
    {
      q: "Are my data secure?",
      a: "All telemetry streams and dispatch manifests are encrypted in transit with TLS 1.3 and at rest with AES-256, meeting SOC 2 Type II and ISO 27001 standards.",
    },
    {
      q: "Do you offer a free trial?",
      a: "Yes! Click the 'Try Now' button below to test-drive our full-featured Dispatcher Operations Control Room instantly with pre-seeded demo credentials.",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-[#111317] font-sans antialiased selection:bg-neutral-900 selection:text-white">
      {/* Top SaaS Header / Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-100 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Left Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-[13px] font-medium text-neutral-600">
            <div className="relative group cursor-pointer flex items-center gap-1 hover:text-black transition-colors">
              <span>Solutions</span>
              <ChevronDown className="h-3.5 w-3.5 text-neutral-400 group-hover:text-black transition-transform" />
            </div>
            <div className="relative group cursor-pointer flex items-center gap-1 hover:text-black transition-colors">
              <span>Products</span>
              <ChevronDown className="h-3.5 w-3.5 text-neutral-400 group-hover:text-black transition-transform" />
            </div>
            <Link href="#useful-for-business" className="hover:text-black transition-colors">
              About
            </Link>
            <Link href="#news-and-updates" className="hover:text-black transition-colors">
              Updates
            </Link>
          </nav>

          {/* Centered Brand Mark */}
          <Link href="/landing" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-black text-white flex items-center justify-center font-black tracking-tighter text-sm">
              <Radio className="h-4 w-4" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-black">
              DISPATCH<span className="text-neutral-400 font-medium">X</span>
            </span>
          </Link>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1 text-[13px] font-medium text-neutral-600 cursor-pointer hover:text-black">
              <span>En</span>
              <ChevronDown className="h-3 w-3 text-neutral-400" />
            </div>

            <Link
              href="/login"
              className="text-[13px] font-semibold text-neutral-800 hover:text-black px-2 py-1 transition-colors"
            >
              Sign In
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center justify-center px-4.5 py-2 rounded-full bg-black text-white text-[13px] font-semibold hover:bg-neutral-800 transition-all shadow-sm active:scale-95"
            >
              Get a Demo
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-12 md:pt-24 md:pb-20 px-6 text-center max-w-5xl mx-auto">
        {/* Subtle pill tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-neutral-100 text-neutral-700 text-xs font-medium mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Next-Generation Fleet AI & Dynamic Disruption Recovery</span>
        </div>

        {/* Mockup Main Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-black leading-[1.08] max-w-4xl mx-auto">
          Control your fleet <br />
          like never before.
        </h1>

        {/* Mockup Subtitle */}
        <p className="mt-6 text-base sm:text-lg md:text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed font-normal">
          Real-time tracking, advanced analytics, and seamless management — all in one powerful platform.
        </p>

        {/* MIDDLE OF LANDING PAGE TRY NOW BUTTON (As requested by user) */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full bg-black text-white text-sm font-semibold hover:bg-neutral-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 cursor-pointer"
          >
            <span>Try Now</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full border border-neutral-200 text-neutral-800 text-sm font-semibold hover:bg-neutral-50 transition-colors"
          >
            <span>Live Control Room</span>
            <ExternalLink className="h-3.5 w-3.5 text-neutral-400" />
          </Link>
        </div>

        {/* Quick credential hint */}
        <p className="mt-3 text-[12px] text-neutral-400 font-mono">
          Instant Dispatcher Access: <span className="text-neutral-700 font-medium">dispatcher / 123456</span>
        </p>
      </section>

      {/* Hero Big Fleet Visual (The Volvo/Truck image exactly from mockup) */}
      <section className="px-4 sm:px-6 max-w-7xl mx-auto mb-24">
        <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-neutral-200/80 aspect-[16/9] sm:aspect-[21/9] bg-neutral-900 group">
          <img
            src="/hero-truck.jpg"
            alt="Commercial fleet semi-truck driving on open highway road"
            className="w-full h-full object-cover object-center group-hover:scale-[1.01] transition-transform duration-700"
          />

          {/* Elegant gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

          {/* Floating Live Telemetry Badges */}
          <div className="absolute bottom-6 left-6 right-6 flex flex-wrap items-center justify-between gap-3 text-white">
            <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 shadow-lg">
              <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-300">Swargate Hub Live Fleet</div>
                <div className="text-xs font-bold">14/14 Trucks Active • 0 Fatalities</div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-4 bg-black/60 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 shadow-lg text-xs">
              <div>
                <span className="text-neutral-400">On-Time SLA: </span>
                <span className="font-bold text-emerald-400">99.8%</span>
              </div>
              <div className="w-px h-4 bg-white/20" />
              <div>
                <span className="text-neutral-400">Dynamic Replanning: </span>
                <span className="font-bold text-sky-400">OR-Tools VRPTW</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Useful for business */}
      <section id="useful-for-business" className="py-20 bg-neutral-50/70 border-t border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-black">
              Useful for business.
            </h2>
            <p className="mt-3 text-base text-neutral-600 font-normal">
              Our technologies enhance business efficiency and driver safety.
            </p>
          </div>

          {/* 3 Metric Cards matching mockup */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Card 1: Time saving */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 border border-neutral-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <span className="inline-block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-6 bg-neutral-100 px-3 py-1 rounded-full">
                  Time saving
                </span>
                <div className="text-5xl sm:text-6xl font-extrabold text-black tracking-tight">
                  20%
                </div>
                <div className="text-lg font-bold text-black mt-2">
                  less mundanity
                </div>
                <p className="mt-4 text-xs sm:text-sm text-neutral-500 leading-relaxed">
                  Process automation frees you to focus on high-priority delivery exceptions, customer communication, and fleet orchestration.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-neutral-100 flex items-center gap-2 text-xs font-semibold text-neutral-700">
                <Clock className="h-4 w-4 text-neutral-400" />
                <span>Save 4.2 hours per dispatcher daily</span>
              </div>
            </div>

            {/* Card 2: Safety */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 border border-neutral-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <span className="inline-block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-6 bg-neutral-100 px-3 py-1 rounded-full">
                  Safety
                </span>
                <div className="text-5xl sm:text-6xl font-extrabold text-black tracking-tight">
                  50%
                </div>
                <div className="text-lg font-bold text-black mt-2">
                  fewer accidents.
                </div>
                <p className="mt-4 text-xs sm:text-sm text-neutral-500 leading-relaxed">
                  Analyzing driving behavior, telematics speeding markers, and shift fatigue intervals improves on-road driver safety.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-neutral-100 flex items-center gap-2 text-xs font-semibold text-neutral-700">
                <Shield className="h-4 w-4 text-neutral-400" />
                <span>Zero fatigue-induced violations</span>
              </div>
            </div>

            {/* Card 3: Improving efficiency */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 border border-neutral-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <span className="inline-block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-6 bg-neutral-100 px-3 py-1 rounded-full">
                  Improving efficiency
                </span>
                <div className="text-5xl sm:text-6xl font-extrabold text-black tracking-tight">
                  30%
                </div>
                <div className="text-lg font-bold text-black mt-2">
                  reduction in fuel costs.
                </div>
                <p className="mt-4 text-xs sm:text-sm text-neutral-500 leading-relaxed">
                  Route optimization saves up to a third on fuel through multi-depot OR-Tools VRPTW solver algorithms and traffic bypasses.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-neutral-100 flex items-center gap-2 text-xs font-semibold text-neutral-700">
                <TrendingUp className="h-4 w-4 text-neutral-400" />
                <span>₹1.4L average monthly diesel savings</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section: News and updates (Right side of user mockup) */}
      <section id="news-and-updates" className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-black">
            News and updates.
          </h2>
          <p className="mt-3 text-base text-neutral-600 font-normal">
            Stay up-to-date with the latest developments and innovations in fleet management.
          </p>
        </div>

        {/* 3 News Cards matching mockup */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* News 1: SAP Integration */}
          <div className="group bg-white rounded-3xl overflow-hidden border border-neutral-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="aspect-[4/3] bg-neutral-100 overflow-hidden relative">
                <img
                  src="/news-van.jpg"
                  alt="Delivery van urban logistics"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 sm:p-7">
                <h3 className="text-lg font-bold text-black leading-snug group-hover:text-neutral-700 transition-colors">
                  Integration with SAP is now complete and fully operational.
                </h3>
                <p className="mt-3 text-xs sm:text-sm text-neutral-500 leading-relaxed">
                  Carriers can now integrate DispatchX with SAP for comprehensive financial, TMS inventory, and freight billing sync.
                </p>
              </div>
            </div>
            <div className="px-6 pb-6 text-xs font-mono text-neutral-400">
              Dec 24
            </div>
          </div>

          {/* News 2: EV Tools */}
          <div className="group bg-white rounded-3xl overflow-hidden border border-neutral-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="aspect-[4/3] bg-neutral-100 overflow-hidden relative">
                <img
                  src="/news-ev.jpg"
                  alt="Electric commercial truck charging"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 sm:p-7">
                <h3 className="text-lg font-bold text-black leading-snug group-hover:text-neutral-700 transition-colors">
                  DispatchX supports electric vehicles and fleet tools.
                </h3>
                <p className="mt-3 text-xs sm:text-sm text-neutral-500 leading-relaxed">
                  We've added tools for managing EV fleets, including battery SOC level monitoring, kilowatt consumption, and smart depot charging windows.
                </p>
              </div>
            </div>
            <div className="px-6 pb-6 text-xs font-mono text-neutral-400">
              Dec 17
            </div>
          </div>

          {/* News 3: Big Data Tech */}
          <div className="group bg-white rounded-3xl overflow-hidden border border-neutral-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="aspect-[4/3] bg-neutral-100 overflow-hidden relative">
                <img
                  src="/news-truck.jpg"
                  alt="Big commercial hauler on highway"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 sm:p-7">
                <h3 className="text-lg font-bold text-black leading-snug group-hover:text-neutral-700 transition-colors">
                  Big data technology: The future of fleet optimization.
                </h3>
                <p className="mt-3 text-xs sm:text-sm text-neutral-500 leading-relaxed">
                  Real-time edge telemetry unlocks next-generation machine learning opportunities for cost reduction, vehicle health monitoring, and proactive rerouting.
                </p>
              </div>
            </div>
            <div className="px-6 pb-6 text-xs font-mono text-neutral-400">
              Dec 14
            </div>
          </div>
        </div>

        {/* Subscribe / Show All Action Bar */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <form onSubmit={handleSubscribe} className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="email"
              value={subscribedEmail}
              onChange={(e) => setSubscribedEmail(e.target.value)}
              placeholder="Enter your email"
              className="h-10 px-4 rounded-full border border-neutral-200 text-xs w-full sm:w-64 focus:outline-none focus:border-black"
            />
            <button
              type="submit"
              className="h-10 px-6 rounded-full bg-black text-white text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
            >
              Subscribe
            </button>
          </form>

          <button
            type="button"
            className="h-10 px-6 rounded-full border border-neutral-200 text-neutral-700 hover:text-black hover:border-black text-xs font-semibold transition-colors cursor-pointer"
          >
            Show All
          </button>
        </div>

        {subscribeSuccess && (
          <p className="mt-3 text-center text-xs text-emerald-600 font-semibold animate-in fade-in">
            ✓ Thank you! You're now subscribed to DispatchX fleet engineering updates.
          </p>
        )}
      </section>

      {/* Section: Frequently Asked Questions (from user mockup) */}
      <section className="py-20 bg-neutral-50 border-t border-neutral-200/80">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left Column Heading */}
            <div className="lg:col-span-5">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-black leading-tight">
                Frequently <br />
                asked <br />
                questions.
              </h2>
              <p className="mt-6 text-sm text-neutral-500 leading-relaxed max-w-sm">
                Can't find an answer to your question? <br />
                <Link href="/login" className="text-black font-semibold underline underline-offset-2 hover:text-neutral-700">
                  Contact us
                </Link>
                , and we'll be happy to help!
              </p>

              <div className="mt-8">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-black text-white text-xs font-semibold hover:bg-neutral-800 transition-all shadow-sm"
                >
                  <span>Launch Dispatcher Console</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Right Column Accordion List */}
            <div className="lg:col-span-7 divide-y divide-neutral-200">
              {faqs.map((faq, idx) => (
                <div key={idx} className="py-4">
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between text-left py-2 font-semibold text-sm sm:text-base text-neutral-900 hover:text-black cursor-pointer transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-neutral-400 font-mono text-sm">
                        {openFaq === idx ? "—" : "+"}
                      </span>
                      <span>{faq.q}</span>
                    </span>
                  </button>

                  {openFaq === idx && (
                    <div className="pl-6 pt-2 pb-3 text-xs sm:text-sm text-neutral-600 leading-relaxed animate-in fade-in duration-200">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Middle/Bottom Conversion CTA */}
      <section className="py-24 bg-black text-white text-center px-6">
        <div className="max-w-4xl mx-auto">
          <span className="inline-block px-3.5 py-1 rounded-full bg-white/10 text-neutral-300 text-xs font-mono mb-6">
            ENTERPRISE LOGISTICS SUITE
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Ready to optimize your fleet operations?
          </h2>
          <p className="mt-4 text-base text-neutral-400 max-w-xl mx-auto leading-relaxed">
            Experience real-time dynamic rerouting, traffic detours, and multi-depot fleet management today.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-white text-black text-sm font-bold hover:bg-neutral-200 transition-all shadow-lg active:scale-95"
            >
              <span>Try Now</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full border border-neutral-700 text-neutral-300 text-sm font-semibold hover:bg-neutral-900 transition-colors"
            >
              <span>Open Operations Room</span>
            </Link>
          </div>
        </div>
      </section>

      {/* SaaS Footer */}
      <footer className="bg-neutral-950 text-neutral-400 text-xs py-14 border-t border-neutral-900">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2 text-white font-extrabold text-base mb-3">
              <div className="h-6 w-6 rounded bg-white text-neutral-950 flex items-center justify-center">
                <Radio className="h-3.5 w-3.5" />
              </div>
              <span>DispatchX</span>
            </div>
            <p className="text-neutral-500 leading-relaxed max-w-sm text-xs">
              Autonomous Fleet Operations & Disruption Recovery. Multi-depot routing powered by OR-Tools VRPTW algorithms.
            </p>
            <div className="mt-4 text-[11px] text-neutral-600">
              Swargate Depot, Pune • Maharashtra, India
            </div>
          </div>

          <div>
            <div className="font-semibold text-white mb-3">Product</div>
            <ul className="space-y-2">
              <li><Link href="/" className="hover:text-white transition-colors">Operations Room</Link></li>
              <li><Link href="/landing" className="hover:text-white transition-colors">Dynamic Replanning</Link></li>
              <li><Link href="/fleet" className="hover:text-white transition-colors">Fleet Telematics</Link></li>
              <li><Link href="/analytics" className="hover:text-white transition-colors">Cost & Fuel Analytics</Link></li>
            </ul>
          </div>

          <div>
            <div className="font-semibold text-white mb-3">Platform</div>
            <ul className="space-y-2">
              <li><Link href="/login" className="hover:text-white transition-colors">Dispatcher Login</Link></li>
              <li><Link href="/schedule" className="hover:text-white transition-colors">Shift Rostering</Link></li>
              <li><Link href="/monitor" className="hover:text-white transition-colors">Live Map Tracking</Link></li>
              <li><Link href="/orders" className="hover:text-white transition-colors">Manifest Pipeline</Link></li>
            </ul>
          </div>

          <div>
            <div className="font-semibold text-white mb-3">Company</div>
            <ul className="space-y-2">
              <li><Link href="#useful-for-business" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="#news-and-updates" className="hover:text-white transition-colors">News & Updates</Link></li>
              <li><Link href="/settings" className="hover:text-white transition-colors">Enterprise Settings</Link></li>
              <li><span className="text-neutral-600">Privacy Policy</span></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between text-neutral-600 text-[11px] gap-3">
          <div>© 2026 DispatchX Inc. All rights reserved.</div>
          <div className="flex items-center gap-6">
            <Link href="/landing" className="hover:text-neutral-400">Landing Page</Link>
            <Link href="/login" className="hover:text-neutral-400">Dispatcher Portal</Link>
            <Link href="/" className="hover:text-neutral-400">Control Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

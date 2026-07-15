"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Globe2, Radar, ShieldCheck, Ship, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const features = [
  { icon: Ship, title: "PortWatch analytics", text: "Daily port throughput, vessel congestion, and trade value monitoring." },
  { icon: Radar, title: "Chokepoint intelligence", text: "Suez, Malacca, Panama, Hormuz, and other critical maritime corridors." },
  { icon: Waves, title: "Climate risk", text: "Scenario-based hazard exposure, physical asset damages, and country risk scoring." },
  { icon: ShieldCheck, title: "Spillover simulator", text: "Model cascading disruption impact across countries, industries, and ports." }
];

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-radial-ocean">
      <div className="fixed inset-0 maritime-grid opacity-50" />
      <section className="relative z-10 flex min-h-[92vh] items-center px-6 py-8">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="mb-6 inline-flex rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100 shadow-neon">
              ITI Graduation Project - Enterprise Maritime Intelligence
            </div>
            <h1 className="max-w-4xl text-5xl font-black leading-tight text-white md:text-7xl">
              CTRL SEA
            </h1>
            <p className="mt-4 max-w-2xl text-xl text-cyan-100/85">
              Maritime Intelligence Platform for port analytics, climate exposure, trade risk, and supply-chain spillover simulation.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/dashboard"><Button>Enter Platform <ArrowRight size={17} /></Button></Link>
              <Link href="#features"><Button className="bg-slate-900/70">Explore Modules</Button></Link>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="relative h-[520px]">
            <div className="absolute inset-0 rounded-full border border-[#D6A85F]/25 bg-cyan-300/5 shadow-neon" />
            <div className="absolute inset-8 rounded-full border border-[#D6A85F]/20" />
            <div className="absolute inset-16 rounded-full border border-cyan-200/10" />
            <Image src="/ctrl-sea-logo.png" alt="CTRL SEA official platform logo" width={360} height={360} priority className="absolute left-1/2 top-1/2 z-10 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full object-contain drop-shadow-[0_0_34px_rgba(214,168,95,.34)] md:h-80 md:w-80" />
            <Globe2 className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 text-cyan-200/30" />
            {["Suez", "Malacca", "Rotterdam", "Shanghai", "Panama"].map((label, index) => (
              <motion.div
                key={label}
                className="absolute rounded-md border border-cyan-300/30 bg-slate-950/80 px-3 py-2 text-sm text-cyan-100"
                style={{ left: `${18 + (index * 16) % 65}%`, top: `${20 + (index * 23) % 58}%` }}
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3 + index * 0.3 }}
              >
                {label}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
      <section id="features" className="relative z-10 mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-4 md:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title}>
                <Icon className="h-8 w-8 text-cyan-200" />
                <h2 className="mt-5 text-lg font-semibold text-white">{feature.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">{feature.text}</p>
              </Card>
            );
          })}
        </div>
      </section>
      <section className="relative z-10 mx-auto grid max-w-7xl gap-6 px-6 py-16 md:grid-cols-3">
        {[
          ["2,069", "Warehouse ports"],
          ["28", "Strategic chokepoints"],
          ["14", "Warehouse datasets"]
        ].map(([value, label]) => (
          <Card key={label} className="text-center">
            <p className="text-4xl font-black text-white">{value}</p>
            <p className="mt-2 text-sm uppercase tracking-[0.2em] text-cyan-200/70">{label}</p>
          </Card>
        ))}
      </section>
      <footer className="relative z-10 border-t border-cyan-300/10 px-6 py-8 text-center text-sm text-slate-500">
        CTRL SEA - Maritime Intelligence Platform - Built for ITI graduation showcase
      </footer>
    </main>
  );
}

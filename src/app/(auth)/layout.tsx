"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Heart, Droplet, ShieldCheck, Clock } from "lucide-react";
import { PublicNavbar } from "@/components/layout/public-navbar";
import Image from "next/image";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-page">
      <PublicNavbar />
      
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl">
        {/* Left side - Form */}
        <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>

        {/* Right side - Image (hidden on mobile) */}
        <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-center lg:bg-gradient-to-br lg:from-accent/10 lg:to-accent/5">
          <div className="relative h-full w-full p-12">
            <div className="flex h-full flex-col items-center justify-center gap-8 text-center">
              <div className="rounded-3xl bg-white/80 p-8 shadow-xl backdrop-blur dark:bg-gray-900/80">
                <Heart className="mx-auto h-24 w-24 text-accent" fill="currentColor" />
              </div>

              <div className="max-w-md">
                <h2 className="mb-2 text-3xl font-bold text-primary">Did you know?</h2>
                <p className="text-sm text-secondary">Important facts about blood donation and safety.</p>
              </div>

              {/* Animated rotating cards */}
              <div className="w-full max-w-md">
                <AnimatedFacts />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


function AnimatedFacts() {
  const facts = [
    {
      id: 1,
      title: "One donation, many lives",
      text: "A single unit of blood can save up to three lives through component separation.",
      icon: Droplet,
    },
    {
      id: 2,
      title: "Universal donor",
      text: "Type O negative can be transfused to nearly anyone in emergencies.",
      icon: ShieldCheck,
    },
    {
      id: 3,
      title: "Safe & tested",
      text: "All donations are screened and stored under strict safety standards.",
      icon: Clock,
    },
  ];

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % facts.length), 6000);
    return () => clearInterval(t);
  }, [paused]);

  const prev = (i: number) => (i - 1 + facts.length) % facts.length;
  const next = (i: number) => (i + 1) % facts.length;

  return (
    <div
      className="relative mx-auto w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative h-64 overflow-hidden">
        {facts.map((fact, i) => {
          const Icon = fact.icon as any;
          const position =
            i === index ? "center" : i === prev(index) ? "left" : i === next(index) ? "right" : "hidden";

          const base =
            "absolute left-1/2 top-1/2 w-96 -translate-y-1/2 rounded-2xl border border-soft bg-surface-card p-6 transition-all duration-1000 ease-in-out";

          // compute translateX offset so off-screen cards are fully out of view (use larger offset for wider card)
          const translateX = position === "center" ? "0%" : position === "left" ? "-220%" : position === "right" ? "220%" : "0%";
          const opacity = position === "center" ? 1 : 0;
          const scale = position === "center" ? 1.06 : 0.96;

          return (
            <div
              key={fact.id}
              className={base}
              style={{
                transform: `translate(-50%, -40%) translateX(${translateX}) scale(${scale})`,
                opacity,
                zIndex: position === "center" ? 30 : 10,
                pointerEvents: position === "center" ? "auto" : "none",
              }}
              aria-hidden={position !== "center"}
            >
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-accent/10 p-3 text-accent">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-primary">{fact.title}</h4>
                  <p className="mt-2 text-base leading-relaxed text-secondary">{fact.text}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* navigation dots */}
      <div className="mt-4 flex items-center justify-center gap-2">
        {facts.map((_, i) => (
          <button
            key={i}
            className={`h-2 w-8 rounded-full transition-all duration-300 ${
              i === index ? "bg-accent" : "bg-muted"
            }`}
            aria-label={`Show fact ${i + 1}`}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const SHAPES = [
  { id: "hands", label: "হাত ও সূর্য" },
  { id: "arcs", label: "রঙিন বৃত্ত" },
  { id: "star", label: "তারা" },
] as const;

export function LogoMark({ className, animate = false }: { className?: string; animate?: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <svg viewBox="0 0 200 200" className={cn("block", animate && "hover:spin-[18deg]", className)} width="100%" height="100%"
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <defs>
        <radialGradient id="sunG" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="70%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#f5900b" />
        </radialGradient>
        <clipPath id="sunClip"><circle cx="100" cy="100" r="34" /></clipPath>
      </defs>
      {/* arcs */}
      <path d="M 38 130 A 78 78 0 1 1 162 70" fill="none" stroke="#881337" strokeWidth="18" strokeLinecap="round" opacity="0.92" />
      <path d="M 168 52 A 78 78 0 0 1 172 132" fill="none" stroke="#f5900b" strokeWidth="16" strokeLinecap="round" opacity="0.92" />
      <path d="M 170 140 A 78 78 0 0 1 40 112" fill="none" stroke="#16a34a" strokeWidth="16" strokeLinecap="round" opacity="0.92" />
      <path d="M 32 92 A 78 78 0 0 1 36 52" fill="none" stroke="#7e22ce" strokeWidth="16" strokeLinecap="round" opacity="0.92" />
      {/* sun rays */}
      <g clipPath="url(#sunClip)">
        {Array.from({ length: 16 }).map((_, i) => {
          const a = (i * 22.5 * Math.PI) / 180;
          const x1 = 100 + Math.cos(a) * 36;
          const y1 = 100 + Math.sin(a) * 36;
          const x2 = 100 + Math.cos(a) * (hover ? 52 : 46);
          const y2 = 100 + Math.sin(a) * (hover ? 52 : 46);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#f5900b" strokeWidth="3" strokeLinecap="round" />;
        })}
        <circle cx="100" cy="100" r="34" fill="url(#sunG)" />
      </g>
      {/* hands */}
      <path d="M 70 118 Q 88 132 100 124 Q 112 132 130 118 Q 138 112 134 104 Q 120 96 100 104 Q 80 96 66 104 Q 62 112 70 118 Z" fill="#db2777" />
      <path d="M 70 84 Q 88 70 100 78 Q 112 70 130 84 Q 138 90 134 98 Q 120 106 100 98 Q 80 106 66 98 Q 62 90 70 84 Z" fill="#06b6d4" />
      {/* star */}
      <polygon points="100,14 106,42 136,42 112,60 121,88 100,72 79,88 88,60 64,42 94,42" fill="#db2777" />
    </svg>
  );
}

export function WordMark({ className }: { className?: string }) {
  return (
    <p className={cn("font-extrabold tracking-tight", className)}>
      Surjo<span className="text-brand-600">Sangstha</span>
    </p>
  );
}

export function BengaliWordMark({ className }: { className?: string }) {
  return <p className={cn("font-bold text-brand-700 dark:text-brand-300", className)}>সূর্য সাহায্য</p>;
}

/**
 * সব জায়গার জন্য নির্ভরযোগ্য লোগো — ছবি লোড না হলে স্বয়ংক্রিয়ভাবে SVG LogoMark দেখায়।
 * (কাস্টম আপলোড করা লোগোর URL ভাঙা থাকলেও লোগো কখনো মিসিং থাকবে না)
 */
export function SiteLogo({ src, alt = "SurjoSangstha", className }: { src?: string | null; className?: string; alt?: string }) {
  const [failed, setFailed] = useState(false);
  const url = (src && src.trim()) || "/logo.png";
  if (failed) return <LogoMark className={className} />;
  return (
    <img
      src={url}
      alt={alt}
      loading="eager"
      decoding="async"
      onError={() => setFailed(true)}
      className={cn("object-contain", className)}
    />
  );
}

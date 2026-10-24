"use client";
import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

/** Scroll-এর উপর নির্ভর করে দেখা/লুকানো হয়; ক্লিক করলে animated way-তে টপে যায় */
export function ClickTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 420);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  if (!show) return null;
  return (
    <button
      aria-label="উপরে যান" title="উপরে যান"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-40 right-4 z-[74] grid h-11 w-11 place-items-center rounded-full bg-brand-600 text-white shadow-xl ring-1 ring-white/20 transition hover:bg-brand-700 md:bottom-24"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, Globe2, Sparkles } from "lucide-react";

export function AnnouncementBar() {
  const [currency, setCurrency] = useState("INR");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("viraasat_currency");
      if (saved) setCurrency(saved);
    }
  }, []);

  const handleCurrencyChange = (val: string) => {
    setCurrency(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("viraasat_currency", val);
      window.dispatchEvent(new CustomEvent("viraasat_currency_change", { detail: val }));
    }
  };

  return (
    <aside aria-label="Heritage guarantee & currency" className="bg-[#701D24] text-[#FAF7F2]/90 text-xs py-2 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 border-b border-[#C59B4B]/30 relative z-50">
      <div className="max-w-[1680px] w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center font-medium">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#C59B4B]/30 text-[#E8CA82] text-[10px]">
            ✦
          </span>
          <span>
            Every purchase directly supports over <strong className="text-white font-semibold">12,400+ GI-Certified Indian Artisans</strong>
          </span>
        </div>
        <div className="flex items-center gap-6">
          <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-[#E8CA82]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#E8CA82]" /> 100% Provenance Guarantee
          </span>
          <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-[#E8CA82]">
            <Globe2 className="w-3.5 h-3.5 text-[#E8CA82]" /> Global Insured Air Express
          </span>
          <div className="flex items-center gap-1 border-l border-white/20 pl-4">
            <label htmlFor="top-currency-select" className="sr-only">Currency</label>
            <select
              id="top-currency-select" suppressHydrationWarning
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="bg-transparent text-xs text-[#E8CA82] font-semibold focus:outline-none cursor-pointer"
            >
              <option value="INR" className="text-neutral-900 bg-white">INR (₹)</option>
              <option value="USD" className="text-neutral-900 bg-white">USD ($)</option>
            </select>
          </div>
        </div>
      </div>
    </aside>
  );
}

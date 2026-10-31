'use client';

import React from 'react';
import Link from 'next/link';
import {
  Crown,
  Sparkles,
  Code2,
  BrainCircuit,
  Palette,
  Compass,
  ShieldCheck,
  Github,
  Linkedin,
  Mail,
  Award,
  Layers,
  Cpu,
  HeartHandshake
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/core/utils/utils';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  division: string;
  isHead?: boolean;
  avatarText: string;
  icon: React.ElementType;
  badge: string;
  bio: string;
  focus: string[];
  quote: string;
  socials: {
    github?: string;
    linkedin?: string;
    email?: string;
  };
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'arpit-tiwari',
    name: 'Arpit Tiwari',
    role: 'Project Head & Chief Systems Architect',
    division: 'Executive Leadership & AI Strategy',
    isHead: true,
    avatarText: 'AT',
    icon: Crown,
    badge: 'Project Head',
    bio: 'Steers Viraasat’s overall architectural vision, technical strategy, and engineering roadmap. Spearheaded the cross-stack integration linking deep learning models, cultural ontologies, and decentralized provenance to empower India’s traditional artisan guilds with world-class digital dignity.',
    focus: [
      'Full-Stack System Architecture',
      'AI & MLOps Orchestration',
      'Cross-Functional Leadership',
      'Artisan Guild Strategic Vision'
    ],
    quote: 'Preserving India’s ancestral heritage requires modern engineering dignity—connecting centuries of artisanal genius with transparent, fair technology.',
    socials: {
      github: 'https://github.com/arpittiwari',
      linkedin: 'https://linkedin.com/in/arpit-tiwari',
      email: 'mailto:arpit.tiwari@viraasat.in'
    }
  },
  {
    id: 'shreyansh-singh',
    name: 'Shreyansh Singh',
    role: 'Full-Stack Systems & AI Engineering',
    division: 'Backend Infrastructure & Storage Parity',
    avatarText: 'SS',
    icon: Cpu,
    badge: 'Core Architect',
    bio: 'Architected Viraasat’s high-throughput FastAPI microservices, resilient multi-engine database layer (SQLite, PostgreSQL & Firestore parity), Razorpay verification pipelines, and automated model registry synchronizations.',
    focus: [
      'FastAPI Microservices',
      'Database Parity & Storage Engines',
      'Razorpay Payment Verification',
      'Backend Security & Clerk Auth'
    ],
    quote: 'Resilient architecture ensures that every artisan transaction is instantaneous, reliable, and transparent from rural workshop to global collector.',
    socials: {
      github: 'https://github.com/shreyansh-singh',
      linkedin: 'https://linkedin.com/in/shreyansh-singh',
      email: 'mailto:shreyansh.singh@viraasat.in'
    }
  },
  {
    id: 'aayush-kumar-singh',
    name: 'Aayush Kumar Singh',
    role: 'Machine Learning & Predictive Intelligence',
    division: 'Data Science & Predictive Regressors',
    avatarText: 'AS',
    icon: BrainCircuit,
    badge: 'Core Specialist',
    bio: 'Engineered Viraasat’s predictive intelligence suite: craft-specific fair-wage pricing regressors with zero target leakage, multi-month Holt-Winters demand forecasting, and Kaggle-trained review spam NLP classifiers.',
    focus: [
      'Fair-Wage Pricing Regressor',
      'Demand Forecasting (Holt-Winters/GBT)',
      'Review Fraud Detection NLP',
      'Two-Tower Neural Recommendations'
    ],
    quote: 'Machine learning should empower fair trade, protecting traditional craftspeople from predatory middlemen and opaque pricing practices.',
    socials: {
      github: 'https://github.com/aayush-kumar-singh',
      linkedin: 'https://linkedin.com/in/aayush-kumar-singh',
      email: 'mailto:aayush.singh@viraasat.in'
    }
  },
  {
    id: 'amitesh-kumar-shukla',
    name: 'Amitesh Kumar Shukla',
    role: 'Frontend Architecture & Heritage UI/UX',
    division: 'Client Experience & Native Android',
    avatarText: 'AS',
    icon: Palette,
    badge: 'Core Specialist',
    bio: 'Designed and built the tactile Cinematic Heritage Design System, high-responsiveness Next.js client architecture, 13-language reactive localization matrix, and production-grade v2/v3 signed Android APK packaging.',
    focus: [
      'Cinematic Heritage Design System',
      '13-Language i18n Localization',
      'Android APK & PWA Engineering',
      'WCAG AA Accessibility & Performance'
    ],
    quote: 'Every pixel of Viraasat is crafted to feel like an authentic Indian heirloom—warm, tactile, and honoring millennia of artistic mastery.',
    socials: {
      github: 'https://github.com/amitesh-kumar-shukla',
      linkedin: 'https://linkedin.com/in/amitesh-shukla',
      email: 'mailto:amitesh.shukla@viraasat.in'
    }
  },
  {
    id: 'shreya-tripathi',
    name: 'Shreya Tripathi',
    role: 'Cultural Research & Provenance Specialist',
    division: 'GI Ontologies & Community Outreach',
    avatarText: 'ST',
    icon: Compass,
    badge: 'Core Specialist',
    bio: 'Curated the historical Geographical Indication (GI) registries, built the interactive Cultural Knowledge Graph mapping regional craft lineages, and fostered direct relationships with master artisan cooperatives across India.',
    focus: [
      'GI Craft Lineage & Ontologies',
      'Cultural Knowledge Graph',
      'Artisan Guild Partnerships',
      'SHA-256 Provenance Ledger'
    ],
    quote: 'Behind every motif, weave, and dye lies an unbroken lineage of master creators. Our mission is to preserve their living heritage for generations.',
    socials: {
      github: 'https://github.com/shreya-tripathi',
      linkedin: 'https://linkedin.com/in/shreya-tripathi',
      email: 'mailto:shreya.tripathi@viraasat.in'
    }
  }
];

interface AboutTeamSectionProps {
  id?: string;
  className?: string;
  showHeader?: boolean;
}

export function AboutTeamSection({
  id = 'about-us',
  className,
  showHeader = true
}: AboutTeamSectionProps) {
  const headMember = TEAM_MEMBERS.find((m) => m.isHead) || TEAM_MEMBERS[0];
  const coreMembers = TEAM_MEMBERS.filter((m) => !m.isHead);

  return (
    <section
      id={id}
      aria-label="About Us - Founding Team"
      className={cn(
        'py-20 md:py-28 bg-[#FAF7F2] text-[#221C18] border-b border-[#E8DCCB] relative overflow-hidden',
        className
      )}
    >
      {/* Artisanal Heritage Decorative Accents */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#C59B4B] to-transparent opacity-60" />
      <div className="absolute inset-0 opacity-[0.03] clay-texture pointer-events-none" />

      <div className="max-w-[1680px] w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 relative z-10">
        {/* Section Header */}
        {showHeader && (
          <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#701D24]/10 border border-[#701D24]/20 text-[#701D24] text-xs font-semibold uppercase tracking-widest mb-4">
              <Sparkles className="w-3.5 h-3.5 text-[#C59B4B]" />
              <span>Founding Team & Architects</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#221C18] tracking-tight">
              Guardians of Indian Heritage & Artisanal Intelligence
            </h2>
            <div className="w-24 h-0.5 bg-[#C59B4B] mx-auto my-6" />
            <p className="text-[#5E2C18]/80 text-base sm:text-lg leading-relaxed font-sans">
              Meet the 5 multidisciplinary builders uniting ancestral Indian handicraft traditions with
              predictive machine learning, cryptographically certified provenance, and fair-wage digital dignity.
            </p>
          </div>
        )}

        {/* ================= 1. FEATURED TEAM HEAD: ARPIT TIWARI ================= */}
        <div className="mb-14 max-w-5xl mx-auto">
          <div className="bg-[#FAF7F2] rounded-3xl p-6 sm:p-8 md:p-10 border-2 border-[#C59B4B] shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
            {/* Top Royal Watermark Pill */}
            <div className="absolute top-0 right-0 bg-gradient-to-l from-[#701D24] to-[#8C2B2B] text-[#FAF7F2] px-6 py-2 rounded-bl-2xl text-[11px] font-bold uppercase tracking-widest shadow-md flex items-center gap-2">
              <Crown className="w-4 h-4 text-[#C59B4B]" />
              <span>Team Lead & Chief Architect</span>
            </div>

            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 mt-4 lg:mt-0">
              {/* Artisanal Monogram Medallion */}
              <div className="relative shrink-0">
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br from-[#701D24] to-[#5E2C18] p-1.5 shadow-2xl flex items-center justify-center border-4 border-[#C59B4B]">
                  <div className="w-full h-full rounded-full bg-[#FAF7F2] flex flex-col items-center justify-center text-center p-2 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[#C59B4B]/10 opacity-60" />
                    <span className="font-serif text-3xl sm:text-4xl font-bold text-[#701D24] tracking-wider relative z-10">
                      {headMember.avatarText}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest font-mono text-[#5E2C18] font-semibold relative z-10">
                      Viraasat
                    </span>
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-1 bg-[#C59B4B] text-[#221C18] p-2 rounded-full shadow-lg border-2 border-[#FAF7F2]">
                  <Crown className="w-5 h-5" />
                </div>
              </div>

              {/* Head Member Details */}
              <div className="flex-1 text-center lg:text-left">
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-2">
                  <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#221C18]">
                    {headMember.name}
                  </h3>
                  <Badge className="bg-[#701D24] text-[#FAF7F2] hover:bg-[#8C2B2B] text-xs px-3 py-1 font-semibold uppercase tracking-wider">
                    {headMember.badge}
                  </Badge>
                </div>

                <div className="text-sm font-medium text-[#701D24] uppercase tracking-wider mb-1 font-sans">
                  {headMember.role}
                </div>
                <div className="text-xs font-mono text-[#5E2C18]/70 mb-4">
                  Division: {headMember.division}
                </div>

                <p className="text-sm sm:text-base text-[#221C18]/85 leading-relaxed mb-6 font-sans">
                  {headMember.bio}
                </p>

                {/* Focus Badges */}
                <div className="mb-6">
                  <span className="text-xs uppercase tracking-wider font-bold text-[#5E2C18] block mb-2">
                    Core Architectural Focus:
                  </span>
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                    {headMember.focus.map((item) => (
                      <span
                        key={item}
                        className="text-xs bg-[#F3EDE2] border border-[#E8DCCB] text-[#5E2C18] px-3 py-1 rounded-full font-medium"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Quote & Socials */}
                <div className="pt-4 border-t border-[#E8DCCB] flex flex-col sm:flex-row items-center justify-between gap-4">
                  <blockquote className="font-serif italic text-xs sm:text-sm text-[#701D24] text-center sm:text-left max-w-xl">
                    &ldquo;{headMember.quote}&rdquo;
                  </blockquote>

                  {/* Accessible touch-friendly social buttons (>=44x44px) */}
                  <div className="flex items-center space-x-2 shrink-0">
                    {headMember.socials.github && (
                      <a
                        href={headMember.socials.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-11 h-11 rounded-full bg-[#F3EDE2] border border-[#E8DCCB] text-[#5E2C18] hover:text-[#FAF7F2] hover:bg-[#701D24] hover:border-[#701D24] flex items-center justify-center transition-all duration-200 cursor-pointer shadow-sm"
                        title={`${headMember.name} GitHub`}
                        aria-label={`${headMember.name} GitHub profile`}
                      >
                        <Github className="w-5 h-5" />
                      </a>
                    )}
                    {headMember.socials.linkedin && (
                      <a
                        href={headMember.socials.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-11 h-11 rounded-full bg-[#F3EDE2] border border-[#E8DCCB] text-[#5E2C18] hover:text-[#FAF7F2] hover:bg-[#701D24] hover:border-[#701D24] flex items-center justify-center transition-all duration-200 cursor-pointer shadow-sm"
                        title={`${headMember.name} LinkedIn`}
                        aria-label={`${headMember.name} LinkedIn profile`}
                      >
                        <Linkedin className="w-5 h-5" />
                      </a>
                    )}
                    {headMember.socials.email && (
                      <a
                        href={headMember.socials.email}
                        className="w-11 h-11 rounded-full bg-[#F3EDE2] border border-[#E8DCCB] text-[#5E2C18] hover:text-[#FAF7F2] hover:bg-[#701D24] hover:border-[#701D24] flex items-center justify-center transition-all duration-200 cursor-pointer shadow-sm"
                        title={`Email ${headMember.name}`}
                        aria-label={`Email ${headMember.name}`}
                      >
                        <Mail className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= 2. THE 4 CORE SPECIALISTS & CO-ARCHITECTS ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {coreMembers.map((member) => {
            const IconComponent = member.icon;
            return (
              <div
                key={member.id}
                className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E8DCCB] shadow-sm hover:border-[#C59B4B] hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative"
              >
                {/* Decorative Top Accent */}
                <div className="absolute top-0 inset-x-6 h-1 bg-gradient-to-r from-transparent via-[#C59B4B]/40 to-transparent group-hover:via-[#C59B4B] transition-colors" />

                <div>
                  {/* Monogram Medallion */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FAF7F2] to-[#F3EDE2] border-2 border-[#C59B4B] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
                        <span className="font-serif text-xl font-bold text-[#701D24]">
                          {member.avatarText}
                        </span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-[#701D24] text-white p-1 rounded-full border border-white">
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-[#C59B4B]/40 text-[#5E2C18] text-[10px] uppercase tracking-wider font-semibold"
                    >
                      {member.badge}
                    </Badge>
                  </div>

                  {/* Title & Name */}
                  <h4 className="font-serif text-xl font-bold text-[#221C18] group-hover:text-[#701D24] transition-colors">
                    {member.name}
                  </h4>
                  <div className="text-xs font-semibold text-[#701D24] uppercase tracking-wider mt-1 mb-0.5">
                    {member.role}
                  </div>
                  <div className="text-[11px] font-mono text-[#5E2C18]/65 mb-4">
                    {member.division}
                  </div>

                  <p className="text-xs text-[#221C18]/75 leading-relaxed mb-5 font-sans">
                    {member.bio}
                  </p>

                  {/* Focus Badges */}
                  <div className="mb-5">
                    <span className="text-[10px] uppercase font-bold text-[#5E2C18] tracking-wider block mb-2">
                      Key Contributions:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {member.focus.map((item) => (
                        <span
                          key={item}
                          className="text-[11px] bg-[#FAF7F2] border border-[#E8DCCB] text-[#5E2C18] px-2.5 py-0.5 rounded-full font-medium"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer with Quote & Socials */}
                <div className="pt-4 border-t border-[#E8DCCB]/80 mt-auto">
                  <p className="font-serif italic text-xs text-[#701D24] mb-4 line-clamp-3">
                    &ldquo;{member.quote}&rdquo;
                  </p>

                  <div className="flex items-center justify-end space-x-2">
                    {member.socials.github && (
                      <a
                        href={member.socials.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-11 h-11 rounded-full bg-[#FAF7F2] border border-[#E8DCCB] text-[#5E2C18] hover:text-[#FAF7F2] hover:bg-[#701D24] hover:border-[#701D24] flex items-center justify-center transition-colors cursor-pointer shadow-sm"
                        title={`${member.name} GitHub`}
                        aria-label={`${member.name} GitHub profile`}
                      >
                        <Github className="w-4 h-4" />
                      </a>
                    )}
                    {member.socials.linkedin && (
                      <a
                        href={member.socials.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-11 h-11 rounded-full bg-[#FAF7F2] border border-[#E8DCCB] text-[#5E2C18] hover:text-[#FAF7F2] hover:bg-[#701D24] hover:border-[#701D24] flex items-center justify-center transition-colors cursor-pointer shadow-sm"
                        title={`${member.name} LinkedIn`}
                        aria-label={`${member.name} LinkedIn profile`}
                      >
                        <Linkedin className="w-4 h-4" />
                      </a>
                    )}
                    {member.socials.email && (
                      <a
                        href={member.socials.email}
                        className="w-11 h-11 rounded-full bg-[#FAF7F2] border border-[#E8DCCB] text-[#5E2C18] hover:text-[#FAF7F2] hover:bg-[#701D24] hover:border-[#701D24] flex items-center justify-center transition-colors cursor-pointer shadow-sm"
                        title={`Email ${member.name}`}
                        aria-label={`Email ${member.name}`}
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ================= 3. COLLECTIVE HERITAGE & TECH IMPACT BANNER ================= */}
        <div className="mt-16 bg-[#221C18] text-[#FAF7F2] rounded-3xl p-8 sm:p-10 border-2 border-[#C59B4B] shadow-2xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#C59B4B]/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-[#701D24]/20 rounded-full blur-2xl pointer-events-none" />

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8 text-center relative z-10">
            <div className="space-y-1">
              <div className="font-serif text-3xl sm:text-4xl font-bold text-[#E8CA82]">5</div>
              <div className="text-xs uppercase tracking-wider text-stone-300 font-medium">Founding Builders</div>
              <div className="text-[10px] text-stone-500 font-mono">Cross-Disciplinary Team</div>
            </div>

            <div className="space-y-1">
              <div className="font-serif text-3xl sm:text-4xl font-bold text-[#E8CA82]">7</div>
              <div className="text-xs uppercase tracking-wider text-stone-300 font-medium">Live ML Models</div>
              <div className="text-[10px] text-stone-500 font-mono">Pricing, Recs, Fraud, Forecaster</div>
            </div>

            <div className="space-y-1">
              <div className="font-serif text-3xl sm:text-4xl font-bold text-[#E8CA82]">13</div>
              <div className="text-xs uppercase tracking-wider text-stone-300 font-medium">Indian Languages</div>
              <div className="text-[10px] text-stone-500 font-mono">Reactive Localization Engine</div>
            </div>

            <div className="space-y-1">
              <div className="font-serif text-3xl sm:text-4xl font-bold text-[#E8CA82]">35+</div>
              <div className="text-xs uppercase tracking-wider text-stone-300 font-medium">GI Crafts Mapped</div>
              <div className="text-[10px] text-stone-500 font-mono">Knowledge Graph & Lineages</div>
            </div>

            <div className="col-span-2 sm:col-span-1 space-y-1">
              <div className="font-serif text-3xl sm:text-4xl font-bold text-[#E8CA82]">100%</div>
              <div className="text-xs uppercase tracking-wider text-stone-300 font-medium">Cryptographic Ledger</div>
              <div className="text-[10px] text-stone-500 font-mono">SHA-256 Provenance Chain</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutTeamSection;


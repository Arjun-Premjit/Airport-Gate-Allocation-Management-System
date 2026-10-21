import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import {
  ArrowRight,
  Plane,
  Clock,
  Mail,
  Phone,
  CheckCircle2,
  AlertTriangle,
  SlidersHorizontal,
  ArrowUpRight
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface DemoGate {
  id: string;
  name: string;
  status: 'Allocated' | 'Available' | 'Reserved' | 'Maintenance' | 'Closed';
  flight?: string;
  airline?: string;
  aircraft?: string;
  timeWindow?: string;
  notes?: string;
  concourse: string;
  wingspanLimit: string;
}

const initialGates: DemoGate[] = [
  {
    id: 'G14',
    name: 'Gate G14',
    status: 'Allocated',
    flight: 'DL404',
    airline: 'Delta Air Lines',
    aircraft: 'Boeing 767-300ER',
    timeWindow: '14:00 – 16:00',
    concourse: 'Concourse G',
    wingspanLimit: '47.6m (Wide-body Compatible)'
  },
  {
    id: 'G03',
    name: 'Gate G03',
    status: 'Maintenance',
    notes: 'Jet Bridge Motor Overhaul',
    timeWindow: 'Active Servicing Window',
    concourse: 'Concourse G',
    wingspanLimit: '52.0m (Mechanically Isolated)'
  },
  {
    id: 'G05',
    name: 'Gate G05',
    status: 'Available',
    notes: 'Stand Cleared & Inspected',
    timeWindow: 'Ready for Immediate Assignment',
    concourse: 'Concourse G',
    wingspanLimit: '60.3m (Heavy / Super Fit)'
  },
  {
    id: 'G08',
    name: 'Gate G08',
    status: 'Allocated',
    flight: 'BA177',
    airline: 'British Airways',
    aircraft: 'Boeing 777-200',
    timeWindow: '16:15 – 18:00',
    concourse: 'Concourse G',
    wingspanLimit: '60.9m (Wide-body Compatible)'
  },
  {
    id: 'G12',
    name: 'Gate G12',
    status: 'Reserved',
    flight: 'AI202',
    airline: 'Air India',
    aircraft: 'Boeing 787-9',
    timeWindow: '18:30 – 20:00',
    concourse: 'Concourse G',
    wingspanLimit: '60.1m (Wide-body Compatible)'
  },
  {
    id: 'G01',
    name: 'Gate G01',
    status: 'Closed',
    notes: 'Tarmac Resurfacing Work',
    timeWindow: 'Scheduled Reopening 06:00 UTC',
    concourse: 'Concourse G',
    wingspanLimit: '36.0m (Narrow-body Stand)'
  }
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  const heroSectionRef = useRef<HTMLElement>(null);
  const gateLandingRef = useRef<HTMLElement>(null);

  // Scroll state for transparent glassmorphic header adaptation
  const [isScrolled, setIsScrolled] = useState(false);

  // Gate Slide Interactive State
  const [selectedGate, setSelectedGate] = useState<DemoGate>(initialGates[0]);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [allocationFlight, setAllocationFlight] = useState('DL404');
  const [allocationGate, setAllocationGate] = useState('G14');
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isReducedMotion, setIsReducedMotion] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = (event: MediaQueryListEvent) =>
      setIsReducedMotion(event.matches);
    mediaQuery.addEventListener('change', handleMotionChange);

    return () => {
      mediaQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  useEffect(() => {
    const handleWindowScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleWindowScroll);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const heroSection = heroSectionRef.current;
    const gateLandingSection = gateLandingRef.current;
    if (!root || !heroSection || isReducedMotion) return;

    // Smooth scroll provider using Lenis
    const lenis = new Lenis({
      duration: 0.85,
      easing: (time) => Math.min(1, 1.001 - Math.pow(2, -10 * time)),
      smoothWheel: true
    });
    const updateLenis = (time: number) => lenis.raf(time * 1000);
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(updateLenis);

    const ctx = gsap.context(() => {
      // 1. Initial Page Load - Airplane Entry Swoop
      gsap.fromTo(
        '.plane-element',
        { yPercent: 80, xPercent: -80, rotate: -8, scale: 0.9 },
        { yPercent: 0, xPercent: 0, rotate: 0, scale: 1, duration: 2.2, ease: 'power2.out' }
      );

      // 2. Hero Transition: Airplane Glides Down, Banks, and Transitions Completely Out of the Frame
      const heroTimeline = gsap.timeline({
        defaults: { ease: 'power1.inOut' },
        scrollTrigger: {
          trigger: heroSection,
          start: 'top top',
          end: '+=140%',
          scrub: 0.8,
          pin: true,
          anticipatePin: 1,
          refreshPriority: 1,
          invalidateOnRefresh: true
        }
      });

      heroTimeline
        .to('.intro-content', { autoAlpha: 0, yPercent: -40, duration: 0.4 })
        .to(
          '.clouds-container',
          { autoAlpha: 0, yPercent: -35, duration: 0.8 },
          '<'
        )
        .fromTo(
          '.plane-element',
          { yPercent: 0, xPercent: 0, rotate: 0, scale: 1, autoAlpha: 1 },
          {
            yPercent: 175,   // Moves completely down out of the frame
            xPercent: 85,    // Swoops diagonally across
            rotate: 16,      // Natural bank angle
            scale: 2.35,     // Zooming large as it rushes past camera
            autoAlpha: 0,    // Fully exits the frame boundary
            duration: 1.2,
            ease: 'power2.in'
          },
          '<-0.1'
        );

      // 3. Gate Landing Section: Real-life Transition to Airplane Landed Inside Gate / Hangar Stand
      if (gateLandingSection) {
        const landingImage = gateLandingSection.querySelector<HTMLElement>('.gate-landing-image');
        const landingBadge = gateLandingSection.querySelector<HTMLElement>('.gate-landing-badge');
        const landingTitle = gateLandingSection.querySelector<HTMLElement>('.gate-landing-title');
        const landingDesc = gateLandingSection.querySelector<HTMLElement>('.gate-landing-desc');
        const landingCta = gateLandingSection.querySelector<HTMLElement>('.gate-landing-cta');
        const telemetryChips = gateLandingSection.querySelectorAll<HTMLElement>('.telemetry-chip');

        // Pinned full-viewport gate slide presentation
        const gateSlideTimeline = gsap.timeline({
          scrollTrigger: {
            trigger: gateLandingSection,
            start: 'top top',
            end: '+=120%',
            pin: true,
            scrub: 0.8,
            anticipatePin: 1
          }
        });

        // Cinematic zoom-in as aircraft settles into the gate stand
        if (landingImage) {
          gateSlideTimeline.fromTo(
            landingImage,
            { scale: 1.15, filter: 'brightness(0.92)' },
            { scale: 1.0, filter: 'brightness(1.0)', duration: 1.0, ease: 'power2.out' },
            0
          );
        }

        // Staggered presentation of the gate landing title, badge & dispatch controls
        const elementsToReveal = [landingBadge, landingTitle, landingDesc, landingCta].filter(Boolean);
        if (elementsToReveal.length > 0) {
          gateSlideTimeline.fromTo(
            elementsToReveal,
            { autoAlpha: 0, y: 40 },
            { autoAlpha: 1, y: 0, stagger: 0.12, duration: 0.8, ease: 'power2.out' },
            0.15
          );
        }

        // Live telemetry chips pop in with active indicators
        if (telemetryChips.length > 0) {
          gateSlideTimeline.fromTo(
            telemetryChips,
            { autoAlpha: 0, scale: 0.85, y: 20 },
            { autoAlpha: 1, scale: 1, y: 0, stagger: 0.1, duration: 0.6, ease: 'back.out(1.5)' },
            0.45
          );
        }
      }

      // 4. Stand Matrix Section Scroll Reveals
      gsap.utils.toArray<HTMLElement>('[data-scroll-reveal]', root).forEach((el) => {
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 30 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 85%', once: true }
          }
        );
      });

      // 5. Staggered Core Pillars Reveal
      gsap.utils.toArray<HTMLElement>('[data-scroll-stagger]', root).forEach((container) => {
        gsap.fromTo(
          Array.from(container.children),
          { autoAlpha: 0, y: 24 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.12,
            ease: 'power2.out',
            scrollTrigger: { trigger: container, start: 'top 88%', once: true }
          }
        );
      });

      // 6. Footer slide-up reveal
      const footer = root.querySelector<HTMLElement>('[data-footer-reveal]');
      if (footer) {
        gsap.fromTo(
          footer,
          { autoAlpha: 0, y: 40 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 1,
            ease: 'power2.out',
            scrollTrigger: { trigger: footer, start: 'top 90%', once: true }
          }
        );
      }
    }, root);

    ScrollTrigger.refresh();

    return () => {
      gsap.ticker.remove(updateLenis);
      lenis.destroy();
      ctx.revert();
    };
  }, [isReducedMotion]);

  const handleTestAllocation = () => {
    setConflictMessage(null);
    setSuccessMessage(null);

    if (allocationGate === 'G03') {
      setConflictMessage(
        'MAINTENANCE ISOLATION LOCK: Gate G03 is actively isolated under Jet Bridge Motor Overhaul. Allocations mechanically blocked.'
      );
      return;
    }

    if (allocationGate === 'G01') {
      setConflictMessage(
        'STAND CLOSED: Gate G01 is undergoing scheduled tarmac resurfacing. Allocation prohibited.'
      );
      return;
    }

    if (allocationGate === 'G14' && allocationFlight === 'AI202') {
      setConflictMessage(
        'TEMPORAL CONFLICT DETECTED: Gate G14 is already allocated to Flight DL404 (14:00 - 16:00). Invariant prohibits overlapping stands.'
      );
      return;
    }

    if (allocationGate === 'G08' && allocationFlight === 'DL404') {
      setConflictMessage(
        'STAND OCCUPIED: Gate G08 is committed to Flight BA177 (16:15 - 18:00). Temporal clash identified.'
      );
      return;
    }

    setSuccessMessage(
      `ALLOCATION VALIDATED: Flight ${allocationFlight} successfully assigned to ${allocationGate}. 0 temporal conflicts identified across 16 tables.`
    );
  };

  const filteredGates = initialGates.filter((g) => {
    if (statusFilter === 'All') return true;
    return g.status.toLowerCase() === statusFilter.toLowerCase();
  });

  return (
    <div
      ref={rootRef}
      className="bg-[#F5F5F7] text-[#000000] min-h-screen font-sans selection:bg-[#0D98D1] selection:text-white"
    >
      {/* ─────────────────────────────────────────────────────────────
          HEADER — Transparent Glassmorphism (AGAMS Logo + Console Only)
      ───────────────────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 inset-x-0 z-50 flex h-[79px] items-center justify-between px-6 sm:px-10 md:px-16 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/25 backdrop-blur-2xl backdrop-saturate-200 border-b border-slate-900/10 shadow-xs'
            : 'bg-white/[0.06] backdrop-blur-md backdrop-saturate-150 border-b border-white/20'
        }`}
      >
        {/* AGAMS Brandmark */}
        <a
          href="/"
          className="inline-flex items-center gap-3.5 group text-[#000000] no-underline"
        >
          <div className="h-10 w-10 rounded-lg bg-[#0A2540] flex items-center justify-center text-white shadow-sm border border-slate-700/40 shrink-0">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-5 h-5 text-[#0D98D1]"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2v20M2 12h20" stroke="#0D98D1" strokeWidth="2.2" />
              <circle cx="12" cy="12" r="3.5" fill="#0D98D1" />
              <path
                d="M5 5l14 14M19 5L5 19"
                stroke="#0D98D1"
                strokeWidth="1.2"
                strokeOpacity="0.4"
              />
            </svg>
          </div>
          <div className="flex flex-col border-l border-black/15 pl-3.5 leading-none">
            <span className="text-xl font-bold tracking-tight text-slate-900 font-display">
              AGAMS
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#0D98D1] font-mono mt-1">
              Gate Operations
            </span>
          </div>
        </a>

        {/* Single Right Action — Operations Console */}
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm sm:text-base font-bold transition-all bg-[#0D98D1] text-white hover:bg-[#0B84B7] px-5 sm:px-6 py-2.5 shadow-sm hover:shadow"
        >
          <span>Operations Console</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          SECTION B: PINNED HERO — Cruising Flight to Descent Approach
      ───────────────────────────────────────────────────────────── */}
      <section
        ref={heroSectionRef}
        className="relative isolate min-h-screen w-full overflow-hidden bg-gradient-to-b from-[rgba(7,152,209,0.38)] via-[rgba(13,152,209,0.18)] to-white text-black pt-[79px]"
      >
        {/* Background Drift Clouds Layer */}
        <div className="clouds-container pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[65%] overflow-hidden opacity-90 select-none">
          <div className="clouds-animate-60 absolute top-[20%] left-0 flex h-full w-[200%]">
            <img
              src="/clouds-bg.webp"
              alt=""
              aria-hidden="true"
              className="h-full w-1/2 shrink-0 object-cover"
            />
            <img
              src="/clouds-bg.webp"
              alt=""
              aria-hidden="true"
              className="h-full w-1/2 shrink-0 object-cover"
            />
          </div>
          <div className="clouds-animate-30 absolute top-[45%] left-0 flex h-full w-[200%]">
            <img
              src="/clouds-bg.webp"
              alt=""
              aria-hidden="true"
              className="h-full w-1/2 shrink-0 object-cover"
            />
            <img
              src="/clouds-bg.webp"
              alt=""
              aria-hidden="true"
              className="h-full w-1/2 shrink-0 object-cover"
            />
          </div>
        </div>

        {/* Airplane Cruising Element */}
        <div className="plane-element pointer-events-none absolute top-[36%] left-0 z-[4] w-full will-change-[transform,opacity] md:top-1/4 md:left-1/3 md:w-[68%] max-w-[1150px] select-none">
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            poster="/plane-poster.png"
            className="w-full h-auto object-contain"
          >
            <source src="/hero-plane.webm" type="video/webm" />
          </video>
        </div>

        {/* HERO INTRO CONTENT */}
        <div className="intro-content absolute top-[79px] left-0 z-[5] h-[calc(100%-79px)] max-w-2xl px-6 pt-[8vmin] sm:px-12 md:w-[58%] xl:px-16 flex items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-700">
              <span className="h-px w-8 bg-[#0D98D1]" />
              <span>Next‑Gen Gate Management Platform</span>
            </div>

            <h1 className="text-[clamp(2.5rem,5.5vw,4.5rem)] font-light leading-[1] tracking-[-2px] text-pretty text-black font-display">
              Precision{' '}
              <span className="animate-agams-wave text-[#0D98D1] font-semibold">
                Gate Control
              </span>
            </h1>

            <p className="max-w-xl text-lg sm:text-xl font-medium leading-relaxed text-slate-700">
              Seamless, conflict‑free gate allocations powered by deterministic algorithms and real‑time airport telemetry across every terminal.
            </p>

            <div className="pt-2 flex flex-wrap gap-4">
              <button
                onClick={() => {
                  const el = gateLandingRef.current;
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full text-lg font-bold bg-[#0D98D1] text-white hover:bg-[#0B84B7] px-8 py-3.5 transition-all shadow-sm hover:shadow"
              >
                <span>Follow Gate Landing</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION C: TRANSITION FRAME — Aircraft Docked Inside Gate Stand
          Recreated real-life transition with AGAMS operational theme
      ───────────────────────────────────────────────────────────── */}
      <section
        ref={gateLandingRef}
        className="relative isolate min-h-screen h-screen w-full overflow-hidden flex items-center bg-[#F5F5F7] border-t border-black/10"
      >
        {/* Full-width Gate / Hangar Stand Backdrop Plate */}
        <div className="absolute inset-0 z-0 overflow-hidden select-none pointer-events-none">
          <img
            src="/gate-landing-frame.jpg"
            alt="Aircraft docked inside terminal gate stand and maintenance bay"
            className="gate-landing-image w-full h-full object-cover object-center filter brightness-[0.98]"
          />
          {/* Subtle directional vignette for text contrast on the left side */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-transparent z-[1] w-full md:w-[65%]" />
        </div>

        {/* Content Overlay matching the composition of the reference frame */}
        <div className="relative z-10 max-w-3xl px-6 sm:px-12 md:px-16 lg:px-20 py-24 space-y-6">
          {/* Delivering Certainty Equivalent -> Invariant Stand Dispatch */}
          <div className="gate-landing-badge inline-flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.18em] text-[#0D98D1]">
            <svg viewBox="0 0 11 11" fill="currentColor" className="w-3.5 h-3.5 text-[#0D98D1]">
              <path d="M.715.5h10v10H5.488V5.753H.715V.5Z" />
            </svg>
            <span className="text-slate-900 font-extrabold tracking-widest">
              TERMINAL OPERATIONS // STAND DISPATCH
            </span>
          </div>

          {/* Heading matching Materials & Logistics Management layout */}
          <h2 className="gate-landing-title text-[clamp(2.5rem,5vw,4.5rem)] font-bold leading-[1.04] tracking-[-1.5px] text-slate-950 font-display">
            Terminal Stand &amp; Gate Management
          </h2>

          {/* Subtitle description */}
          <p className="gate-landing-desc max-w-xl text-lg sm:text-xl font-medium leading-relaxed text-slate-800">
            Real‑time conflict‑free stand allocations, automated jet bridge alignment verification, and deterministic apron turnaround orchestration.
          </p>

          {/* High-visibility Pill Button */}
          <div className="gate-landing-cta pt-3 flex flex-wrap items-center gap-4">
            <button
              onClick={() => {
                const el = document.getElementById('gate-workspace');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center justify-center gap-2.5 rounded-full text-base sm:text-lg font-bold bg-[#0D98D1] text-white hover:bg-[#0B84B7] px-8 py-3.5 transition-all shadow-md hover:shadow-lg"
            >
              <span>Explore Stand Matrix</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => navigate('/allocations')}
              className="inline-flex items-center justify-center gap-2 rounded-full text-base sm:text-lg font-bold bg-white/80 hover:bg-white text-slate-900 border border-black/15 px-7 py-3.5 transition-all shadow-xs"
            >
              <span>Allocation Console</span>
            </button>
          </div>

          {/* Live Operational Badges on the Frame */}
          <div className="pt-6 flex flex-wrap items-center gap-3 font-mono text-xs">
            <div className="telemetry-chip inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-black/10 shadow-xs text-slate-800 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Stand G14 // Active Dock</span>
            </div>

            <div className="telemetry-chip inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-black/10 shadow-xs text-slate-800 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Zero-Overlap Invariant Active</span>
            </div>

            <div className="telemetry-chip inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-black/10 shadow-xs text-slate-700 font-semibold">
              <span>Centerline Alignment 100%</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION D: INTERACTIVE GATE ALLOCATION WORKSPACE
      ───────────────────────────────────────────────────────────── */}
      <section
        id="gate-workspace"
        data-gate-slide
        className="relative isolate w-full bg-[#F5F5F7] py-20 px-6 sm:px-12 md:px-16 border-t border-black/10 overflow-hidden"
      >
        <div className="relative z-10 max-w-7xl mx-auto space-y-10">
          {/* Section Header */}
          <div data-scroll-reveal className="space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#0D98D1]">
              <svg viewBox="0 0 11 11" fill="currentColor" className="w-3.5 h-3.5 text-[#0D98D1]">
                <path d="M.715.5h10v10H5.488V5.753H.715V.5Z" />
              </svg>
              <span>Conflict‑Free Allocation Engine</span>
            </div>

            <h2 className="text-4xl sm:text-5xl font-light text-slate-900 tracking-[-2px] leading-[1.08] font-display">
              Live Stand{' '}
              <span className="text-[#0D98D1] font-semibold">Matrix</span>
            </h2>

            <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed">
              Interactive gate workspace with real‑time status tracking, overlap detection, and one‑click allocation verification across all concourse stands.
            </p>
          </div>

          {/* Interactive Gate Workspace Card */}
          <div data-scroll-reveal className="border border-black/10 bg-white p-8 sm:p-10 shadow-xl space-y-8 rounded-none">
            {/* Header Telemetry Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-5">
              <div className="flex items-center gap-3 font-mono text-sm">
                <span className="font-bold text-slate-900">STATION: DUBAI INTERNATIONAL (DXB)</span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-600 font-medium">TERMINAL 2 • CONCOURSE G</span>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
                {['All', 'Available', 'Allocated', 'Reserved', 'Maintenance', 'Closed'].map(
                  (tab) => (
                    <button
                      key={tab}
                      onClick={() => setStatusFilter(tab)}
                      className={`px-3 py-1 font-semibold transition-all ${
                        statusFilter.toLowerCase() === tab.toLowerCase()
                          ? 'bg-[#0D98D1] text-white shadow-sm'
                          : 'bg-[#F5F5F7] text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {tab}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Stand Matrix Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredGates.map((gate) => {
                const isSelected = selectedGate.id === gate.id;
                let badgeClass = '';
                if (gate.status === 'Allocated')
                  badgeClass = 'border-blue-200 bg-blue-50 text-blue-700';
                else if (gate.status === 'Available')
                  badgeClass = 'border-emerald-200 bg-emerald-50 text-emerald-700';
                else if (gate.status === 'Reserved')
                  badgeClass = 'border-amber-200 bg-amber-50 text-amber-700';
                else if (gate.status === 'Maintenance')
                  badgeClass = 'border-red-200 bg-red-50 text-red-700';
                else badgeClass = 'border-slate-200 bg-slate-100 text-slate-600';

                return (
                  <div
                    key={gate.id}
                    onClick={() => setSelectedGate(gate)}
                    className={`p-5 border cursor-pointer transition-all space-y-3 ${
                      isSelected
                        ? 'border-[#0D98D1] bg-sky-50/50 shadow-md ring-1 ring-[#0D98D1]'
                        : 'border-black/10 bg-[#F5F5F7] hover:border-slate-400 hover:bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-baseline">
                      <span className="font-mono font-bold text-slate-900 text-base">
                        {gate.name}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 border text-xs font-bold uppercase font-mono rounded-full ${badgeClass}`}
                      >
                        {gate.status}
                      </span>
                    </div>

                    {gate.flight ? (
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          Flight {gate.flight} • {gate.airline}
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">
                          {gate.aircraft} • {gate.timeWindow}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          {gate.notes}
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">
                          {gate.timeWindow}
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t border-black/5 flex items-center justify-between text-[11px] font-mono text-slate-500">
                      <span>{gate.wingspanLimit}</span>
                      <span className="text-[#0D98D1] font-bold">Select Stand ⌵</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Gate Inspector */}
            <div className="p-6 border border-black/10 bg-slate-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold font-mono text-slate-500 uppercase">
                  <span>Selected Stand Telemetry</span>
                  <span>•</span>
                  <span className="text-[#0D98D1]">{selectedGate.name}</span>
                </div>
                <div className="text-base font-bold text-slate-900">
                  {selectedGate.flight
                    ? `Active Assignment: Flight ${selectedGate.flight} (${selectedGate.aircraft})`
                    : `Stand Condition: ${selectedGate.notes || selectedGate.status}`}
                </div>
                <div className="text-xs text-slate-600 font-mono">
                  Location: {selectedGate.concourse} | Limit: {selectedGate.wingspanLimit} | Window: {selectedGate.timeWindow}
                </div>
              </div>

              {/* Conflict Test Controls */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <select
                    value={allocationFlight}
                    onChange={(e) => setAllocationFlight(e.target.value)}
                    className="border border-black/15 bg-white px-3 py-2 text-xs font-mono font-bold text-slate-800"
                  >
                    <option value="DL404">Flight DL404 (B767)</option>
                    <option value="AI202">Flight AI202 (B789)</option>
                    <option value="BA177">Flight BA177 (B772)</option>
                  </select>

                  <select
                    value={allocationGate}
                    onChange={(e) => setAllocationGate(e.target.value)}
                    className="border border-black/15 bg-white px-3 py-2 text-xs font-mono font-bold text-slate-800"
                  >
                    <option value="G14">Gate G14</option>
                    <option value="G05">Gate G05</option>
                    <option value="G03">Gate G03 (Maint)</option>
                    <option value="G08">Gate G08</option>
                    <option value="G12">Gate G12</option>
                    <option value="G01">Gate G01 (Closed)</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleTestAllocation}
                  className="px-5 py-2 text-xs font-bold font-mono uppercase bg-[#0D98D1] text-white hover:bg-[#0B84B7] transition-all shadow-sm"
                >
                  Verify Allocation
                </button>
              </div>
            </div>

            {/* Invariant Engine Output Messages */}
            {conflictMessage && (
              <div className="p-4 border border-red-300 bg-red-50 text-red-800 flex items-start gap-3 text-xs font-mono">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">INVARIANT CONSTRAINT ENFORCED</div>
                  <div className="mt-1">{conflictMessage}</div>
                </div>
              </div>
            )}

            {successMessage && (
              <div className="p-4 border border-emerald-300 bg-emerald-50 text-emerald-800 flex items-start gap-3 text-xs font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">CONFLICT‑FREE GUARANTEE</div>
                  <div className="mt-1">{successMessage}</div>
                </div>
              </div>
            )}

            {/* Bottom Metrics Bar */}
            <div className="pt-4 border-t border-black/10 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
              <div className="flex flex-wrap items-center gap-6 text-slate-600">
                <span className="flex items-center gap-1.5 font-bold text-slate-900">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  0 Gate Overlaps
                </span>
                <span>•</span>
                <span className="font-bold text-slate-900">100% Pre-Allocated</span>
                <span>•</span>
                <span className="font-bold text-[#0D98D1]">16 Relational Tables Active</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/allocations')}
                  className="inline-flex items-center gap-2 rounded-full font-bold text-sm bg-[#0D98D1] text-white hover:bg-[#0B84B7] px-6 py-2.5 transition-colors shadow-sm"
                >
                  <span>Launch Allocation Board</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate('/timeline')}
                  className="inline-flex items-center gap-2 rounded-full font-bold text-sm bg-white text-slate-900 border border-slate-300 hover:bg-slate-50 px-6 py-2.5 transition-colors shadow-sm"
                >
                  <span>24h Timeline</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION E: THREE CORE CAPABILITIES
      ───────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 sm:px-12 md:px-16 max-w-7xl mx-auto">
        {/* Section Header */}
        <div data-scroll-reveal className="mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#0D98D1]">
            <svg viewBox="0 0 11 11" fill="currentColor" className="w-3.5 h-3.5 text-[#0D98D1]">
              <path d="M.715.5h10v10H5.488V5.753H.715V.5Z" />
            </svg>
            <span>Engineered For Operational Excellence</span>
          </div>

          <h2 className="text-4xl sm:text-5xl font-light text-slate-900 tracking-[-2px] leading-[1.08] font-display">
            Built On{' '}
            <span className="animate-agams-wave text-[#0D98D1] font-semibold">
              Three
            </span>{' '}
            Core Pillars
          </h2>
        </div>

        {/* Three Pillar Cards */}
        <div data-scroll-stagger className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Pillar 1: Allocation Intelligence */}
          <div
            className="group relative flex flex-col justify-between overflow-hidden rounded-none border border-black/10 bg-white p-8 sm:p-10 transition-all hover:shadow-xl"
          >
            <div className="space-y-4">
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Allocation Intelligence
              </h3>
              <p className="text-base text-slate-600 font-medium leading-relaxed">
                Constraint‑aware scheduling that enforces wingspan compatibility, prevents temporal overlaps, and guarantees zero‑conflict gate assignments in real time.
              </p>
              <div className="pt-2">
                <a
                  href="/allocations"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/allocations');
                  }}
                  className="inline-flex items-center gap-2 text-base font-bold text-[#0D98D1] underline decoration-[#0D98D1] decoration-2 underline-offset-4 group-hover:text-[#0B84B7] transition-colors"
                >
                  <span>View Allocations</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#0D98D1]/10 text-[#0D98D1] font-mono text-xs font-bold uppercase tracking-wider">
                <Plane className="w-3.5 h-3.5" />
                <span>STAND // ENGINE</span>
              </div>

              <svg viewBox="0 0 100 100" fill="none" className="w-16 h-16 stroke-[#0D98D1] transition-transform group-hover:scale-105">
                <rect x="20" y="20" width="60" height="60" rx="4" strokeWidth="2" strokeDasharray="4 2" />
                <path d="M50 10v20M50 70v20M10 50h20M70 50h20" strokeWidth="2" />
                <circle cx="50" cy="50" r="14" strokeWidth="2" className="fill-[#0D98D1]/10" />
                <path d="M44 50h12M50 44v12" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Pillar 2: Maintenance Isolation */}
          <div
            className="group relative flex flex-col justify-between overflow-hidden rounded-none border border-black/10 bg-white p-8 sm:p-10 transition-all hover:shadow-xl"
          >
            <div className="space-y-4">
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Maintenance Isolation
              </h3>
              <p className="text-base text-slate-600 font-medium leading-relaxed">
                Automatic servicing locks that mechanically prevent allocations on stands undergoing jet bridge repair, tarmac resurfacing, or equipment calibration.
              </p>
              <div className="pt-2">
                <a
                  href="/gates"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/gates');
                  }}
                  className="inline-flex items-center gap-2 text-base font-bold text-[#913B31] underline decoration-[#913B31] decoration-2 underline-offset-4 group-hover:text-[#7A3129] transition-colors"
                >
                  <span>Inspect Gates</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#913B31]/10 text-[#913B31] font-mono text-xs font-bold uppercase tracking-wider">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>GATE // SAFETY</span>
              </div>

              <svg viewBox="0 0 100 100" fill="none" className="w-16 h-16 stroke-[#913B31] transition-transform group-hover:scale-105">
                <path d="M15 80h70M25 80V35l25-15 25 15v45" strokeWidth="2" />
                <path d="M40 50h20v30H40z" strokeWidth="2" className="fill-[#913B31]/10" />
                <circle cx="50" cy="20" r="5" strokeWidth="2" />
                <path d="M20 65h60" strokeWidth="1.5" strokeDasharray="3 3" />
              </svg>
            </div>
          </div>

          {/* Pillar 3: Operational Timeline */}
          <div
            className="group relative flex flex-col justify-between overflow-hidden rounded-none border border-black/10 bg-white p-8 sm:p-10 transition-all hover:shadow-xl"
          >
            <div className="space-y-4">
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Operational Timeline
              </h3>
              <p className="text-base text-slate-600 font-medium leading-relaxed">
                Unified 24‑hour gate timeline for station heads and ramp controllers. Track turnaround windows, monitor concourse utilisation, and audit every allocation.
              </p>
              <div className="pt-2">
                <a
                  href="/timeline"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/timeline');
                  }}
                  className="inline-flex items-center gap-2 text-base font-bold text-[#927438] underline decoration-[#927438] decoration-2 underline-offset-4 group-hover:text-[#7A612D] transition-colors"
                >
                  <span>Open Timeline</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#927438]/10 text-[#927438] font-mono text-xs font-bold uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5" />
                <span>DISPATCH // CONTROL</span>
              </div>

              <svg viewBox="0 0 100 100" fill="none" className="w-16 h-16 stroke-[#927438] transition-transform group-hover:scale-105">
                <circle cx="50" cy="50" r="38" strokeWidth="2" />
                <circle cx="50" cy="50" r="24" strokeWidth="1.5" strokeDasharray="4 2" />
                <circle cx="50" cy="50" r="10" strokeWidth="2" className="fill-[#927438]/10" />
                <path d="M50 12v76M12 50h76M50 50l26-26" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION F: FOOTER — Clean AGAMS Operations Footer
      ───────────────────────────────────────────────────────────── */}
      <footer data-footer-reveal className="relative overflow-hidden border-t border-black/10 bg-white px-6 sm:px-12 md:px-16 pt-[clamp(2.5rem,5vw,5rem)] pb-12">
        <div className="max-w-7xl mx-auto space-y-16">
          {/* Top Grid: Logo + 3 Navigation Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Col 1: Brand */}
            <div className="lg:col-span-5 space-y-4">
              <a href="/" className="inline-flex items-center gap-3 group text-[#000000] no-underline">
                <div className="h-10 w-10 rounded-lg bg-[#0A2540] flex items-center justify-center text-white shadow-sm border border-slate-700/40 shrink-0">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="w-5 h-5 text-[#0D98D1]"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2v20M2 12h20" stroke="#0D98D1" strokeWidth="2.2" />
                    <circle cx="12" cy="12" r="3.5" fill="#0D98D1" />
                    <path
                      d="M5 5l14 14M19 5L5 19"
                      stroke="#0D98D1"
                      strokeWidth="1.2"
                      strokeOpacity="0.4"
                    />
                  </svg>
                </div>
                <div className="flex flex-col border-l border-black/10 pl-3 leading-none">
                  <span className="text-lg font-bold tracking-tight text-slate-900 font-display">
                    AGAMS
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#0D98D1] font-mono mt-1">
                    GATE OPERATIONS
                  </span>
                </div>
              </a>
              <p className="text-sm text-slate-600 leading-relaxed max-w-sm font-medium">
                Airport Gate Allocation Management System — a conflict‑free, deterministic platform purpose‑built for modern aviation hub operations.
              </p>
            </div>

            {/* Col 2: Explore */}
            <div className="lg:col-span-2 space-y-4">
              <p className="text-base font-bold text-slate-900">Explore</p>
              <ul className="space-y-3 text-sm font-semibold text-slate-600">
                <li>
                  <button onClick={() => navigate('/dashboard')} className="hover:text-[#0D98D1] transition-colors">
                    Dashboard
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/allocations')} className="hover:text-[#0D98D1] transition-colors">
                    Gate Allocation
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/timeline')} className="hover:text-[#0D98D1] transition-colors">
                    Gate Timeline
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/flights')} className="hover:text-[#0D98D1] transition-colors">
                    Flight Manifest
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/gates')} className="hover:text-[#0D98D1] transition-colors">
                    Gate Inventory
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Operations */}
            <div className="lg:col-span-2 space-y-4">
              <p className="text-base font-bold text-slate-900">Operations</p>
              <ul className="space-y-3 text-sm font-semibold text-slate-600">
                <li>
                  <button onClick={() => navigate('/allocations')} className="hover:text-[#0D98D1] transition-colors">
                    Stand Matching
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/maintenance')} className="hover:text-[#0D98D1] transition-colors">
                    Maintenance Records
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/gates')} className="hover:text-[#0D98D1] transition-colors">
                    Gate Status Board
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/timeline')}
                    className="hover:text-[#0D98D1] transition-colors inline-flex items-center gap-1"
                  >
                    <span>24h Flight Timeline</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 4: Contact */}
            <div className="lg:col-span-3 space-y-4">
              <p className="text-base font-bold text-slate-900">Contact</p>
              <ul className="space-y-3 text-sm font-semibold text-slate-600">
                <li className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#0D98D1]" />
                  <a
                    href="mailto:ops@agams.aero"
                    className="hover:text-[#0D98D1] transition-colors"
                  >
                    ops@agams.aero
                  </a>
                </li>
                <li className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-[#0D98D1]" />
                  <span className="font-mono text-slate-600">DXB Ramp Dispatch: Ext 402</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-[#0D98D1]" />
                  <span className="font-mono">24/7 Duty Operations</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-6 border-t border-black/10 lg:flex lg:items-center lg:justify-between">
            {/* Telemetry Pill */}
            <div className="hidden lg:flex items-center gap-3 px-4 py-2.5 rounded-full border border-black/10 bg-slate-50 font-mono text-xs shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-800 font-bold">System Online</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500">Conflict‑Free Engine Active</span>
            </div>

            {/* Footer Metadata */}
            <ul className="flex flex-wrap justify-center gap-y-3 divide-x divide-black/10 py-4 text-xs font-semibold text-slate-500 font-mono lg:justify-end">
              <li className="px-3">
                <p>© 2026 AGAMS</p>
              </li>
              <li className="px-3">
                <p>Dubai International Airport</p>
              </li>
              <li className="px-3">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-[#0D98D1] hover:underline"
                >
                  Operations Console
                </button>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
};

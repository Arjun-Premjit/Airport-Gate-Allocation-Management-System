import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import {
  ArrowRight,
  Plane,
  ChevronDown,
  Clock,
  Mail,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Layers,
  ArrowUpRight,
  Menu,
  X,
  ShieldCheck,
  SlidersHorizontal,
  Calendar
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

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
    const root = rootRef.current;
    const heroSection = heroSectionRef.current;
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
        { yPercent: 100, xPercent: -100, rotate: -10 },
        { yPercent: 0, xPercent: 0, rotate: 0, duration: 2, ease: 'sine.out' }
      );

      // 2. Streamlined Hero Transition: Exit Intro & Airplane Climb Directly into Gate Slide
      // Slide 2 (Part Sales content-2) and Slide 3 (Component Repair content-3) have been removed.
      const heroTimeline = gsap.timeline({
        defaults: { ease: 'power1.out' },
        scrollTrigger: {
          trigger: heroSection,
          start: 'top-=79px top',
          end: '+=120%',
          scrub: 0.75,
          pin: true,
          anticipatePin: 1,
          refreshPriority: 1,
          invalidateOnRefresh: true
        }
      });

      heroTimeline
        .to('.intro-content', { autoAlpha: 0, yPercent: -20, duration: 0.5 })
        .fromTo(
          '.plane-element',
          { yPercent: 0, xPercent: 0, rotate: 0 },
          { yPercent: -20, xPercent: 100, rotate: 8, duration: 1.5, ease: 'power1.in' },
          '<-0.3'
        );

      // 3. Reference Airplane ScrollTrigger Animation Recreated Inside the Gate Slide
      const gateSlide = root.querySelector<HTMLElement>('[data-gate-slide]');
      const gatePlane = root.querySelector<HTMLElement>('[data-gate-plane]');
      const gateClouds = root.querySelectorAll<HTMLElement>('[data-gate-cloud]');

      if (gateSlide && gatePlane) {
        gsap.fromTo(
          gatePlane,
          {
            xPercent: -40,
            yPercent: -35,
            rotate: -6,
            scale: 1.15,
            autoAlpha: 0.25
          },
          {
            xPercent: 15,
            yPercent: 0,
            rotate: 2,
            scale: 0.85,
            autoAlpha: 1,
            ease: 'power1.out',
            scrollTrigger: {
              trigger: gateSlide,
              start: 'top 85%',
              end: 'center 45%',
              scrub: 0.8,
              invalidateOnRefresh: true
            }
          }
        );

        if (gateClouds.length > 0) {
          gsap.fromTo(
            gateClouds,
            { xPercent: 12, autoAlpha: 0.4 },
            {
              xPercent: -12,
              autoAlpha: 0.85,
              ease: 'none',
              scrollTrigger: {
                trigger: gateSlide,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1
              }
            }
          );
        }
      }

      // 4. Section Scroll Reveals
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

      // 5. Staggered Cards Reveal
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
    }, root);

    ScrollTrigger.refresh();

    return () => {
      gsap.ticker.remove(updateLenis);
      lenis.destroy();
      ctx.revert();
    };
  }, [isReducedMotion]);

  const partnerLogos = [
    '/frame-1-large.webp',
    '/frame-2-large.webp',
    '/frame-3-large.webp',
    '/frame-4-large.webp',
    '/frame-5-large.webp',
    '/frame-6-large.webp',
    '/frame-7-large.webp',
    '/frame-8-large.webp',
    '/frame-9-large.webp',
    '/frame-10-large.webp'
  ];

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
          SECTION A: STICKY AGAMS HEADER & NAVIGATION
      ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 flex h-[79px] justify-between border-b border-black/10 bg-white pl-[clamp(2rem,4.5vw,4rem)] pr-5 md:pr-12 items-center">
        {/* AGAMS Brandmark */}
        <div className="flex items-center">
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
            <div className="flex flex-col border-l border-black/10 pl-3.5 leading-none">
              <span className="text-xl font-bold tracking-tight text-slate-900 font-display">
                AGAMS
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#0D98D1] font-mono mt-1">
                Gate Operations
              </span>
            </div>
          </a>
        </div>

        {/* Centered Desktop Divide-X Navigation */}
        <nav
          aria-label="Main"
          className="hidden md:flex items-center h-full max-w-max flex-1 justify-center"
        >
          <ul className="flex h-full list-none items-center justify-center divide-x divide-black/10">
            {/* Services Dropdown */}
            <li className="relative h-full flex items-center">
              <button
                type="button"
                onClick={() => setServicesOpen(!servicesOpen)}
                onMouseEnter={() => setServicesOpen(true)}
                className="group inline-flex h-[79px] w-max items-center justify-center px-8 py-6 text-xl font-semibold transition-colors hover:no-underline hover:bg-black/5"
              >
                <span>Services</span>
                <ChevronDown
                  className={`ml-1.5 w-4 h-4 text-[#0D98D1] transition-transform duration-200 ${
                    servicesOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {servicesOpen && (
                <div
                  onMouseLeave={() => setServicesOpen(false)}
                  className="absolute top-full left-0 w-72 bg-white border border-black/10 shadow-xl py-3 z-50"
                >
                  <button
                    onClick={() => {
                      setServicesOpen(false);
                      const el = document.getElementById('gate-workspace');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full text-left px-6 py-2.5 text-sm font-semibold hover:bg-black/5 text-slate-800 flex items-center justify-between"
                  >
                    <span>Gate Allocation Board</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#0D98D1]" />
                  </button>
                  <button
                    onClick={() => {
                      setServicesOpen(false);
                      navigate('/maintenance');
                    }}
                    className="w-full text-left px-6 py-2.5 text-sm font-semibold hover:bg-black/5 text-slate-800 flex items-center justify-between"
                  >
                    <span>Maintenance Isolation</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#0D98D1]" />
                  </button>
                  <button
                    onClick={() => {
                      setServicesOpen(false);
                      navigate('/flights');
                    }}
                    className="w-full text-left px-6 py-2.5 text-sm font-semibold hover:bg-black/5 text-slate-800 flex items-center justify-between"
                  >
                    <span>Flight Manifest</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#0D98D1]" />
                  </button>
                </div>
              )}
            </li>

            {/* About Dropdown */}
            <li className="relative h-full flex items-center">
              <button
                type="button"
                onClick={() => setAboutOpen(!aboutOpen)}
                onMouseEnter={() => setAboutOpen(true)}
                className="group inline-flex h-[79px] w-max items-center justify-center px-8 py-6 text-xl font-semibold transition-colors hover:no-underline hover:bg-black/5"
              >
                <span>About</span>
                <ChevronDown
                  className={`ml-1.5 w-4 h-4 text-[#0D98D1] transition-transform duration-200 ${
                    aboutOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {aboutOpen && (
                <div
                  onMouseLeave={() => setAboutOpen(false)}
                  className="absolute top-full left-0 w-72 bg-white border border-black/10 shadow-xl py-3 z-50"
                >
                  <button
                    onClick={() => {
                      setAboutOpen(false);
                      const el = document.getElementById('divisions');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full text-left px-6 py-2.5 text-sm font-semibold hover:bg-black/5 text-slate-800"
                  >
                    Three Distinct Divisions
                  </button>
                  <button
                    onClick={() => {
                      setAboutOpen(false);
                      navigate('/terminals');
                    }}
                    className="w-full text-left px-6 py-2.5 text-sm font-semibold hover:bg-black/5 text-slate-800"
                  >
                    DXB Station Control
                  </button>
                  <button
                    onClick={() => {
                      setAboutOpen(false);
                      navigate('/analytics');
                    }}
                    className="w-full text-left px-6 py-2.5 text-sm font-semibold hover:bg-black/5 text-slate-800"
                  >
                    Operational Certainty
                  </button>
                </div>
              )}
            </li>

            {/* Events / Timeline */}
            <li className="h-full flex items-center">
              <button
                onClick={() => navigate('/timeline')}
                className="inline-flex h-[79px] w-max items-center justify-center px-8 py-6 text-xl font-semibold transition-colors hover:no-underline hover:bg-black/5"
              >
                Events
              </button>
            </li>

            {/* Contact */}
            <li className="h-full flex items-center">
              <a
                href="#contact"
                className="inline-flex h-[79px] w-max items-center justify-center px-8 py-6 text-xl font-semibold transition-colors hover:no-underline hover:bg-black/5"
              >
                Contact
              </a>
            </li>
          </ul>
        </nav>

        {/* Right CTA Button / Mobile Menu Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="hidden sm:inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-base font-bold transition-all bg-[#0D98D1] text-white hover:bg-[#0B84B7] px-6 py-2.5 shadow-sm hover:shadow"
          >
            <span>Operations Console</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex md:hidden items-center justify-center p-2 rounded-lg text-slate-700 hover:bg-black/5"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[79px] bg-white border-b border-black/10 p-6 z-40 space-y-4 shadow-xl">
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              const el = document.getElementById('gate-workspace');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="block w-full text-left text-lg font-bold py-2 border-b border-slate-100"
          >
            Gate Allocation Slide
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              navigate('/timeline');
            }}
            className="block w-full text-left text-lg font-bold py-2 border-b border-slate-100"
          >
            Timeline & Events
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              navigate('/flights');
            }}
            className="block w-full text-left text-lg font-bold py-2 border-b border-slate-100"
          >
            Flight Manifest
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              navigate('/dashboard');
            }}
            className="w-full mt-4 flex items-center justify-center gap-2 rounded-full py-3 bg-[#0D98D1] text-white font-bold"
          >
            <span>Open Operations Console</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION B: PINNED INITIAL HERO SEQUENCE
          (Slide 2 & Slide 3 skipped/removed per requirement)
      ───────────────────────────────────────────────────────────── */}
      <section
        ref={heroSectionRef}
        className="relative isolate min-h-[calc(100svh-79px)] w-full overflow-hidden bg-gradient-to-b from-[rgba(7,152,209,0.35)] via-[rgba(13,152,209,0.18)] to-white text-black"
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

        {/* Airplane Cruising Element (Initial Hero Video) */}
        <div className="plane-element pointer-events-none absolute top-[38%] left-0 z-[4] w-full will-change-[transform,opacity] md:top-1/4 md:left-1/3 md:w-[68%] max-w-[1150px] select-none">
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

        {/* STAGE 1: INTRO CONTENT ("Gate Allocation Simplified") */}
        <div className="intro-content absolute top-0 left-0 z-[5] h-full max-w-2xl px-6 pt-[8vmin] sm:px-12 md:w-[58%] xl:px-16">
          <div className="relative w-full md:top-1/3 md:left-0 md:-translate-y-1/2 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-700">
              <span className="h-px w-8 bg-[#0D98D1]" />
              <span>Deterministic Airport Ramp &amp; Gate Engine</span>
            </div>

            <h1 className="text-[clamp(2.5rem,5.5vw,4.5rem)] font-light leading-[1] tracking-[-2px] text-pretty text-black font-display">
              Gate Allocation{' '}
              <span className="animate-agams-wave text-[#0D98D1] font-semibold">
                Simplified
              </span>
            </h1>

            <p className="max-w-xl text-lg sm:text-xl font-medium leading-relaxed text-slate-700">
              Real-time apron telemetry, mechanical conflict avoidance, and deterministic gate assignment for global aviation hubs.
            </p>

            <div className="pt-2 flex flex-wrap gap-4">
              <button
                onClick={() => {
                  const el = document.getElementById('gate-workspace');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full text-lg font-bold bg-[#0D98D1] text-white hover:bg-[#0B84B7] px-8 py-3.5 transition-all shadow-sm hover:shadow"
              >
                <span>Scroll to Gate Allocation</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION C: THE GATE ALLOCATION SLIDE & RECREATED PLANE ANIMATION
          (Direct transition target immediately following initial hero)
      ───────────────────────────────────────────────────────────── */}
      <section
        id="gate-workspace"
        data-gate-slide
        className="relative isolate w-full bg-[#F5F5F7] py-20 px-6 sm:px-12 md:px-16 border-t border-black/10 overflow-hidden"
      >
        {/* RECREATED REFERENCE AIRPLANE SCROLLTRIGGER ANIMATION INSIDE GATE SLIDE */}
        <div
          data-gate-plane
          className="pointer-events-none absolute right-[-5%] top-[6%] z-0 w-[55vw] max-w-[850px] select-none opacity-80 will-change-transform"
        >
          <img
            src="/plane-poster.png"
            alt="Approaching aircraft on final stand alignment"
            className="w-full h-auto object-contain filter drop-shadow-xl"
          />
        </div>

        {/* Soft Drift Cloud Backdrop for Stand Alignment */}
        <div
          data-gate-cloud
          className="pointer-events-none absolute -left-20 top-12 z-0 w-96 h-48 opacity-30 select-none overflow-hidden"
        >
          <img
            src="/clouds-bg.webp"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto space-y-10">
          {/* Section Header with Runway-to-Gate Indicator */}
          <div data-scroll-reveal className="space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#0D98D1]">
              <svg viewBox="0 0 11 11" fill="currentColor" className="w-3.5 h-3.5 text-[#0D98D1]">
                <path d="M.715.5h10v10H5.488V5.753H.715V.5Z" />
              </svg>
              <span>Deterministic Ramp Allocation Engine</span>
            </div>

            <h2 className="text-4xl sm:text-5xl font-light text-slate-900 tracking-[-2px] leading-[1.08] font-display">
              Gate Allocation Management{' '}
              <span className="text-[#0D98D1] font-semibold">Slide</span>
            </h2>

            <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed">
              Dubai International Terminal 2 Concourse G live stand matrix. Mechanical conflict avoidance, wingspan suitability enforcement, and locked servicing isolation.
            </p>
          </div>

          {/* Interactive Gate Workspace Card */}
          <div data-scroll-reveal className="border border-black/10 bg-white p-8 sm:p-10 shadow-xl space-y-8 rounded-none">
            {/* Header Telemetry Bar & Invariant Indicators */}
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

            {/* Selected Gate Inspector & Invariant Verification Panel */}
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

              {/* Quick Conflict Test Controls */}
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
                  <div className="font-bold">SQL CONFLICT-FREE GUARANTEE</div>
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
          SECTION D: CUSTOMER & PARTNER LOGO STRIP (INFINITE MARQUEE)
      ───────────────────────────────────────────────────────────── */}
      <section className="carousel-block py-14 bg-white border-y border-black/10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-4">
          <p className="text-xs uppercase font-bold tracking-[0.14em] text-slate-500 font-mono">
            Trusted By Global Airlines, Lessors &amp; Station Operators
          </p>
        </div>

        <div className="overflow-hidden flex w-full">
          <div className="animate-marquee flex items-center gap-12 sm:gap-16">
            {partnerLogos.concat(partnerLogos).map((src, idx) => (
              <div
                key={`logo-${idx}`}
                className="h-16 w-36 sm:w-44 shrink-0 flex items-center justify-center grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer"
              >
                <img
                  src={src}
                  alt={`Aviation Partner ${idx + 1}`}
                  className="max-h-12 max-w-full object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION E: GLOBAL HUB MANAGEMENT VIA THREE CORE PILLARS
      ───────────────────────────────────────────────────────────── */}
      <section id="capabilities" className="py-24 px-6 sm:px-12 md:px-16 max-w-7xl mx-auto">
        {/* Section Header */}
        <div data-scroll-reveal className="mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#0D98D1]">
            <svg viewBox="0 0 11 11" fill="currentColor" className="w-3.5 h-3.5 text-[#0D98D1]">
              <path d="M.715.5h10v10H5.488V5.753H.715V.5Z" />
            </svg>
            <span>Delivering Operational Certainty</span>
          </div>

          <h2 className="text-4xl sm:text-5xl font-light text-slate-900 tracking-[-2px] leading-[1.08] font-display">
            Global Hub Management Via{' '}
            <span className="animate-agams-wave text-[#0D98D1] font-semibold">
              Three
            </span>{' '}
            Core Architectural Pillars
          </h2>
        </div>

        {/* Three Distinct Architectural Pillar Cards */}
        <div data-scroll-stagger className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Pillar 1: Stand Allocation Engine (Cyan #0D98D1) */}
          <div
            className="group relative flex flex-col justify-between overflow-hidden rounded-none border border-black/10 bg-white p-8 sm:p-10 transition-all hover:shadow-xl"
            style={{ '--color-primary': '#0D98D1' } as React.CSSProperties}
          >
            <div className="space-y-4">
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Stand Allocation Engine
              </h3>
              <p className="text-base text-slate-600 font-medium leading-relaxed">
                Automated wingspan suitability enforcement, wide-body/narrow-body stand matching, and zero-overlap temporal conflict resolution.
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
                  <span>Explore Allocations</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#0D98D1]/10 text-[#0D98D1] font-mono text-xs font-bold uppercase tracking-wider">
                <Plane className="w-3.5 h-3.5" />
                <span>STAND // ENGINE</span>
              </div>

              {/* Stand Gate Terminal Schematic SVG */}
              <svg viewBox="0 0 100 100" fill="none" className="w-16 h-16 stroke-[#0D98D1] transition-transform group-hover:scale-105">
                <rect x="20" y="20" width="60" height="60" rx="4" strokeWidth="2" strokeDasharray="4 2" />
                <path d="M50 10v20M50 70v20M10 50h20M70 50h20" strokeWidth="2" />
                <circle cx="50" cy="50" r="14" strokeWidth="2" className="fill-[#0D98D1]/10" />
                <path d="M44 50h12M50 44v12" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Pillar 2: Apron Telemetry (Crimson #913B31) */}
          <div
            className="group relative flex flex-col justify-between overflow-hidden rounded-none border border-black/10 bg-white p-8 sm:p-10 transition-all hover:shadow-xl"
            style={{ '--color-primary': '#913B31' } as React.CSSProperties}
          >
            <div className="space-y-4">
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Apron Telemetry
              </h3>
              <p className="text-base text-slate-600 font-medium leading-relaxed">
                Real-time jet bridge status, active maintenance isolation windows, and tarmac resurfacing locks across all hub terminals.
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
                  <span>Inspect Apron</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#913B31]/10 text-[#913B31] font-mono text-xs font-bold uppercase tracking-wider">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>APRON // TELEMETRY</span>
              </div>

              {/* Apron Jet Bridge Telemetry SVG */}
              <svg viewBox="0 0 100 100" fill="none" className="w-16 h-16 stroke-[#913B31] transition-transform group-hover:scale-105">
                <path d="M15 80h70M25 80V35l25-15 25 15v45" strokeWidth="2" />
                <path d="M40 50h20v30H40z" strokeWidth="2" className="fill-[#913B31]/10" />
                <circle cx="50" cy="20" r="5" strokeWidth="2" />
                <path d="M20 65h60" strokeWidth="1.5" strokeDasharray="3 3" />
              </svg>
            </div>
          </div>

          {/* Pillar 3: Dispatch Command (Gold #927438) */}
          <div
            className="group relative flex flex-col justify-between overflow-hidden rounded-none border border-black/10 bg-white p-8 sm:p-10 transition-all hover:shadow-xl"
            style={{ '--color-primary': '#927438' } as React.CSSProperties}
          >
            <div className="space-y-4">
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Dispatch Command
              </h3>
              <p className="text-base text-slate-600 font-medium leading-relaxed">
                Unified station control for Gate Managers, Flight Managers, and Station Heads. Automated live audit logs and turnaround tracking.
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
                  <span>Launch Timeline</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#927438]/10 text-[#927438] font-mono text-xs font-bold uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5" />
                <span>DISPATCH // CONTROL</span>
              </div>

              {/* Dispatch Radar Sweep SVG */}
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
          SECTION F: HIGH-END REFERENCE FOOTER
      ───────────────────────────────────────────────────────────── */}
      <footer data-scroll-reveal className="relative overflow-hidden border-t border-black/10 bg-white px-6 sm:px-12 md:px-16 pt-[clamp(2.5rem,5vw,5rem)] pb-12">
        <div className="max-w-7xl mx-auto space-y-16">
          {/* Top Grid: Logo + 3 Navigation Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Col 1: Brand & Identity */}
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
                Airport Gate Allocation Management System. Globally trusted, responsive, and agile aviation software providing deterministic gate allocation and ramp turnaround predictability.
              </p>
            </div>

            {/* Col 2: Explore Navigation */}
            <div className="lg:col-span-2 space-y-4">
              <p className="text-base font-bold text-slate-900">Explore</p>
              <ul className="space-y-3 text-sm font-semibold text-slate-600">
                <li>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="hover:text-[#0D98D1] transition-colors"
                  >
                    Dashboard
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/allocations')}
                    className="hover:text-[#0D98D1] transition-colors"
                  >
                    Gate Allocation
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/timeline')}
                    className="hover:text-[#0D98D1] transition-colors"
                  >
                    Gate Timeline
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/flights')}
                    className="hover:text-[#0D98D1] transition-colors"
                  >
                    Flight Manifest
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/gates')}
                    className="hover:text-[#0D98D1] transition-colors"
                  >
                    Gate Inventory
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Services & Infrastructure */}
            <div className="lg:col-span-2 space-y-4">
              <p className="text-base font-bold text-slate-900">Operations</p>
              <ul className="space-y-3 text-sm font-semibold text-slate-600">
                <li>
                  <button
                    onClick={() => navigate('/allocations')}
                    className="hover:text-[#0D98D1] transition-colors"
                  >
                    Deterministic Matching
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/maintenance')}
                    className="hover:text-[#0D98D1] transition-colors"
                  >
                    Maintenance Isolation
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/gates')}
                    className="hover:text-[#0D98D1] transition-colors"
                  >
                    Apron Telemetry
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

            {/* Col 4: Speak to Us */}
            <div id="contact" className="lg:col-span-3 space-y-4">
              <p className="text-base font-bold text-slate-900">Speak to us</p>
              <ul className="space-y-3 text-sm font-semibold text-slate-600">
                <li className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#0D98D1]" />
                  <a
                    href="mailto:dispatch@agams.airport"
                    className="hover:text-[#0D98D1] transition-colors"
                  >
                    dispatch@agams.airport
                  </a>
                </li>
                <li className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-[#0D98D1]" />
                  <span className="font-mono text-slate-600">DXB Apron Control: Ex. 402</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-[#0D98D1]" />
                  <span className="font-mono">24/7 Duty Dispatch</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Area: Live Operational Telemetry Pill & Metadata Bar */}
          <div className="pt-6 border-t border-black/10 lg:flex lg:items-center lg:justify-between">
            {/* AGAMS Operational Status Telemetry Pill */}
            <div className="hidden lg:flex items-center gap-3 px-4 py-2.5 rounded-full border border-black/10 bg-slate-50 font-mono text-xs shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-800 font-bold">DXB T2 Telemetry: 18 Gates Active</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500">Conflict-Free Invariant Engine</span>
            </div>

            {/* Footer Metadata with Divide-X hairlines */}
            <ul className="flex flex-wrap justify-center gap-y-3 divide-x divide-black/10 py-4 text-xs font-semibold text-slate-500 font-mono lg:justify-end">
              <li className="px-3">
                <p>© 2026 AGAMS Systems</p>
              </li>
              <li className="px-3">
                <p>DXB Station Control • Invariant Engine</p>
              </li>
              <li className="px-3">
                <span className="text-slate-400">Deterministic Ramp Engine</span>
              </li>
              <li className="px-3">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-[#0D98D1] hover:underline"
                >
                  Console Dashboard
                </button>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
};


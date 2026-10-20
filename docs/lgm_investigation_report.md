# LGM Aviation Website Reverse-Engineering & Reconstruction Specification

**Target Website:** https://lgmaviation.com/  
**Methodology:** Direct inspection of live HTML, CSS tokens, server-rendered components, static Next.js JavaScript bundles, and GSAP ScrollTrigger timeline configurations.  
**Confidence Score:** High (Direct AST and bundle source extraction from `1531484a91f959be.js` and `b47b448181a49dea.css`).

---

## 1. Executive Summary & Technology Stack Identified

| Component | Identified Technology | Evidence / Origin |
|---|---|---|
| **Framework** | Next.js (App Router / SSR) | Chunks in `/_next/static/chunks/` |
| **Styling** | Tailwind CSS + Custom CSS Variables | `b47b448181a49dea.css`, `clamp()`, `px-fluid-*` |
| **Motion & Animation Engine** | **GSAP 3.12+ with ScrollTrigger & Observer** | Explicitly declared and instantiated in `1531484a91f959be.js` |
| **Typography** | DM Sans, Host Grotesk, IBM Plex Mono | Extracted design tokens |
| **Palette** | Monochrome with 3 Regional Accents: Cyan (`#0D98D1`), Rust Red (`#913B31`), Antique Gold (`#927438`), Neutral Gray (`#F5F5F7`), Crisp White (`#FFFFFF`), Deep Ink (`#000000`) | `design.md` & CSS bundle |
| **Carousel** | Embla Carousel (`embla__viewport`, `embla__container`) | Extracted HTML structure |
| **3D / Layer Graphics** | Layered SVGs with isometric isometric geometry + Canvas/Video layers | Inline SVG paths & Canvas containers |

---

## 2. Section-by-Section Architectural Specification

### Section A: Header & Navigation
- **Purpose**: Global sticky brand identity and multi-tier portal navigation.
- **Dimensions & Spacing**:
  - Height: `79px` (desktop), sticky `top: 0`, `z-index: 50`.
  - Padding: `pl-[clamp(2rem,4.5vw,4rem)]`, `px-8` on navigation triggers.
  - Border: `border-b border-black/10`, background `#FFFFFF`.
- **Layout & Structure**:
  - Left: Official vector logo `lgmlogo-01.svg` (`105px x 79px`, object-contain).
  - Center: Horizontal `nav` with divide-x hairline (`divide-x divide-black/10`).
    - *Services* dropdown trigger with Chevron icon (rotates 180° on open).
    - *About* dropdown trigger with Chevron icon.
    - *Events* direct link.
    - *Contact* direct link.
  - Right: Mobile hamburger menu trigger (`md:hidden`) and operational CTA button ("Operations Console" / "Sign In").
- **Motion Behavior**:
  - Sticky header remains pinned at top during full page scroll.
  - Navigation buttons have `hover:bg-black/5` with `0.15s cubic-bezier(0.4, 0, 0.2, 1)`.

---

### Section B: Pinned Multi-Stage Hero & Story Sequence (GSAP Timeline)
- **Container**: `section.relative.isolate.min-h-[calc(100dvh-80px)].w-full.overflow-clip.bg-gradient-to-b.from-[rgba(7,152,209,0.35)].to-[rgba(230,245,250,0)]`
- **Exact GSAP ScrollTrigger Configuration** (extracted verbatim from bundle):
  ```javascript
  gsap.timeline({
    defaults: { ease: "power1.out" },
    scrollTrigger: {
      trigger: sectionRef.current,
      start: "top-=80px top",
      end: "+=500%",
      scrub: true,
      pin: true,
      anticipatePin: 1,
      refreshPriority: 1,
      markers: false
    }
  })
  ```
- **Sequential Animation Steps**:
  1. **Initial Page Load Entry**:
     - `.plane` swoops in: `fromTo(".plane", { yPercent: 100, xPercent: -100, rotate: -10 }, { yPercent: 0, xPercent: 0, rotate: 0, duration: 2, ease: "sine.out" })`
  2. **Stage 1 -> 2 (Hero Exit & Airplane Ascent)**:
     - `intro-content` fades out: `to(".intro-content", { autoAlpha: 0, duration: 0.5 })`
     - `.plane` climbs up and exits top-right: `fromTo(".plane", { yPercent: 0, xPercent: 0, rotate: 0 }, { yPercent: -20, xPercent: 100, rotate: 8, duration: 2, ease: "power1.in" }, "<-1")`
  3. **Stage 2 (Aircraft Part Sales / Core Capabilities)**:
     - `.content-2` slides up from below: `fromTo(".content-2", { autoAlpha: 0, yPercent: 100 }, { autoAlpha: 1, yPercent: 0, duration: 0.5 }, "<")`
     - Pinned Dwell: `addPause("+=1")`
     - `.content-2` slides up and out: `fromTo(".content-2", { autoAlpha: 1, yPercent: 0 }, { autoAlpha: 0, yPercent: -100, duration: 0.5 })`
  4. **Stage 3 (Component Repair Management / Conflict Engine)**:
     - `.content-3` slides up: `fromTo(".content-3", { autoAlpha: 0, yPercent: 100 }, { autoAlpha: 1, yPercent: 0, duration: 0.5 }, "<0.5")`
     - Pinned Dwell: `addPause("+=1")`
     - `.content-3` slides up and out: `fromTo(".content-3", { autoAlpha: 1, yPercent: 0 }, { autoAlpha: 0, yPercent: -100, duration: 0.5 })`
  5. **Stage 4 (Delivering Certainty & Apron / Hanger Transition)**:
     - `.clouds` scale up into camera: `fromTo(".clouds", { scale: 1 }, { scale: 2.5, duration: 1.5, ease: "power1.out" }, ">")`
     - `.clouds` fade out: `fromTo(".clouds", { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.5 }, "<1s")`
     - `.hanger` rises from bottom: `fromTo(".hanger", { yPercent: 100 }, { yPercent: 0, duration: 1 }, "<")`
     - `.hanger-text` reveals: `fromTo(".hanger-text", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, ">-0.5")`
     - Video / Canvas scrubs to completion.

---

### Section C: Customer & Partner Logo Strip
- **Purpose**: High-trust social proof demonstrating international airline and lessor partnerships.
- **Layout**: `div.carousel-block.py-fluid-16` containing continuous sliding track.
- **Assets**: 10 official partner logo frames (`frame-1-large.webp` through `frame-10-large.webp`).
- **Motion**: Continuous seamless horizontal auto-scroll with pause-on-hover.

---

### Section D: Global Reach Via Three Distinct Divisions
- **Header**:
  - Badge: Icon with `Delivering Certainty`.
  - Heading: `Global Reach Via <span class="wave">Three</span> Distinct Divisions`.
- **Card Grid**: `grid md:grid-cols-3 gap-6`.
- **Card Architecture**:
  - **Division 1: LGM Aviation** (EMEA / Spares)
    - Primary Accent: Cyan `#0D98D1`
    - Logo: `lgm-logo-sub.webp`
    - Wireframe: Isometric 3D SVG wing/cube structure (`stroke: #0D98D1`, hover fill `rgba(13,152,209,0.1)`)
    - CTA: "Learn More" with full card hit target (`before:absolute before:inset-0`)
  - **Division 2: LGM Aviation Americas** (Americas / Support)
    - Primary Accent: Rust Red `#913B31`
    - Logo: `lgm-logo-americas.webp`
    - Wireframe: Isometric 3D SVG (`stroke: #913B31`, hover fill `#F4EBEA`)
    - CTA: "Learn More"
  - **Division 3: LGM Aviation Capital** (Asset Transactions / Fleet)
    - Primary Accent: Antique Gold `#927438`
    - Logo: `lgm-logo-capital.webp`
    - Wireframe: Isometric 3D SVG (`stroke: #927438`, hover fill `#F4F1EB`)
    - CTA: "Learn More"

---

### Section E: Operational Airport Concourse Matrix (Preserving Working AGAMS Functionality)
- **Purpose**: Maintain AGAMS core gate allocation workflows (16-table locked database, conflict prevention, real-time gate occupancy).
- **Styling Alignment**: Re-styled with the LGM token system (sharp 0px grid hairlines, tabular figures, DM Sans/Host Grotesk, subtle status indicators for Available, Allocated, Reserved, Maintenance, Closed).

---

### Section F: High-End Footer
- **Layout**:
  - Top grid (`lg:grid-cols-2`):
    - Left: LGM logo (`105px x 79px`) and descriptive statement.
    - Right (`grid-cols-3`): "Explore", "Services", "Speak to us" (email, telephone `01243 200787`, `24/7` clock badge, LinkedIn).
  - Bottom section:
    - Overlapping Stack of 3 Isometric 3D SVGs with brand strokes (`#913B31`, `#927438`, `#0D98D1`) that elevate `-translate-y-4` on hover.
    - Legal and operational metadata strip with pipe dividers (`divide-x divide-black/10`).

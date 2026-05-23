import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";
import { Star, Users, ShieldCheck, Smartphone, ArrowRight } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const INJECTED_STYLES = `
  .cinematic-hero .gsap-reveal { visibility: hidden; }

  @media (max-width: 767px) {
    .cinematic-hero .hero-card-grid {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 0.85rem;
      padding: max(1rem, env(safe-area-inset-top, 0px)) 1rem max(1rem, env(safe-area-inset-bottom, 0px));
    }
    .cinematic-hero .main-card {
      width: 94vw !important;
      height: 86dvh !important;
      border-radius: 28px !important;
    }
    .cinematic-hero .card-left-text { gap: 0.6rem; }
    .cinematic-hero .card-left-text h2 {
      font-size: clamp(1.35rem, 6.4vw, 1.75rem);
      line-height: 1.08;
    }
    .cinematic-hero .card-left-text p { line-height: 1.38; }
    .cinematic-hero .ipad-stage { width: min(100%, 340px) !important; }
    .cinematic-hero .ipad-bezel-mobile { border-radius: 20px !important; }
    .cinematic-hero .ipad-screen-mobile { inset: 10px !important; border-radius: 13px !important; }
    .cinematic-hero .floating-badge {
      font-size: 11px;
      gap: 0.35rem;
      padding: 0.35rem 0.55rem;
      border-radius: 0.8rem;
    }
    .cinematic-hero .phone-widget { display: none; }
    .cinematic-hero .mobile-hide-badge { display: none; }
  }

  @media (max-width: 374px), (max-height: 720px) {
    .cinematic-hero .ipad-stage { width: min(100%, 305px) !important; }
    .cinematic-hero .optional-feedback-copy { display: none; }
  }

  .cinematic-hero .bg-grid-theme {
    background-size: 60px 60px;
    background-image:
      linear-gradient(to right, rgba(255,255,255,0.10) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255,255,255,0.10) 1px, transparent 1px);
    mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
    -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
  }

  .cinematic-hero .text-3d-matte {
    color: #fff;
    text-shadow: 0 10px 30px rgba(0,0,0,0.55), 0 2px 4px rgba(0,0,0,0.35);
  }
  .cinematic-hero .text-silver-matte {
    background: linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.45) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    transform: translateZ(0);
    filter: drop-shadow(0 10px 20px rgba(0,0,0,0.4)) drop-shadow(0 2px 4px rgba(0,0,0,0.3));
  }
  .cinematic-hero .text-gold-matte {
    background: linear-gradient(180deg, #FFE9A8 0%, #FFCC00 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    transform: translateZ(0);
    filter: drop-shadow(0 8px 18px rgba(201,162,76,0.35));
  }
  .cinematic-hero .text-card-silver-matte {
    background: linear-gradient(180deg, #FFFFFF 0%, #A1A1AA 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    transform: translateZ(0);
    filter: drop-shadow(0 12px 24px rgba(0,0,0,0.8)) drop-shadow(0 4px 8px rgba(0,0,0,0.6));
  }

  .cinematic-hero .premium-depth-card {
    background: linear-gradient(145deg, #0F5EDB 0%, #0B2E8A 100%);
    box-shadow:
      0 40px 100px -20px rgba(0,0,0,0.9),
      0 20px 40px -20px rgba(0,0,0,0.8),
      inset 0 1px 2px rgba(255,255,255,0.2),
      inset 0 -2px 4px rgba(0,0,0,0.8);
    border: 1px solid rgba(255,255,255,0.04);
    position: relative;
  }
  .cinematic-hero .card-sheen {
    position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 5;
    background: radial-gradient(800px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.07) 0%, transparent 40%);
    mix-blend-mode: screen;
  }

  .cinematic-hero .iphone-bezel {
    background-color: #111;
    box-shadow:
      inset 0 0 0 2px #52525B,
      inset 0 0 0 7px #000,
      0 40px 80px -15px rgba(0,0,0,0.9),
      0 15px 25px -5px rgba(0,0,0,0.7);
    transform-style: preserve-3d;
  }
  .cinematic-hero .screen-glare {
    background: linear-gradient(110deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 45%);
  }
  .cinematic-hero .widget-depth {
    background: linear-gradient(180deg, rgba(15,94,219,0.85) 0%, rgba(11,46,138,0.85) 100%);
    box-shadow:
      0 10px 20px rgba(0,0,0,0.4),
      inset 0 1px 1px rgba(255,255,255,0.08),
      inset 0 -1px 1px rgba(0,0,0,0.6);
    border: 1px solid rgba(255,255,255,0.06);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }
  .cinematic-hero .floating-ui-badge {
    background: linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.02) 100%);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.12),
      0 25px 50px -12px rgba(0,0,0,0.8),
      inset 0 1px 1px rgba(255,255,255,0.2),
      inset 0 -1px 1px rgba(0,0,0,0.5);
  }

  .cinematic-hero .btn-modern-light, .cinematic-hero .btn-modern-dark {
    transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
  }
  .cinematic-hero .btn-modern-light {
    background: linear-gradient(180deg, #FFE9A8 0%, #FFCC00 100%);
    color: #0F172A;
    box-shadow: 0 0 0 1px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.1), 0 12px 24px -4px rgba(201,162,76,0.45), inset 0 1px 1px rgba(255,255,255,0.6), inset 0 -3px 6px rgba(0,0,0,0.08);
  }
  .cinematic-hero .btn-modern-light:hover { transform: translateY(-3px); }
  .cinematic-hero .btn-modern-dark {
    background: linear-gradient(180deg, #27272A 0%, #18181B 100%);
    color: #fff;
    box-shadow: 0 0 0 1px rgba(255,255,255,0.1), 0 12px 24px -4px rgba(0,0,0,0.9), inset 0 1px 1px rgba(255,255,255,0.15), inset 0 -3px 6px rgba(0,0,0,0.8);
  }
  .cinematic-hero .btn-modern-dark:hover { transform: translateY(-3px); }

  .cinematic-hero .progress-ring {
    transform: rotate(-90deg);
    transform-origin: center;
    stroke-dasharray: 402;
    stroke-dashoffset: 402;
    stroke-linecap: round;
  }
`;

export interface CinematicHeroProps extends React.HTMLAttributes<HTMLDivElement> {
  brandName?: string;
  logoSrc?: string;
  tagline1?: string;
  tagline2?: string;
  taglineHighlight?: string;
  cardHeading?: string;
  cardDescription?: React.ReactNode;
  metricValue?: number;
  metricLabel?: string;
  metricSub?: string;
  screenshotSrc?: string;
  ctaHeading?: string;
  ctaDescription?: string;
  primaryCtaLabel?: string;
  secondaryCtaLabel?: string;
  onPrimaryCta?: () => void;
  onSecondaryCta?: () => void;
}

export function CinematicHero({
  brandName = "Trumpetstar",
  logoSrc,
  tagline1 = "Trompete lernen,",
  tagline2 = "kinderleicht.",
  taglineHighlight = "kinderleicht.",
  cardHeading = "440+ Mitspielvideos. 24+ Levels.",
  cardDescription = (
    <>
      Vom ersten Ton bis zum Konzertstück – mit Mario Schulter, KI-Coach Tim und der
      gamifizierten Starmethode. Üben wird zum Spiel.
    </>
  ),
  metricValue = 440,
  metricLabel = "Mitspielvideos",
  metricSub = "in 24+ Levels",
  screenshotSrc,
  ctaHeading = "Starte heute mit Trompete.",
  ctaDescription = "Jederzeit kündbar. 30 Tage Geld-zurück-Garantie. Spielerisch von der ersten Minute an.",
  primaryCtaLabel = "Jetzt kostenlos starten",
  secondaryCtaLabel = "Pro ansehen",
  onPrimaryCta,
  onSecondaryCta,
  className,
  ...props
}: CinematicHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainCardRef = useRef<HTMLDivElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(0);

  // Mouse parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (window.scrollY > window.innerHeight * 2) return;
      cancelAnimationFrame(requestRef.current);
      requestRef.current = requestAnimationFrame(() => {
        if (mainCardRef.current && mockupRef.current) {
          const rect = mainCardRef.current.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;
          mainCardRef.current.style.setProperty("--mouse-x", `${mouseX}px`);
          mainCardRef.current.style.setProperty("--mouse-y", `${mouseY}px`);

          const xVal = (e.clientX / window.innerWidth - 0.5) * 2;
          const yVal = (e.clientY / window.innerHeight - 0.5) * 2;
          gsap.to(mockupRef.current, {
            rotationY: xVal * 10,
            rotationX: -yVal * 10,
            ease: "power3.out",
            duration: 1.2,
          });
        }
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // Cinematic scroll timeline
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const ctx = gsap.context(() => {
      gsap.set(".text-track", { autoAlpha: 0, y: 60, scale: 0.85, filter: "blur(20px)", rotationX: -20 });
      gsap.set(".text-days", { autoAlpha: 1, clipPath: "inset(0 100% 0 0)" });
      gsap.set(".main-card", { y: window.innerHeight + 200, autoAlpha: 1 });
      gsap.set([".card-left-text", ".card-right-text", ".mockup-scroll-wrapper", ".floating-badge", ".phone-widget"], { autoAlpha: 0 });
      gsap.set(".cta-wrapper", { autoAlpha: 0, scale: 0.8, filter: "blur(30px)" });

      const introTl = gsap.timeline({ delay: 0.3 });
      introTl
        .to(".text-track", { duration: 1.6, autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", rotationX: 0, ease: "expo.out" })
        .to(".text-days", { duration: 1.2, clipPath: "inset(0 0% 0 0)", ease: "power4.inOut" }, "-=1.0");

      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=7000",
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        },
      });

      scrollTl
        .to([".hero-text-wrapper", ".bg-grid-theme"], { scale: 1.15, filter: "blur(20px)", opacity: 0.2, ease: "power2.inOut", duration: 2 }, 0)
        .to(".main-card", { y: 0, ease: "power3.inOut", duration: 2 }, 0)
        .to(".main-card", { width: "100%", height: "100%", borderRadius: "0px", ease: "power3.inOut", duration: 1.5 })
        .fromTo(".mockup-scroll-wrapper",
          { y: 300, z: -500, rotationX: 50, rotationY: -30, autoAlpha: 0, scale: 0.6 },
          { y: 0, z: 0, rotationX: 0, rotationY: 0, autoAlpha: 1, scale: 1, ease: "expo.out", duration: 2.5 }, "-=0.8"
        )
        .fromTo(".phone-widget", { y: 40, autoAlpha: 0, scale: 0.95 }, { y: 0, autoAlpha: 1, scale: 1, stagger: 0.15, ease: "back.out(1.2)", duration: 1.5 }, "-=1.5")
        .to(".progress-ring", { strokeDashoffset: 60, duration: 2, ease: "power3.inOut" }, "-=1.2")
        .to(".counter-val", { innerHTML: metricValue, snap: { innerHTML: 1 }, duration: 2, ease: "expo.out" }, "-=2.0")
        .fromTo(".floating-badge", { y: 100, autoAlpha: 0, scale: 0.7, rotationZ: -10 }, { y: 0, autoAlpha: 1, scale: 1, rotationZ: 0, ease: "back.out(1.5)", duration: 1.5, stagger: 0.2 }, "-=2.0")
        .fromTo(".card-left-text", { x: -50, autoAlpha: 0 }, { x: 0, autoAlpha: 1, ease: "power4.out", duration: 1.5 }, "-=1.5")
        .fromTo(".card-right-text", { x: 50, autoAlpha: 0, scale: 0.8 }, { x: 0, autoAlpha: 1, scale: 1, ease: "expo.out", duration: 1.5 }, "<")
        .to({}, { duration: 2.5 })
        .set(".hero-text-wrapper", { autoAlpha: 0 })
        .set(".cta-wrapper", { autoAlpha: 1 })
        .to({}, { duration: 1.5 })
        .to([".mockup-scroll-wrapper", ".floating-badge", ".card-left-text", ".card-right-text"], {
          scale: 0.9, y: -40, z: -200, autoAlpha: 0, ease: "power3.in", duration: 1.2, stagger: 0.05,
        })
        .to(".main-card", {
          width: isMobile ? "92vw" : "85vw",
          height: isMobile ? "92vh" : "85vh",
          borderRadius: isMobile ? "32px" : "40px",
          ease: "expo.inOut",
          duration: 1.8,
        }, "pullback")
        .to(".cta-wrapper", { scale: 1, filter: "blur(0px)", ease: "expo.inOut", duration: 1.8 }, "pullback")
        .to(".main-card", { y: -window.innerHeight - 300, ease: "power3.in", duration: 1.5 });
    }, containerRef);

    return () => ctx.revert();
  }, [metricValue]);

  // Replace highlight in tagline2 if provided
  const renderTagline2 = () => {
    if (!taglineHighlight || !tagline2.includes(taglineHighlight)) {
      return <span className="text-silver-matte">{tagline2}</span>;
    }
    const parts = tagline2.split(taglineHighlight);
    return (
      <>
        <span className="text-silver-matte">{parts[0]}</span>
        <span className="text-gold-matte text-days">{taglineHighlight}</span>
        <span className="text-silver-matte">{parts[1]}</span>
      </>
    );
  };

  return (
    <div
      ref={containerRef}
      className={cn("cinematic-hero relative w-full h-screen overflow-hidden text-white", className)}
      style={{ background: 'linear-gradient(180deg, hsl(212,100%,56%) 0%, hsl(218,88%,46%) 40%, hsl(222,86%,29%) 100%)' }}
      {...props}
    >
      <style>{INJECTED_STYLES}</style>

      {/* Background grid */}
      <div className="bg-grid-theme absolute inset-0 pointer-events-none" />

      {/* HERO TEXT */}
      <div className="hero-text-wrapper absolute inset-0 flex flex-col items-center justify-center text-center px-6 z-10">
        {logoSrc && (
          <img src={logoSrc} alt={brandName} className="text-track h-12 md:h-16 mb-8 opacity-90" />
        )}
        <h1 className="text-track font-black tracking-tight leading-[0.95] text-5xl md:text-7xl lg:text-8xl">
          <span className="block text-3d-matte">{tagline1}</span>
          <span className="block mt-2">{renderTagline2()}</span>
        </h1>
        <p className="text-track mt-8 text-white/60 text-base md:text-lg max-w-xl">
          {brandName} – die Lern-App für Trompete. Mitspielen, Punkte sammeln, besser werden.
        </p>
      </div>

      {/* MAIN CARD */}
      <div
        ref={mainCardRef}
        className="main-card premium-depth-card absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden"
        style={{ width: "85vw", height: "70vh", borderRadius: "40px" }}
      >
        <div className="card-sheen" />

        {/* Card content grid */}
        <div className="hero-card-grid relative z-10 w-full h-full grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 p-5 md:p-8 lg:p-10">
          {/* LEFT TEXT */}
          <div className="card-left-text md:col-span-3 min-w-0 flex flex-col justify-center space-y-3 md:space-y-4">

            <span className="inline-flex items-center gap-2 self-start px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs uppercase tracking-widest text-white/60">
              <Star className="w-3 h-3 text-[#FFCC00]" /> Trumpetstar App
            </span>
            <h2 className="text-card-silver-matte text-2xl md:text-3xl lg:text-4xl font-bold leading-tight">
              {cardHeading}
            </h2>
            <p className="text-white/65 text-sm md:text-base leading-relaxed">
              {cardDescription}
            </p>
            <p className="optional-feedback-copy text-white/55 text-xs md:text-sm leading-relaxed">
              Optional auch mit persönlichem Feedback von ausgebildeten Trompetenlehrern.
            </p>
          </div>

          {/* iPAD LANDSCAPE MOCKUP */}
          <div className="mockup-scroll-wrapper md:col-span-6 min-w-0 flex items-center justify-center relative py-4 md:py-0" style={{ perspective: "1500px" }}>
            {/* iPad + badges share this relative wrapper so badges anchor to the iPad corners */}
            <div className="ipad-stage relative" style={{ width: "min(540px, 100%)" }}>
              <div
                ref={mockupRef}
                className="iphone-bezel ipad-bezel-mobile relative w-full"
                style={{
                  aspectRatio: "4 / 3",
                  borderRadius: "26px",
                  transformStyle: "preserve-3d",
                }}
              >
                {/* Camera dot */}
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/30 z-20" />
                {/* Screen */}
                <div className="ipad-screen-mobile absolute inset-[14px] rounded-[18px] overflow-hidden bg-[#0B2E8A]">
                  {screenshotSrc && (
                    <img src={screenshotSrc} alt="App Screenshot" className="w-full h-full object-cover object-top" />
                  )}
                  {/* Glare */}
                  <div className="screen-glare absolute inset-0 z-10 pointer-events-none" />

                  {/* Overlay widget: progress ring */}
                  <div className="phone-widget widget-depth absolute right-3 bottom-3 rounded-2xl p-3 z-30 flex items-center gap-3 max-w-[60%]">
                    <div className="relative w-14 h-14 shrink-0">
                      <svg viewBox="0 0 144 144" className="w-full h-full">
                        <circle cx="72" cy="72" r="64" stroke="rgba(255,255,255,0.08)" strokeWidth="10" fill="none" />
                        <circle
                          className="progress-ring"
                          cx="72" cy="72" r="64"
                          stroke="#FFCC00" strokeWidth="10" fill="none"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="counter-val text-white font-bold text-sm">0</span>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-xs font-semibold truncate">{metricLabel}</p>
                      <p className="text-white/50 text-[10px]">{metricSub}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badges — anchored to iPad corners, slightly outside */}
              <div className="floating-badge floating-ui-badge absolute top-2 left-2 md:-top-4 md:-left-6 rounded-2xl px-3 py-2 flex items-center gap-2 text-xs whitespace-nowrap z-40">
                <Star className="w-4 h-4 text-[#FFCC00]" />
                <span className="text-white font-semibold">4,9 ★</span>
                <span className="text-white/50 hidden sm:inline">Bewertung</span>
              </div>
              <div className="floating-badge floating-ui-badge absolute top-2 right-2 md:-top-4 md:-right-6 rounded-2xl px-3 py-2 flex items-center gap-2 text-xs whitespace-nowrap z-40">
                <Users className="w-4 h-4 text-[#FFCC00]" />
                <span className="text-white font-semibold">500+</span>
                <span className="text-white/50 hidden sm:inline">Schüler:innen</span>
              </div>
              <div className="floating-badge floating-ui-badge absolute bottom-2 left-2 md:-bottom-4 md:-left-6 rounded-2xl px-3 py-2 flex items-center gap-2 text-xs whitespace-nowrap z-40">
                <ShieldCheck className="w-4 h-4 text-[#FFCC00]" />
                <span className="text-white font-semibold">30 Tage</span>
                <span className="text-white/50 hidden sm:inline">Geld-zurück</span>
              </div>
              <div className="floating-badge floating-ui-badge mobile-hide-badge absolute bottom-2 right-2 md:-bottom-4 md:-right-6 rounded-2xl px-3 py-2 flex items-center gap-2 text-xs whitespace-nowrap z-40">
                <Smartphone className="w-4 h-4 text-[#FFCC00]" />
                <span className="text-white/80">iOS · Android · Web</span>
              </div>
            </div>
          </div>

          {/* RIGHT TEXT — USP-Liste (kein Duplikat) */}
          <div className="card-right-text md:col-span-3 min-w-0 flex flex-col justify-center space-y-3 md:space-y-4">
            <p className="text-white/60 text-xs uppercase tracking-widest">Was drinsteckt</p>
            <ul className="space-y-2 text-xs md:text-sm text-white/80">
              <li className="flex items-start gap-2"><span className="text-[#FFCC00] mt-0.5 shrink-0">●</span> <span>Strukturiert in 24+ Levels</span></li>
              <li className="flex items-start gap-2"><span className="text-[#FFCC00] mt-0.5 shrink-0">●</span> <span>Playbacks für Bb, C, Horn F/Es</span></li>
              <li className="flex items-start gap-2"><span className="text-[#FFCC00] mt-0.5 shrink-0">●</span> <span>KI-Coach Tim & NoteRunner-Spiel</span></li>
              <li className="flex items-start gap-2"><span className="text-[#FFCC00] mt-0.5 shrink-0">●</span> <span>8 Notenhefte inklusive</span></li>
              <li className="flex items-start gap-2"><span className="text-[#FFCC00] mt-0.5 shrink-0">●</span> <span>Optional: Feedback vom Trompetenlehrer</span></li>
            </ul>
          </div>

        </div>
      </div>


      {/* FINAL CTA */}
      <div className="cta-wrapper absolute inset-0 flex flex-col items-center justify-center text-center px-6 z-20 pointer-events-none">
        <div className="pointer-events-auto max-w-2xl">
          <h2 className="text-3d-matte text-4xl md:text-6xl font-black leading-tight mb-4">
            {ctaHeading}
          </h2>
          <p className="text-white/70 text-base md:text-lg mb-8">
            {ctaDescription}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onPrimaryCta}
              className="btn-modern-light rounded-full px-7 py-3.5 font-bold inline-flex items-center gap-2"
            >
              {primaryCtaLabel} <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onSecondaryCta}
              className="btn-modern-dark rounded-full px-7 py-3.5 font-bold"
            >
              {secondaryCtaLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CinematicHero;

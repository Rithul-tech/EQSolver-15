import React from "react";

interface EQSolverLogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

export default function EQSolverLogo({
  className = "",
  showText = true,
  size = "md"
}: EQSolverLogoProps) {
  // Size mappings
  const iconSizes = {
    sm: "w-8 h-8",
    md: "w-11 h-11",
    lg: "w-14 h-14",
    xl: "w-20 h-20"
  };

  const textSizes = {
    sm: {
      title: "text-sm",
      sub: "text-[7px]"
    },
    md: {
      title: "text-lg sm:text-xl",
      sub: "text-[9px] sm:text-[10px]"
    },
    lg: {
      title: "text-2xl",
      sub: "text-xs"
    },
    xl: {
      title: "text-4xl",
      sub: "text-base"
    }
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`} id="eqsolver-brand-logo">
      {/* Brand Icon (Inline SVG representing the atom orbital with math glyphs) */}
      <svg
        className={`${iconSizes[size]} shrink-0`}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        id="logo-svg-icon"
      >
        <defs>
          <linearGradient id="vibrantBlue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00d4ff" />
            <stop offset="100%" stopColor="#0052cc" />
          </linearGradient>
          <linearGradient id="deepNavy" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0a2540" />
            <stop offset="100%" stopColor="#001833" />
          </linearGradient>
          <linearGradient id="accentBlue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          <filter id="subtle-glow" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Orbit Ellipse 1 (Tilted Left) */}
        <ellipse
          cx="60"
          cy="60"
          rx="18"
          ry="52"
          stroke="url(#vibrantBlue)"
          strokeWidth="3.2"
          transform="rotate(-40, 60, 60)"
          strokeLinecap="round"
          opacity="0.9"
        />

        {/* Orbit Ellipse 2 (Vertical-ish) */}
        <ellipse
          cx="60"
          cy="60"
          rx="18"
          ry="52"
          stroke="url(#deepNavy)"
          strokeWidth="3.2"
          transform="rotate(15, 60, 60)"
          strokeLinecap="round"
        />

        {/* Orbit Ellipse 3 (Tilted Right) */}
        <ellipse
          cx="60"
          cy="60"
          rx="18"
          ry="52"
          stroke="url(#accentBlue)"
          strokeWidth="3.2"
          transform="rotate(70, 60, 60)"
          strokeLinecap="round"
          opacity="0.85"
        />

        {/* Swooping Orbit Arrow wraps around the atom */}
        <path
          d="M 22,82 C 16,60 30,32 58,26 C 88,20 114,48 108,76 C 104,95 82,110 58,104 C 44,101 32,92 26,80"
          stroke="url(#vibrantBlue)"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
          strokeDasharray="4 220"
          strokeDashoffset="-25"
          className="hidden" // decorative overlay
        />

        {/* Solid active swirling arrow element */}
        <path
          d="M 25,86 C 14,70 18,46 38,34 C 62,20 94,32 102,58 C 108,78 94,102 70,105 C 50,107 32,93 26,74"
          stroke="url(#deepNavy)"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
          strokeDasharray="140 100"
          strokeDashoffset="10"
        />

        {/* Swirling Arrowhead */}
        <path
          d="M 23,80 L 32,68 L 29,88 Z"
          fill="url(#deepNavy)"
          stroke="url(#deepNavy)"
          strokeWidth="1"
          strokeLinejoin="round"
          transform="rotate(-8, 23, 80)"
        />

        {/* Mathematical Glyphs Group (Placed beautifully inside the central intersection) */}
        {/* '=' glyph */}
        <text
          x="35"
          y="61"
          fill="url(#deepNavy)"
          fontFamily="sans-serif"
          fontSize="11"
          fontWeight="bold"
          letterSpacing="0"
        >
          =
        </text>

        {/* 'x' variable glyph */}
        <text
          x="50"
          y="66"
          fill="url(#deepNavy)"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize="16"
          fontWeight="bold"
        >
          x
        </text>

        {/* '√' square root glyph */}
        <path
          d="M 66,66 L 71,68 L 76,55 L 88,55"
          stroke="url(#vibrantBlue)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          filter="url(#subtle-glow)"
        />
      </svg>

      {/* Brand Text Content */}
      {showText && (
        <div className="flex flex-col select-none" id="logo-text-container">
          <div className="flex items-center gap-1.5 leading-none">
            <span className={`font-sans font-black tracking-tight text-slate-800 uppercase ${textSizes[size].title}`}>
              EQSolver
            </span>
          </div>
          <span 
            className={`font-sans font-bold text-slate-400 uppercase tracking-widest mt-0.5 leading-none ${textSizes[size].sub}`}
            style={{ letterSpacing: "0.14em" }}
          >
            Mathematics & Science Solutions
          </span>
        </div>
      )}
    </div>
  );
}

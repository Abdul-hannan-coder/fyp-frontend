"use client";

import * as React from "react";

/**
 * Decorative animated-characters panel (extracted from the showcase component).
 * Eyes follow the cursor, characters blink, lean while you type, and the purple
 * one "peeks" when the password is visible. Drive the reactions with props from
 * a real form — auth stays in the page, this is purely visual.
 */

interface PupilProps {
  size?: number;
  maxDistance?: number;
  pupilColor?: string;
  forceLookX?: number;
  forceLookY?: number;
}

function Pupil({ size = 12, maxDistance = 5, pupilColor = "black", forceLookX, forceLookY }: PupilProps) {
  const [mouse, setMouse] = React.useState({ x: 0, y: 0 });
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const move = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  const pos = (() => {
    if (forceLookX !== undefined && forceLookY !== undefined) return { x: forceLookX, y: forceLookY };
    if (!ref.current) return { x: 0, y: 0 };
    const r = ref.current.getBoundingClientRect();
    const dx = mouse.x - (r.left + r.width / 2);
    const dy = mouse.y - (r.top + r.height / 2);
    const dist = Math.min(Math.sqrt(dx ** 2 + dy ** 2), maxDistance);
    const a = Math.atan2(dy, dx);
    return { x: Math.cos(a) * dist, y: Math.sin(a) * dist };
  })();

  return (
    <div
      ref={ref}
      className="rounded-full"
      style={{ width: size, height: size, backgroundColor: pupilColor, transform: `translate(${pos.x}px, ${pos.y}px)`, transition: "transform 0.1s ease-out" }}
    />
  );
}

interface EyeBallProps {
  size?: number;
  pupilSize?: number;
  maxDistance?: number;
  eyeColor?: string;
  pupilColor?: string;
  isBlinking?: boolean;
  forceLookX?: number;
  forceLookY?: number;
}

function EyeBall({ size = 18, pupilSize = 7, maxDistance = 5, eyeColor = "white", pupilColor = "#2D2D2D", isBlinking = false, forceLookX, forceLookY }: EyeBallProps) {
  return (
    <div
      className="flex items-center justify-center overflow-hidden rounded-full transition-all duration-150"
      style={{ width: size, height: isBlinking ? 2 : size, backgroundColor: eyeColor }}
    >
      {!isBlinking && <Pupil size={pupilSize} maxDistance={maxDistance} pupilColor={pupilColor} forceLookX={forceLookX} forceLookY={forceLookY} />}
    </div>
  );
}

export function AnimatedCharacters({
  isTyping = false,
  password = "",
  showPassword = false,
}: {
  isTyping?: boolean;
  password?: string;
  showPassword?: boolean;
}) {
  const [mouse, setMouse] = React.useState({ x: 0, y: 0 });
  const [purpleBlink, setPurpleBlink] = React.useState(false);
  const [blackBlink, setBlackBlink] = React.useState(false);
  const [lookEachOther, setLookEachOther] = React.useState(false);
  const [peek, setPeek] = React.useState(false);

  const purpleRef = React.useRef<HTMLDivElement>(null);
  const blackRef = React.useRef<HTMLDivElement>(null);
  const yellowRef = React.useRef<HTMLDivElement>(null);
  const orangeRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const move = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  // Random blinking
  React.useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const schedule = (set: (v: boolean) => void) => {
      t = setTimeout(() => {
        set(true);
        setTimeout(() => { set(false); schedule(set); }, 150);
      }, Math.random() * 4000 + 3000);
    };
    schedule(setPurpleBlink);
    schedule(setBlackBlink);
    return () => clearTimeout(t);
  }, []);

  // Glance at each other when typing begins
  React.useEffect(() => {
    if (isTyping) {
      setLookEachOther(true);
      const t = setTimeout(() => setLookEachOther(false), 800);
      return () => clearTimeout(t);
    }
    setLookEachOther(false);
  }, [isTyping]);

  // Purple peeks when the password is visible
  React.useEffect(() => {
    if (password.length > 0 && showPassword) {
      const t = setTimeout(() => {
        setPeek(true);
        setTimeout(() => setPeek(false), 800);
      }, Math.random() * 3000 + 2000);
      return () => clearTimeout(t);
    }
    setPeek(false);
  }, [password, showPassword, peek]);

  const lean = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return { faceX: 0, faceY: 0, skew: 0 };
    const r = ref.current.getBoundingClientRect();
    const dx = mouse.x - (r.left + r.width / 2);
    const dy = mouse.y - (r.top + r.height / 3);
    return {
      faceX: Math.max(-15, Math.min(15, dx / 20)),
      faceY: Math.max(-10, Math.min(10, dy / 30)),
      skew: Math.max(-6, Math.min(6, -dx / 120)),
    };
  };

  const purple = lean(purpleRef);
  const black = lean(blackRef);
  const yellow = lean(yellowRef);
  const orange = lean(orangeRef);
  const hidingPw = password.length > 0 && !showPassword;
  const showingPw = password.length > 0 && showPassword;

  return (
    <div className="relative flex h-[420px] w-full items-end justify-center">
      <div className="relative" style={{ width: 520, height: 400 }}>
        {/* Purple */}
        <div
          ref={purpleRef}
          className="absolute bottom-0 transition-all duration-700 ease-in-out"
          style={{
            left: 70, width: 180, height: isTyping || hidingPw ? 440 : 400,
            backgroundColor: "#6C3FF5", borderRadius: "10px 10px 0 0", zIndex: 1,
            transform: showingPw ? "skewX(0deg)" : isTyping || hidingPw ? `skewX(${purple.skew - 12}deg) translateX(40px)` : `skewX(${purple.skew}deg)`,
            transformOrigin: "bottom center",
          }}
        >
          <div className="absolute flex gap-8 transition-all duration-700 ease-in-out"
            style={{ left: showingPw ? 20 : lookEachOther ? 55 : 45 + purple.faceX, top: showingPw ? 35 : lookEachOther ? 65 : 40 + purple.faceY }}>
            {[0, 1].map((i) => (
              <EyeBall key={i} size={18} pupilSize={7} isBlinking={purpleBlink}
                forceLookX={showingPw ? (peek ? 4 : -4) : lookEachOther ? 3 : undefined}
                forceLookY={showingPw ? (peek ? 5 : -4) : lookEachOther ? 4 : undefined} />
            ))}
          </div>
        </div>

        {/* Black */}
        <div
          ref={blackRef}
          className="absolute bottom-0 transition-all duration-700 ease-in-out"
          style={{
            left: 240, width: 120, height: 310, backgroundColor: "#2D2D2D", borderRadius: "8px 8px 0 0", zIndex: 2,
            transform: showingPw ? "skewX(0deg)" : lookEachOther ? `skewX(${black.skew * 1.5 + 10}deg) translateX(20px)` : isTyping || hidingPw ? `skewX(${black.skew * 1.5}deg)` : `skewX(${black.skew}deg)`,
            transformOrigin: "bottom center",
          }}
        >
          <div className="absolute flex gap-6 transition-all duration-700 ease-in-out"
            style={{ left: showingPw ? 10 : lookEachOther ? 32 : 26 + black.faceX, top: showingPw ? 28 : lookEachOther ? 12 : 32 + black.faceY }}>
            {[0, 1].map((i) => (
              <EyeBall key={i} size={16} pupilSize={6} maxDistance={4} isBlinking={blackBlink}
                forceLookX={showingPw ? -4 : lookEachOther ? 0 : undefined}
                forceLookY={showingPw ? -4 : lookEachOther ? -4 : undefined} />
            ))}
          </div>
        </div>

        {/* Orange */}
        <div
          ref={orangeRef}
          className="absolute bottom-0 transition-all duration-700 ease-in-out"
          style={{ left: 0, width: 240, height: 200, zIndex: 3, backgroundColor: "#FF9B6B", borderRadius: "120px 120px 0 0",
            transform: showingPw ? "skewX(0deg)" : `skewX(${orange.skew}deg)`, transformOrigin: "bottom center" }}>
          <div className="absolute flex gap-8 transition-all duration-200 ease-out"
            style={{ left: showingPw ? 50 : 82 + orange.faceX, top: showingPw ? 85 : 90 + orange.faceY }}>
            {[0, 1].map((i) => (
              <Pupil key={i} size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={showingPw ? -5 : undefined} forceLookY={showingPw ? -4 : undefined} />
            ))}
          </div>
        </div>

        {/* Yellow */}
        <div
          ref={yellowRef}
          className="absolute bottom-0 transition-all duration-700 ease-in-out"
          style={{ left: 310, width: 140, height: 230, backgroundColor: "#E8D754", borderRadius: "70px 70px 0 0", zIndex: 4,
            transform: showingPw ? "skewX(0deg)" : `skewX(${yellow.skew}deg)`, transformOrigin: "bottom center" }}>
          <div className="absolute flex gap-6 transition-all duration-200 ease-out"
            style={{ left: showingPw ? 20 : 52 + yellow.faceX, top: showingPw ? 70 : 78 + yellow.faceY }}>
            {[0, 1].map((i) => (
              <Pupil key={i} size={11} maxDistance={5} pupilColor="#2D2D2D" forceLookX={showingPw ? -5 : undefined} forceLookY={showingPw ? -4 : undefined} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

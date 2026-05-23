"use client";

import { CSSProperties } from "react";
import { MascotMood } from "@/lib/types";

interface MascotProps {
  size?: number;
  mood?: MascotMood;
  talking?: boolean;
  listening?: boolean;
  style?: CSSProperties;
}

export function Mascot({ size = 80, mood = "happy", talking = false, listening = false, style = {} }: MascotProps) {
  const eyeShape = (cx: number, cy: number) => {
    if (mood === "sleeping") {
      return <path d={`M${cx - 7},${cy} q7,-6 14,0`} stroke="#3D2E20" strokeWidth="2.5" strokeLinecap="round" fill="none" />;
    }
    if (mood === "thinking") {
      return <ellipse cx={cx} cy={cy + 1} rx="4" ry="5" fill="#3D2E20" />;
    }
    if (mood === "excited") {
      return <path d={`M${cx - 6},${cy + 1} q6,-7 12,0`} stroke="#3D2E20" strokeWidth="2.8" strokeLinecap="round" fill="none" />;
    }
    return (
      <g style={{ transformOrigin: `${cx}px ${cy}px`, animation: "blink 4s infinite" }}>
        <ellipse cx={cx} cy={cy} rx="4.5" ry="5.5" fill="#3D2E20" />
        <circle cx={cx + 1.5} cy={cy - 1.5} r="1.5" fill="#fff" />
      </g>
    );
  };

  const mouth = () => {
    if (talking) {
      return <ellipse cx="50" cy="60" rx="6" ry="5" fill="#3D2E20" style={{ animation: "pop 0.3s infinite alternate" }} />;
    }
    if (mood === "sleeping") {
      return <ellipse cx="50" cy="62" rx="4" ry="3" fill="#3D2E20" opacity="0.5" />;
    }
    return <path d="M44,58 q6,8 12,0" stroke="#3D2E20" strokeWidth="3" strokeLinecap="round" fill="none" />;
  };

  const gradId = `mascot-grad-${size}`;

  return (
    <div style={{ width: size, height: size, position: "relative", display: "inline-block", ...style }}>
      {listening && (
        <>
          <div style={{
            position: "absolute", inset: -8, borderRadius: "50%",
            border: "3px solid rgba(232, 132, 90, 0.4)",
            animation: "pulse-ring 1.4s ease-out infinite",
          }} />
          <div style={{
            position: "absolute", inset: -8, borderRadius: "50%",
            border: "3px solid rgba(232, 132, 90, 0.4)",
            animation: "pulse-ring 1.4s ease-out 0.5s infinite",
          }} />
        </>
      )}
      <svg viewBox="0 0 100 100" width={size} height={size} style={{ animation: "float 3.5s ease-in-out infinite", display: "block" }}>
        <ellipse cx="50" cy="93" rx="28" ry="3" fill="#3D2E20" opacity="0.08" />
        <defs>
          <radialGradient id={gradId} cx="35%" cy="32%">
            <stop offset="0%" stopColor="#F9B98F" />
            <stop offset="55%" stopColor="#EE9461" />
            <stop offset="100%" stopColor="#D67340" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="38" fill={`url(#${gradId})`} stroke="#C95E36" strokeWidth="1.5" opacity="0.95" />
        <path d="M50,12 q-2,-6 4,-8 q-1,5 6,4 q-3,5 -10,4 z" fill="#7AA779" stroke="#5E8B5D" strokeWidth="1" />
        <circle cx="32" cy="58" r="4.5" fill="#E36A88" opacity="0.55" />
        <circle cx="68" cy="58" r="4.5" fill="#E36A88" opacity="0.55" />
        {eyeShape(38, 46)}
        {eyeShape(62, 46)}
        {mouth()}
        <ellipse cx="32" cy="32" rx="7" ry="5" fill="#fff" opacity="0.35" />
      </svg>
    </div>
  );
}

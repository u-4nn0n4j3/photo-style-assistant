import React from "react";

// 3 色限制（深綠/米白/橘），確保畫風統一
const C = {
    green: "#2F3E3A",
    bg: "#F6F7F4",
    orange: "#D9A441",
    line: "rgba(47,62,58,0.18)",
    soft: "rgba(47,62,58,0.08)",
};

// 小像素 icon：用 rect 疊出來（Cursor 也很容易理解）
function PixelCamera({ size = 48 }: { size?: number }) {
    const s = size / 16; // 16格
    return (
        <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
            {/* body */}
            <rect x="2" y="5" width="12" height="8" rx="1" fill={C.green} />
            {/* top */}
            <rect x="4" y="4" width="3" height="2" rx="1" fill={C.green} />
            {/* lens outer */}
            <rect x="6" y="7" width="4" height="4" rx="2" fill={C.bg} opacity="0.95" />
            {/* lens inner */}
            <rect x="7" y="8" width="2" height="2" rx="1" fill={C.green} opacity="0.75" />
            {/* highlight */}
            <rect x="11" y="6" width="2" height="1" rx="0.5" fill={C.orange} />
            {/* pixel grid feel: small dots */}
            <rect x="3" y="12" width="1" height="1" fill={C.bg} opacity="0.6" />
            <rect x="12" y="12" width="1" height="1" fill={C.bg} opacity="0.6" />
        </svg>
    );
}

function PixelSun({ size = 40 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
            <rect x="6" y="6" width="4" height="4" rx="1" fill={C.orange} />
            {/* rays */}
            <rect x="7" y="2" width="2" height="2" fill={C.orange} opacity="0.85" />
            <rect x="7" y="12" width="2" height="2" fill={C.orange} opacity="0.85" />
            <rect x="2" y="7" width="2" height="2" fill={C.orange} opacity="0.85" />
            <rect x="12" y="7" width="2" height="2" fill={C.orange} opacity="0.85" />
        </svg>
    );
}

function PixelChart({ size = 44 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
            <rect x="2" y="13" width="12" height="1" fill={C.green} opacity="0.35" />
            <rect x="3" y="9" width="2" height="4" rx="1" fill={C.green} />
            <rect x="7" y="7" width="2" height="6" rx="1" fill={C.green} opacity="0.75" />
            <rect x="11" y="5" width="2" height="8" rx="1" fill={C.orange} />
        </svg>
    );
}

// 主要 Hero 插畫：扁平幾何背景 + 像素貼紙（BC 融合）
export default function HeroArtwork() {
    return (
        <div style={{ position: "relative", width: "100%", height: "320px" }}>
            {/* 大塊幾何背景（扁平、低飽和） */}
            <svg
                width="100%"
                height="100%"
                viewBox="0 0 560 320"
                preserveAspectRatio="xMidYMid meet"
                aria-hidden="true"
            >
                <rect x="0" y="0" width="560" height="320" fill={C.bg} />
                {/* soft hills */}
                <path
                    d="M0,220 C120,190 180,260 300,230 C420,200 470,250 560,235 L560,320 L0,320 Z"
                    fill={C.soft}
                />
                <path
                    d="M0,250 C140,235 220,290 340,265 C460,240 500,275 560,265 L560,320 L0,320 Z"
                    fill={C.soft}
                    opacity="0.75"
                />
                {/* baseline / time tick */}
                <line x1="90" y1="205" x2="470" y2="205" stroke={C.line} strokeWidth="2" />
                {Array.from({ length: 7 }).map((_, i) => {
                    const x = 120 + i * 50;
                    return <line key={i} x1={x} y1="198" x2={x} y2="212" stroke={C.line} strokeWidth="2" />;
                })}
                {/* big subtle shape (camera silhouette block, not detailed) */}
                <rect x="135" y="120" width="220" height="110" rx="18" fill="rgba(47,62,58,0.10)" />
                <rect x="165" y="140" width="80" height="18" rx="9" fill="rgba(47,62,58,0.12)" />
                <circle cx="255" cy="175" r="32" fill="rgba(47,62,58,0.14)" />
                <circle cx="255" cy="175" r="18" fill="rgba(47,62,58,0.10)" />
            </svg>

            {/* 像素貼紙 icon：點綴、但不搶主角 */}
            <div style={{ position: "absolute", left: 58, top: 50, opacity: 0.95 }}>
                <PixelSun size={42} />
            </div>
            <div style={{ position: "absolute", left: 110, top: 135 }}>
                <PixelCamera size={54} />
            </div>
            <div style={{ position: "absolute", left: 360, top: 165 }}>
                <PixelChart size={46} />
            </div>
        </div>
    );
}

// 也把 icon export 出去，給按鈕/卡片共用（避免風格分裂）
export { PixelCamera, PixelSun, PixelChart };


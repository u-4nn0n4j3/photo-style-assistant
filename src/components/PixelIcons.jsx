/**
 * 共用像素風 SVG 圖示（低飽和、灰階、與首頁插畫同套）
 * style: 全站 icon 系統
 */

const GRAY = {
  g1: "#f2f2f2",
  g2: "#e3e3e3",
  g3: "#d2d2d2",
  g4: "#bdbdbd",
  g5: "#9d9d9d",
  g6: "#7a7a7a",
  g7: "#555555",
  g8: "#3a3a3a",
  accent: "#8a9492", // 極淡灰綠/灰藍，小面積點綴
};

// style: header - 標題區左側小圖（相機/資料夾）
export function PxCamera({ size = 48, className = "" }) {
  const s = size / 16;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      aria-hidden
    >
      <rect x="2" y="5" width="12" height="8" rx="1" fill={GRAY.g8} />
      <rect x="4" y="4" width="3" height="2" rx="1" fill={GRAY.g8} />
      <rect x="6" y="7" width="4" height="4" rx="2" fill={GRAY.g3} />
      <rect x="7" y="8" width="2" height="2" rx="1" fill={GRAY.g6} />
      <rect x="11" y="6" width="2" height="1" rx="0.5" fill={GRAY.accent} />
    </svg>
  );
}

// style: primary switches - 拍攝計算器主按鍵 icon
export function PxCalculator({ size = 20, className = "" }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      aria-hidden
    >
      <rect x="1" y="2" width="14" height="10" rx="1" fill={GRAY.g7} />
      <rect x="3" y="4" width="10" height="4" fill={GRAY.g3} />
      <rect x="4" y="9" width="2" height="2" fill={GRAY.g6} />
      <rect x="7" y="9" width="2" height="2" fill={GRAY.g6} />
      <rect x="10" y="9" width="2" height="2" fill={GRAY.g6} />
      <rect x="4" y="12" width="2" height="2" fill={GRAY.g6} />
      <rect x="7" y="12" width="2" height="2" fill={GRAY.g6} />
      <rect x="10" y="12" width="2" height="2" fill={GRAY.g6} />
    </svg>
  );
}

// style: primary switches - 拍攝後分析主按鍵 icon
export function PxChart({ size = 20, className = "" }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      aria-hidden
    >
      <rect x="2" y="13" width="12" height="1" fill={GRAY.g4} />
      <rect x="3" y="9" width="2" height="4" rx="1" fill={GRAY.g6} />
      <rect x="7" y="7" width="2" height="6" rx="1" fill={GRAY.g5} />
      <rect x="11" y="5" width="2" height="8" rx="1" fill={GRAY.g7} />
    </svg>
  );
}

// style: tabs - 景深
export function PxDepth({ size = 16, className = "" }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      aria-hidden
    >
      <rect x="2" y="6" width="12" height="2" fill={GRAY.g6} />
      <rect x="2" y="4" width="2" height="8" fill={GRAY.g6} />
      <rect x="12" y="4" width="2" height="8" fill={GRAY.g6} />
      <rect x="6" y="6" width="4" height="4" fill={GRAY.g4} />
    </svg>
  );
}

// style: tabs - 曝光三角
export function PxExposure({ size = 16, className = "" }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      aria-hidden
    >
      <rect x="6" y="2" width="4" height="4" fill={GRAY.g6} />
      <rect x="4" y="6" width="8" height="2" fill={GRAY.g6} />
      <rect x="2" y="10" width="12" height="2" fill={GRAY.g6} />
      <rect x="6" y="6" width="4" height="4" fill={GRAY.g4} />
    </svg>
  );
}

// style: tabs - ND
export function PxND({ size = 16, className = "" }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      aria-hidden
    >
      <rect x="2" y="4" width="12" height="8" fill={GRAY.g7} />
      <rect x="4" y="6" width="8" height="4" fill={GRAY.g5} />
      <rect x="6" y="7" width="4" height="2" fill={GRAY.accent} />
    </svg>
  );
}

// style: tabs - 日落
export function PxSun({ size = 16, className = "" }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      aria-hidden
    >
      <rect x="6" y="6" width="4" height="4" rx="1" fill={GRAY.g5} />
      <rect x="7" y="2" width="2" height="2" fill={GRAY.g5} />
      <rect x="7" y="12" width="2" height="2" fill={GRAY.g5} />
      <rect x="2" y="7" width="2" height="2" fill={GRAY.g5} />
      <rect x="12" y="7" width="2" height="2" fill={GRAY.g5} />
    </svg>
  );
}

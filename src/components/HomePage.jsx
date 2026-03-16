import React from "react";
import "./HomePage.css";

const HeroBackground = () => (
  <svg
    className="homepage-psa__hero-bg"
    viewBox="0 0 1440 760"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="none"
    aria-hidden
  >
    {/* Layer 1：最淡、最高，起伏較緩但位置偏左 */}
    <path
      d="
M0 340
C 220 250, 420 420, 650 330
C 890 235, 1080 410, 1440 300
L1440 760 L0 760 Z"
      fill="var(--psa-hill-1)"
      opacity="0.85"
    />

    {/* Layer 2：第二層，波峰偏中間，幅度更大 */}
    <path
      d="
M0 420
C 180 520, 420 260, 640 420
C 860 580, 1100 320, 1440 450
L1440 760 L0 760 Z"
      fill="var(--psa-hill-2)"
      opacity="0.78"
    />

    {/* Layer 3：第三層，右側起伏更明顯，拉出不對稱 */}
    <path
      d="
M0 470
C 260 360, 420 560, 720 460
C 980 375, 1120 610, 1440 500
L1440 760 L0 760 Z"
      fill="var(--psa-hill-3)"
      opacity="0.82"
    />

    {/* Layer 4：第四層，整體更低，做出大幅度長波 */}
    <path
      d="
M0 560
C 260 650, 520 420, 820 560
C 1100 690, 1240 520, 1440 610
L1440 760 L0 760 Z"
      fill="var(--psa-hill-4)"
      opacity="0.88"
    />

    {/* Layer 5：最底層，吃到底部，波形更大且平穩 */}
    <path
      d="
M0 640
C 320 560, 560 760, 860 640
C 1130 535, 1280 720, 1440 660
L1440 760 L0 760 Z"
      fill="var(--psa-hill-5)"
      opacity="0.95"
    />
  </svg>
);

/* 立體扁平風格相機插圖 360×280 */
const CameraIllustration = ({ width = 360 }) => (
  <svg
    width={width}
    viewBox="0 0 360 280"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    {/* 草地三層：由深到淺 #9AAB8E、#A8B89C、#B5C4A8 */}
    <path d="M0 200 Q 90 140, 180 200 T 360 200 L 360 280 L 0 280 Z" fill="#9AAB8E" />
    <path d="M0 220 Q 120 160, 240 220 T 360 220 L 360 280 L 0 280 Z" fill="#A8B89C" />
    <path d="M0 240 Q 150 190, 300 240 L 360 240 L 360 280 L 0 280 Z" fill="#B5C4A8" />
    {/* 後方淺灰白矩形框 */}
    <rect x="45" y="70" width="135" height="100" rx="8" fill="#F5F2EB" />
    {/* 太陽：實心圓 + 六條放射光線 */}
    <circle cx="290" cy="55" r="26" fill="#D9A441" />
    <line x1="290" y1="29" x2="290" y2="12" stroke="#D9A441" strokeWidth="4" strokeLinecap="round" />
    <line x1="290" y1="81" x2="290" y2="98" stroke="#D9A441" strokeWidth="4" strokeLinecap="round" />
    <line x1="264" y1="55" x2="247" y2="55" stroke="#D9A441" strokeWidth="4" strokeLinecap="round" />
    <line x1="316" y1="55" x2="333" y2="55" stroke="#D9A441" strokeWidth="4" strokeLinecap="round" />
    <line x1="271" y1="33" x2="259" y2="21" stroke="#D9A441" strokeWidth="4" strokeLinecap="round" />
    <line x1="309" y1="77" x2="321" y2="89" stroke="#D9A441" strokeWidth="4" strokeLinecap="round" />
    {/* 相機機身：立體扁平 - 陰影面 #3A5331 */}
    <path d="M95 105 L95 215 L100 218 L100 108 Z" fill="#3A5331" />
    <path d="M95 105 L265 105 L270 108 L100 108 Z" fill="#3A5331" />
    {/* 機身主體 #4A6741 */}
    <rect x="100" y="108" width="165" height="105" rx="12" fill="#4A6741" />
    {/* 螢幕區域 */}
    <rect x="115" y="123" width="135" height="72" rx="8" fill="#B5C4A8" opacity={0.25} />
    {/* 閃光燈區域 */}
    <rect x="255" y="118" width="18" height="12" rx="3" fill="#B5C4A8" />
    {/* 熱靴槽 */}
    <rect x="155" y="98" width="55" height="10" rx="2" fill="#3A5331" />
    <line x1="165" y1="103" x2="200" y2="103" stroke="#2D4227" strokeWidth="1" />
    <line x1="200" y1="103" x2="200" y2="108" stroke="#2D4227" strokeWidth="1" />
    {/* 記憶卡插槽 */}
    <rect x="268" y="145" width="12" height="35" rx="2" fill="#E8E4DC" />
    {/* 鏡頭：反光環 #6B8C6B + 同心圓 #3A5331、#2D4227、#1A2E16 */}
    <circle cx="182" cy="168" r="38" fill="#6B8C6B" />
    <circle cx="182" cy="168" r="32" fill="#3A5331" />
    <circle cx="182" cy="168" r="26" fill="#2D4227" />
    <circle cx="182" cy="168" r="16" fill="#1A2E16" />
    {/* 快門按鈕 */}
    <circle cx="225" cy="125" r="7" fill="#D9A441" />
    {/* 底部裝飾線 + 刻度 */}
    <line x1="70" y1="265" x2="290" y2="265" stroke="#B5C4A8" strokeWidth="2" strokeLinecap="round" />
    {[90, 130, 170, 210, 250].map((x) => (
      <line key={x} x1={x} y1={262} x2={x} y2={268} stroke="#9AAB8E" strokeWidth="1.5" strokeLinecap="round" />
    ))}
    <circle cx="110" cy="265" r="4" fill="#D9A441" />
    <circle cx="182" cy="265" r="4" fill="#B5C4A8" opacity={0.7} />
    <circle cx="254" cy="265" r="4" fill="#B5C4A8" opacity={0.7} />
  </svg>
);

const PixelToolsIllustration = ({ className = "" }) => (
  <svg
    className={className}
    viewBox="0 0 240 150"
    width="220"
    height="140"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="像素風拍攝工具插畫：曝光三角、景深、ND、日落"
    shapeRendering="crispEdges"
  >
    <defs>
      <style>
        {`
.g1{fill:#f2f2f2}
.g2{fill:#e3e3e3}
.g3{fill:#d2d2d2}
.g4{fill:#bdbdbd}
.g5{fill:#9d9d9d}
.g6{fill:#7a7a7a}
.g7{fill:#555555}
.g8{fill:#3a3a3a}
`}
      </style>
    </defs>
    {/* 地平線（更簡潔） */}
    <rect x="18" y="112" width="204" height="3" className="g3" />
    <rect x="18" y="115" width="204" height="2" className="g2" />
    {/* 日落（縮小避免太擠） */}
    <rect x="186" y="82" width="18" height="14" className="g4" />
    <rect x="190" y="78" width="10" height="4" className="g3" />
    <rect x="182" y="88" width="26" height="5" className="g2" />
    {/* ND 濾鏡片（更小） */}
    <rect x="164" y="96" width="14" height="11" className="g5" />
    <rect x="166" y="98" width="10" height="7" className="g7" />
    <rect x="168" y="100" width="6" height="3" className="g6" />
    {/* 相機（比例調整：更大、3:2、更像相機） */}
    <rect x="40" y="76" width="132" height="62" className="g8" />
    <rect x="44" y="80" width="124" height="54" className="g7" />
    <rect x="58" y="66" width="80" height="14" className="g7" />
    <rect x="64" y="62" width="26" height="6" className="g6" />
    <rect x="144" y="68" width="20" height="12" className="g6" />
    <rect x="146" y="70" width="16" height="8" className="g4" />
    <rect x="44" y="92" width="124" height="2" className="g6" />
    <rect x="52" y="124" width="34" height="4" className="g6" />
    <rect x="52" y="128" width="34" height="2" className="g5" />
    <rect x="92" y="88" width="56" height="56" className="g8" />
    <rect x="96" y="92" width="48" height="48" className="g6" />
    <rect x="100" y="96" width="40" height="40" className="g8" />
    <rect x="106" y="102" width="28" height="28" className="g5" />
    <rect x="116" y="110" width="6" height="6" className="g2" />
    <rect x="126" y="120" width="4" height="4" className="g3" />
    {/* 光圈符號（曝光三角暗示） */}
    <rect x="22" y="92" width="14" height="14" className="g6" />
    <rect x="24" y="94" width="10" height="10" className="g2" />
    <rect x="28" y="96" width="2" height="6" className="g6" />
    <rect x="26" y="98" width="6" height="2" className="g6" />
    {/* 景深符號（對焦括號） */}
    <rect x="22" y="116" width="18" height="2" className="g6" />
    <rect x="22" y="114" width="2" height="6" className="g6" />
    <rect x="38" y="114" width="2" height="6" className="g6" />
    {/* 小三角（曝光三角另一個暗示） */}
    <rect x="48" y="140" width="12" height="2" className="g5" />
    <rect x="53" y="136" width="2" height="4" className="g5" />
    <rect x="50" y="138" width="8" height="2" className="g6" />
  </svg>
);

const PixelHistogramIllustration = ({ className = "" }) => (
  <svg
    className={className}
    viewBox="0 0 220 120"
    width="180"
    height="110"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="像素直方圖插畫"
    shapeRendering="crispEdges"
  >
    <defs>
      <style>
        {`
.h1{fill:#d9d9d9}
.h2{fill:#bfbfbf}
.h3{fill:#9a9a9a}
.h4{fill:#6f6f6f}
.h5{fill:#3f3f3f}
`}
      </style>
    </defs>
    {/* 底線（無外框） */}
    <rect x="34" y="92" width="152" height="4" className="h2" />
    <rect x="34" y="96" width="152" height="2" className="h1" />
    {/* 直方圖：7 條，間距更舒適 */}
    <rect x="52" y="70" width="12" height="22" className="h3" />
    <rect x="70" y="56" width="12" height="36" className="h4" />
    <rect x="88" y="42" width="12" height="50" className="h5" />
    <rect x="106" y="34" width="12" height="58" className="h4" />
    <rect x="124" y="46" width="12" height="46" className="h5" />
    <rect x="142" y="60" width="12" height="32" className="h4" />
    <rect x="160" y="74" width="12" height="18" className="h3" />
    {/* 少量顆粒細節（不密集） */}
    <rect x="46" y="82" width="4" height="4" className="h2" />
    <rect x="176" y="84" width="4" height="4" className="h3" />
  </svg>
);

const HomePage = ({ onFeatureSelect }) => {
  return (
    <div className="homepage-psa" data-psa-home="true">
      <span className="homepage-psa__debug-badge" aria-hidden>HOME_COMPONENT_ACTIVE</span>
      <div className="homepage-psa__shell">
        <div className="homepage-psa__hero">
          <HeroBackground />

          <div className="homepage-psa__left">
            <h1 className="homepage-psa__title">攝影風格助手</h1>
            <p className="homepage-psa__subtitle">從拍攝前到拍攝後的完整輔助流程</p>
          </div>

          <div className="homepage-psa__right">
            <div
              className="homepage-psa__card homepage-psa__card--primary psa-card"
              onClick={() => onFeatureSelect("calculator")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") && onFeatureSelect("calculator")
              }
            >
              <div className="psa-illus psa-illus--pixel" aria-hidden="true">
                <PixelToolsIllustration className="psa-pixelIllus" />
              </div>
              <div className="homepage-psa__card-content">
                <h3 className="homepage-psa__card-title">開始拍攝計算器</h3>
                <p className="homepage-psa__card-desc">曝光、景深、ND 濾鏡、日落時間</p>
              </div>
            </div>

            <div
              className="homepage-psa__card homepage-psa__card--secondary psa-card"
              onClick={() => onFeatureSelect("analysis")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") && onFeatureSelect("analysis")
              }
            >
              <div className="psa-illus psa-illus--pixel psa-illus--hist" aria-hidden="true">
                <PixelHistogramIllustration className="psa-pixelIllus psa-pixelIllus--hist" />
              </div>
              <div className="homepage-psa__card-content">
                <h3 className="homepage-psa__card-title">進行拍攝後分析</h3>
                <p className="homepage-psa__card-desc">風格分析、Lightroom 調整建議</p>
              </div>
              <span className="homepage-psa__card-arrow">→</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;

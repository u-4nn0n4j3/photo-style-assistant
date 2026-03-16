import { useState, useRef, useEffect, useCallback } from "react";
import { Upload, Loader2, X, BarChart3, ChevronRight } from "lucide-react";
import HomePage from "./components/HomePage";
import {
  PxCamera,
  PxCalculator,
  PxChart,
  PxDepth,
  PxExposure,
  PxND,
  PxSun,
} from "./components/PixelIcons";
import {
  calcSunriseSunset,
  formatMinutesToTime,
  getShootingStatus,
  getStatusDisplay,
  getTimeMode,
} from "./utils/suncalc";
import {
  analyzeHSVComplete,
  analyzeDetailedHue,
  calculateHueShiftAmount,
  calculateUniversalHueShift,
  calculateRGBCurveAdjustments,
  generateHSLAdjustments,
  applyUniversalHSLAdjustments,
  applyRGBCurveAdjustments,
  detectLightingEffect,
} from "./universalHueConversion";
import "./analysis-mode.css";
import "./px-func-style.css";
import "./psa-design-tokens.css";
import "./psa-section-header.css";

// 像素風 SVG 插圖（功能頁專用，禁止 emoji）- 低飽和灰階
const PxIconBalance = () => (
  <svg className="px-icon px-icon-balance" viewBox="0 0 24 24" width={32} height={32} shapeRendering="crispEdges" aria-hidden>
    <rect x="10" y="4" width="4" height="12" fill="#8a9492" />
    <rect x="2" y="16" width="8" height="3" fill="#686864" />
    <rect x="14" y="16" width="8" height="3" fill="#686864" />
    <rect x="4" y="14" width="2" height="4" fill="#444440" />
    <rect x="18" y="14" width="2" height="4" fill="#444440" />
  </svg>
);
const PxIconMagnifier = () => (
  <svg className="px-icon px-icon-magnifier" viewBox="0 0 24 24" width={32} height={32} shapeRendering="crispEdges" aria-hidden>
    <circle cx="10" cy="10" r="6" fill="#686864" stroke="#444440" strokeWidth="1" />
    <circle cx="10" cy="10" r="2" fill="#8a9492" />
    <rect x="14" y="14" width="6" height="2" fill="#686864" />
  </svg>
);
const PxIconBulb = () => (
  <svg className="px-icon px-icon-bulb" viewBox="0 0 20 20" width={20} height={20} shapeRendering="crispEdges" aria-hidden>
    <rect x="8" y="2" width="4" height="4" fill="#8a9492" />
    <rect x="6" y="6" width="8" height="2" fill="#8a9492" />
    <rect x="6" y="12" width="8" height="2" fill="#8a9492" />
    <rect x="4" y="14" width="4" height="4" fill="#686864" />
    <rect x="12" y="14" width="4" height="4" fill="#686864" />
  </svg>
);

// -----------------------------------------------------------------------------
// 常數：上傳限制
// -----------------------------------------------------------------------------
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ACCEPT_EXT = ".jpg,.jpeg,.png";

// -----------------------------------------------------------------------------
// 分析結果僅在兩張照片都上傳並點擊分析按鈕後顯示，不使用模擬資料
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// 拍攝計算器：常數與選項
// -----------------------------------------------------------------------------
const F_STOPS = ["f/1.4", "f/1.8", "f/2", "f/2.8", "f/4", "f/5.6", "f/8", "f/11", "f/16", "f/22"];
const SHUTTER_SPEEDS = ["1/8000", "1/4000", "1/2000", "1/1000", "1/500", "1/250", "1/125", "1/60", "1/30", "1/15", "1/8", "1/4"];
const ISO_VALUES = [100, 200, 400, 800, 1600, 3200, 6400, 12800, 25600];
const FOCAL_LENGTHS = [14, 20, 24, 28, 35, 50, 85, 135, 200, 300];
const ND_OPTIONS = [
  { label: "ND2 (1檔)",   stops: 1,  multiplier: 2 },
  { label: "ND4 (2檔)",   stops: 2,  multiplier: 4 },
  { label: "ND8 (3檔)",   stops: 3,  multiplier: 8 },
  { label: "ND16 (4檔)",  stops: 4,  multiplier: 16 },
  { label: "ND32 (5檔)",  stops: 5,  multiplier: 32 },
  { label: "ND64 (6檔)",  stops: 6,  multiplier: 64 },
  { label: "ND128 (7檔)", stops: 7,  multiplier: 128 },
  { label: "ND256 (8檔)", stops: 8,  multiplier: 256 },
  { label: "ND400",       stops: 8.6, multiplier: 400 },
  { label: "ND500 (9檔)", stops: 9,  multiplier: 500 },
  { label: "ND1000 (10檔)", stops: 10, multiplier: 1000 },
  { label: "ND4000 (12檔)", stops: 12, multiplier: 4000 },
  { label: "ND6400 (13檔)", stops: 13, multiplier: 6400 },
  { label: "ND32000 (15檔)", stops: 15, multiplier: 32000 },
];
const ORIGINAL_SHUTTERS = [
  "1/8000", "1/6400", "1/5000", "1/4000", "1/3200", "1/2500",
  "1/2000", "1/1600", "1/1250", "1/1000", "1/800",  "1/640",
  "1/500",  "1/400",  "1/320",  "1/250",  "1/200",  "1/160",
  "1/125",  "1/100",  "1/80",   "1/60",   "1/50",   "1/40",
  "1/30",
];
// 日落時間用：22 縣市經緯度、時區與選單 key（台灣 UTC+8，赫爾辛基 UTC+2）
const CITY_COORDINATES = {
  taipei: { name: "台北市", lat: 25.033, lng: 121.5654, tzOffset: 8 },
  "new-taipei": { name: "新北市", lat: 25.012, lng: 121.4659, tzOffset: 8 },
  keelung: { name: "基隆市", lat: 25.1276, lng: 121.7392, tzOffset: 8 },
  taoyuan: { name: "桃園市", lat: 24.9936, lng: 121.301, tzOffset: 8 },
  "hsinchu-city": { name: "新竹市", lat: 24.8138, lng: 120.9675, tzOffset: 8 },
  "hsinchu-county": { name: "新竹縣", lat: 24.8387, lng: 121.0177, tzOffset: 8 },
  miaoli: { name: "苗栗縣", lat: 24.5602, lng: 120.8214, tzOffset: 8 },
  taichung: { name: "台中市", lat: 24.1477, lng: 120.6736, tzOffset: 8 },
  changhua: { name: "彰化縣", lat: 24.0518, lng: 120.5161, tzOffset: 8 },
  nantou: { name: "南投縣", lat: 23.9609, lng: 120.9719, tzOffset: 8 },
  yunlin: { name: "雲林縣", lat: 23.7092, lng: 120.4313, tzOffset: 8 },
  "chiayi-city": { name: "嘉義市", lat: 23.4801, lng: 120.4491, tzOffset: 8 },
  "chiayi-county": { name: "嘉義縣", lat: 23.4518, lng: 120.2554, tzOffset: 8 },
  tainan: { name: "台南市", lat: 22.9999, lng: 120.2269, tzOffset: 8 },
  kaohsiung: { name: "高雄市", lat: 22.6273, lng: 120.3014, tzOffset: 8 },
  pingtung: { name: "屏東縣", lat: 22.5519, lng: 120.5487, tzOffset: 8 },
  yilan: { name: "宜蘭縣", lat: 24.7021, lng: 121.7378, tzOffset: 8 },
  hualien: { name: "花蓮縣", lat: 23.9871, lng: 121.6015, tzOffset: 8 },
  taitung: { name: "台東縣", lat: 22.7972, lng: 121.0713, tzOffset: 8 },
  penghu: { name: "澎湖縣", lat: 23.5711, lng: 119.5794, tzOffset: 8 },
  kinmen: { name: "金門縣", lat: 24.4489, lng: 118.3767, tzOffset: 8 },
  lienchiang: { name: "連江縣（馬祖）", lat: 26.1605, lng: 119.95, tzOffset: 8 },
  helsinki: { name: "赫爾辛基", lat: 60.1695, lng: 24.9354, tzOffset: 2 },
};

// 將快門字串轉為秒（數值）
function shutterToSeconds(s) {
  if (s.includes("/")) {
    const parts = s.split("/");
    const denom = parseFloat(parts[1]);
    if (!denom || !Number.isFinite(denom)) return 0;
    return 1 / denom;
  }
  const numeric = parseFloat(s.replace("s", ""));
  return Number.isNaN(numeric) ? 0 : numeric;
}

// 標準快門列表（秒）用於找最接近
const SHUTTER_SECONDS = [1 / 8000, 1 / 4000, 1 / 2000, 1 / 1000, 1 / 500, 1 / 250, 1 / 125, 1 / 60, 1 / 30, 1 / 15, 1 / 8, 1 / 4];

// 手震風險：顯示用標準快門（分母）
const SHAKE_STANDARD_SHUTTER_DENS = [4, 8, 15, 30, 60, 125, 250, 500, 1000, 2000, 4000, 8000];

function getBoundingStandardShutterDens(den) {
  const v = Math.max(1, Math.round(Number(den) || 0));
  const list = SHAKE_STANDARD_SHUTTER_DENS;

  if (v <= list[0]) return [list[0], list[1] ?? list[0]];
  if (v >= list[list.length - 1]) return [list[list.length - 2] ?? list[list.length - 1], list[list.length - 1]];

  const exactIdx = list.indexOf(v);
  if (exactIdx !== -1) {
    const next = list[exactIdx + 1];
    if (next != null) return [list[exactIdx], next];
    return [list[exactIdx - 1] ?? list[exactIdx], list[exactIdx]];
  }

  for (let i = 0; i < list.length - 1; i += 1) {
    const a = list[i];
    const b = list[i + 1];
    if (a < v && v < b) return [a, b];
  }
  return [list[list.length - 2], list[list.length - 1]];
}

function formatShutterDenPair(den) {
  const [a, b] = getBoundingStandardShutterDens(den);
  return `1/${a} 或 1/${b}`;
}

function formatShutterFromSeconds(sec) {
  if (sec >= 1) return `${sec % 1 === 0 ? sec : sec.toFixed(1)} 秒`;
  const frac = 1 / sec;
  if (frac >= 1 && Math.abs(frac - Math.round(frac)) < 0.01) return `1/${Math.round(frac)} 秒`;
  return `${sec.toFixed(2)} 秒`;
}

// -----------------------------------------------------------------------------
// 工具 1：景深計算器
// -----------------------------------------------------------------------------
const CAMERA_TYPES = [
  { id: "ff", label: "全片幅", coc: 0.03, cocLabel: "CoC = 0.030mm" },
  { id: "apsc", label: "APS-C", coc: 0.019, cocLabel: "CoC = 0.019mm" },
  { id: "m43", label: "M43", coc: 0.015, cocLabel: "CoC = 0.015mm" },
];

function calcDoF(fStop, focalLength, distance, cocMm) {
  const CoC = cocMm;
  const aperture = parseFloat(String(fStop).replace("f/", ""));
  const focalLengthM = focalLength / 1000;
  const H = (focalLength * focalLength) / (aperture * CoC * 1000);
  const Dn = (distance * H) / (H + distance - focalLengthM);
  const Df = (distance * H) / (H - distance + focalLengthM);
  const DoF = Number.isFinite(Df) && Df > 0 ? Df - Dn : Infinity;
  const nearDoF = distance - Dn;
  const farDoF = Number.isFinite(Df) && Df > 0 ? Df - distance : Infinity;
  return { Dn, Df, DoF, nearDoF, farDoF };
}

// 建議光圈：景深過淺 → 縮小光圈（較大 f 值）；背景模糊不足 → 開大光圈（較小 f 值）
function suggestFStop(currentFStr, direction) {
  const idx = F_STOPS.indexOf(currentFStr);
  if (idx === -1) return currentFStr;
  if (direction === "smallerAperture") return F_STOPS[Math.min(idx + 1, F_STOPS.length - 1)];
  return F_STOPS[Math.max(idx - 1, 0)];
}

function DoFCalculator() {
  const [cameraType, setCameraType] = useState("apsc");
  const [fStop, setFStop] = useState("f/2.8");
  const [customFStop, setCustomFStop] = useState(2.8);
  const [focalLengthChoice, setFocalLengthChoice] = useState("50");
  const [customFocalLength, setCustomFocalLength] = useState(50);
  const [distance, setDistance] = useState(3);
  const [result, setResult] = useState(null);

  const coc = CAMERA_TYPES.find((c) => c.id === cameraType)?.coc ?? 0.019;
  const effectiveFStop = fStop === "custom" ? `f/${customFStop}` : fStop;
  const effectiveFocalLength = focalLengthChoice === "custom" ? customFocalLength : Number(focalLengthChoice);

  const handleCalc = () => {
    const raw = calcDoF(effectiveFStop, effectiveFocalLength, distance, coc);
    const DfInf = !Number.isFinite(raw.Df) || raw.Df < 0;
    setResult({ ...raw, DfInf, fStop: effectiveFStop, distance, focalLength: effectiveFocalLength });
  };

  return (
    <div className="rounded-2xl p-6 md:p-8 bg-[var(--color-bg-tertiary)] shadow-[0_4px_16px_rgba(0,0,0,0.2)] border border-[var(--color-border-primary)]">
      <div className="sectionHeader mb-4">
        <div className="sectionHeaderLeft">
          <span className="sectionIcon"><PxDepth size={24} className="calculator-title-icon" aria-hidden /></span>
          <div className="sectionTitleStack">
            <h3 className="sectionTitle calculator-title">景深計算器</h3>
            <p className="sectionSubtitle">計算景深範圍，掌握清晰與模糊的界線</p>
          </div>
        </div>
      </div>

      {/* style: form controls - 相機類型：卡片式單選 */}
      <div className="mb-6">
        <span className="text-sm font-medium text-[var(--color-dark-primary)] mb-3 block">相機類型</span>
        <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="相機類型">
          {CAMERA_TYPES.map((cam) => (
            <label
              key={cam.id}
              className={`
                flex-1 min-w-[100px] rounded-xl border-2 px-4 py-3 cursor-pointer transition-all
                shadow-[0_1px_3px_rgba(0,0,0,0.06)]
                ${cameraType === cam.id ? "border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/20 shadow-md" : "border-[var(--color-border-primary)] bg-[var(--color-bg-tertiary)] hover:border-[var(--color-accent-primary)]"}
              `}
            >
              <input
                type="radio"
                name="cameraType"
                value={cam.id}
                checked={cameraType === cam.id}
                onChange={() => setCameraType(cam.id)}
                className="sr-only"
              />
              <span className="block font-medium text-[var(--color-dark-primary)]">{cam.label}</span>
              <span className="block text-xs text-[var(--color-dark-primary)]/70 mt-0.5">{cam.cocLabel}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <label className="block">
          <span className="text-sm font-medium text-[var(--color-dark-primary)] mb-1 block">光圈值（f/）</span>
          <div className="flex gap-2">
            <select
              value={fStop}
              onChange={(e) => setFStop(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border-primary)] px-3 py-2.5 text-[var(--color-dark-primary)] bg-white focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)]"
            >
              {F_STOPS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
              <option value="custom">自訂</option>
            </select>
            {fStop === "custom" && (
              <input
                type="number"
                min={0.7}
                max={64}
                step={0.1}
                value={customFStop}
                onChange={(e) => setCustomFStop(Number(e.target.value) || 0.7)}
                className="w-[120px] rounded-lg border border-[var(--color-border-primary)] px-3 py-2.5 text-[var(--color-dark-primary)] bg-white focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)]"
                aria-label="自訂光圈值"
              />
            )}
          </div>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[var(--color-text-primary)] mb-1 block">焦距（mm）</span>
          <div className="flex gap-2">
            <select
              value={focalLengthChoice}
              onChange={(e) => setFocalLengthChoice(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border-primary)] px-3 py-2.5 text-[var(--color-dark-primary)] bg-white focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)]"
            >
              {FOCAL_LENGTHS.map((mm) => (
                <option key={mm} value={String(mm)}>{mm}</option>
              ))}
              <option value="custom">自訂</option>
            </select>
            {focalLengthChoice === "custom" && (
              <input
                type="number"
                min={1}
                max={2000}
                step={1}
                value={customFocalLength}
                onChange={(e) => setCustomFocalLength(Number(e.target.value) || 1)}
                className="w-[120px] rounded-lg border border-[var(--color-border-primary)] px-3 py-2.5 text-[var(--color-dark-primary)] bg-white focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)]"
                aria-label="自訂焦距"
              />
            )}
          </div>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[var(--color-dark-primary)] mb-1 block">對焦距離（m）</span>
          <input
            type="number"
            min={0.5}
            max={50}
            step={0.5}
            value={distance}
            onChange={(e) => setDistance(Number(e.target.value) || 0.5)}
            className="w-full rounded-lg border border-[var(--color-border-primary)] px-3 py-2.5 text-[var(--color-dark-primary)] bg-white focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)]"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={handleCalc}
        className="btn-primary btn-calculate"
      >
        計算景深
      </button>

      {result && (
        <div className="mt-6 space-y-6 analysis-result-enter">
          {/* 景深視覺化條 */}
          <DoFVisualBar result={result} />

          {/* 2x2 數值網格 */}
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/90 border border-[var(--color-border-primary)] p-4">
              <p className="text-xs font-medium text-[var(--color-dark-primary)]/70 mb-1">景深範圍</p>
              <p className="text-lg font-bold text-[var(--color-dark-primary)]">
                {result.Dn.toFixed(2)}–{result.DfInf ? "∞" : `${result.Df.toFixed(2)}`} m
              </p>
            </div>
            <div className="rounded-xl bg-white/90 border border-[var(--color-border-primary)] p-4">
              <p className="text-xs font-medium text-[var(--color-dark-primary)]/70 mb-1">總景深</p>
              <p className="text-lg font-bold text-[var(--color-dark-primary)]">
                {result.DfInf ? "∞" : `${result.DoF.toFixed(2)} m`}
              </p>
            </div>
            <div className="rounded-xl bg-white/90 border border-[var(--color-border-primary)] p-4">
              <p className="text-xs font-medium text-[var(--color-dark-primary)]/70 mb-1">前景深</p>
              <p className="text-lg font-bold text-[var(--color-dark-primary)]">{result.nearDoF.toFixed(2)} m</p>
            </div>
            <div className="rounded-xl bg-white/90 border border-[var(--color-border-primary)] p-4">
              <p className="text-xs font-medium text-[var(--color-dark-primary)]/70 mb-1">後景深</p>
              <p className="text-lg font-bold text-[var(--color-dark-primary)]">
                {result.DfInf ? "∞" : `${result.farDoF.toFixed(2)} m`}
              </p>
            </div>
          </div>

          {/* 風險提示 */}
          <DoFRiskAlerts result={result} />
        </div>
      )}
    </div>
  );
}

// 景深視覺化條：左模糊 | 清楚區 | 右模糊，標註近景 / 對焦點 / 遠景
function DoFVisualBar({ result }) {
  const { Dn, Df, DfInf, distance, nearDoF, farDoF } = result;
  const maxD = DfInf ? distance + (distance - Dn) * 2 : Math.max(Df, distance + 0.5);
  const minD = Math.max(0.1, Dn - (distance - Dn) * 0.5);
  const range = maxD - minD;
  const pctN = ((Dn - minD) / range) * 100;
  const pctFocus = ((distance - minD) / range) * 100;
  // 遠景有限時用 Df；無限時清楚區延伸到對焦點外一段（對稱延伸）
  const clearEnd = DfInf ? distance + (distance - Dn) : Df;
  const pctF = ((clearEnd - minD) / range) * 100;
  const clearWidth = Math.min(100 - pctN, Math.max(2, pctF - pctN));

  return (
    <div className="rounded-xl border border-[var(--color-border-primary)] bg-white/90 p-4 shadow-sm">
      <p className="text-sm font-medium text-[var(--color-dark-primary)] mb-3">景深範圍</p>
      <div className="relative h-12 rounded-lg overflow-hidden bg-[var(--color-bg-tertiary)]">
        {/* 左模糊 */}
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--color-border-primary)]/80 to-[var(--color-border-primary)]/60"
          style={{ width: `${pctN}%` }}
        />
        {/* 清楚區 */}
        <div
          className="absolute inset-y-0 dof-bar-clear bg-[var(--color-accent-primary)]/90"
          style={{ left: `${pctN}%`, width: `${clearWidth}%` }}
        />
        {/* 右模糊 */}
        <div
          className="absolute inset-y-0 right-0 bg-gradient-to-l from-[var(--color-border-primary)]/80 to-[var(--color-border-primary)]/60"
          style={{ left: `${pctN + clearWidth}%`, width: `${100 - pctN - clearWidth}%` }}
        />
        {/* 對焦點垂直線 */}
        <div
          className="focus-marker absolute top-0 bottom-0 w-0.5 bg-[var(--color-dark-primary)] shadow-md z-10"
          style={{ left: `${pctFocus}%`, transform: "translateX(-50%)" }}
          aria-hidden
        />
      </div>
      <div className="flex justify-between mt-2 text-xs text-[var(--color-dark-primary)]">
        <span>近景清楚 {Dn.toFixed(2)}m</span>
        <span className="font-semibold text-[var(--color-accent-primary)]">對焦點 {distance.toFixed(2)}m</span>
        <span>{DfInf ? "遠景 → ∞" : `遠景清楚 ${Df.toFixed(2)}m`}</span>
      </div>
      <div className="flex justify-center gap-6 mt-1 text-sm text-[var(--color-dark-primary)]/80">
        <span>前景深：{nearDoF.toFixed(2)}m</span>
        <span>後景深：{DfInf ? "∞" : `${farDoF.toFixed(2)}m`}</span>
      </div>
    </div>
  );
}

// 風險提示：對焦失誤（總景深 < 0.5m）、背景模糊不足（> 3m）、無則顯示良好
function DoFRiskAlerts({ result }) {
  const totalDoF = result.DfInf ? Infinity : result.DoF;
  const isShallow = totalDoF < 0.5;
  const isDeep = Number.isFinite(totalDoF) && totalDoF > 3;
  const fSuggestSmaller = suggestFStop(result.fStop, "smallerAperture");
  const fSuggestLarger = suggestFStop(result.fStop, "largerAperture");

  if (!isShallow && !isDeep) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 flex items-center gap-3">
        <span className="pixel-icon-check" aria-hidden />
        <p className="font-medium text-emerald-800">參數設定良好</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {isShallow && (
        <div className="rounded-xl border-2 border-amber-200 bg-amber-50/90 px-4 py-3 shadow-sm">
          <p className="font-semibold text-amber-800 flex items-center gap-2">
            <span className="pixel-icon-warning" aria-hidden /> 景深過淺
          </p>
          <p className="text-sm text-amber-700 mt-1">
            總景深僅 {result.DoF.toFixed(2)}m，對焦需要非常精確。
          </p>
          <p className="text-sm font-medium text-amber-800 mt-2">
            建議：縮小光圈至 {fSuggestSmaller} 或增加對焦距離。
          </p>
        </div>
      )}
      {isDeep && (
        <div className="rounded-xl border-2 border-[var(--color-accent-primary)] bg-[var(--color-bg-secondary)] px-4 py-3 shadow-sm">
          <p className="font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
            <span className="pixel-icon-bulb" aria-hidden /> 背景模糊效果有限
          </p>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            景深較大，背景不易虛化。
          </p>
          <p className="text-sm font-medium text-[var(--color-accent-primary)] mt-2">
            建議：開大光圈至 {fSuggestLarger} 或使用更長焦距。
          </p>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// 工具 2：曝光三角計算器（當前 EV + 3 組等效曝光）
// -----------------------------------------------------------------------------
function calcEV(apertureStr, shutterStr, iso) {
  const apertureValue = parseFloat(String(apertureStr).replace("f/", ""));
  const shutterValue = shutterToSeconds(shutterStr);
  const isoValue = parseInt(iso, 10);
  const EV = Math.log2((apertureValue * apertureValue) / shutterValue) + Math.log2(isoValue / 100);
  return EV;
}

// 給定目標 EV、ISO，求快門秒數：N^2/t = 2^(EV - log2(ISO/100)) => t = N^2 / 2^(EV - log2(ISO/100))
function evToShutterSeconds(apertureValue, isoValue, ev) {
  const n2 = apertureValue * apertureValue;
  const term = Math.pow(2, ev - Math.log2(isoValue / 100));
  return n2 / term;
}

function pickNearestShutter(sec) {
  let best = SHUTTER_SPEEDS[0];
  let bestSec = shutterToSeconds(best);
  let bestDiff = Math.abs(bestSec - sec);
  for (const s of SHUTTER_SPEEDS) {
    const v = shutterToSeconds(s);
    const d = Math.abs(v - sec);
    if (d < bestDiff) {
      bestDiff = d;
      best = s;
      bestSec = v;
    }
  }
  return best;
}

// 噪點容忍度上限
const NOISE_TOLERANCE_LIMITS = {
  conservative: 800,
  normal: 1600,
  aggressive: 3200,
};

const NOISE_TOLERANCE_LABELS = {
  conservative: "保守",
  normal: "一般",
  aggressive: "激進",
};

// 曝光用相機類型（用於裁切係數 / 安全快門）
const EXPOSURE_CAMERA_TYPES = [
  { id: "fullframe", label: "全片幅" },
  { id: "apsc", label: "APS-C" },
  { id: "m43", label: "M43" },
];

const EXPOSURE_CROP_FACTORS = {
  fullframe: 1,
  apsc: 1.5,
  m43: 2,
};

// 計算安全快門（以分母形式，例如 50 代表 1/50 秒）
function calculateSafeShutterDen(focalLength, cameraType) {
  const cropFactor = EXPOSURE_CROP_FACTORS[cameraType] ?? 1;
  return Math.ceil(focalLength * cropFactor);
}

// 將當前快門字串轉成分母（例如 "1/60" -> 60）
function shutterStringToDenominator(shutterStr) {
  const sec = shutterToSeconds(shutterStr);
  if (!Number.isFinite(sec) || sec <= 0) return 0;
  const den = 1 / sec;
  return den;
}

// 手震風險建議
function calculateShakeRiskSuggestions(currentShutterDen, safeShutterDen, apertureValue, isoValue) {
  const current = Math.max(1, currentShutterDen);
  const safe = Math.max(1, safeShutterDen);
  const shutterGap = safe / current; // 需要提升的倍數

  // 建議的快門速度（分母越大代表快門越快）
  const suggestedShutter = Math.round(safe * 1.5); // 比安全快門快約 1.5 倍

  // 建議的光圈（開大，假設每檔降低光圈值 1.4 倍）
  const apertureStops = Math.log2(shutterGap);
  const suggestedApertureRaw = apertureValue / Math.pow(1.4, Math.ceil(apertureStops));
  const suggestedAperture = Math.max(1.4, Number(suggestedApertureRaw.toFixed(1))); // 最大光圈通常是 f/1.4

  // 建議的 ISO（提升）
  const suggestedISO = Math.min(6400, Math.ceil((isoValue * shutterGap) / 100) * 100); // 以 100 為單位

  return {
    suggestedShutter,
    suggestedAperture,
    suggestedISO,
  };
}

function checkCameraShakeRisk(shutterStr, focalLength, cameraType, apertureValue, isoValue) {
  const safeShutterDen = calculateSafeShutterDen(focalLength, cameraType);
  const currentDen = shutterStringToDenominator(shutterStr);

  // 如果快門速度慢於安全快門，有手震風險
  if (currentDen && currentDen < safeShutterDen) {
    const suggestions = calculateShakeRiskSuggestions(currentDen, safeShutterDen, apertureValue, isoValue);
    return {
      hasRisk: true,
      safeShutter: safeShutterDen,
      currentShutter: Math.max(1, Math.round(currentDen)),
      suggestions,
    };
  }

  return { hasRisk: false };
}

// 噪點風險建議
function calculateNoiseRiskSuggestions(currentISO, maxISO, apertureValue, shutterStr) {
  const isoReduction = currentISO / maxISO; // 需要降低的倍數

  // 建議的 ISO
  const suggestedISO = maxISO;

  // 建議的光圈（開大以補償 ISO 降低）
  const apertureStops = Math.log2(isoReduction);
  const suggestedApertureRaw = apertureValue / Math.pow(1.4, Math.ceil(apertureStops));
  const suggestedAperture = Math.max(1.4, Number(suggestedApertureRaw.toFixed(1)));

  // 建議的快門（降低以補償 ISO 降低）
  const currentDen = shutterStringToDenominator(shutterStr);
  const suggestedShutterRaw = currentDen / isoReduction;
  const suggestedShutter = Math.max(30, Math.floor(suggestedShutterRaw)); // 快門不低於 1/30

  return {
    suggestedISO,
    suggestedAperture,
    suggestedShutter,
  };
}

function checkNoiseRisk(isoValue, toleranceKey, apertureValue, shutterStr) {
  const maxISO = NOISE_TOLERANCE_LIMITS[toleranceKey] ?? NOISE_TOLERANCE_LIMITS.normal;

  if (isoValue > maxISO) {
    return {
      hasRisk: true,
      currentISO: isoValue,
      maxISO,
      tolerance: toleranceKey,
      suggestions: calculateNoiseRiskSuggestions(isoValue, maxISO, apertureValue, shutterStr),
    };
  }

  return { hasRisk: false };
}

function ExposureCalculator() {
  const [aperture, setAperture] = useState("f/2.8");
  const [shutter, setShutter] = useState("1/125");
  const [iso, setIso] = useState("400");
  const [focalLengthChoice, setFocalLengthChoice] = useState("50");
  const [cameraType, setCameraType] = useState("apsc");
  const [noiseTolerance, setNoiseTolerance] = useState("normal");
  const [cameraShakeRisk, setCameraShakeRisk] = useState(null);
  const [noiseRiskData, setNoiseRiskData] = useState(null);
  const [result, setResult] = useState(null);
  const [customApertureInput, setCustomApertureInput] = useState("2.8");
  const [customShutterDenInput, setCustomShutterDenInput] = useState("125");
  const [customISOInput, setCustomISOInput] = useState("400");
  const [customFocalLengthInput, setCustomFocalLengthInput] = useState("50");
  const [customErrors, setCustomErrors] = useState({
    aperture: "",
    shutterDen: "",
    iso: "",
    focalLength: "",
  });

  const parsedCustomAperture = Number(customApertureInput);
  const parsedCustomShutterDen = Number(customShutterDenInput);
  const parsedCustomISO = Number(customISOInput);
  const parsedCustomFocalLength = Number(customFocalLengthInput);

  const isCustomApertureValid =
    Number.isFinite(parsedCustomAperture) && parsedCustomAperture >= 0.7 && parsedCustomAperture <= 64;
  const isCustomShutterDenValid =
    Number.isFinite(parsedCustomShutterDen) &&
    Number.isInteger(parsedCustomShutterDen) &&
    parsedCustomShutterDen >= 1 &&
    parsedCustomShutterDen <= 8000;
  const isCustomISOValid = Number.isFinite(parsedCustomISO) && parsedCustomISO >= 50 && parsedCustomISO <= 102400;
  const isCustomFocalLengthValid =
    Number.isFinite(parsedCustomFocalLength) && parsedCustomFocalLength >= 1 && parsedCustomFocalLength <= 2000;

  const validateCustomAperture = (raw) => {
    const v = Number(raw);
    if (!Number.isFinite(v) || v < 0.7 || v > 64) return "光圈值請輸入 0.7 ~ 64 之間的數值";
    return "";
  };

  const validateCustomShutterDen = (raw) => {
    const v = Number(raw);
    if (!Number.isFinite(v) || !Number.isInteger(v) || v < 1 || v > 8000) return "快門分母請輸入 1 ~ 8000 之間的整數";
    return "";
  };

  const validateCustomISO = (raw) => {
    const v = Number(raw);
    if (!Number.isFinite(v) || v < 50 || v > 102400) return "ISO 請輸入 50 ~ 102400 之間的數值";
    return "";
  };

  const validateCustomFocalLength = (raw) => {
    const v = Number(raw);
    if (!Number.isFinite(v) || v < 1 || v > 2000) return "焦距請輸入 1 ~ 2000 之間的數值";
    return "";
  };

  const effectiveApertureStr =
    aperture === "custom" && isCustomApertureValid ? `f/${parsedCustomAperture}` : aperture;
  const effectiveShutterStr =
    shutter === "custom" && isCustomShutterDenValid ? `1/${parsedCustomShutterDen}` : shutter;
  const effectiveISOStr = iso === "custom" && isCustomISOValid ? String(parsedCustomISO) : String(iso);
  const effectiveFocalLength =
    focalLengthChoice === "custom" && isCustomFocalLengthValid ? parsedCustomFocalLength : Number(focalLengthChoice);

  const handleCalc = () => {
    const nextErrors = {
      aperture: aperture === "custom" ? validateCustomAperture(customApertureInput) : "",
      shutterDen: shutter === "custom" ? validateCustomShutterDen(customShutterDenInput) : "",
      iso: iso === "custom" ? validateCustomISO(customISOInput) : "",
      focalLength: focalLengthChoice === "custom" ? validateCustomFocalLength(customFocalLengthInput) : "",
    };
    setCustomErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    const ev = calcEV(effectiveApertureStr, effectiveShutterStr, effectiveISOStr);
    const aVal = parseFloat(effectiveApertureStr.replace("f/", ""));
    const isoNum = parseInt(effectiveISOStr, 10);
    // 三組：f/4, f/2.8, f/5.6 固定 ISO 400，反算快門
    const combos = [
      { f: "f/4", n: 4 },
      { f: "f/2.8", n: 2.8 },
      { f: "f/5.6", n: 5.6 },
    ].map(({ f, n }) => {
      const t = evToShutterSeconds(n, isoNum, ev);
      const nearest = pickNearestShutter(t);
      return { aperture: f, shutter: nearest, iso: isoNum };
    });
    setResult({ ev, combos });

    // ---------- 風險檢測 ----------
    const shakeRisk = checkCameraShakeRisk(effectiveShutterStr, effectiveFocalLength, cameraType, aVal, isoNum);
    const noiseRisk = checkNoiseRisk(isoNum, noiseTolerance, aVal, effectiveShutterStr);

    setCameraShakeRisk(shakeRisk.hasRisk ? shakeRisk : null);
    setNoiseRiskData(noiseRisk.hasRisk ? noiseRisk : null);
  };

  // 即時重算風險（不重算 EV / 等效組合）
  useEffect(() => {
    if (!result) return; // 還沒按過「計算曝光值」就不要顯示風險

    const hasInvalidCustom =
      (aperture === "custom" && !isCustomApertureValid) ||
      (shutter === "custom" && !isCustomShutterDenValid) ||
      (iso === "custom" && !isCustomISOValid) ||
      (focalLengthChoice === "custom" && !isCustomFocalLengthValid);
    if (hasInvalidCustom) {
      setCameraShakeRisk(null);
      setNoiseRiskData(null);
      return;
    }

    const aVal = parseFloat(effectiveApertureStr.replace("f/", ""));
    const isoNum = parseInt(effectiveISOStr, 10);

    const shakeRisk = checkCameraShakeRisk(effectiveShutterStr, effectiveFocalLength, cameraType, aVal, isoNum);
    const noiseRisk = checkNoiseRisk(isoNum, noiseTolerance, aVal, effectiveShutterStr);

    setCameraShakeRisk(shakeRisk.hasRisk ? shakeRisk : null);
    setNoiseRiskData(noiseRisk.hasRisk ? noiseRisk : null);
  }, [
    aperture,
    shutter,
    iso,
    focalLengthChoice,
    cameraType,
    noiseTolerance,
    result,
    effectiveApertureStr,
    effectiveShutterStr,
    effectiveISOStr,
    effectiveFocalLength,
  ]);

  return (
    <div className="rounded-2xl p-6 md:p-8 bg-[var(--color-bg-tertiary)] shadow-[0_4px_16px_rgba(0,0,0,0.2)] border border-[var(--color-border-primary)]">
      <div className="sectionHeader mb-4">
        <div className="sectionHeaderLeft">
          <span className="sectionIcon"><PxExposure size={24} className="calculator-title-icon" aria-hidden /></span>
          <div className="sectionTitleStack">
            <h3 className="sectionTitle calculator-title">曝光三角計算器</h3>
            <p className="sectionSubtitle">調整光圈、快門、ISO，維持相同曝光值</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4 exposure-params-grid">
        <label className="block">
          <span className="text-sm font-medium text-[var(--color-dark-primary)] mb-1 block">光圈（f/）</span>
          <div className="flex gap-2">
            <select
              value={aperture}
              onChange={(e) => setAperture(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border-primary)] px-3 py-2.5 text-[var(--color-dark-primary)] bg-white focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)]"
            >
              {F_STOPS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
              <option value="custom">自訂</option>
            </select>
            {aperture === "custom" && (
              <div className="w-[120px]">
                <input
                  type="number"
                  step="0.1"
                  value={customApertureInput}
                  onChange={(e) => {
                    const next = e.target.value;
                    setCustomApertureInput(next);
                    if (customErrors.aperture) setCustomErrors((prev) => ({ ...prev, aperture: validateCustomAperture(next) }));
                  }}
                  onBlur={() => setCustomErrors((prev) => ({ ...prev, aperture: validateCustomAperture(customApertureInput) }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                  }}
                  className="w-full rounded-lg border border-[var(--color-border-primary)] px-3 py-2.5 text-[var(--color-dark-primary)] bg-white focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)]"
                  aria-label="自訂光圈"
                />
                {customErrors.aperture && <p className="mt-1 text-xs text-red-600">{customErrors.aperture}</p>}
              </div>
            )}
          </div>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[var(--color-dark-primary)] mb-1 block">快門速度</span>
          <div className="flex gap-2">
            <select
              value={shutter}
              onChange={(e) => setShutter(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border-primary)] px-3 py-2.5 text-[var(--color-dark-primary)] bg-white focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)]"
            >
              {SHUTTER_SPEEDS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
              <option value="custom">自訂</option>
            </select>
            {shutter === "custom" && (
              <div className="w-[120px]">
                <input
                  type="number"
                  step="1"
                  value={customShutterDenInput}
                  onChange={(e) => {
                    const next = e.target.value;
                    setCustomShutterDenInput(next);
                    if (customErrors.shutterDen) setCustomErrors((prev) => ({ ...prev, shutterDen: validateCustomShutterDen(next) }));
                  }}
                  onBlur={() => setCustomErrors((prev) => ({ ...prev, shutterDen: validateCustomShutterDen(customShutterDenInput) }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                  }}
                  className="w-full rounded-lg border border-[var(--color-border-primary)] px-3 py-2.5 text-[var(--color-dark-primary)] bg-white focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)]"
                  aria-label="自訂快門分母（1/x 秒）"
                />
                {customErrors.shutterDen && <p className="mt-1 text-xs text-red-600">{customErrors.shutterDen}</p>}
              </div>
            )}
          </div>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[var(--color-dark-primary)] mb-1 block">ISO</span>
          <div className="flex gap-2">
            <select
              value={iso}
              onChange={(e) => setIso(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border-primary)] px-3 py-2.5 text-[var(--color-dark-primary)] bg-white focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)]"
            >
              {ISO_VALUES.map((i) => (
                <option key={i} value={String(i)}>{i}</option>
              ))}
              <option value="custom">自訂</option>
            </select>
            {iso === "custom" && (
              <div className="w-[120px]">
                <input
                  type="number"
                  step="100"
                  value={customISOInput}
                  onChange={(e) => {
                    const next = e.target.value;
                    setCustomISOInput(next);
                    if (customErrors.iso) setCustomErrors((prev) => ({ ...prev, iso: validateCustomISO(next) }));
                  }}
                  onBlur={() => setCustomErrors((prev) => ({ ...prev, iso: validateCustomISO(customISOInput) }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                  }}
                  className="w-full rounded-lg border border-[var(--color-border-primary)] px-3 py-2.5 text-[var(--color-dark-primary)] bg-white focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)]"
                  aria-label="自訂 ISO"
                />
                {customErrors.iso && <p className="mt-1 text-xs text-red-600">{customErrors.iso}</p>}
              </div>
            )}
          </div>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[var(--color-text-primary)] mb-1 block">焦距（mm）</span>
          <div className="flex gap-2">
            <select
              value={focalLengthChoice}
              onChange={(e) => setFocalLengthChoice(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border-primary)] px-3 py-2.5 text-[var(--color-dark-primary)] bg-white focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)]"
            >
              {FOCAL_LENGTHS.map((mm) => (
                <option key={mm} value={String(mm)}>{mm}</option>
              ))}
              <option value="custom">自訂</option>
            </select>
            {focalLengthChoice === "custom" && (
              <div className="w-[120px]">
                <input
                  type="number"
                  step="1"
                  value={customFocalLengthInput}
                  onChange={(e) => {
                    const next = e.target.value;
                    setCustomFocalLengthInput(next);
                    if (customErrors.focalLength) setCustomErrors((prev) => ({ ...prev, focalLength: validateCustomFocalLength(next) }));
                  }}
                  onBlur={() => setCustomErrors((prev) => ({ ...prev, focalLength: validateCustomFocalLength(customFocalLengthInput) }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                  }}
                  className="w-full rounded-lg border border-[var(--color-border-primary)] px-3 py-2.5 text-[var(--color-dark-primary)] bg-white focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)]"
                  aria-label="自訂焦距（曝光）"
                />
                {customErrors.focalLength && <p className="mt-1 text-xs text-red-600">{customErrors.focalLength}</p>}
              </div>
            )}
          </div>
        </label>
      </div>

      {/* 相機類型選擇（裁切係數） */}
      <div className="mb-6">
        <span className="text-sm font-medium text-[var(--color-dark-primary)] mb-2 block">相機類型（裁切係數）</span>
        <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="相機類型（曝光）">
          {EXPOSURE_CAMERA_TYPES.map((cam) => (
            <label
              key={cam.id}
              className={`
                flex-1 min-w-[100px] rounded-xl border-2 px-4 py-2.5 cursor-pointer transition-all
                shadow-[0_1px_3px_rgba(0,0,0,0.06)]
                ${cameraType === cam.id ? "border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/20 shadow-md" : "border-[var(--color-border-primary)] bg-[var(--color-bg-tertiary)] hover:border-[var(--color-accent-primary)]"}
              `}
            >
              <input
                type="radio"
                name="exposureCameraType"
                value={cam.id}
                checked={cameraType === cam.id}
                onChange={() => setCameraType(cam.id)}
                className="sr-only"
              />
              <span className="block font-medium text-[var(--color-dark-primary)]">{cam.label}</span>
            </label>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleCalc}
        className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[var(--color-accent-primary)] text-[var(--color-dark-primary)] font-semibold text-lg shadow-lg hover:bg-[var(--color-accent-secondary)] hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-hover)] focus:ring-offset-2"
      >
        計算曝光值
      </button>

      {result && (
        <div className="result-section analysis-result-enter space-y-6">
          <p className="text-[var(--color-text-primary)] font-medium">
            當前曝光值：<span className="text-xl font-bold text-[var(--color-text-primary)]">EV {result.ev.toFixed(1)}</span>
          </p>
          <p className="text-sm font-medium text-[var(--color-text-secondary)] mt-2">建議組合（等效曝光）：</p>
          <ul className="space-y-2">
            {result.combos.map((c, i) => (
              <li key={i} className="text-[var(--color-text-primary)] font-medium">
                光圈 {c.aperture} ＋ 快門 {c.shutter} ＋ ISO {c.iso}
              </li>
            ))}
          </ul>

          {/* 拍攝風險檢測 */}
          <div className="exposure-risk-detection">
            <h4 className="risk-detection-title">拍攝風險檢測</h4>

            <div className="risk-alerts-container">
              {/* 手震風險 */}
              {cameraShakeRisk && (
                <div className="risk-alert risk-warning">
                  <div className="risk-icon" aria-hidden />
                  <div className="risk-content">
                    <h5 className="risk-title">手震風險</h5>
                    <p className="risk-description">
                      快門速度 1/{cameraShakeRisk.currentShutter} 低於安全快門 {formatShutterDenPair(cameraShakeRisk.safeShutter)}，可能造成畫面模糊
                    </p>
                    <div className="risk-suggestions">
                      <strong>建議改善方式：</strong>
                      <ul>
                        <li>提升快門速度至 {formatShutterDenPair(cameraShakeRisk.suggestions.suggestedShutter)} 或更快</li>
                        <li>開大光圈至 f/{cameraShakeRisk.suggestions.suggestedAperture}（增加進光量）</li>
                        <li>提升 ISO 至 {cameraShakeRisk.suggestions.suggestedISO}（補償曝光）</li>
                        <li>使用腳架或開啟防手震功能</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* 噪點風險 */}
              {noiseRiskData && (
                <div className="risk-alert risk-info noise-risk">
                  <div className="risk-icon" aria-hidden />
                  <div className="risk-content">
                    <h5 className="risk-title">噪點風險</h5>
                    <p className="risk-description">
                      ISO {noiseRiskData.currentISO} 超過
                      {NOISE_TOLERANCE_LABELS[noiseRiskData.tolerance] || ""}模式建議值（{noiseRiskData.maxISO}），畫質可能下降
                    </p>
                    <div className="risk-suggestions">
                      <strong>建議改善方式：</strong>
                      <ul>
                        <li>降低 ISO 至 {noiseRiskData.suggestions.suggestedISO}（提升畫質）</li>
                        <li>開大光圈至 f/{noiseRiskData.suggestions.suggestedAperture}（增加進光量）</li>
                        <li>降低快門速度至 1/{Math.round(noiseRiskData.suggestions.suggestedShutter)}（如有腳架）</li>
                        <li>增加現場光源或使用閃光燈</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* 參數良好 */}
              {!cameraShakeRisk && !noiseRiskData && (
                <div className="risk-alert risk-success">
                  <div className="risk-icon" aria-hidden />
                  <div className="risk-content">
                    <h5 className="risk-title">參數設定良好</h5>
                    <p className="risk-description">
                      曝光參數平衡，適合當前拍攝需求
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 畫質要求標準（超過多少 ISO 就警告） */}
            <div className="noise-tolerance-setting">
              <h4 className="tolerance-section-title">畫質要求標準</h4>
              <p className="tolerance-description">
                設定你對噪點的接受程度，系統會根據此標準檢查你的 ISO 設定是否過高
              </p>
              <label className="tolerance-label">選擇你的畫質要求：</label>
              <div className="tolerance-buttons">
                <button
                  type="button"
                  className={`tolerance-btn ${noiseTolerance === "conservative" ? "active" : ""}`}
                  onClick={() => setNoiseTolerance("conservative")}
                >
                  <span className="btn-title">極致畫質</span>
                  <span className="btn-desc">ISO 超過 800 就警告</span>
                </button>
                <button
                  type="button"
                  className={`tolerance-btn ${noiseTolerance === "normal" ? "active" : ""}`}
                  onClick={() => setNoiseTolerance("normal")}
                >
                  <span className="btn-title">平衡模式</span>
                  <span className="btn-desc">ISO 超過 1600 就警告</span>
                </button>
                <button
                  type="button"
                  className={`tolerance-btn ${noiseTolerance === "aggressive" ? "active" : ""}`}
                  onClick={() => setNoiseTolerance("aggressive")}
                >
                  <span className="btn-title">亮度優先</span>
                  <span className="btn-desc">ISO 超過 3200 就警告</span>
                </button>
              </div>
              <div className="tolerance-hint">
                <span className="hint-icon" aria-hidden />
                <span className="hint-text">
                  這不會改變你輸入的 ISO 數值，只是設定「何時提醒你 ISO 可能過高」的標準
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// 工具 3：拍攝情境推薦（獨立頁面）
// -----------------------------------------------------------------------------
function ScenarioRecommendationTool() {
  const [activeStep, setActiveStep] = useState(1);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [selectedPreferences, setSelectedPreferences] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [lightCondition, setLightCondition] = useState(null);
  const [supportType, setSupportType] = useState(null);
  const [focalRange, setFocalRange] = useState(null);
  const [subjectDistance, setSubjectDistance] = useState(null);
  const [errors, setErrors] = useState({
    scenario: false,
    light: false,
    support: false,
    focal: false,
    distance: false,
  });
  const [conflictWarning, setConflictWarning] = useState("");

  const step1Ref = useRef(null);
  const step2Ref = useRef(null);
  const step3Ref = useRef(null);
  const prevActiveStepRef = useRef(activeStep);

  const isStep1Active = activeStep === 1;
  const isStep2Active = activeStep === 2;
  const isStep3Active = activeStep === 3;

  const isStep1Completed = !!(selectedScenario && lightCondition && supportType);
  const isStep2Completed = !!(isStep1Completed && focalRange && subjectDistance);

  const getStepTabId = (step) => `scenario-step-tab-${step}`;
  const getStepPanelId = (step) => `scenario-step-panel-${step}`;

  const handleScenarioClick = (scenario) => {
    setSelectedScenario(scenario);
    setRecommendations(null);
    setErrors((prev) => ({ ...prev, scenario: false }));
  };

  const handlePreferenceChange = (e) => {
    const value = e.target.value;
    const checked = e.target.checked;

    setSelectedPreferences((prev) => {
      if (checked) {
        // 最多兩個，選第三個時自動捨棄最早的
        if (prev.length >= 2) {
          return [...prev.slice(1), value];
        }
        if (prev.includes(value)) return prev;
        return [...prev, value];
      }
      return prev.filter((p) => p !== value);
    });
  };

  useEffect(() => {
    const prevStep = prevActiveStepRef.current;
    if (prevStep === activeStep) return;

    const getStepContainer = (step) => {
      if (step === 1) return step1Ref.current;
      if (step === 2) return step2Ref.current;
      if (step === 3) return step3Ref.current;
      return null;
    };

    const prevContainer = getStepContainer(prevStep);
    const activeEl = document.activeElement;
    if (prevContainer && activeEl && prevContainer.contains(activeEl)) {
      if (typeof activeEl.blur === "function") {
        activeEl.blur();
      }
    }

    const nextContainer = getStepContainer(activeStep);
    if (nextContainer) {
      const focusTarget =
        nextContainer.querySelector('[data-focus-initial="true"]') ||
        nextContainer.querySelector(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
      if (focusTarget && typeof focusTarget.focus === "function") {
        focusTarget.focus();
      }
    }

    prevActiveStepRef.current = activeStep;
  }, [activeStep]);

  const getRecommendations = () => {
    const nextErrors = {
      scenario: !selectedScenario,
      light: !lightCondition,
      support: !supportType,
      focal: !focalRange,
      distance: !subjectDistance,
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      if (!isStep1Completed) setActiveStep(1);
      else setActiveStep(2);
      return;
    }

    // 衝突處理：凍結動作 vs 保留動態感
    let conflictMsg = "";
    const hasFreeze = selectedPreferences.includes("freeze-motion");
    const hasKeepMotion = selectedPreferences.includes("keep-motion");
    const hasLowNoise = selectedPreferences.includes("low-noise");
    const isNightLowLight = lightCondition === "night-lowlight";
    const isHandheldSupport = supportType === "handheld";

    if (hasFreeze && hasKeepMotion) {
      // 忽略保留動態感，優先凍結動作
      conflictMsg = "偏好衝突：已優先套用「凍結動作」，忽略「保留動態感」。";
    }

    // 基礎 EV 對照
    const baseEVMap = {
      "sun-strong": 15,
      "sun-shade": 12,
      cloudy: 11,
      "golden-hour": 13,
      "indoor-natural": 8,
      "night-lowlight": 4,
    };
    const baseEV = baseEVMap[lightCondition] ?? 12;

    // 光圈基準
    const scenarioApertureRanges = {
      portrait: [1.8, 2.8],
      landscape: [8, 11],
      sports: [4, 5.6],
      night: [2, 2.8],
      sunset: [8, 11],
      studio: [2, 2.8],
    };
    const [apMinBase, apMaxBase] = scenarioApertureRanges[selectedScenario] ?? [2.8, 4];

    const pickStandardAperture = (target) => {
      const candidates = F_STOPS.map((s) => parseFloat(s.replace("f/", "")));
      let best = candidates[0];
      let bestDiff = Math.abs(candidates[0] - target);
      for (let i = 1; i < candidates.length; i += 1) {
        const d = Math.abs(candidates[i] - target);
        if (d < bestDiff) {
          bestDiff = d;
          best = candidates[i];
        }
      }
      return best;
    };

    // 主體距離修正
    let apMin = apMinBase;
    let apMax = apMaxBase;
    if (subjectDistance === "macro") {
      apMin *= 1.4;
      apMax *= 2;
    } else if (subjectDistance === "far") {
      apMin *= 1.4;
      apMax *= 1.4;
    }

    const hasShallow = selectedPreferences.includes("shallow-dof");
    const hasHighContrast = selectedPreferences.includes("high-contrast-detail");

    let baseApertureVal = (apMin + apMax) / 2;
    if (hasShallow) {
      baseApertureVal = apMinBase;
    } else if (hasHighContrast) {
      baseApertureVal *= 1.4;
    }
    const baseAperture = pickStandardAperture(baseApertureVal);

    // 焦段（取範圍中間）
    const focalRangeMap = {
      ultrawide: 14,
      wide: 24,
      standard: 50,
      "short-tele": 85,
      tele: 135,
    };
    const focalMm = focalRangeMap[focalRange] ?? 50;

    // 安全快門（秒）
    const standardShutters = SHUTTER_SPEEDS.map((s) => {
      const [, denStr] = s.split("/");
      return 1 / Number(denStr);
    }).sort((a, b) => a - b);

    const pickNearestShutterSeconds = (seconds) => {
      if (!Number.isFinite(seconds) || seconds <= 0) return standardShutters[0];
      let best = standardShutters[0];
      let bestDiff = Math.abs(standardShutters[0] - seconds);
      for (let i = 1; i < standardShutters.length; i += 1) {
        const d = Math.abs(standardShutters[i] - seconds);
        if (d < bestDiff) {
          bestDiff = d;
          best = standardShutters[i];
        }
      }
      return best;
    };

    const formatShutterLabel = (seconds) => {
      if (!Number.isFinite(seconds) || seconds <= 0) return "1/125";
      if (seconds >= 1) {
        const rounded = Math.round(seconds * 10) / 10;
        return `${rounded.toFixed(1)}s`;
      }
      const den = Math.round(1 / seconds);
      return `1/${den}`;
    };

    const isoSequence = [100, 200, 400, 800, 1600, 3200, 6400];

    const calcSafeShutterSeconds = () => {
      if (supportType === "tripod") return null;
      let baseSec = 1 / focalMm;
      if (supportType === "monopod") baseSec *= 2; // 降一級
      if (supportType === "gimbal") baseSec *= 4; // 降兩級
      return pickNearestShutterSeconds(baseSec);
    };

    const hasFreezeMotion = hasFreeze;
    const hasKeepMotionPref = hasKeepMotion;
    const hasCorrectExposure = selectedPreferences.includes("correct-exposure");

    const parseShutterToSeconds = (label) => {
      if (!label) return 0;
      if (label.endsWith("s")) {
        const v = Number(label.replace("s", ""));
        return Number.isFinite(v) && v > 0 ? v : 0;
      }
      if (label.startsWith("1/")) {
        const den = Number(label.slice(2));
        return Number.isFinite(den) && den > 0 ? 1 / den : 0;
      }
      return 0;
    };

    const calcCombo = (mode) => {
      // mode: "standard" | "quality" | "safety"
      let apertureVal = baseAperture;
      if (mode === "quality" && !hasShallow) {
        // 略縮一級換畫質
        apertureVal = pickStandardAperture(apertureVal * 1.4);
      } else if (mode === "safety" && hasShallow) {
        // 安全模式微縮一級拉回一點景深
        apertureVal = pickStandardAperture(apertureVal * 1.2);
      }

      let isoIdx = 0;
      if (mode === "quality") {
        isoIdx = 0; // 盡量從 100 開始
      } else if (mode === "safety") {
        isoIdx = 2; // 從 400 起，偏安全
      }
      let isoVal = isoSequence[isoIdx];
      let overrodeLowNoiseISO = false;

      // EV 公式：t = N^2 / (2^EV) * (ISO/100)
      const apSquared = apertureVal * apertureVal;

      // 標準模式：直接用 EV 反推快門；高畫質：偏向慢一點換低 ISO；安全：先瞄準更快快門
      let t = (apSquared / (2 ** baseEV)) * (100 / isoVal);

      if (mode === "safety") {
        const safe = calcSafeShutterSeconds();
        if (safe) {
          // 目標快門比安全快門再快一些（約 1.5 倍）
          const target = Math.max(safe / 1.5, 1 / 1000);
          t = target;
          // 反推 ISO 以維持亮度
          const neededISO = (apSquared / (2 ** baseEV)) * (100 / t);
          // 就近取 ISO 檔位
          let chosenISO = isoSequence[isoSequence.length - 1];
          for (let i = 0; i < isoSequence.length; i += 1) {
            if (isoSequence[i] >= neededISO) {
              chosenISO = isoSequence[i];
              break;
            }
          }
          if (hasLowNoise && chosenISO > 800) overrodeLowNoiseISO = true;
          isoVal = chosenISO;
        }
      }

      // 偏好快門修正
      const safeShutterSec = calcSafeShutterSeconds();
      if (hasFreezeMotion) {
        const minFreeze = 1 / 500;
        if (t > minFreeze) t = minFreeze;
      } else if (hasKeepMotionPref && !hasFreezeMotion) {
        if (supportType === "tripod" || supportType === "gimbal") {
          // 1/15 ~ 1/4 區間中間
          t = 1 / 8;
        }
      }

      // 安全快門與 ISO 補償
      if (safeShutterSec && (supportType === "handheld" || supportType === "monopod" || supportType === "gimbal")) {
        if (t > safeShutterSec) {
          const factor = t / safeShutterSec;
          // 需要提亮幾級
          const stops = Math.log2(factor);
          const targetISO = isoVal * 2 ** stops;
          let chosenISO = isoSequence[0];
          for (let i = 0; i < isoSequence.length; i += 1) {
            if (isoSequence[i] >= targetISO) {
              chosenISO = isoSequence[i];
              break;
            }
          }
          if (hasLowNoise && chosenISO > 800) {
            overrodeLowNoiseISO = true;
          }
          isoVal = chosenISO;
          t = safeShutterSec;
        }
      }

      // 重新計算 t 以符合 EV 與最終 ISO / N，除非「優先保持曝光正確」要求嚴格守住
      if (hasCorrectExposure) {
        t = (apSquared / (2 ** baseEV)) * (100 / isoVal);
      }

      // ISO 提升以避免曝光不足
      const brightnessFactor = (apSquared / t) * (100 / isoVal);
      const evAchieved = Math.log2(brightnessFactor || 1);
      if (evAchieved < baseEV - 0.5) {
        for (let i = isoSequence.indexOf(isoVal) + 1; i < isoSequence.length; i += 1) {
          const candidateISO = isoSequence[i];
          if (hasLowNoise && candidateISO > 800) {
            overrodeLowNoiseISO = true;
          }
          isoVal = candidateISO;
          const factor2 = (apSquared / t) * (100 / isoVal);
          const ev2 = Math.log2(factor2 || 1);
          if (ev2 >= baseEV - 0.5) break;
        }
      }

      const finalShutterSec = pickNearestShutterSeconds(t);
      const shutterLabel = formatShutterLabel(finalShutterSec);

      // 風險評估
      let isoRisk = "";
      if (overrodeLowNoiseISO && hasLowNoise && isoVal > 800) {
        isoRisk =
          "光線條件不足，無法在 ISO 800 內達到正確曝光，已自動調整 ISO。";
      } else if ((!hasLowNoise && isoVal >= 3200) || (hasLowNoise && isoVal > 800)) {
        isoRisk = "高 ISO 可能產生明顯噪點，建議留意暗部與陰影細節。";
      }
      let shakeRisk = "";
      if (safeShutterSec && finalShutterSec > safeShutterSec) {
        shakeRisk = "快門低於安全快門，手持時容易產生手震模糊。";
      }

      let title = "標準組合";
      if (mode === "quality") title = "高畫質優先";
      if (mode === "safety") title = "安全手持優先";

      let reasonLines = [];
      if (mode === "standard") {
        reasonLines.push("根據場景與主體距離選擇光圈，兼顧景深與背景表現。");
      } else if (mode === "quality") {
        reasonLines.push("盡量壓低 ISO，優先保留細節與動態範圍。");
      } else {
        reasonLines.push("優先提高快門速度，降低手震與主體位移風險。");
      }
      if (hasShallow) {
        reasonLines.push("偏好淺景深，光圈設定偏大以強化背景虛化。");
      }
      if (hasFreezeMotion) {
        reasonLines.push("偏好凍結動作，快門不低於 1/500 秒。");
      } else if (hasKeepMotionPref && (supportType === "tripod" || supportType === "gimbal")) {
        reasonLines.push("偏好保留動態感，使用慢速快門表現運動軌跡。");
      }
      if (hasLowNoise) {
        reasonLines.push("低噪點優先，ISO 不超過約 800。");
      }
      if (hasCorrectExposure) {
        reasonLines.push("優先保持曝光接近理論值，較少犧牲速度或 ISO。");
      }

      const risks = [];
      if (shakeRisk) risks.push(shakeRisk);
      if (isoRisk) risks.push(isoRisk);

      // 預期畫面效果
      let predictedEffect = "";
      if (apertureVal <= 2.8 && (subjectDistance === "near" || subjectDistance === "macro")) {
        predictedEffect = "背景虛化明顯，主體與背景分離感強。";
      } else if (apertureVal >= 8 && (selectedScenario === "landscape" || subjectDistance === "far")) {
        predictedEffect = "畫面多數元素清晰，適合表現整體場景與細節。";
      }
      if (finalShutterSec <= 1 / 1000 && (selectedScenario === "sports" || hasFreezeMotion)) {
        predictedEffect = (predictedEffect ? predictedEffect + " " : "") + "動作清晰凍結，畫面銳利。";
      } else if (finalShutterSec >= 1 / 15 && (supportType === "tripod" || supportType === "gimbal")) {
        predictedEffect = (predictedEffect ? predictedEffect + " " : "") + "可拍出流水、光軌等絲滑動態感。";
      }
      if (isoVal >= 3200 && isNightLowLight) {
        predictedEffect = (predictedEffect ? predictedEffect + " " : "") + "畫面可能出現較明顯顆粒感，需留意暗部表現。";
      }

      // 實拍小提示
      let shootingHint = "";
      if ((supportType === "handheld" || supportType === "monopod") && finalShutterSec >= 1 / 60) {
        shootingHint = "手持慢速快門時建議憋氣並靠牆或欄杆穩定身體，降低手震機率。";
      } else if (apertureVal <= 2.8 && selectedScenario === "portrait") {
        shootingHint = "大光圈人像建議將對焦點放在眼睛，避免景深過淺導致關鍵部位失焦。";
      } else if (isoVal >= 3200) {
        shootingHint = "高 ISO 拍攝後建議在 Lightroom / Camera Raw 中使用亮度噪點滑桿進行降噪。";
      } else if (finalShutterSec <= 1 / 1000 && selectedScenario === "sports") {
        shootingHint = "運動場景建議搭配連拍模式，提升抓到決定性瞬間的機率。";
      }
      if (supportType === "tripod") {
        shootingHint = (shootingHint ? shootingHint + " " : "") + "使用腳架時記得關閉鏡頭防手震功能，避免產生反效果。";
      }

      return {
        title,
        aperture: apertureVal,
        shutter: shutterLabel,
        iso: isoVal,
        reason: reasonLines.join(" "),
        risk: risks.join(" "),
        predictedEffect,
        shootingHint,
      };
    };

    const comboStandard = calcCombo("standard");
    const comboQuality = calcCombo("quality");
    const comboSafety = calcCombo("safety");

    const results = [comboStandard, comboQuality, comboSafety];

    // 差異性檢查與微調
    const shutterSecs = results.map((c) => parseShutterToSeconds(c.shutter));
    const isAllShutterSame =
      shutterSecs[0] > 0 &&
      Math.abs(shutterSecs[0] - shutterSecs[1]) < 1e-6 &&
      Math.abs(shutterSecs[1] - shutterSecs[2]) < 1e-6;

    const isos = results.map((c) => c.iso);
    const isAllIsoSame = isos[0] === isos[1] && isos[1] === isos[2];

    // 推薦 2 ISO <= 推薦 1 ISO
    if (results[1].iso > results[0].iso) {
      const targetISO = Math.max(100, results[0].iso / 2);
      const ap = results[1].aperture;
      const apSq = ap * ap;
      const t2 = (apSq / (2 ** baseEV)) * (100 / targetISO);
      const sec2 = pickNearestShutterSeconds(t2);
      results[1].iso = targetISO;
      results[1].shutter = formatShutterLabel(sec2);
      shutterSecs[1] = parseShutterToSeconds(results[1].shutter);
    }

    // 推薦 3 快門 >= 推薦 1 快門（更快）
    if (shutterSecs[2] > shutterSecs[0]) {
      const ap3 = results[2].aperture;
      const apSq3 = ap3 * ap3;
      const targetSec = Math.max(shutterSecs[0] / 2, 1 / 1000);
      const neededISO3 = (apSq3 / (2 ** baseEV)) * (100 / targetSec);
      let chosenISO3 = isoSequence[isoSequence.length - 1];
      for (let i = 0; i < isoSequence.length; i += 1) {
        if (isoSequence[i] >= neededISO3) {
          chosenISO3 = isoSequence[i];
          break;
        }
      }
      results[2].iso = chosenISO3;
      results[2].shutter = formatShutterLabel(pickNearestShutterSeconds(targetSec));
      shutterSecs[2] = parseShutterToSeconds(results[2].shutter);
    }

    // 若快門三組仍完全相同，強行拉開：quality 慢一級，safety 快一級
    if (isAllShutterSame) {
      // quality 慢一級
      const baseSec = shutterSecs[1] || shutterSecs[0] || 1 / 125;
      const slower = pickNearestShutterSeconds(baseSec * 2);
      results[1].shutter = formatShutterLabel(slower);
      // safety 快一級
      const faster = pickNearestShutterSeconds(baseSec / 2);
      results[2].shutter = formatShutterLabel(faster);
    }

    // 若 ISO 三組仍完全相同，強行讓 quality 更低、safety 更高
    if (isAllIsoSame) {
      const baseISO = results[0].iso;
      // quality 盡量壓到 100
      results[1].iso = 100;
      const apQ = results[1].aperture;
      const tQ = (apQ * apQ / (2 ** baseEV)) * (100 / results[1].iso);
      results[1].shutter = formatShutterLabel(pickNearestShutterSeconds(tQ));

      // safety 往上拉一檔 ISO
      let nextISO = baseISO;
      for (let i = 0; i < isoSequence.length; i += 1) {
        if (isoSequence[i] > baseISO) {
          nextISO = isoSequence[i];
          break;
        }
      }
      results[2].iso = nextISO;
      const apS = results[2].aperture;
      const tS = (apS * apS / (2 ** baseEV)) * (100 / results[2].iso);
      results[2].shutter = formatShutterLabel(pickNearestShutterSeconds(tS));
    }

    // 複合條件警告
    let extraConflict = conflictMsg;
    if (hasLowNoise && isNightLowLight && isHandheldSupport) {
      extraConflict +=
        (extraConflict ? " " : "") +
        "此條件下「低噪點」與「夜晚低光手持」難以同時滿足，建議使用腳架或提高容忍 ISO。";
    }
    if (hasKeepMotionPref && isHandheldSupport) {
      extraConflict +=
        (extraConflict ? " " : "") +
        "慢速快門搭配手持容易模糊，建議改用腳架或穩定器。";
    }
    setConflictWarning(extraConflict);

    setRecommendations(results);
    setActiveStep(3);
  };

  const handleNextFromStep1 = () => {
    const nextErrors = {
      ...errors,
      scenario: !selectedScenario,
      light: !lightCondition,
      support: !supportType,
    };
    setErrors(nextErrors);
    if (nextErrors.scenario || nextErrors.light || nextErrors.support) return;
    setActiveStep(2);
  };

  const handleReset = () => {
    setActiveStep(1);
    setSelectedScenario(null);
    setSelectedPreferences([]);
    setRecommendations(null);
    setLightCondition(null);
    setSupportType(null);
    setFocalRange(null);
    setSubjectDistance(null);
    setErrors({
      scenario: false,
      light: false,
      support: false,
      focal: false,
      distance: false,
    });
  };

  const renderStepItem = (step, label) => {
    const isActive = activeStep === step;
    const isCompleted = (step === 1 && isStep1Completed) || (step === 2 && isStep2Completed) || (step === 3 && recommendations);
    const baseCircle =
      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border";
    const baseLabel = "ml-2 text-xs sm:text-sm";
    const circleClass = isActive
      ? `${baseCircle} bg-[var(--fg-mid)] text-white border-[var(--fg-mid)]`
      : isCompleted
        ? `${baseCircle} bg-[var(--fg-bg-soft)] text-[var(--fg-mid)] border-[var(--fg-mid)]`
        : `${baseCircle} bg-transparent text-[var(--fg-mute)] border-[var(--fg-border)]`;
    const labelClass = isActive
      ? `${baseLabel} text-[var(--fg-ink)]`
      : isCompleted
        ? `${baseLabel} text-[var(--fg-mid)]`
        : `${baseLabel} text-[var(--fg-mute)]`;

    const displayNumber = step === 1 ? "①" : step === 2 ? "②" : "③";

    return (
      <button
        key={step}
        type="button"
        role="tab"
        id={getStepTabId(step)}
        aria-selected={isActive}
        aria-controls={getStepPanelId(step)}
        tabIndex={isActive ? 0 : -1}
        className="flex items-center min-w-0 focus:outline-none"
        onClick={() => setActiveStep(step)}
      >
        <div className={circleClass}>
          {isCompleted && !isActive ? "✓" : displayNumber}
        </div>
        <span className={labelClass}>{label}</span>
      </button>
    );
  };

  return (
    <div className="scenario-recommender">
      <div className="sticky top-0 z-10 -mx-4 px-4 pt-2 pb-3 bg-[var(--fg-bg,rgba(241,240,237,0.96))] bg-opacity-95 backdrop-blur-sm">
        <div
          className="flex items-center justify-between gap-3 text-[11px] sm:text-xs"
          role="tablist"
          aria-label="拍攝情境推薦步驟"
        >
          {renderStepItem(1, "拍攝條件")}
          <div className="flex-1 h-px mx-2 bg-[var(--fg-border)] opacity-60" />
          {renderStepItem(2, "細化設定")}
          <div className="flex-1 h-px mx-2 bg-[var(--fg-border)] opacity-60" />
          {renderStepItem(3, "獲得推薦")}
        </div>
      </div>

      <h3 className="scenario-title mt-3">拍攝情境推薦</h3>
      <p className="scenario-subtitle">依序完成步驟，獲得適合現場條件的曝光建議組合</p>

      {/* 第一步：拍攝條件 */}
      <div
        ref={step1Ref}
        className={`mt-4 space-y-4 transition-opacity duration-300 ${
          isStep1Active ? "opacity-100" : "opacity-0 pointer-events-none absolute -z-10"
        }`}
        aria-hidden={!isStep1Active}
        role="tabpanel"
        id={getStepPanelId(1)}
        aria-labelledby={getStepTabId(1)}
      >
        <div className="scenario-selection">
          <label className="scenario-label">
            選擇拍攝情境
            {errors.scenario && (
              <span className="ml-2 text-xs text-red-500 align-middle">請選擇此項目</span>
            )}
          </label>
          <div className="scenario-buttons">
            <button
              type="button"
              className={`scenario-btn ${selectedScenario === "portrait" ? "active" : ""}`}
              data-scenario="portrait"
              tabIndex={isStep1Active ? 0 : -1}
              onClick={() => handleScenarioClick("portrait")}
            >
              人像
            </button>
            <button
              type="button"
              className={`scenario-btn ${selectedScenario === "landscape" ? "active" : ""}`}
              data-scenario="landscape"
              tabIndex={isStep1Active ? 0 : -1}
              onClick={() => handleScenarioClick("landscape")}
            >
              風景
            </button>
            <button
              type="button"
              className={`scenario-btn ${selectedScenario === "sports" ? "active" : ""}`}
              data-scenario="sports"
              tabIndex={isStep1Active ? 0 : -1}
              onClick={() => handleScenarioClick("sports")}
            >
              運動
            </button>
            <button
              type="button"
              className={`scenario-btn ${selectedScenario === "night" ? "active" : ""}`}
              data-scenario="night"
              tabIndex={isStep1Active ? 0 : -1}
              onClick={() => handleScenarioClick("night")}
            >
              夜景
            </button>
            <button
              type="button"
              className={`scenario-btn ${selectedScenario === "sunset" ? "active" : ""}`}
              data-scenario="sunset"
              tabIndex={isStep1Active ? 0 : -1}
              onClick={() => handleScenarioClick("sunset")}
            >
              日落
            </button>
            <button
              type="button"
              className={`scenario-btn ${selectedScenario === "studio" ? "active" : ""}`}
              data-scenario="studio"
              tabIndex={isStep1Active ? 0 : -1}
              onClick={() => handleScenarioClick("studio")}
            >
              室內自然光
            </button>
          </div>
        </div>

        {/* 區塊一：光線條件（單選） */}
        <div className="scenario-selection">
          <label className="scenario-label">
            光線條件
            {errors.light && (
              <span className="ml-2 text-xs text-red-500 align-middle">請選擇此項目</span>
            )}
          </label>
          <div className="scenario-buttons">
            {[
              { id: "sun-strong", label: "晴天強光" },
              { id: "sun-shade", label: "晴天陰影" },
              { id: "cloudy", label: "陰天多雲" },
              { id: "golden-hour", label: "黃金時段" },
              { id: "indoor-natural", label: "室內自然光" },
              { id: "night-lowlight", label: "夜晚低光" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`scenario-btn ${lightCondition === opt.id ? "active" : ""}`}
                tabIndex={isStep1Active ? 0 : -1}
                onClick={() => {
                  setLightCondition(opt.id);
                  setErrors((prev) => ({ ...prev, light: false }));
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 區塊二：拍攝支撐方式（單選） */}
        <div className="scenario-selection">
          <label className="scenario-label">
            拍攝支撐方式
            {errors.support && (
              <span className="ml-2 text-xs text-red-500 align-middle">請選擇此項目</span>
            )}
          </label>
          <div className="scenario-buttons">
            {[
              { id: "handheld", label: "手持" },
              { id: "tripod", label: "腳架" },
              { id: "monopod", label: "獨腳架" },
              { id: "gimbal", label: "穩定器" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`scenario-btn ${supportType === opt.id ? "active" : ""}`}
                tabIndex={isStep1Active ? 0 : -1}
                onClick={() => {
                  setSupportType(opt.id);
                  setErrors((prev) => ({ ...prev, support: false }));
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            className="btn-primary min-h-[44px] px-6"
            data-focus-initial="true"
            tabIndex={isStep1Active ? 0 : -1}
            onClick={handleNextFromStep1}
          >
            下一步 →
          </button>
        </div>
      </div>

      {/* 第二步：細化設定 */}
      <div
        ref={step2Ref}
        className={`mt-4 space-y-4 transition-opacity duration-300 ${
          isStep2Active ? "opacity-100" : "opacity-0 pointer-events-none absolute -z-10"
        }`}
        aria-hidden={!isStep2Active}
        role="tabpanel"
        id={getStepPanelId(2)}
        aria-labelledby={getStepTabId(2)}
      >
        {/* 焦段範圍 */}
        <div className="scenario-selection">
          <label className="scenario-label">
            使用焦段
            {errors.focal && (
              <span className="ml-2 text-xs text-red-500 align-middle">請選擇此項目</span>
            )}
          </label>
          <div className="scenario-buttons">
            {[
              { id: "ultrawide", label: "超廣角（14mm以下）" },
              { id: "wide", label: "廣角（14~35mm）" },
              { id: "standard", label: "標準（35~70mm）" },
              { id: "short-tele", label: "中望遠（70~135mm）" },
              { id: "tele", label: "望遠（135mm以上）" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`scenario-btn ${focalRange === opt.id ? "active" : ""}`}
                tabIndex={isStep2Active ? 0 : -1}
                onClick={() => {
                  setFocalRange(opt.id);
                  setErrors((prev) => ({ ...prev, focal: false }));
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 主體距離 */}
        <div className="scenario-selection">
          <label className="scenario-label">
            主體距離
            {errors.distance && (
              <span className="ml-2 text-xs text-red-500 align-middle">請選擇此項目</span>
            )}
          </label>
          <div className="scenario-buttons">
            {[
              { id: "macro", label: "微距（50cm以內）" },
              { id: "near", label: "近景（50cm~2m）" },
              { id: "mid", label: "中景（2m~10m）" },
              { id: "far", label: "遠景（10m以上）" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`scenario-btn ${subjectDistance === opt.id ? "active" : ""}`}
                tabIndex={isStep2Active ? 0 : -1}
                onClick={() => {
                  setSubjectDistance(opt.id);
                  setErrors((prev) => ({ ...prev, distance: false }));
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 拍攝偏好 */}
        <div className="preference-selection">
          <label className="preference-label">拍攝偏好（可選1-2項）</label>
          <div className="preference-checkboxes">
            <label className="preference-item">
              <input
                type="checkbox"
                name="preference"
                value="shallow-dof"
                checked={selectedPreferences.includes("shallow-dof")}
                tabIndex={isStep2Active ? 0 : -1}
                onChange={handlePreferenceChange}
              />
              <span>淺景深（背景虛化）</span>
            </label>
            <label className="preference-item">
              <input
                type="checkbox"
                name="preference"
                value="freeze-motion"
                checked={selectedPreferences.includes("freeze-motion")}
                tabIndex={isStep2Active ? 0 : -1}
                onChange={handlePreferenceChange}
              />
              <span>凍結動作</span>
            </label>
            <label className="preference-item">
              <input
                type="checkbox"
                name="preference"
                value="low-noise"
                checked={selectedPreferences.includes("low-noise")}
                tabIndex={isStep2Active ? 0 : -1}
                onChange={handlePreferenceChange}
              />
              <span>低噪點優先</span>
            </label>
            <label className="preference-item">
              <input
                type="checkbox"
                name="preference"
                value="keep-motion"
                checked={selectedPreferences.includes("keep-motion")}
                tabIndex={isStep2Active ? 0 : -1}
                onChange={handlePreferenceChange}
              />
              <span>保留動態感（慢速快門）</span>
            </label>
            <label className="preference-item">
              <input
                type="checkbox"
                name="preference"
                value="high-contrast-detail"
                checked={selectedPreferences.includes("high-contrast-detail")}
                tabIndex={isStep2Active ? 0 : -1}
                onChange={handlePreferenceChange}
              />
              <span>高對比保留細節</span>
            </label>
            <label className="preference-item">
              <input
                type="checkbox"
                name="preference"
                value="correct-exposure"
                checked={selectedPreferences.includes("correct-exposure")}
                tabIndex={isStep2Active ? 0 : -1}
                onChange={handlePreferenceChange}
              />
              <span>優先保持曝光正確</span>
            </label>
          </div>
          {selectedPreferences.includes("freeze-motion") &&
            selectedPreferences.includes("keep-motion") && (
              <p className="mt-2 text-xs text-red-500">
                兩者方向相反，建議擇一選擇
              </p>
            )}
        </div>

        <div className="mt-6 flex flex-wrap justify-between gap-3">
          <button
            type="button"
            className="btn-primary min-h-[44px] px-4"
            tabIndex={isStep2Active ? 0 : -1}
            onClick={() => setActiveStep(1)}
          >
            ← 上一步
          </button>
          <button
            type="button"
            className="btn-recommend min-h-[44px] px-6"
            data-focus-initial="true"
            tabIndex={isStep2Active ? 0 : -1}
            onClick={getRecommendations}
          >
            獲得推薦組合 →
          </button>
        </div>
      </div>

      {/* 第三步：推薦結果 */}
      <div
        ref={step3Ref}
        className={`mt-4 space-y-4 transition-opacity duration-300 ${
          isStep3Active ? "opacity-100" : "opacity-0 pointer-events-none absolute -z-10"
        }`}
        aria-hidden={!isStep3Active}
        role="tabpanel"
        id={getStepPanelId(3)}
        aria-labelledby={getStepTabId(3)}
      >
        {conflictWarning && (
          <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {conflictWarning}
          </div>
        )}

        {recommendations && recommendations.length > 0 ? (
          <div className="recommendation-results">
            {recommendations.map((rec, index) => (
              <div className="recommendation-card" key={index}>
                <div className="card-header">
                  <span className="card-badge">推薦 {index + 1}</span>
                  <span className="card-title">{rec.title}</span>
                </div>
                <div className="card-settings">
                  <div className="setting-item">
                    <span className="setting-label">光圈</span>
                    <span className="setting-value">f/{rec.aperture}</span>
                  </div>
                  <div className="setting-item">
                    <span className="setting-label">快門</span>
                    <span className="setting-value">{rec.shutter}</span>
                  </div>
                  <div className="setting-item">
                    <span className="setting-label">ISO</span>
                    <span className="setting-value">{rec.iso}</span>
                  </div>
                </div>
                {/* 參數視覺化指示器 */}
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="setting-label text-[10px] uppercase tracking-wide">光圈</span>
                    <div className="flex-1 h-1 rounded-full bg-[var(--fg-bg-soft)] overflow-hidden">
                      <div
                        className="h-full bg-[var(--fg-accent)]"
                        style={{
                          width: `${Math.min(100, Math.max(0, ((Math.log2(22) - Math.log2(rec.aperture)) / (Math.log2(22) - Math.log2(1.4))) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="setting-label text-[10px] uppercase tracking-wide">快門</span>
                    <div className="flex-1 h-1 rounded-full bg-[var(--fg-bg-soft)] overflow-hidden">
                      <div
                        className="h-full bg-[var(--fg-accent)]"
                        style={{
                          width: `${(() => {
                            const parseShutter = (label) => {
                              if (!label) return 0;
                              if (label.endsWith("s")) {
                                const v = Number(label.replace("s", ""));
                                return Number.isFinite(v) ? v : 0;
                              }
                              if (label.startsWith("1/")) {
                                const den = Number(label.slice(2));
                                return Number.isFinite(den) && den > 0 ? 1 / den : 0;
                              }
                              return 0;
                            };
                            const t = parseShutter(rec.shutter) || 0;
                            const tMin = 1 / 8000;
                            const tMax = 1 / 4;
                            const clamped = Math.min(tMax, Math.max(tMin, t || tMin));
                            const pos = (Math.log2(clamped) - Math.log2(tMin)) / (Math.log2(tMax) - Math.log2(tMin));
                            return Math.min(100, Math.max(0, pos * 100));
                          })()}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="setting-label text-[10px] uppercase tracking-wide">ISO</span>
                    <div className="flex-1 h-1 rounded-full bg-[var(--fg-bg-soft)] overflow-hidden">
                      <div
                        className="h-full bg-[var(--fg-accent)]"
                        style={{
                          width: `${Math.min(100, Math.max(0, ((Math.log2(rec.iso || 100) - Math.log2(100)) / (Math.log2(6400) - Math.log2(100))) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="card-reason">
                  <strong>取捨說明：</strong>
                  <p>{rec.reason}</p>
                  {rec.risk && (
                    <p className="mt-1 text-xs text-amber-800">
                      風險提示：{rec.risk}
                    </p>
                  )}
                  {/* 預期畫面效果 */}
                  {rec.predictedEffect && (
                    <p className="mt-1 text-xs text-[var(--fg-mid)]">
                      預期畫面效果：{rec.predictedEffect}
                    </p>
                  )}
                  {/* 實拍小提示 */}
                  {rec.shootingHint && (
                    <p className="mt-1 text-[11px] text-[var(--fg-mute)]">
                      實拍小提示：{rec.shootingHint}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--fg-mute)]">
            尚未產生推薦組合，請先在前兩步完成條件並點擊「獲得推薦組合」。
          </p>
        )}

        <div className="mt-6 flex justify-start">
          <button
            type="button"
            className="btn-primary min-h-[44px] px-4"
            data-focus-initial="true"
            tabIndex={isStep3Active ? 0 : -1}
            onClick={handleReset}
          >
            ← 重新設定
          </button>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 工具 3：ND 鏡長曝光計算器
// -----------------------------------------------------------------------------
function NDCalculator() {
  const [originalShutter, setOriginalShutter] = useState("1/125");
  const [ndOption, setNdOption] = useState(
    ND_OPTIONS.find((o) => o.label.startsWith("ND64")) || ND_OPTIONS[0],
  ); // 預設 ND64，找不到就用第一個
  const [result, setResult] = useState(null);

  const handleCalc = () => {
    const shutterSeconds = shutterToSeconds(originalShutter);
    const ndMultiplier = ndOption.multiplier;
    const newShutterSec = shutterSeconds * ndMultiplier;
    let tip = "";
    if (newShutterSec > 30) tip = "建議使用 B 快門模式和計時器";
    else if (newShutterSec > 2) tip = "建議使用腳架和快門線";
    setResult({ newShutterSec, tip });
  };

  const displayTime = result
    ? (() => {
        const sec = result.newShutterSec;
        if (sec < 1) {
          // result < 1 秒：0.XX 秒
          return `${sec.toFixed(2)} 秒`;
        }
        if (sec < 60) {
          // 1–59 秒：X.X 秒
          return `${sec.toFixed(1)} 秒`;
        }
        if (sec < 3600) {
          // 60–3599 秒：X 分 Y 秒
          const totalSec = Math.round(sec);
          const minutes = Math.floor(totalSec / 60);
          const seconds = totalSec % 60;
          return `${minutes} 分 ${seconds} 秒`;
        }
        // 3600 秒以上：X 小時 Y 分 Z 秒
        const totalSec = Math.round(sec);
        const hours = Math.floor(totalSec / 3600);
        const remainder = totalSec % 3600;
        const minutes = Math.floor(remainder / 60);
        const seconds = remainder % 60;
        return `${hours} 小時 ${minutes} 分 ${seconds} 秒`;
      })()
    : "";

  return (
    <div className="rounded-2xl p-6 md:p-8 bg-[var(--color-bg-tertiary)] shadow-[0_4px_16px_rgba(0,0,0,0.2)] border border-[var(--color-border-primary)]">
      <div className="sectionHeader mb-4">
        <div className="sectionHeaderLeft">
          <span className="sectionIcon"><PxND size={24} className="calculator-title-icon" aria-hidden /></span>
          <div className="sectionTitleStack">
            <h3 className="sectionTitle calculator-title">ND 鏡長曝光計算器</h3>
            <p className="sectionSubtitle">使用 ND 減光鏡時的快門時間計算</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <label className="block">
          <span className="text-sm font-medium text-[var(--color-dark-primary)] mb-1 block">原始快門速度</span>
          <select
            value={originalShutter}
            onChange={(e) => setOriginalShutter(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-border-primary)] px-3 py-2.5 text-[var(--color-dark-primary)] bg-white focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)]"
          >
            {ORIGINAL_SHUTTERS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[var(--color-dark-primary)] mb-1 block">ND 鏡減光級數</span>
          <select
            value={ndOption.label}
            onChange={(e) => setNdOption(ND_OPTIONS.find((o) => o.label === e.target.value) || ND_OPTIONS[3])}
            className="w-full rounded-lg border border-[var(--color-border-primary)] px-3 py-2.5 text-[var(--color-dark-primary)] bg-white focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)]"
          >
            {ND_OPTIONS.map((o) => (
              <option key={o.label} value={o.label}>{o.label}</option>
            ))}
          </select>
        </label>
      </div>

      <button
        type="button"
        onClick={handleCalc}
        className="btn-primary btn-calculate"
      >
        計算曝光時間
      </button>

      {result && (
        <div className="result-section analysis-result-enter space-y-3">
          <p className="text-[var(--color-dark-primary)] font-medium">
            調整後快門速度：<span className="text-xl font-bold text-[var(--color-dark-primary)]">{displayTime}</span>
          </p>
          {result.tip && (
            <p className="text-sm text-amber-800 bg-amber-100 rounded-lg px-3 py-2">{result.tip}</p>
          )}
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// 工具 4：日落時間 / Golden Hour 查詢（NOAA 純前端計算）
// -----------------------------------------------------------------------------
function GoldenHourCalculator() {
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedCity, setSelectedCity] = useState("taipei");
  const [result, setResult] = useState(null);
  const [tick, setTick] = useState(0);

  const calculate = () => {
    const coord = CITY_COORDINATES[selectedCity];
    if (!coord || coord.tzOffset == null) {
      setResult(null);
      return;
    }
    const d = new Date(selectedDate + "T12:00:00");
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const sun = calcSunriseSunset(year, month, day, coord.lat, coord.lng, coord.tzOffset);

    if (sun.sunrise === -1) {
      setResult({ polar: "night", cityName: coord.name });
      return;
    }
    if (sun.sunrise === -2) {
      setResult({ polar: "day", cityName: coord.name });
      return;
    }

    const morningGoldenStart = sun.sunrise;
    const morningGoldenEnd = sun.sunrise + 60;
    const eveningGoldenStart = sun.sunset - 60;
    const eveningGoldenEnd = sun.sunset;
    const blueHourStart = sun.sunset;
    const blueHourEnd = sun.sunset + 40;

    const windows = {
      morningGoldenStart,
      morningGoldenEnd,
      eveningGoldenStart,
      eveningGoldenEnd,
      blueHourStart,
      blueHourEnd,
    };

    const data = {
      sunrise: formatMinutesToTime(sun.sunrise),
      morningGolden: `${formatMinutesToTime(morningGoldenStart)} - ${formatMinutesToTime(morningGoldenEnd)}`,
      sunset: formatMinutesToTime(sun.sunset),
      eveningGolden: `${formatMinutesToTime(eveningGoldenStart)} - ${formatMinutesToTime(eveningGoldenEnd)}`,
      blueHour: `${formatMinutesToTime(blueHourStart)} - ${formatMinutesToTime(blueHourEnd)}`,
    };

    setResult({
      sun,
      windows,
      data,
      cityName: coord.name,
      selectedDateObj: d,
    });
  };

  useEffect(() => {
    calculate();
  }, [selectedDate, selectedCity]);

  useEffect(() => {
    if (!result?.selectedDateObj) return;
    const mode = getTimeMode(result.selectedDateObj, new Date());
    if (mode !== "near") return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [result?.selectedDateObj, result?.sun]);

  const getCurrentMinutesInCityTz = () => {
    const coord = CITY_COORDINATES[selectedCity];
    if (!coord) return null;
    const now = new Date();
    const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    let localMinutes = utcMinutes + coord.tzOffset * 60;
    if (localMinutes < 0) localMinutes += 1440;
    if (localMinutes >= 1440) localMinutes -= 1440;
    return localMinutes;
  };

  const mode = result?.selectedDateObj ? getTimeMode(result.selectedDateObj, new Date()) : null;

  const statusDisplay = (() => {
    if (!result?.sun || result.polar || mode !== "near") return null;
    const currentMinutes = getCurrentMinutesInCityTz();
    if (currentMinutes == null) return null;
    const status = getShootingStatus(currentMinutes, result.sun, result.windows);
    return getStatusDisplay(status, currentMinutes, result.sun, result.windows);
  })();

  return (
    <div className="rounded-2xl p-6 md:p-8 bg-[var(--color-bg-tertiary)] shadow-[0_4px_16px_rgba(0,0,0,0.2)] border border-[var(--color-border-primary)]">
      <div className="sectionHeader mb-4">
        <div className="sectionHeaderLeft">
          <span className="sectionIcon"><PxSun size={24} className="calculator-title-icon" aria-hidden /></span>
          <div className="sectionTitleStack">
            <h3 className="sectionTitle calculator-title">日落時間查詢</h3>
            <p className="sectionSubtitle">找出拍攝黃金時段的最佳時機</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <label className="block">
          <span className="text-sm font-medium text-[var(--color-dark-primary)] mb-1 block">日期</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-border-primary)] px-3 py-2.5 text-[var(--color-dark-primary)] bg-white focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)]"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[var(--color-dark-primary)] mb-1 block">選擇城市</span>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-border-primary)] px-3 py-2.5 text-[var(--color-dark-primary)] bg-white focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)]"
          >
            <option value="">請選擇城市</option>
            <optgroup label="北部">
              <option value="taipei">台北市</option>
              <option value="new-taipei">新北市</option>
              <option value="keelung">基隆市</option>
              <option value="taoyuan">桃園市</option>
              <option value="hsinchu-city">新竹市</option>
              <option value="hsinchu-county">新竹縣</option>
            </optgroup>
            <optgroup label="中部">
              <option value="miaoli">苗栗縣</option>
              <option value="taichung">台中市</option>
              <option value="changhua">彰化縣</option>
              <option value="nantou">南投縣</option>
              <option value="yunlin">雲林縣</option>
            </optgroup>
            <optgroup label="南部">
              <option value="chiayi-city">嘉義市</option>
              <option value="chiayi-county">嘉義縣</option>
              <option value="tainan">台南市</option>
              <option value="kaohsiung">高雄市</option>
              <option value="pingtung">屏東縣</option>
            </optgroup>
            <optgroup label="東部">
              <option value="yilan">宜蘭縣</option>
              <option value="hualien">花蓮縣</option>
              <option value="taitung">台東縣</option>
            </optgroup>
            <optgroup label="離島">
              <option value="penghu">澎湖縣</option>
              <option value="kinmen">金門縣</option>
              <option value="lienchiang">連江縣（馬祖）</option>
            </optgroup>
            <optgroup label="海外">
              <option value="helsinki">赫爾辛基</option>
            </optgroup>
          </select>
        </label>
      </div>

      {result?.polar && (
        <div className="result-section analysis-result-enter">
          <div className="rounded-xl p-5 bg-amber-100 text-amber-900 font-medium">
            {result.polar === "day" ? "永晝（極晝）" : "永夜（極夜）"} — {result.cityName}
          </div>
        </div>
      )}

      {result && !result.polar && (
        <div className="result-section analysis-result-enter">
          <div className="space-y-4">
            {mode === "near" && statusDisplay && (
              <div className="sunset-status-banner sunset-info-banner status-box rounded-xl p-4 border border-[var(--color-border-primary)] bg-[var(--color-bg-tertiary)] shadow-sm">
                <span className="sunset-info-icon px-icon" aria-hidden><PxIconBulb /></span>
                <div>
                  <p className="status-label font-semibold text-[var(--color-dark-primary)]">
                    目前狀態：{statusDisplay.label}
                  </p>
                  <p className="status-countdown text-sm mt-1 text-[var(--color-dark-primary)]/80">
                    {statusDisplay.countdown}
                  </p>
                </div>
              </div>
            )}

            <div className="golden-hour-card sunset-result-card rounded-xl overflow-hidden p-5 shadow-md">
              <p className="sunset-card-title text-sm font-medium mb-3">Golden Hour（黃金時段）</p>
              <p className="sunset-row sunset-row-sunrise"><span className="sunset-label">日出</span><span className="sunset-time-value sunset-time-sunrise">{result.data.sunrise}</span></p>
              <p className="sunset-row sunset-row-golden"><span className="sunset-label">晨間 Golden Hour</span><span className="sunset-time-value sunset-time-golden">{result.data.morningGolden}</span></p>
              {(() => {
                const win = result.windows;
                const fmt = (m) => formatMinutesToTime(m);
                const middayBoundary = win.eveningGoldenStart - 180;
                const preppingBoundary = win.eveningGoldenStart - 60;
                return (
                  <>
                    <div className="sunset-divider" />
                    <p className="sunset-row"><span className="sunset-label">上午（光線偏硬）</span><span className="sunset-time-value">{fmt(win.morningGoldenEnd)} - {fmt(middayBoundary)}</span></p>
                    <p className="sunset-row"><span className="sunset-label">午後（光線漸柔）</span><span className="sunset-time-value">{fmt(middayBoundary)} - {fmt(preppingBoundary)}</span></p>
                    <div className="sunset-divider" />
                    <p className="sunset-row sunset-row-golden"><span className="sunset-label">傍晚 Golden Hour</span><span className="sunset-time-value sunset-time-golden">{result.data.eveningGolden}</span></p>
                  </>
                );
              })()}
            </div>
            <div className="blue-hour-card sunset-result-card rounded-xl overflow-hidden p-5 shadow-md">
              <p className="sunset-card-title text-sm font-medium mb-3">Blue Hour（藍調時刻）</p>
              <p className="sunset-row sunset-row-blue-hour"><span className="sunset-label">藍調時段</span><span className="sunset-time-value">{result.data.blueHour}</span></p>
              <p className="sunset-row sunset-row-sunset"><span className="sunset-label">日落</span><span className="sunset-time-value sunset-time-sunset">{result.data.sunset}</span></p>
            </div>
            <p className="sunset-hint">僅供參考，實際時間依當日天氣而定</p>
          </div>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// 拍攝計算器主面板：四工具標籤切換
// -----------------------------------------------------------------------------
const CALC_TOOLS = [
  { id: "dof", label: "景深", icon: PxDepth },
  { id: "exposure", label: "曝光三角", icon: PxExposure },
  { id: "scenario", label: "情境推薦", icon: PxCamera },
  { id: "nd", label: "ND 長曝光", icon: PxND },
  { id: "golden", label: "日落時間", icon: PxSun },
];

function ShootingCalculatorPanel() {
  const [activeTool, setActiveTool] = useState("dof");

  return (
    <section
      className="psa-calc-panel mt-2 min-w-0"
      aria-label="拍攝計算器"
    >
      {/* style: tabs - 頂部四個標籤 */}
      <div className="tool-tabs">
        {CALC_TOOLS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeTool === id}
            onClick={() => setActiveTool(id)}
            className={`
              tool-tab flex items-center gap-2 font-medium text-sm
              ${activeTool === id ? "active" : ""}
            `}
            data-tool={id === "dof" ? "depth" : id}
          >
            {Icon && <Icon size={16} className="tool-tab-icon" aria-hidden />}
            {label}
          </button>
        ))}
      </div>

      <div className="psa-calc-content">
        <div hidden={activeTool !== "dof"}>
          <DoFCalculator />
        </div>
        <div hidden={activeTool !== "exposure"}>
          <ExposureCalculator />
        </div>
        <div hidden={activeTool !== "scenario"}>
          <ScenarioRecommendationTool />
        </div>
        <div hidden={activeTool !== "nd"}>
          <NDCalculator />
        </div>
        <div hidden={activeTool !== "golden"}>
          <GoldenHourCalculator />
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// 上傳區域單一區塊：虛線框 + 預覽 / 上傳提示
// -----------------------------------------------------------------------------
function UploadZone({
  title,
  description,
  imageBase64,
  error,
  onSelect,
  onClear,
  inputRef,
  disabled,
  zoneType = "your",
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    // 檔案驗證：僅接受 .jpg / .jpeg / .png，最大 20MB；錯誤時由父層顯示紅色提示並 3 秒後自動消失
    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!validTypes.includes(file.type)) {
      onSelect(null, "請上傳 JPG 或 PNG 格式的圖片");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      onSelect(null, "照片太大（超過 20MB）。建議：如果是相機 RAW 檔，請先轉成 JPEG 或調整輸出品質。");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onSelect(reader.result, null);
    reader.onerror = () => onSelect(null, "讀取檔案失敗");
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    handleFile(file);
    e.target.value = ""; // 允許同一檔案再次觸發
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer?.files?.[0];
    handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleClick = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const showPreview = !!imageBase64;

  return (
    <div
      className={`upload-area rounded-2xl p-5 md:p-6 bg-[var(--color-bg-tertiary)] shadow-[0_4px_16px_rgba(0,0,0,0.2)] border border-[var(--color-border-primary)] min-h-[280px] flex flex-col ${zoneType === "reference" ? "reference-upload-zone" : "photo-upload-zone"}`}
    >
      <div className="sectionHeader mb-4">
        <div className="sectionHeaderLeft">
          <div className="sectionTitleStack">
            <h3 className="sectionTitle upload-section-title">{title}</h3>
            <p className="sectionSubtitle upload-section-description">{description}</p>
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_EXT}
        className="hidden"
        onChange={handleInputChange}
        aria-label={title}
      />

      {showPreview ? (
        /* 預覽區：隱藏虛線框、照片保持比例、最大高度 300–400px、hover 半透明遮罩、右上角「✕ 重新上傳」僅清除 */
        <div className="relative flex-1 rounded-xl overflow-hidden bg-[var(--color-bg-tertiary)] min-h-[200px] max-h-[400px] flex items-center justify-center group">
          <img
            src={imageBase64}
            alt="已上傳預覽"
            className="w-full max-h-[400px] object-contain"
          />
          {/* Hover 時整張照片上的半透明遮罩 */}
          <div
            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            aria-hidden
          />
          {/* 右上角「✕ 重新上傳」：半透明黑底白字，點擊僅清除照片回到上傳狀態 */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-black/60 text-white text-sm font-medium hover:bg-black/80 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="清除照片並重新上傳"
          >
            <X className="w-4 h-4" aria-hidden />
            重新上傳
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            upload-placeholder flex-1 min-h-[200px] rounded-xl border-2 border-dashed transition-all duration-200
            flex flex-col items-center justify-center gap-2 text-[var(--color-text-secondary)]
            hover:border-[var(--color-accent-primary)] hover:bg-[var(--color-bg-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:ring-offset-2
            ${isDragging ? "border-[var(--color-accent-primary)] bg-[var(--color-bg-tertiary)]" : "border-[var(--color-border-primary)]"}
            ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
          `}
        >
          <span className="upload-placeholder-icon" aria-hidden />
          <span className="font-medium text-[var(--color-text-secondary)]">點擊上傳照片</span>
          <span className="text-xs text-[var(--color-text-tertiary)]">支援 JPG, PNG</span>
        </button>
      )}

      {error && <p className="mt-2 text-sm text-red-500" role="alert">{error}</p>}
    </div>
  );
}

// -----------------------------------------------------------------------------
// 單一對比項目（進度條型）：你的照片（藍）vs 參考照片（紫）+ 淡藍提示框
// 數值由 Canvas getImageData 真實像素計算，單位 %
// -----------------------------------------------------------------------------
function ComparisonItem({ label, yours, reference, suggestion, referenceIsWarn }) {
  const yoursPct = Math.min(100, Math.max(0, yours));
  const refPct = Math.min(100, Math.max(0, reference));
  const refBarClass = referenceIsWarn ? "bar-f warn" : "bar-f ref";
  return (
    <div className="comparison-group comparison-item-card">
      <h3 className="comparison-title">{label}</h3>
      <div className="comparison-bars">
        <div className="bar-item">
          <span className="bar-label">你的照片</span>
          <div className="bar-container">
            <div
              className="bar-f yours"
              style={{ width: `${yoursPct}%` }}
              role="progressbar"
              aria-valuenow={yours}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
        <div className="bar-item">
          <span className="bar-label">參考照片</span>
          <div className="bar-container">
            <div
              className={refBarClass}
              style={{ width: `${refPct}%` }}
              role="progressbar"
              aria-valuenow={reference}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      </div>
      <div className="comparison-result">{suggestion}</div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 色溫分析：R-B 差值判斷偏暖/偏冷，估算 K 值，單位 K，建議文字自動生成
// 含智能分析模式顯示（圖二格式 + 藍色框分析模式）
// -----------------------------------------------------------------------------
function formatTempDisplay(tone) {
  if (!tone) return null;
  const name = tone.category === "cool" ? "偏冷" : tone.category === "warm" ? "偏暖" : "中性";
  return `${name}（約 ${tone.colorTemp}K）`;
}

function formatToneLabel(tone) {
  if (!tone) return null;
  const name = tone.category === "cool" ? "冷色調" : tone.category === "warm" ? "暖色調" : "中性色調";
  return `${name}（${tone.colorTemp}K）`;
}

// 移除 suggestion 中的百分比文字（移除 100%、99% 等，不影響 +20K）
function stripPercentage(text) {
  if (typeof text !== "string") return text ?? "";
  const cleaned = text.replace(/\s*\d+%\s*/g, "").trim();
  return cleaned || text;
}

// 統計圖表樣式圖標（柱狀圖）
const ModeIconSvg = () => (
  <svg className="mode-icon" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

function AnalysisModeSection({ toneMode, originalTone, referenceTone, isSameImage }) {
  const modeName = toneMode?.name ?? "-";
  const origToneStr = isSameImage ? "-" : (toneMode ? (formatToneLabel(originalTone) ?? "-") : "-");
  const refToneStr = isSameImage ? "-" : (toneMode ? (formatToneLabel(referenceTone) ?? "-") : "-");
  const descText = toneMode?.description ?? (isSameImage ? "偵測到原圖與參考圖相同，無需調整" : "-");

  return (
    <div className="analysis-mode-section" role="status">
      <h3 className="analysis-mode-title">
        <ModeIconSvg />
        分析模式
      </h3>
      <div className="mode-content-grid">
        <div className="mode-data-item">
          <span className="mode-label">偵測模式：</span>
          <span className="mode-value primary">{modeName}</span>
        </div>
        <div className="mode-data-item">
          <span className="mode-label">原圖色調：</span>
          <span className="mode-value">{origToneStr}</span>
        </div>
        <div className="mode-data-item">
          <span className="mode-label">參考色調：</span>
          <span className="mode-value">{refToneStr}</span>
        </div>
      </div>
      <div className="mode-description-box">{descText}</div>
    </div>
  );
}

function ColorTempItem({ yours, reference, suggestion, originalTone, referenceTone, isSameImage }) {
  const origTempStr = isSameImage ? "-" : (formatTempDisplay(originalTone) ?? yours);
  const refTempStr = isSameImage ? "-" : (formatTempDisplay(referenceTone) ?? reference);
  const proximityText = isSameImage ? "相同圖片" : stripPercentage(suggestion);

  return (
    <div className="comparison-group comparison-item-card">
      <h3 className="comparison-title">色溫分析</h3>
      <div className="comparison-bars">
        <div className="bar-item">
          <span className="bar-label">你的照片</span>
          <span className="temp-value">{origTempStr}</span>
        </div>
        <div className="bar-item">
          <span className="bar-label">參考照片</span>
          <span className="temp-value">{refTempStr}</span>
        </div>
      </div>
      <div className="comparison-result">{proximityText}</div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 調整預覽：Canvas 像素處理，套用 Lightroom 建議參數
// -----------------------------------------------------------------------------
function parseLrVal(str, defaultVal = 0) {
  if (str == null) return defaultVal;
  const num = parseFloat(String(str).replace(/[^\d.-]/g, ""));
  return Number.isNaN(num) ? defaultVal : num;
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;
  if (s === 0) r = g = b = l;
  else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

const clamp = (v) => Math.min(255, Math.max(0, v));

function applyLightroomParams(imageData, lr) {
  const data = imageData.data;
  const exp = Math.max(-5, Math.min(5, parseLrVal(lr.exposure, 0)));
  const con = Math.max(-100, Math.min(100, parseLrVal(lr.contrast, 0)));
  const conScaled = con * 0.7;
  const high = Math.max(-100, Math.min(100, parseLrVal(lr.highlights, 0)));
  const shad = Math.max(-100, Math.min(100, parseLrVal(lr.shadows, 0)));
  const white = Math.max(-100, Math.min(100, parseLrVal(lr.whites, 0)));
  const black = Math.max(-100, Math.min(100, parseLrVal(lr.blacks, 0)));
  const sat = Math.max(-100, Math.min(100, parseLrVal(lr.saturation, 0)));
  const vib = Math.max(-100, Math.min(100, parseLrVal(lr.vibrance, 0)));
  const colorTemp = Math.max(-50, Math.min(50, parseLrVal(lr.temperature, 0)));
  const tintVal = Math.max(-20, Math.min(20, parseLrVal(lr.tint, 0)));
  const redCurve = lr.redCurve ?? 0;
  const greenCurve = lr.greenCurve ?? 0;
  const blueCurve = lr.blueCurve ?? 0;

  const exposureMult = Math.pow(2, exp);
  const conFactor = (259 * (conScaled + 255)) / (255 * (259 - conScaled));

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i], g = data[i + 1], b = data[i + 2];

    // 2. 色溫與色調不套用於 canvas 預覽，僅反映在 Lightroom 建議參數數值上
    // （色溫用 canvas 模擬會造成膚色嚴重偏移，視覺誤導）

    // 3. 曝光
    r = clamp(r * exposureMult);
    g = clamp(g * exposureMult);
    b = clamp(b * exposureMult);

    // 4. 對比（S 曲線）
    r = clamp(conFactor * (r - 128) + 128);
    g = clamp(conFactor * (g - 128) + 128);
    b = clamp(conFactor * (b - 128) + 128);

    // 5. 高光與陰影（平滑遮罩）
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    const highlightMask = Math.max(0, (luminance - 128) / 127);
    const shadowMask = Math.max(0, (128 - luminance) / 128);
    r = clamp(r + (high / 100) * 30 * highlightMask + (shad / 100) * 30 * shadowMask);
    g = clamp(g + (high / 100) * 30 * highlightMask + (shad / 100) * 30 * shadowMask);
    b = clamp(b + (high / 100) * 30 * highlightMask + (shad / 100) * 30 * shadowMask);

    // 6. 白色與黑色端點裁切
    const blackLift = (black / 100) * 35;
    const whiteBoost = (white / 100) * 35;
    r = clamp(r + (r < 128 ? blackLift * (1 - r / 128) : whiteBoost * ((r - 128) / 127)));
    g = clamp(g + (g < 128 ? blackLift * (1 - g / 128) : whiteBoost * ((g - 128) / 127)));
    b = clamp(b + (b < 128 ? blackLift * (1 - b / 128) : whiteBoost * ((b - 128) / 127)));

    // 7. 飽和度與自然飽和度（HSL 轉換，低飽和像素對 vibrance 更敏感）
    let { h, s, l } = rgbToHsl(r, g, b);
    const satMult = 1 + sat * 0.008;
    const vibMult = 1 + vib * 0.008;
    const vibWeight = l >= 20 && l <= 80
      ? Math.min(1, s < 50 ? 1.2 - s / 50 : Math.max(0, 1 - (s - 50) / 100))
      : 0;
    const newS = s * satMult * (vibWeight * (vibMult - 1) + 1);
    const clampedS = Math.max(0, Math.min(100, newS));
    // 飽和度提升時輕微壓低亮度，避免過曝
    const sDelta = clampedS - s;
    const lCompensate = sDelta > 0 ? sDelta * 0.04 : 0;
    const newL = Math.max(0, Math.min(100, l - lCompensate));
    const rgb = hslToRgb(h, clampedS, newL);
    r = rgb.r; g = rgb.g; b = rgb.b;

    // 8. 最後統一 clamp
    data[i] = clamp(r);
    data[i + 1] = clamp(g);
    data[i + 2] = clamp(b);
  }
  return imageData;
}

// -----------------------------------------------------------------------------
// LAB 色彩空間轉換（D65 白點 Xn=0.9505, Yn=1, Zn=1.0890）
// 第一步：sRGB → 線性 RGB；第二步：線性 RGB → XYZ；第三步：XYZ → LAB
// -----------------------------------------------------------------------------
function rgbToLab(r, g, b) {
  const lin = (c) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const lr = lin(r), lg = lin(g), lb = lin(b);
  const x = lr * 0.4124 + lg * 0.3576 + lb * 0.1805;
  const y = lr * 0.2126 + lg * 0.7152 + lb * 0.0722;
  const z = lr * 0.0193 + lg * 0.1192 + lb * 0.9505;
  const xn = 0.9505, yn = 1.0000, zn = 1.0890;
  const f = (t) => (t > 0.008856 ? Math.pow(t, 1 / 3) : 7.787 * t + 16 / 116);
  const L = 116 * f(y / yn) - 16;
  const a = 500 * (f(x / xn) - f(y / yn));
  const B = 200 * (f(y / yn) - f(z / zn));
  return { L, a, b: B };
}

function labToRgb(L, a, b) {
  const xn = 0.9505, yn = 1.0000, zn = 1.0890;
  const fy = (L + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - b / 200;
  const finv = (t) => (t > 0.008856 ? Math.pow(t, 3) : (t - 16 / 116) / 7.787);
  const x = xn * finv(fx);
  const y = yn * finv(fy);
  const z = zn * finv(fz);
  let r = x * 3.2404542 - y * 1.5371385 - z * 0.4985314;
  let g = -x * 0.9692660 + y * 1.8760108 + z * 0.0415560;
  let bl = x * 0.0556434 - y * 0.2040259 + z * 1.0572252;
  const gamma = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
  return {
    r: Math.round(Math.max(0, Math.min(255, gamma(Math.max(0, Math.min(1, r))) * 255))),
    g: Math.round(Math.max(0, Math.min(255, gamma(Math.max(0, Math.min(1, g))) * 255))),
    b: Math.round(Math.max(0, Math.min(255, gamma(Math.max(0, Math.min(1, bl))) * 255))),
  };
}

// -----------------------------------------------------------------------------
// LAB 色彩空間統計分析：meanL/A/B、stdL、亮部(L>70)/暗部(L<30)平均、最亮/最暗 5%
// -----------------------------------------------------------------------------
function computeLabStats(data) {
  let sumL = 0, sumA = 0, sumB = 0;
  let sumL2 = 0;
  let sumHighL = 0, countHigh = 0;
  let sumLowL = 0, countLow = 0;
  const lValues = [];
  const n = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    const lab = rgbToLab(data[i], data[i + 1], data[i + 2]);
    sumL += lab.L; sumA += lab.a; sumB += lab.b;
    sumL2 += lab.L * lab.L;
    if (lab.L > 70) { sumHighL += lab.L; countHigh++; }
    if (lab.L < 30) { sumLowL += lab.L; countLow++; }
    lValues.push(lab.L);
  }
  const meanL = sumL / n, meanA = sumA / n, meanB = sumB / n;
  const stdL = Math.sqrt(Math.max(1e-6, sumL2 / n - meanL * meanL));
  const highLMean = countHigh > 0 ? sumHighL / countHigh : meanL;
  const lowLMean = countLow > 0 ? sumLowL / countLow : meanL;
  lValues.sort((a, b) => a - b);
  const idx5 = Math.floor(n * 0.05);
  const idx95 = Math.min(n - 1, Math.floor(n * 0.95));
  const bottom5L = lValues[idx5];
  const top5L = lValues[idx95];
  return { meanL, meanA, meanB, stdL, highLMean, lowLMean, top5L, bottom5L, n, countHigh, countLow };
}

function isSkinPixelForProtection(r, g, b) {
  return r > 150 && g > 100 && b > 80 && r > g && g > b;
}

function applyColorTransfer(imageData, params) {
  const { deltaL, deltaA, deltaB } = params;

  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    let dL = deltaL, dA = deltaA, dB = deltaB;
    if (isSkinPixelForProtection(r, g, b)) {
      dL *= 0.6; dA *= 0.6; dB *= 0.6;
    }
    const lab = rgbToLab(r, g, b);
    const L2 = lab.L + dL, A2 = lab.a + dA, B2 = lab.b + dB;
    const rgb = labToRgb(L2, A2, B2);
    data[i] = rgb.r;
    data[i + 1] = rgb.g;
    data[i + 2] = rgb.b;
  }
  return imageData;
}

function deriveLightroomDisplayFromLab(origStats, refStats, warmAComp, warmBComp) {
  const lDiff = refStats.meanL - origStats.meanL;
  const ev = Math.round((lDiff / 12) * 10) / 10;
  const conRatio = origStats.stdL < 1e-6 ? 1 : refStats.stdL / origStats.stdL;
  const con = Math.round((conRatio - 1) * 100);
  const chromaOrig = Math.sqrt(origStats.meanA ** 2 + origStats.meanB ** 2);
  const chromaRef = Math.sqrt(refStats.meanA ** 2 + refStats.meanB ** 2);
  const satDiff = Math.round(((chromaRef - chromaOrig) / 2) * 10);
  const tempFromA = Math.round((refStats.meanA - origStats.meanA) * 80);
  const high = Math.round(-lDiff * 0.3);
  const shad = Math.round(lDiff * 0.4);
  const tintFromB = Math.round((refStats.meanB - origStats.meanB) * 20);
  const clarityFromStd = Math.round((refStats.stdL / (origStats.stdL + 1e-6) - 1) * 30);
  const fmt = (v) => (v >= 0 ? `+${v}` : `${v}`);
  return {
    exposure: fmt(ev),
    contrast: fmt(con),
    highlights: fmt(high),
    shadows: fmt(shad),
    whites: fmt(Math.round(high * 0.5)),
    blacks: fmt(Math.round(-shad * 0.3)),
    temperature: fmt(tempFromA),
    tint: fmt(tintFromB),
    saturation: fmt(satDiff),
    vibrance: fmt(Math.round(satDiff * 0.6)),
    clarity: fmt(clarityFromStd),
  };
}

// -----------------------------------------------------------------------------
// 色彩分析核心：RGB 通道統計
// -----------------------------------------------------------------------------
function calculateChannelStats(data) {
  let sumR = 0, sumG = 0, sumB = 0, n = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    // 過濾過亮（>220）、過暗（<20）像素，避免天空/陰影污染色彩分析
    if (lum < 20 || lum > 220) continue;
    // 過濾低飽和像素（灰色/白色），避免牆壁、衣服污染
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    if (max - min < 15) continue;
    sumR += r; sumG += g; sumB += b; n++;
  }
  // 若有效像素太少則 fallback 全圖平均
  if (n < 100) {
    let sr = 0, sg = 0, sb = 0, total = 0;
    for (let i = 0; i < data.length; i += 4) {
      sr += data[i]; sg += data[i + 1]; sb += data[i + 2]; total++;
    }
    const r = total ? sr / total : 128;
    const g = total ? sg / total : 128;
    const b = total ? sb / total : 128;
    return { r: { mean: r }, g: { mean: g }, b: { mean: b } };
  }
  const r = sumR / n, g = sumG / n, b = sumB / n;
  return { r: { mean: r }, g: { mean: g }, b: { mean: b } };
}

function getSimpleChannelStats(data) {
  const s = calculateChannelStats(data);
  return { r: s.r.mean, g: s.g.mean, b: s.b.mean };
}

// -----------------------------------------------------------------------------
// 色溫估算
// -----------------------------------------------------------------------------
function estimateColorTemperature(rgbStats) {
  const r = rgbStats.r?.mean ?? rgbStats.r ?? 128;
  const g = rgbStats.g?.mean ?? rgbStats.g ?? 128;
  const b = Math.max(1, rgbStats.b?.mean ?? rgbStats.b ?? 128);
  const rbRatio = r / b;
  let temp;
  if (rbRatio > 1.3) temp = 2000 + (rbRatio - 1.3) * 2000;
  else if (rbRatio > 1.0) temp = 5000 + (rbRatio - 1.0) * 10000;
  else if (rbRatio > 0.8) temp = 6500 + (1.0 - rbRatio) * 7500;
  else temp = 8000 + (0.8 - rbRatio) * 2500;
  return {
    estimated: Math.round(Math.max(2000, Math.min(10000, temp))),
    rbRatio,
  };
}

// -----------------------------------------------------------------------------
// 色調類型辨識
// -----------------------------------------------------------------------------
function classifyColorTone(rgbStats, colorTemp) {
  const r = rgbStats.r?.mean ?? rgbStats.r ?? 128;
  const g = rgbStats.g?.mean ?? rgbStats.g ?? 128;
  const b = Math.max(1, rgbStats.b?.mean ?? rgbStats.b ?? 128);
  const rbRatio = r / b;
  const warmthIndex = (r - b) / (r + g + b + 1e-6);
  const temp = colorTemp.estimated;

  let category = "neutral";
  let intensity = "subtle";

  if (temp < 4500 || rbRatio < 0.9 || warmthIndex < -0.1) {
    category = "cool";
    if (Math.abs(warmthIndex) > 0.25) intensity = "strong";
    else if (Math.abs(warmthIndex) > 0.15) intensity = "moderate";
  } else if (temp > 6000 || rbRatio > 1.1 || warmthIndex > 0.1) {
    category = "warm";
    if (Math.abs(warmthIndex) > 0.25) intensity = "strong";
    else if (Math.abs(warmthIndex) > 0.15) intensity = "moderate";
  }

  return {
    category,
    intensity,
    colorTemp: temp,
    rbRatio,
    warmthIndex,
  };
}

// -----------------------------------------------------------------------------
// 轉換模式判斷
// -----------------------------------------------------------------------------
function determineConversionMode(originalTone, referenceTone) {
  const origCat = originalTone.category;
  const refCat = referenceTone.category;

  let mode = { type: "", name: "", description: "", maxTempChange: 20, temperatureSensitivity: 0.5 };

  if (origCat === refCat) {
    mode.type = "same_tone_adjustment";
    mode.name = `${origCat === "cool" ? "冷" : origCat === "warm" ? "暖" : "中性"}色調微調`;
    mode.description = `原圖與參考圖均為${origCat === "cool" ? "冷" : origCat === "warm" ? "暖" : "中性"}色調，使用微調算法`;
    mode.maxTempChange = 20;
    mode.temperatureSensitivity = 0.3;
  } else if (origCat === "cool" && refCat === "warm") {
    mode.type = "cool_to_warm";
    mode.name = "冷調轉暖調";
    mode.description = "原圖為冷色調，參考圖為暖色調，需要大幅度色調轉換";
    mode.maxTempChange = 80;
    mode.temperatureSensitivity = 1.2;
  } else if (origCat === "warm" && refCat === "cool") {
    mode.type = "warm_to_cool";
    mode.name = "暖調轉冷調";
    mode.description = "原圖為暖色調，參考圖為冷色調，需要大幅度色調轉換";
    mode.maxTempChange = -80;
    mode.temperatureSensitivity = 1.2;
  } else if (origCat === "neutral" && refCat === "warm") {
    mode.type = "neutral_to_warm";
    mode.name = "中性轉暖調";
    mode.description = "原圖為中性色調，參考圖為暖色調";
    mode.maxTempChange = 50;
    mode.temperatureSensitivity = 0.8;
  } else if (origCat === "neutral" && refCat === "cool") {
    mode.type = "neutral_to_cool";
    mode.name = "中性轉冷調";
    mode.description = "原圖為中性色調，參考圖為冷色調";
    mode.maxTempChange = -50;
    mode.temperatureSensitivity = 0.8;
  } else if ((origCat === "warm" || origCat === "cool") && refCat === "neutral") {
    mode.type = "to_neutral";
    mode.name = `${origCat === "cool" ? "冷" : "暖"}調轉中性`;
    mode.description = `原圖為${origCat === "cool" ? "冷" : "暖"}色調，參考圖為中性色調`;
    mode.maxTempChange = 30;
    mode.temperatureSensitivity = 0.6;
  }

  const warmthDiff = Math.abs(referenceTone.warmthIndex - originalTone.warmthIndex);
  mode.adjustmentStrength = warmthDiff > 0.3 ? "strong" : warmthDiff > 0.15 ? "moderate" : "subtle";

  return mode;
}

// -----------------------------------------------------------------------------
// 色彩分析：R/B 暖度比例、通道偏移
// -----------------------------------------------------------------------------
function analyzeColorProfile(origData, refData) {
  const origRGB = calculateChannelStats(origData);
  const refRGB = calculateChannelStats(refData);
  const or = origRGB.r.mean, og = origRGB.g.mean, ob = Math.max(1, origRGB.b.mean);
  const rr = refRGB.r.mean, rg = refRGB.g.mean, rb = Math.max(1, refRGB.b.mean);
  const origWarmth = or / ob;
  const refWarmth = rr / rb;
  const warmthRatio = origWarmth < 0.01 ? 1 : refWarmth / origWarmth;
  return {
    warmthRatio,
    rShift: rr - or,
    gShift: rg - og,
    bShift: rb - ob,
    avgBrightness: (rr + rg + rb) / 3,
  };
}

// -----------------------------------------------------------------------------
// 亮度分析：HSV 空間，中間調/高光/陰影（0-100 尺度）
// -----------------------------------------------------------------------------
function analyzeBrightness(origData, refData) {
  const getHSVStats = (data) => {
    let sumV = 0, sumMid = 0, sumHigh = 0, sumLow = 0;
    let n = 0, nMid = 0, nHigh = 0, nLow = 0;
    for (let i = 0; i < data.length; i += 4) {
      const hsv = rgbToHsv(data[i], data[i + 1], data[i + 2]);
      sumV += hsv.v;
      n++;
      if (hsv.v >= 40 && hsv.v <= 70) { sumMid += hsv.v; nMid++; }
      if (hsv.v > 70) { sumHigh += hsv.v; nHigh++; }
      if (hsv.v < 40) { sumLow += hsv.v; nLow++; }
    }
    return {
      overall: n ? sumV / n : 50,
      midtone: nMid ? sumMid / nMid : 50,
      highlight: nHigh ? sumHigh / nHigh : 70,
      shadow: nLow ? sumLow / nLow : 30,
    };
  };
  const orig = getHSVStats(origData);
  const ref = getHSVStats(refData);
  return {
    midtoneShift: ref.midtone - orig.midtone,
    highlightShift: ref.highlight - orig.highlight,
    shadowShift: ref.shadow - orig.shadow,
    overallShift: ref.overall - orig.overall,
    origBrightness: orig.overall,
    refBrightness: ref.overall,
  };
}

// -----------------------------------------------------------------------------
// 飽和度分析：加權平均（高飽和像素權重更大）、高飽和比例
// -----------------------------------------------------------------------------
function analyzeSaturation(origData, refData) {
  const getSatStats = (data) => {
    const valid = [];
    for (let i = 0; i < data.length; i += 4) {
      const hsv = rgbToHsv(data[i], data[i + 1], data[i + 2]);
      const v01 = hsv.v / 100, s01 = hsv.s / 100;
      if (v01 > 0.2 && v01 < 0.95) {
        valid.push({ s: s01, h: hsv.h, v: v01 });
      }
    }
    if (!valid.length) return { avg: 0.5, weightedMean: 0.5, highSatRatio: 0, veryHighSatRatio: 0, red: 0.5, orange: 0.5, yellow: 0.5 };

    const sVals = valid.map((p) => p.s);
    const mean = sVals.reduce((a, b) => a + b, 0) / sVals.length;

    let weightedSum = 0, totalWeight = 0;
    for (const p of valid) {
      const w = Math.pow(p.s, 1.5);
      weightedSum += p.s * w;
      totalWeight += w;
    }
    const weightedMean = totalWeight > 0 ? weightedSum / totalWeight : mean;

    const highSatRatio = sVals.filter((s) => s > 0.5).length / sVals.length;
    const veryHighSatRatio = sVals.filter((s) => s > 0.7).length / sVals.length;

    const redPx = valid.filter((p) => (p.h >= 0 && p.h < 30) || (p.h >= 330 && p.h <= 360));
    const orangePx = valid.filter((p) => p.h >= 30 && p.h < 60);
    const yellowPx = valid.filter((p) => p.h >= 60 && p.h < 90);

    return {
      avg: mean,
      weightedMean,
      highSatRatio: Math.max(0.01, highSatRatio),
      veryHighSatRatio,
      red: redPx.length ? redPx.reduce((a, p) => a + p.s, 0) / redPx.length : 0.5,
      orange: orangePx.length ? orangePx.reduce((a, p) => a + p.s, 0) / orangePx.length : 0.5,
      yellow: yellowPx.length ? yellowPx.reduce((a, p) => a + p.s, 0) / yellowPx.length : 0.5,
    };
  };
  const orig = getSatStats(origData);
  const ref = getSatStats(refData);

  const origSat = Math.max(0.01, orig.weightedMean);
  const refSat = Math.max(0.01, ref.weightedMean);
  const satRatio = refSat / origSat;
  const highSatRatioChange = ref.highSatRatio / orig.highSatRatio;
  const combinedRatio = satRatio * 0.6 + highSatRatioChange * 0.4;

  return {
    saturationRatio: combinedRatio,
    satShift: refSat - origSat,
    orangeSatShift: (ref.orange - orig.orange) * 100,
    weightedMeanOrig: origSat,
    weightedMeanRef: refSat,
  };
}

// -----------------------------------------------------------------------------
// 對比度分析：亮度標準差
// -----------------------------------------------------------------------------
function analyzeContrast(origData, refData) {
  const getStdDev = (data) => {
    const lums = [];
    for (let i = 0; i < data.length; i += 4)
      lums.push(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    const mean = lums.reduce((a, b) => a + b, 0) / (lums.length || 1);
    const variance = lums.reduce((a, v) => a + (v - mean) ** 2, 0) / (lums.length || 1);
    return Math.sqrt(variance);
  };
  const origStd = getStdDev(origData);
  const refStd = getStdDev(refData);
  const origSafe = Math.max(1e-6, origStd);
  return {
    contrastRatio: refStd / origSafe,
    contrastShift: refStd - origStd,
    origStd,
  };
}

// -----------------------------------------------------------------------------
// Lightroom 參數映射：模式感知，依色調類型選擇策略
// -----------------------------------------------------------------------------
function calculateLightroomParams(colorProfile, brightness, saturation, contrast, mode, originalTone, referenceTone, detailedHue = null) {
  const params = {
    temperature: 0, tint: 0, exposure: 0, contrast: 0,
    highlights: 0, shadows: 0, whites: 0, blacks: 0,
    vibrance: 0, saturation: 0,
    redCurve: 0, greenCurve: 0, blueCurve: 0,
  };

  const wr = colorProfile.warmthRatio;
  const tempDiff = referenceTone ? referenceTone.colorTemp - originalTone.colorTemp : 0;

  let baseTemp = 0;
  if (wr > 1.2) baseTemp = 25 + (wr - 1.2) * 75;
  else if (wr > 1.1) baseTemp = 15 + (wr - 1.1) * 100;
  else if (wr > 1.05) baseTemp = 5 + (wr - 1.05) * 200;
  else if (wr < 0.95) baseTemp = (wr - 0.95) * 200;

  params.temperature = Math.round(baseTemp * (mode?.temperatureSensitivity ?? 1));

  if (mode?.type === "same_tone_adjustment") {
    params.temperature = Math.max(-(mode.maxTempChange ?? 20), Math.min(mode.maxTempChange ?? 20, params.temperature));
    if (Math.abs(tempDiff) < 300) params.temperature *= 0.5;
  } else if (mode?.type === "cool_to_warm" || mode?.type === "neutral_to_warm") {
    params.temperature = Math.max(15, params.temperature);
    params.temperature = Math.min(mode?.maxTempChange ?? 50, params.temperature);
    if (referenceTone?.intensity === "strong") params.temperature *= 1.3;
  } else if (mode?.type === "warm_to_cool" || mode?.type === "neutral_to_cool") {
    params.temperature = Math.min(-15, params.temperature);
    params.temperature = Math.max(mode?.maxTempChange ?? -50, params.temperature);
    if (referenceTone?.intensity === "strong") params.temperature *= 1.3;
  } else if (mode?.type === "to_neutral") {
    params.temperature *= 0.6;
    params.temperature = Math.max(-(mode.maxTempChange ?? 30), Math.min(mode.maxTempChange ?? 30, params.temperature));
  }

  const gmBalance = (colorProfile.gShift - (colorProfile.rShift + colorProfile.bShift) / 2) / 10;
  params.tint = Math.round(Math.max(-15, Math.min(15, gmBalance)));
  const isMagentaToOrange =
    detailedHue?.orig?.dominantHue === "magenta-red" && detailedHue?.ref?.dominantHue === "orange-red";
  if (isMagentaToOrange) params.tint = Math.round(Math.max(-15, Math.min(15, params.tint + 10)));
  if (mode?.type === "same_tone_adjustment") params.tint *= 0.6;

  const hueShift =
    detailedHue?.orig && detailedHue?.ref
      ? calculateHueShiftAmount(detailedHue.orig, detailedHue.ref)
      : null;
  if (hueShift?.needsRGBLevelAdjustment) {
    const rgbAdj = calculateRGBCurveAdjustments(hueShift, detailedHue.orig, detailedHue.ref);
    params.redCurve = rgbAdj.redCurve;
    params.greenCurve = rgbAdj.greenCurve;
    params.blueCurve = rgbAdj.blueCurve;
  }
  if (hueShift?.type === "magenta_to_orange") {
    params.temperature += 20;
    params.vibrance += 12;
    params.saturation += 8;
  }

  const exposureEV = brightness.overallShift / 50;
  params.exposure = Math.max(-3.0, Math.min(3.0, exposureEV));

  const hs = brightness.highlightShift;
  if (hs > 10) {
    params.highlights = Math.round(-20 - hs / 2);
    if (params.exposure > 0.5) params.highlights -= 15;
    params.highlights = Math.max(params.highlights, -50);
  } else if (hs < -10) {
    params.highlights = Math.round(hs / 2);
    params.highlights = Math.min(params.highlights, 30);
  }

  const ss = brightness.shadowShift;
  if (ss > 10) {
    params.shadows = Math.round(10 + ss / 3);
    params.shadows = Math.min(params.shadows, 50);
  } else if (ss > 5) {
    params.shadows = Math.round(ss);
  } else if (ss < -10) {
    params.shadows = Math.round(ss / 2);
    params.shadows = Math.max(params.shadows, -50);
  }

  params.whites = Math.round(hs / 4);
  if (params.exposure > 0.4 && params.highlights < -15) params.whites -= 5;
  params.whites = Math.max(-30, Math.min(30, params.whites));
  params.blacks = Math.round(ss / 3);
  params.blacks = Math.max(-30, Math.min(30, params.blacks));

  const cr = contrast.contrastRatio;
  if (cr > 1.1) {
    params.contrast = Math.round((10 + (cr - 1.1) * 50) * 3);
    params.contrast = Math.min(params.contrast, 80);
  } else if (cr < 0.9) {
    params.contrast = Math.round((cr - 0.9) * 300);
    params.contrast = Math.max(params.contrast, -80);
  }

  const sr = saturation.saturationRatio;
  if (sr > 1.15) {
    params.vibrance = Math.round(18 + (sr - 1.15) * 60);
    params.vibrance = Math.min(params.vibrance, 50);
    params.saturation = Math.round(10 + (sr - 1.15) * 40);
    params.saturation = Math.min(params.saturation, 35);
  } else if (sr > 1.05) {
    params.vibrance = Math.round(10 + (sr - 1.05) * 80);
    params.vibrance = Math.min(params.vibrance, 40);
    params.saturation = Math.round(5 + (sr - 1.05) * 50);
    params.saturation = Math.min(params.saturation, 28);
  } else if (sr > 0.98) {
    params.vibrance = Math.round((sr - 0.98) * 140);
    params.saturation = Math.round((sr - 0.98) * 100);
  } else if (sr > 0.90) {
    params.vibrance = Math.round((sr - 0.94) * 120);
    params.saturation = Math.round((sr - 0.94) * 90);
  } else {
    params.vibrance = Math.round((sr - 0.90) * 100);
    params.vibrance = Math.max(params.vibrance, -25);
    params.saturation = Math.round((sr - 0.90) * 80);
    params.saturation = Math.max(params.saturation, -20);
  }

  // 飽和度保護：若兩圖的加權平均飽和度差距不大，不輸出飽和度建議
  const satAbsDiff = Math.abs(saturation.weightedMeanRef - saturation.weightedMeanOrig);
  const contrastIsMainDiff = Math.abs(contrast.contrastRatio - 1) > 0.05 && satAbsDiff < 0.12;
  if (satAbsDiff < 0.08 || contrastIsMainDiff) {
    params.saturation = 0;
    params.vibrance = 0;
  }

  if (["cool_to_warm", "warm_to_cool", "neutral_to_warm", "neutral_to_cool"].includes(mode?.type)) {
    params.vibrance = Math.min(params.vibrance + 8, 100);
    params.saturation = Math.min(params.saturation + 5, 75);
  }

  if (params.temperature > 15 && saturation.orangeSatShift > 5) {
    params.vibrance = Math.min(params.vibrance + 5, 88);
    params.saturation = Math.min(params.saturation + 3, 63);
  }

  const fmt = (v) => (v >= 0 ? `+${v}` : `${v}`);
  return {
    exposure: fmt(Math.round(params.exposure * 10) / 10),
    contrast: fmt(params.contrast),
    highlights: fmt(params.highlights),
    shadows: fmt(params.shadows),
    whites: fmt(params.whites),
    blacks: fmt(params.blacks),
    saturation: fmt(params.saturation),
    vibrance: fmt(params.vibrance),
    temperature: fmt(params.temperature),
    tint: fmt(params.tint),
    redCurve: params.redCurve,
    greenCurve: params.greenCurve,
    blueCurve: params.blueCurve,
  };
}

// -----------------------------------------------------------------------------
// 從 LAB 統計推導 Lightroom 建議值（保留供 fallback，但主流程改用色彩分析）
// -----------------------------------------------------------------------------
function deriveLightroomFromLabStats(origLab, refLab) {
  const clampEv = (v) => Math.max(-5, Math.min(5, v));
  const clamp100 = (v) => Math.max(-100, Math.min(100, Math.round(v)));
  const clamp50 = (v) => Math.max(-50, Math.min(50, Math.round(v)));

  const deltaL = refLab.meanL - origLab.meanL;
  const deltaA = refLab.meanA - origLab.meanA;
  const deltaB = refLab.meanB - origLab.meanB;

  const ev = clampEv(deltaL / 10);
  const chromaOrig = Math.sqrt(origLab.meanA ** 2 + origLab.meanB ** 2);
  const chromaRef = Math.sqrt(refLab.meanA ** 2 + refLab.meanB ** 2);
  const satSign = chromaRef >= chromaOrig ? 1 : -1;
  const sat = clamp100(satSign * ((Math.abs(deltaA) + Math.abs(deltaB)) / 2) * 2);
  const tempK = clamp50(deltaB * -1 * 3);
  const con = clamp100((refLab.stdL - origLab.stdL) * 1.5);
  const high = clamp100((refLab.highLMean - origLab.highLMean) * 1.2);
  const shad = clamp100((refLab.lowLMean - origLab.lowLMean) * 1.2);
  const white = clamp100((refLab.top5L - origLab.top5L) * 0.8);
  const black = clamp100((refLab.bottom5L - origLab.bottom5L) * 0.8);
  const vib = clamp100(satSign * Math.min(Math.abs(deltaA), Math.abs(deltaB)) * 1.5);

  const fmt = (v) => (v >= 0 ? `+${v}` : `${v}`);
  return {
    exposure: fmt(Math.round(ev * 10) / 10),
    contrast: fmt(con),
    highlights: fmt(high),
    shadows: fmt(shad),
    whites: fmt(white),
    blacks: fmt(black),
    saturation: fmt(sat),
    vibrance: fmt(vib),
    temperature: fmt(tempK),
  };
}

function checkImageSimilarity(originalImgData, referenceImgData) {
  if (originalImgData.width !== referenceImgData.width || originalImgData.height !== referenceImgData.height) {
    return { isSame: false, similarity: 0 };
  }
  const sampleRate = 100;
  let matchCount = 0;
  let totalSamples = 0;
  const threshold = 5;
  const od = originalImgData.data;
  const rd = referenceImgData.data;
  for (let i = 0; i < od.length; i += 4 * sampleRate) {
    const rDiff = Math.abs(od[i] - rd[i]);
    const gDiff = Math.abs(od[i + 1] - rd[i + 1]);
    const bDiff = Math.abs(od[i + 2] - rd[i + 2]);
    if (rDiff <= threshold && gDiff <= threshold && bDiff <= threshold) matchCount++;
    totalSamples++;
  }
  const similarity = totalSamples > 0 ? (matchCount / totalSamples) * 100 : 0;
  return { isSame: similarity > 98, similarity };
}

function analyzeImagesForColorTransfer(photoYourBase64, photoRefBase64) {
  return new Promise((resolve, reject) => {
    const loadImage = (src) =>
      new Promise((res, rej) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => res(img);
        img.onerror = () => rej(new Error("無法載入圖片"));
        img.src = src;
      });

    const drawToCanvas = (img, maxW = 800) => {
      let w = img.width, h = img.height;
      if (w > maxW) {
        h = (h * maxW) / w;
        w = maxW;
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      return ctx.getImageData(0, 0, w, h);
    };

    Promise.all([loadImage(photoYourBase64), loadImage(photoRefBase64)])
      .then(([imgYour, imgRef]) => {
        const origData = drawToCanvas(imgYour);
        const refData = drawToCanvas(imgRef);

        // 同圖校正：偵測到相同圖片時直接回傳全 0 參數
        const similarityCheck = checkImageSimilarity(origData, refData);
        if (similarityCheck.isSame) {
          const origLab = computeLabStats(origData.data);
          const l = Math.round(Math.min(100, Math.max(0, origLab.meanL)));
          const chroma = Math.sqrt(origLab.meanA ** 2 + origLab.meanB ** 2);
          const sat = Math.round(Math.min(100, chroma));
          const con = Math.round(Math.min(100, (origLab.stdL / 25) * 100));
          const k = Math.round(5500 + origLab.meanB * 20);
          const tempStr = origLab.meanB > 5 ? `偏暖（約 ${k}K）` : origLab.meanB < -5 ? `偏冷（約 ${k}K）` : `中性（約 ${k}K）`;
          const zeroLr = {
            exposure: "+0", contrast: "+0", highlights: "+0", shadows: "+0",
            whites: "+0", blacks: "+0", saturation: "+0", vibrance: "+0", temperature: "+0",
          };
          const origToneLab = { category: origLab.meanB > 5 ? "warm" : origLab.meanB < -5 ? "cool" : "neutral", colorTemp: k };
          return resolve({
            brightness: { yours: l, reference: l, suggestion: "亮度接近" },
            saturation: { yours: sat, reference: sat, suggestion: "飽和度接近" },
            contrast: { yours: con, reference: con, suggestion: "對比接近" },
            colorTemp: { yours: tempStr, reference: tempStr, suggestion: "色溫接近" },
            lightroomSettings: zeroLr,
            colorTransferParams: null,
            toneMode: { type: "identical_images", name: "相同圖片", description: "偵測到相同圖片，無需調整" },
            hslAdjustments: null,
            hueShift: null,
            rgbCurveAdjustments: null,
            lightingEffect: null,
            analysis: { isSameImage: true, similarity: similarityCheck.similarity, originalTone: origToneLab, referenceTone: origToneLab },
          });
        }

        // LAB 色彩空間統計分析
        const origLab = computeLabStats(origData.data);
        const refLab = computeLabStats(refData.data);

        const deltaL = refLab.meanL - origLab.meanL;
        const deltaA = refLab.meanA - origLab.meanA;
        const deltaB = refLab.meanB - origLab.meanB;

        const saturation = analyzeSaturation(origData.data, refData.data);
        const contrast = analyzeContrast(origData.data, refData.data);

        // 亮度：LAB L 0~100 對應百分比
        const yoursBrightness = Math.round(Math.min(100, Math.max(0, origLab.meanL)));
        const refBrightness = Math.round(Math.min(100, Math.max(0, refLab.meanL)));
        const brightnessDiff = refBrightness - yoursBrightness;
        const brightnessSuggestion =
          brightnessDiff > 8
            ? `參考較亮，建議增加曝光約 +${(brightnessDiff / 25).toFixed(1)} EV`
            : brightnessDiff < -8
              ? `參考較暗，建議降低曝光約 ${(brightnessDiff / 25).toFixed(1)} EV`
              : "亮度接近";

        // 飽和度：HSV 加權平均換算 0~100
        const yoursSat = Math.round(saturation.weightedMeanOrig * 100);
        const refSat = Math.round(saturation.weightedMeanRef * 100);
        const satDiff = refSat - yoursSat;
        const satSuggestion =
          satDiff > 10
            ? "參考飽和度較高，建議增加飽和度"
            : satDiff < -10
              ? "參考飽和度較低，建議降低飽和度"
              : "飽和度接近";

        // 對比度：直方圖兩端比例（亮部 L>70 + 暗部 L<30），對 S 型曲線敏感
        const getHistContrast = (lab) => {
          const highRatio = lab.countHigh / lab.n;
          const lowRatio = lab.countLow / lab.n;
          return Math.round(Math.min(100, (highRatio + lowRatio) * 200));
        };
        const yoursCon = getHistContrast(origLab);
        const refCon = getHistContrast(refLab);
        const conDiff = refCon - yoursCon;
        const conSuggestion =
          conDiff > 5
            ? "參考對比較高，建議增加對比"
            : conDiff < -5
              ? "參考對比較柔和，建議降低對比"
              : "對比接近";

        // 色溫：LAB B 通道估算 K，亮度補償後 5500 + correctedB*20
        const neutralL = 55;
        const compensate = (lab) => {
          const lFactor = (lab.meanL - neutralL) * 0.05;
          return lab.meanB - lFactor;
        };
        const correctedBOrig = compensate(origLab);
        const correctedBRef = compensate(refLab);
        const kYours = Math.round(5500 + correctedBOrig * 20);
        const kRef = Math.round(5500 + correctedBRef * 20);
        const tempYours = origLab.meanB > 5 ? `偏暖（約 ${kYours}K）` : origLab.meanB < -5 ? `偏冷（約 ${kYours}K）` : `中性（約 ${kYours}K）`;
        const tempRef = refLab.meanB > 5 ? `偏暖（約 ${kRef}K）` : refLab.meanB < -5 ? `偏冷（約 ${kRef}K）` : `中性（約 ${kRef}K）`;
        const tempDiff = kRef - kYours;
        let tempSuggestion =
          Math.abs(tempDiff) >= 300
            ? tempDiff > 0
              ? `建議增加色溫約 +${Math.round(tempDiff / 100) * 100}K`
              : `建議降低色溫約 -${Math.round(Math.abs(tempDiff) / 100) * 100}K`
            : "色溫接近";

        // Lightroom 建議：RGB/HSV 色彩分析（輕量版）
        let lightroomSettings;
        let toneMode = null;
        let hslAdjustments = null;
        let hueShift = null;
        let rgbCurveAdjustments = null;
        let lightingEffect = null;
        let origTone = null;
        let refTone = null;
        try {
          const origRGBStats = calculateChannelStats(origData.data);
          const refRGBStats = calculateChannelStats(refData.data);
          const origTemp = estimateColorTemperature(origRGBStats);
          const refTemp = estimateColorTemperature(refRGBStats);
          origTone = classifyColorTone(origRGBStats, origTemp);
          refTone = classifyColorTone(refRGBStats, refTemp);
          const mode = determineConversionMode(origTone, refTone);
          toneMode = { name: mode.name, description: mode.description, type: mode.type, focusAreas: ["temperature", "saturation", "brightness"], strength: mode.adjustmentStrength };
          const ot = origTone.colorTemp;
          const rt = refTone.colorTemp;
          const td = Math.abs(rt - ot);
          tempSuggestion = td < 300 ? "色溫接近" : rt > ot ? `建議增加色溫約 +${Math.round(td / 100) * 100}K` : `建議降低色溫約 -${Math.round(td / 100) * 100}K`;

          const colorProfile = analyzeColorProfile(origData.data, refData.data);
          const brightness = analyzeBrightness(origData.data, refData.data);
          const detailedHue = {
            orig: analyzeDetailedHue(origRGBStats),
            ref: analyzeDetailedHue(refRGBStats),
          };
          lightroomSettings = calculateLightroomParams(colorProfile, brightness, saturation, contrast, mode, origTone, refTone, detailedHue);

          // 通用色相轉換：HSV 分析 + 打光偵測 + 色相偏移 + HSL 調整
          try {
            const origHSV = analyzeHSVComplete(origData.data);
            const refHSV = analyzeHSVComplete(refData.data);
            const detailedShift = calculateHueShiftAmount(detailedHue.orig, detailedHue.ref);
            hueShift = calculateUniversalHueShift(origHSV.stats.hue, refHSV.stats.hue);
            if (detailedShift.type !== "none") {
              hueShift = {
                ...hueShift,
                shift: detailedShift.shift,
                type: detailedShift.type,
                intensity: detailedShift.intensity === "strong" ? "major" : detailedShift.intensity === "moderate" ? "moderate" : hueShift.intensity,
                needsRGBLevelAdjustment: detailedShift.needsRGBLevelAdjustment,
              };
            }
            lightingEffect = detectLightingEffect(origHSV.stats.hue, refHSV.stats.hue);
            hslAdjustments = generateHSLAdjustments(hueShift, origHSV.stats.hue, refHSV.stats.hue, lightingEffect, detailedHue);
          } catch (_) { /* 色相分析失敗時不影響主流程 */ }

        rgbCurveAdjustments =
          hueShift?.type != null ? calculateRGBCurveAdjustments(hueShift, detailedHue?.orig, detailedHue?.ref) : null;
        } catch (err) {
          console.warn("色彩分析異常，使用備援算法:", err);
          lightroomSettings = deriveLightroomFromLabStats(origLab, refLab);
        }

        // 色彩遷移預覽：LAB delta 套用 + 膚色保護 0.6
        const colorTransferParams = { deltaL, deltaA, deltaB };

        const origToneForAnalysis = origTone ? { category: origTone.category, colorTemp: origTone.colorTemp } : { category: origLab.meanB > 5 ? "warm" : origLab.meanB < -5 ? "cool" : "neutral", colorTemp: kYours };
        const refToneForAnalysis = refTone ? { category: refTone.category, colorTemp: refTone.colorTemp } : { category: refLab.meanB > 5 ? "warm" : refLab.meanB < -5 ? "cool" : "neutral", colorTemp: kRef };

        const analysisResult = {
          brightness: { yours: yoursBrightness, reference: refBrightness, suggestion: brightnessSuggestion },
          saturation: { yours: yoursSat, reference: refSat, suggestion: satSuggestion },
          contrast: { yours: yoursCon, reference: refCon, suggestion: conSuggestion },
          colorTemp: { yours: tempYours, reference: tempRef, suggestion: tempSuggestion },
          lightroomSettings,
          colorTransferParams,
          toneMode,
          hslAdjustments,
          hueShift,
          rgbCurveAdjustments,
          lightingEffect,
          analysis: { originalTone: origToneForAnalysis, referenceTone: refToneForAnalysis },
        };

        resolve(analysisResult);
      })
      .catch(reject);
  });
}

function AdjustmentPreview({ photoBase64, lightroomSettings, colorTransferParams, hslAdjustments, rgbCurveAdjustments }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const useLightroom = !!lightroomSettings && Object.keys(lightroomSettings || {}).length > 0;
    if (!photoBase64 || !useLightroom) {
      setPreviewUrl(null);
      return;
    }
    setIsProcessing(true);
    setPreviewUrl(null);
    let cancelled = false;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setTimeout(() => {
        if (cancelled) return;
        const maxW = 800;
        let w = img.width, h = img.height;
        if (w > maxW) {
          h = (h * maxW) / w;
          w = maxW;
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        let imageData = ctx.getImageData(0, 0, w, h);
        const processed = applyLightroomParams(imageData, lightroomSettings);
        // HSL 色相調整不套用於 canvas 預覽
        // 原因：canvas 是全局像素操作，hslAdjustments 是針對特定色相範圍的精細調整
        // 套用後會造成整體色偏，僅保留在 Lightroom 參數匯出中供實際後製使用

        if (cancelled) return;
        const previewCanvas = document.createElement("canvas");
        previewCanvas.width = w;
        previewCanvas.height = h;
        const previewCtx = previewCanvas.getContext("2d");
        previewCtx.putImageData(processed, 0, 0);

        setPreviewUrl(previewCanvas.toDataURL("image/jpeg", 0.92));
        setIsProcessing(false);
      }, 0);
    };
    img.onerror = () => setIsProcessing(false);
    img.src = photoBase64;
    return () => { cancelled = true; };
  }, [photoBase64, lightroomSettings, colorTransferParams, hslAdjustments, rgbCurveAdjustments]);

  if (!photoBase64) return null;

  return (
    <div className="adjustment-preview-section">
      <h3 className="adjustment-preview-title">調整預覽</h3>
      {isProcessing ? (
        <div className="adjustment-preview-loading">
          <Loader2 className="w-10 h-10 animate-spin" aria-hidden />
          <span>預覽處理中...</span>
        </div>
      ) : (
        <div className="adjustment-preview-grid">
          <div className="adjustment-preview-item">
            <div className="adjustment-preview-img-wrap">
              <img src={photoBase64} alt="原始照片" className="adjustment-preview-img" />
            </div>
            <p className="adjustment-preview-label">原圖</p>
          </div>
          <div className="adjustment-preview-item">
            <div className="adjustment-preview-img-wrap">
              {previewUrl ? (
                <img src={previewUrl} alt="套用建議後" className="adjustment-preview-img" />
              ) : (
                <div className="adjustment-preview-placeholder" />
              )}
            </div>
            <p className="adjustment-preview-label">套用建議後</p>
          </div>
        </div>
      )}
    </div>
  );
}

// 從像素陣列計算單張圖的偏向（亮度 / 色溫 / 色彩通道）
function getBiasFromImageData(data) {
  let sumL = 0, sumR = 0, sumG = 0, sumB = 0, n = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    sumL += 0.299 * r + 0.587 * g + 0.114 * b;
    sumR += r; sumG += g; sumB += b;
    n++;
  }
  const avgL = n ? sumL / n : 0;
  const avgR = n ? sumR / n : 0;
  const avgG = n ? sumG / n : 0;
  const avgB = n ? sumB / n : 0;
  const brightnessBias = avgL < 85 ? "偏暗" : avgL > 170 ? "偏亮" : "正常";
  const tempBias = (avgR - avgB) > 15 ? "偏暖" : (avgB - avgR) > 15 ? "偏冷" : "中性";
  const arr = [
    { v: avgR, label: "偏紅" },
    { v: avgG, label: "偏綠" },
    { v: avgB, label: "偏藍" },
  ];
  arr.sort((a, b) => b.v - a.v);
  const channelBias = (arr[0].v - arr[1].v) > 10 ? arr[0].label : "均衡";
  return { avgL, avgR, avgG, avgB, brightnessBias, tempBias, channelBias };
}

// -----------------------------------------------------------------------------
// 分析結果：僅在兩張照片都上傳並點擊分析按鈕後顯示
// 第一部分：白卡「照片對比分析」— 亮度/飽和度/對比度/色溫（真實像素計算）
// 第二部分：藍→紫漸層卡「Lightroom 調整建議」— 9 項 3x3 網格 + 底部提示
// -----------------------------------------------------------------------------
function AnalysisResultDisplay({ result, onReset, photoYour, photoRef }) {
  if (!result || !result.brightness) return null;

  const compareHistogramCanvasRef = useRef(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [biasData, setBiasData] = useState(null);

  // 偏向分析：離屏 canvas 讀取兩張圖像素 → 計算亮度/色溫/通道偏向
  useEffect(() => {
    if (!photoYour || !photoRef) return;
    const loadImg = (src) =>
      new Promise((res, rej) => {
        const img = new Image();
        img.onload = () => res(img);
        img.onerror = rej;
        img.src = src;
      });
    const getPixelData = (img) => {
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      const off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      const ctx = off.getContext("2d");
      ctx.drawImage(img, 0, 0);
      return ctx.getImageData(0, 0, w, h).data;
    };
    Promise.all([loadImg(photoYour), loadImg(photoRef)])
      .then(([img1, img2]) => {
        setBiasData({
          yours: getBiasFromImageData(getPixelData(img1)),
          reference: getBiasFromImageData(getPixelData(img2)),
        });
      })
      .catch(() => setBiasData(null));
  }, [photoYour, photoRef]);

  // 兩張圖疊加 RGB 直方圖：離屏 canvas 取像素 → hist 陣列 → 99.5% 縮放 → 繪製（含內距）
  useEffect(() => {
    if (!photoYour || !photoRef || !compareHistogramCanvasRef.current) return;
    const canvas = compareHistogramCanvasRef.current;
    const ctx = canvas.getContext("2d");
    const canvasWidth = 512;
    const canvasHeight = 200;
    const padding = 16;
    const drawWidth = canvasWidth - padding * 2;
    const drawHeight = canvasHeight - padding * 2;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const loadImage = (src) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });

    const getRGBHistogramsFromImage = (img) => {
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      const off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      const c = off.getContext("2d");
      c.drawImage(img, 0, 0);
      const data = c.getImageData(0, 0, w, h).data;
      const histR = new Array(256).fill(0);
      const histG = new Array(256).fill(0);
      const histB = new Array(256).fill(0);
      for (let i = 0; i < data.length; i += 4) {
        histR[data[i]] += 1;
        histG[data[i + 1]] += 1;
        histB[data[i + 2]] += 1;
      }
      return { histR, histG, histB };
    };

    const percentile99_5 = (arr) => {
      const sorted = arr.slice().sort((a, b) => a - b);
      const idx = Math.floor(256 * 0.995);
      return sorted[idx] ?? 0;
    };

    Promise.all([loadImage(photoYour), loadImage(photoRef)])
      .then(([img1, img2]) => {
        const { histR: histR1, histG: histG1, histB: histB1 } = getRGBHistogramsFromImage(img1);
        const { histR: histR2, histG: histG2, histB: histB2 } = getRGBHistogramsFromImage(img2);
        const p1 = Math.max(percentile99_5(histR1), percentile99_5(histG1), percentile99_5(histB1));
        const p2 = Math.max(percentile99_5(histR2), percentile99_5(histG2), percentile99_5(histB2));
        const maxVal = Math.max(p1, p2, 1);
        const scale = maxVal * 1.15;

        ctx.fillStyle = "#f8f6f2";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        const drawLine = (hist, color, dashed) => {
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.setLineDash(dashed ? [4, 4] : []);
          ctx.beginPath();
          for (let i = 0; i < 256; i++) {
            const x = padding + (i / 256) * drawWidth;
            const histVal = Math.min(hist[i], maxVal);
            const y = canvasHeight - padding - (histVal / scale) * drawHeight;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        };

        const r = "rgba(220,80,80,0.8)";
        const g = "rgba(80,180,80,0.8)";
        const b = "rgba(80,120,220,0.8)";
        drawLine(histR1, r, false);
        drawLine(histG1, g, false);
        drawLine(histB1, b, false);
        drawLine(histR2, r, true);
        drawLine(histG2, g, true);
        drawLine(histB2, b, true);
      })
      .catch(() => {});
  }, [photoYour, photoRef]);

  const lr = result.lightroomSettings || {};
  const copyParamsToClipboard = async () => {
    const fmt = (v) => (v != null ? String(v) : "—");
    const text = [
      `曝光：${fmt(lr.exposure)} EV`,
      `對比：${fmt(lr.contrast)}`,
      `高光：${fmt(lr.highlights)}`,
      `陰影：${fmt(lr.shadows)}`,
      `白色：${fmt(lr.whites)}`,
      `黑色：${fmt(lr.blacks)}`,
      `飽和度：${fmt(lr.saturation)}`,
      `自然飽和度：${fmt(lr.vibrance)}`,
      `色溫：${fmt(lr.temperature)} K`,
    ].join("\n");
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };
  // 固定 9 項順序：曝光、對比、高光、陰影、白色、黑色、飽和度、自然飽和度、色溫
  const lrItems = [
    { key: "exposure", label: "曝光", value: lr.exposure, unit: " EV" },
    { key: "contrast", label: "對比", value: lr.contrast, unit: "" },
    { key: "highlights", label: "高光", value: lr.highlights, unit: "" },
    { key: "shadows", label: "陰影", value: lr.shadows, unit: "" },
    { key: "whites", label: "白色", value: lr.whites, unit: "" },
    { key: "blacks", label: "黑色", value: lr.blacks, unit: "" },
    { key: "saturation", label: "飽和度", value: lr.saturation, unit: "" },
    { key: "vibrance", label: "自然飽和度", value: lr.vibrance, unit: "" },
    { key: "temperature", label: "色溫", value: lr.temperature, unit: " K" },
  ];

  const isSameImage = !!result.analysis?.isSameImage;

  return (
    <div className="analysis-result-wrapper mt-8 space-y-8 analysis-result-enter" data-same-image={isSameImage || undefined}>
      {isSameImage && (
        <div className="same-image-notice" role="status">
          <p className="m-0">偵測到相同圖片，無需調整</p>
        </div>
      )}
      {/* ---------- 第一部分：照片對比分析（白色卡片） ---------- */}
      <div className="analysis-comparison-card photo-comparison-section">
        <div className="sectionHeader">
          <div className="sectionHeaderLeft">
            <h2 className="main-section-title analysis-comparison-title">照片對比分析</h2>
          </div>
        </div>
        <div className="analysis-comparison-grid">
          <ComparisonItem
            label="亮度對比"
            yours={result.brightness.yours}
            reference={result.brightness.reference}
            suggestion={result.brightness.suggestion}
          />
          <ComparisonItem
            label="飽和度對比"
            yours={result.saturation.yours}
            reference={result.saturation.reference}
            suggestion={result.saturation.suggestion}
          />
          <ComparisonItem
            label="對比度對比"
            yours={result.contrast.yours}
            reference={result.contrast.reference}
            suggestion={result.contrast.suggestion}
          />
          <ColorTempItem
            yours={result.colorTemp.yours}
            reference={result.colorTemp.reference}
            suggestion={result.colorTemp.suggestion}
            originalTone={result.analysis?.originalTone}
            referenceTone={result.analysis?.referenceTone}
            isSameImage={isSameImage}
          />
        </div>
        {biasData && (
          <div className="bias-dashboard">
            <h4 className="bias-dashboard-title">偏向分析</h4>
            <div className="bias-dashboard-table">
              <div className="bias-dashboard-row bias-dashboard-header">
                <div className="bias-dashboard-cell bias-dashboard-cell-left">你的照片</div>
                <div className="bias-dashboard-cell bias-dashboard-cell-center">差異說明</div>
                <div className="bias-dashboard-cell bias-dashboard-cell-right">參考照片</div>
              </div>
              <div className="bias-dashboard-row">
                <div className="bias-dashboard-cell bias-dashboard-cell-left">
                  <span className="bias-label" data-value={biasData.yours.brightnessBias}>{biasData.yours.brightnessBias}</span>
                </div>
                <div className="bias-dashboard-cell bias-dashboard-cell-center">
                  <p className="bias-diff-text">
                    {(() => {
                      const pct = Math.round(Math.abs(biasData.reference.avgL - biasData.yours.avgL) / 255 * 100);
                      if (pct < 2) return "亮度接近";
                      return biasData.reference.avgL > biasData.yours.avgL
                        ? `參考照片比你的照片亮 ${pct}%`
                        : `參考照片比你的照片暗 ${pct}%`;
                    })()}
                  </p>
                </div>
                <div className="bias-dashboard-cell bias-dashboard-cell-right">
                  <span className="bias-label" data-value={biasData.reference.brightnessBias}>{biasData.reference.brightnessBias}</span>
                </div>
              </div>
              <div className="bias-dashboard-row">
                <div className="bias-dashboard-cell bias-dashboard-cell-left">
                  <span className="bias-label" data-value={biasData.yours.tempBias}>{biasData.yours.tempBias}</span>
                </div>
                <div className="bias-dashboard-cell bias-dashboard-cell-center">
                  <p className="bias-diff-text">
                    {biasData.yours.tempBias === biasData.reference.tempBias ? "色溫傾向一致" : `參考照片${biasData.reference.tempBias}`}
                  </p>
                </div>
                <div className="bias-dashboard-cell bias-dashboard-cell-right">
                  <span className="bias-label" data-value={biasData.reference.tempBias}>{biasData.reference.tempBias}</span>
                </div>
              </div>
              <div className="bias-dashboard-row">
                <div className="bias-dashboard-cell bias-dashboard-cell-left">
                  <span className="bias-label" data-value={biasData.yours.channelBias}>{biasData.yours.channelBias}</span>
                </div>
                <div className="bias-dashboard-cell bias-dashboard-cell-center">
                  <p className="bias-diff-text">
                    {biasData.yours.channelBias === biasData.reference.channelBias ? "色彩通道傾向一致" : `參考照片${biasData.reference.channelBias}`}
                  </p>
                </div>
                <div className="bias-dashboard-cell bias-dashboard-cell-right">
                  <span className="bias-label" data-value={biasData.reference.channelBias}>{biasData.reference.channelBias}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="color-distribution compare-histogram-block">
          <h4 className="compare-histogram-title">顏色分佈</h4>
          <div className="compare-histogram-canvas-wrap">
            <canvas ref={compareHistogramCanvasRef} width={512} height={200} className="compare-histogram-canvas" />
          </div>
          <div className="histogram-legend compare-histogram-legend">
            <span className="legend-item compare-legend-red">紅</span>
            <span className="legend-item compare-legend-green">綠</span>
            <span className="legend-item compare-legend-blue">藍</span>
            <span className="legend-item compare-legend-solid">實線 你的照片</span>
            <span className="legend-item compare-legend-dashed">虛線 參考照片</span>
          </div>
        </div>
      </div>

      {/* 區塊二：分析模式（獨立區塊）*/}
      <AnalysisModeSection
        toneMode={result.toneMode}
        originalTone={result.analysis?.originalTone}
        referenceTone={result.analysis?.referenceTone}
        isSameImage={isSameImage}
      />

      {/* ---------- 第二部分：Lightroom 調整建議（藍→紫漸層，白字，3x3 網格） ---------- */}
      <div className="lightroom-suggestions-card" aria-label="Lightroom 調整建議">
        <div className="sectionHeader">
          <div className="sectionHeaderLeft">
            <h3 className="sectionTitle lightroom-suggestions-title">Lightroom 調整建議</h3>
          </div>
        </div>
        <div className="lightroom-adjustment-grid">
          {lrItems.map((item) => (
            <div key={item.key} className="lightroom-adjustment-item">
              <p className="lightroom-adjustment-name">{item.label}</p>
              <p className="lightroom-adjustment-value">
                {item.value != null ? `${item.value}${item.unit}` : "—"}
              </p>
            </div>
          ))}
        </div>
        {!result.analysis?.isSameImage && (
          <div className="lightroom-hint-box">
            <span className="lightroom-hint-icon px-icon" aria-hidden><PxIconBulb /></span>
            <p className="m-0">這些是建議值，實際調整時可以根據個人喜好微調。</p>
          </div>
        )}
        {result.lightingEffect?.isLightingEffect && (
          <div className="lighting-effect-warning" role="alert">
            <p className="lighting-effect-warning-title">⚠️ 偵測到創意打光效果（{result.lightingEffect.lightingType === "blue" ? "藍色" : result.lightingEffect.lightingType === "magenta" ? "洋紅" : "彩色"}燈光）</p>
            <p className="m-0">系統已自動降低調整強度，避免過度改變原圖色調。若需要完整複製打光效果，建議使用專業調色軟體。</p>
          </div>
        )}
        <div className="lightroom-copy-params-wrap">
          <button
            type="button"
            onClick={copyParamsToClipboard}
            className="btn btn-primary lightroom-copy-params-btn"
          >
            {copySuccess ? "已複製 ✓" : "複製參數"}
          </button>
        </div>
      </div>

      {/* ---------- 第三部分：調整預覽 ---------- */}
      <AdjustmentPreview
        photoBase64={photoYour}
        lightroomSettings={result.lightroomSettings}
        colorTransferParams={result.colorTransferParams}
        hslAdjustments={result.hslAdjustments}
        rgbCurveAdjustments={result.rgbCurveAdjustments}
      />

      <div className="flex justify-start">
        <button
          type="button"
          onClick={onReset}
          className="text-sm font-medium text-[var(--color-accent-primary)] hover:text-[var(--color-accent-hover)] focus:outline-none focus:underline"
        >
          重新上傳並分析
        </button>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 調色逆向工程：單張照片分析工具
// -----------------------------------------------------------------------------
function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: h * 360, s: s * 100, v: v * 100 };
}

function calculateBrightness(data) {
  let sum = 0, n = 0;
  for (let i = 0; i < data.length; i += 4) {
    sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
    n++;
  }
  return n ? Math.round((sum / n / 255) * 100) : 50;
}

function calculateContrast(data) {
  const lums = [];
  for (let i = 0; i < data.length; i += 4)
    lums.push((data[i] + data[i + 1] + data[i + 2]) / 3);
  if (lums.length < 2) return 50;
  const mean = lums.reduce((a, b) => a + b, 0) / lums.length;
  const variance = lums.reduce((a, v) => a + (v - mean) ** 2, 0) / lums.length;
  const std = Math.sqrt(variance);
  // 0-50 typical std -> map to 0-100 contrast feeling
  const raw = Math.min(100, Math.max(0, (std / 80) * 100));
  return Math.round(raw);
}

function calculateSaturation(data) {
  let sum = 0, n = 0;
  for (let i = 0; i < data.length; i += 4) {
    const { s } = rgbToHsv(data[i], data[i + 1], data[i + 2]);
    sum += s;
    n++;
  }
  return n ? Math.round(sum / n) : 50;
}

function estimateColorTemp(data) {
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
  }
  if (!n) return { temp: 5500, tag: "中性" };
  r /= n; g /= n; b /= n;
  const ratio = b > 0 ? r / b : 1;
  let temp = 5500;
  if (ratio > 1.15) temp = 5500 + (ratio - 1) * 4000;
  else if (ratio < 0.85) temp = 5500 - (1 - ratio) * 4000;
  temp = Math.round(Math.max(3000, Math.min(9000, temp)));
  const tag = temp > 6000 ? "偏冷" : temp < 5000 ? "偏暖" : "中性";
  return { temp, tag };
}

function extractDominantColors(data, numColors = 5) {
  const bucket = {};
  const step = 32;
  for (let i = 0; i < data.length; i += 4) {
    const r = Math.floor(data[i] / step) * step;
    const g = Math.floor(data[i + 1] / step) * step;
    const b = Math.floor(data[i + 2] / step) * step;
    const key = `${r},${g},${b}`;
    bucket[key] = (bucket[key] || 0) + 1;
  }
  const total = data.length / 4;
  const entries = Object.entries(bucket)
    .map(([k, count]) => {
      const [r, g, b] = k.split(",").map(Number);
      const hex = "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
      return { hex, percentage: Math.round((count / total) * 100), r, g, b };
    })
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, numColors);
  return entries;
}

function generateHistogram(data) {
  const bins = new Array(256).fill(0);
  for (let i = 0; i < data.length; i += 4) {
    const l = Math.round((data[i] + data[i + 1] + data[i + 2]) / 3);
    bins[Math.min(255, l)]++;
  }
  return bins;
}

function generateRGBHistograms(data) {
  const r = new Array(256).fill(0);
  const g = new Array(256).fill(0);
  const b = new Array(256).fill(0);
  for (let i = 0; i < data.length; i += 4) {
    r[Math.min(255, data[i])]++;
    g[Math.min(255, data[i + 1])]++;
    b[Math.min(255, data[i + 2])]++;
  }
  return { r, g, b };
}

function getColorName(hex) {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  const names = [
    { name: "紅", r: 220, g: 50, b: 50 }, { name: "橙", r: 230, g: 130, b: 50 },
    { name: "黃", r: 240, g: 220, b: 60 }, { name: "綠", r: 80, g: 180, b: 80 },
    { name: "青", r: 60, g: 180, b: 180 }, { name: "藍", r: 60, g: 100, b: 220 },
    { name: "紫", r: 140, g: 80, b: 200 }, { name: "粉", r: 240, g: 160, b: 180 },
    { name: "白", r: 245, g: 245, b: 245 }, { name: "灰", r: 128, g: 128, b: 128 }, { name: "黑", r: 30, g: 30, b: 30 },
  ];
  let best = "其他", minD = 1e9;
  names.forEach(({ name, r: nr, g: ng, b: nb }) => {
    const d = (r - nr) ** 2 + (g - ng) ** 2 + (b - nb) ** 2;
    if (d < minD) { minD = d; best = name; }
  });
  return best;
}

// 偏向分析：從像素 data 計算亮度/色溫/色彩通道偏向（純前端）
function computeBiasAnalysis(data) {
  const n = data.length / 4;
  let sumL = 0;
  const Ls = [];
  let sumR = 0, sumG = 0, sumB = 0;
  for (let i = 0; i < data.length; i += 4) {
    const R = data[i], G = data[i + 1], B = data[i + 2];
    const L = 0.299 * R + 0.587 * G + 0.114 * B;
    sumL += L;
    Ls.push(L);
    sumR += R;
    sumG += G;
    sumB += B;
  }
  const avgL = sumL / n;
  const avgR = sumR / n;
  const avgG = sumG / n;
  const avgB = sumB / n;
  const varianceL = Ls.reduce((acc, L) => acc + (L - avgL) ** 2, 0) / n;
  const stdL = Math.sqrt(varianceL);

  let brightnessLabel = "正常";
  if (avgL < 85) brightnessLabel = "偏暗";
  else if (avgL > 170) brightnessLabel = "偏亮";

  let contrastLabel = "正常對比";
  if (stdL < 40) contrastLabel = "低對比";
  else if (stdL > 80) contrastLabel = "高對比";

  let tempBiasLabel = "中性";
  if (avgR - avgB > 15) tempBiasLabel = "偏暖";
  else if (avgB - avgR > 15) tempBiasLabel = "偏冷";
  const colorTempK = Math.round(5000 + (avgB - avgR) * 20);

  const rgb = [
    { v: avgR, label: "偏紅" },
    { v: avgG, label: "偏綠" },
    { v: avgB, label: "偏藍" },
  ].sort((a, b) => b.v - a.v);
  const channelBiasLabel = rgb[0].v - rgb[1].v > 10 ? rgb[0].label : "均衡";

  const styleDescriptions = {
    "偏暗-偏冷": "低調冷色調風格，適合都市、夜景題材。",
    "偏亮-偏暖": "明亮暖色調風格，適合人像、日系題材。",
    "偏暗-偏暖": "暗調暖色調風格，適合電影感、復古題材。",
    "偏亮-偏冷": "清透冷色調風格，適合清新、自然題材。",
    "正常-中性": "色調均衡，對比適中，通用型風格。",
    "偏暗-中性": "低調中性風格，對比適中，適合紀實、街拍。",
    "偏亮-中性": "明亮中性風格，適合人像、商業攝影。",
    "正常-偏暖": "均衡偏暖風格，適合人像、風景。",
    "正常-偏冷": "均衡偏冷風格，適合建築、靜物。",
  };
  const key = `${brightnessLabel}-${tempBiasLabel}`;
  const styleDescription = styleDescriptions[key] ?? `整體為${brightnessLabel}、${tempBiasLabel}，${contrastLabel}。`;

  return {
    brightnessLabel,
    avgL: Math.round(avgL),
    stdL: Math.round(stdL),
    contrastLabel,
    tempBiasLabel,
    colorTempK,
    avgR: Math.round(avgR),
    avgG: Math.round(avgG),
    avgB: Math.round(avgB),
    channelBiasLabel,
    styleDescription,
  };
}

function estimateToneCurveDescription(histogram) {
  const total = histogram.reduce((a, b) => a + b, 0) || 1;
  const shadow = histogram.slice(0, 64).reduce((a, b) => a + b, 0) / total;
  const mid = histogram.slice(64, 192).reduce((a, b) => a + b, 0) / total;
  const highlight = histogram.slice(192, 256).reduce((a, b) => a + b, 0) / total;
  if (shadow > 0.4) return "陰影較多、暗部較重，可能做了壓暗或褪色風格。";
  if (highlight > 0.35) return "高光區域較多，整體偏亮或過曝風格。";
  if (mid > 0.6) return "中間調為主，對比柔和、階調平順。";
  return "階調分佈較均衡，可依喜好微調曲線。";
}

function estimateLightroomParams(analysis) {
  const { brightness, contrast, saturation, colorTemp, clarity } = analysis;
  const exp = ((brightness - 50) / 50) * 1.5;
  const con = ((contrast - 50) / 50) * 40;
  const sat = ((saturation - 50) / 50) * 35;
  const vib = ((saturation - 50) / 50) * 25;
  const tempVal = colorTemp.temp - 5500;
  const temp = Math.round(tempVal / 200);
  const tint = temp > 0 ? Math.round(-temp * 0.3) : Math.round(-temp * 0.3);
  const high = brightness > 55 ? -10 : brightness < 45 ? 5 : 0;
  const shad = brightness < 50 ? 15 : brightness > 60 ? -5 : 5;
  const white = brightness > 55 ? 5 : 0;
  const black = brightness < 45 ? -8 : 0;
  const clar = ((clarity - 50) / 50) * 25;
  const dehaze = ((contrast - 50) / 50) * 15;
  const texture = ((clarity - 50) / 50) * 15;
  return {
    exposureValue: Math.round(exp * 10) / 10,
    contrastValue: Math.round(con),
    highlightValue: high,
    shadowValue: shad,
    whiteValue: white,
    blackValue: black,
    tempValue: temp,
    tintValue: tint,
    saturationValue: Math.round(sat),
    vibranceValue: Math.round(vib),
    clarityValue: Math.round(clar),
    dehazeValue: Math.round(dehaze),
    textureValue: Math.round(texture),
  };
}

function getStyleTags(analysis) {
  const tags = [];
  if (analysis.brightness < 40) tags.push("低調");
  if (analysis.brightness > 65) tags.push("明亮");
  if (analysis.contrast < 40) tags.push("柔和");
  if (analysis.contrast > 65) tags.push("高對比");
  if (analysis.saturation < 40) tags.push("低飽和");
  if (analysis.saturation > 65) tags.push("高飽和");
  if (analysis.colorTemp.temp > 6200) tags.push("冷色調");
  if (analysis.colorTemp.temp < 5000) tags.push("暖色調");
  if (analysis.clarity > 60) tags.push("清晰");
  if (tags.length === 0) tags.push("均衡");
  return tags;
}

function getStyleName(analysis, styleTags) {
  const lowSat = analysis.saturation < 40;
  const warm = analysis.colorTemp?.temp < 5000;
  const soft = analysis.contrast < 40;
  const liftShadow = (analysis.shadowValue ?? 0) > 10;
  if (lowSat && warm && soft) return "電影膠片風格";
  if (lowSat && soft) return "低飽和柔和風格";
  if (warm && liftShadow) return "暖調提亮陰影風格";
  if (styleTags?.length) return `${styleTags.slice(0, 2).join("＋")}風格`;
  return "一般調色風格";
}

function getStyleDescription(styleName, analysis, styleTags, toneCurveDescription) {
  const parts = [toneCurveDescription];
  if (analysis.saturation < 45) parts.push("整體飽和度偏低。");
  if (analysis.colorTemp?.temp < 5200) parts.push("色溫偏暖。");
  if (analysis.contrast < 45) parts.push("對比較柔和。");
  if ((analysis.shadowValue ?? 0) > 15) parts.push("陰影有提亮。");
  return `這張照片呈現出${styleName}的特徵：${parts.join(" ")}適合用於人像、街拍等題材。`;
}

function analyzeReverseImage(imageFile) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    img.onerror = () => reject(new Error("無法載入圖片"));
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const colorTemp = estimateColorTemp(data);
      const dominantColors = extractDominantColors(data);
      const histogram = generateHistogram(data);
      const rgbHistogram = generateRGBHistograms(data);
      const brightness = calculateBrightness(data);
      const contrast = calculateContrast(data);
      const saturation = calculateSaturation(data);
      const clarity = Math.round((contrast + 50) / 2);
      const toneCurveDescription = estimateToneCurveDescription(histogram);
      const bias = computeBiasAnalysis(data);
      const analysis = {
        brightness,
        contrast,
        saturation,
        clarity,
        colorTemp,
        dominantColor: dominantColors[0]?.hex || "#808080",
        dominantColorName: getColorName(dominantColors[0]?.hex || "#808080"),
        tintBias: colorTemp.temp > 6000 ? "偏綠/冷" : colorTemp.temp < 5000 ? "偏洋紅/暖" : "中性",
        colorPalette: dominantColors,
        histogram,
        rgbHistogram,
        toneCurveDescription,
        bias,
      };
      const lrParams = estimateLightroomParams(analysis);
      const styleTags = getStyleTags(analysis);
      const merged = { ...analysis, ...lrParams };
      const styleName = getStyleName(merged, styleTags);
      const styleDesc = getStyleDescription(styleName, merged, styleTags, toneCurveDescription);
      resolve({
        analysis: { ...merged, styleName, styleDesc },
        imageWidth: canvas.width,
        imageHeight: canvas.height,
        styleTags,
      });
    };
    img.src = URL.createObjectURL(imageFile);
  });
}

// 參數值轉條形寬度（約 -50..+50 → 0..100%），負值加 negative class
function paramBarPercent(val, range = 50) {
  if (val == null) return 50;
  const p = 50 + (Number(val) / range) * 50;
  return Math.max(0, Math.min(100, p));
}

// 調色逆向工程：分析結果區塊（含 histogram / tone curve / RGB 直方圖）
const LR_SLIDER_SPEC = [
  { key: "exposure", label: "曝光", min: -5, max: 5, step: 0.1 },
  { key: "contrast", label: "對比", min: -100, max: 100, step: 1 },
  { key: "highlight", label: "高光", min: -100, max: 100, step: 1 },
  { key: "shadow", label: "陰影", min: -100, max: 100, step: 1 },
  { key: "white", label: "白色", min: -100, max: 100, step: 1 },
  { key: "black", label: "黑色", min: -100, max: 100, step: 1 },
  { key: "temp", label: "色溫", min: -100, max: 100, step: 1 },
  { key: "tint", label: "色調", min: -100, max: 100, step: 1 },
  { key: "saturation", label: "飽和度", min: -100, max: 100, step: 1 },
  { key: "vibrance", label: "自然飽和度", min: -100, max: 100, step: 1 },
];
const LR_INITIAL = Object.fromEntries(LR_SLIDER_SPEC.map(({ key }) => [key, 0]));
const RGB_SPEC = [
  { key: "r", label: "R（紅）", channel: "r" },
  { key: "g", label: "G（綠）", channel: "g" },
  { key: "b", label: "B（藍）", channel: "b" },
];
const RGB_INITIAL = { r: 0, g: 0, b: 0 };

function getRgbParamsFromAnalysis() {
  return { ...RGB_INITIAL };
}

function getLrParamsFromAnalysis(analysis) {
  if (!analysis) return { ...LR_INITIAL };
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, Number(v) ?? 0));
  return {
    exposure: clamp(analysis.exposureValue, -5, 5),
    contrast: clamp(analysis.contrastValue, -100, 100),
    highlight: clamp(analysis.highlightValue, -100, 100),
    shadow: clamp(analysis.shadowValue, -100, 100),
    white: clamp(analysis.whiteValue, -100, 100),
    black: clamp(analysis.blackValue, -100, 100),
    temp: clamp(analysis.tempValue, -100, 100),
    tint: clamp(analysis.tintValue, -100, 100),
    saturation: clamp(analysis.saturationValue, -100, 100),
    vibrance: clamp(analysis.vibranceValue, -100, 100),
  };
}

/** 純前端：對 Uint8ClampedArray 就地套用 Lightroom 參數，回傳直方圖。飽和度/自然飽和度用 RGB 直接運算。 */
function applyLightroomPipelineInPlace(data, width, height, lrParams, rgbParams) {
  const exposure = Number(lrParams.exposure) ?? 0;
  const contrast = Number(lrParams.contrast) ?? 0;
  const highlights = Number(lrParams.highlight) ?? 0;
  const shadows = Number(lrParams.shadow) ?? 0;
  const whites = Number(lrParams.white) ?? 0;
  const blacks = Number(lrParams.black) ?? 0;
  const temperature = Number(lrParams.temp) ?? 0;
  const tint = Number(lrParams.tint) ?? 0;
  const saturation = Number(lrParams.saturation) ?? 0;
  const vibrance = Number(lrParams.vibrance) ?? 0;
  const sliderR = Number(rgbParams.r) ?? 0;
  const sliderG = Number(rgbParams.g) ?? 0;
  const sliderB = Number(rgbParams.b) ?? 0;

  const expFactor = Math.pow(2, exposure);
  const conFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  const histR = new Array(256).fill(0);
  const histG = new Array(256).fill(0);
  const histB = new Array(256).fill(0);

  for (let i = 0; i < data.length; i += 4) {
    let R = data[i];
    let G = data[i + 1];
    let B = data[i + 2];

    R = R * expFactor;
    G = G * expFactor;
    B = B * expFactor;

    R = conFactor * (R - 128) + 128;
    G = conFactor * (G - 128) + 128;
    B = conFactor * (B - 128) + 128;

    const L = 0.299 * R + 0.587 * G + 0.114 * B;

    if (L > 192) {
      const scale = 1 + (highlights / 100) * (L - 192) / 63;
      R *= scale;
      G *= scale;
      B *= scale;
    }
    if (L < 64) {
      const scale = 1 + (shadows / 100) * (64 - L) / 64;
      R *= scale;
      G *= scale;
      B *= scale;
    }
    if (L > 224) {
      const scale = 1 + (whites / 100) * 0.5;
      R *= scale;
      G *= scale;
      B *= scale;
    }
    if (L < 32) {
      const scale = 1 + (blacks / 100) * 0.5;
      R *= scale;
      G *= scale;
      B *= scale;
    }

    R = R + temperature * 0.5;
    B = B - temperature * 0.5;
    R = R + tint * 0.3;
    G = G - tint * 0.3;

    if (saturation !== 0) {
      const factor = saturation / 100;
      const gray = 0.299 * R + 0.587 * G + 0.114 * B;
      R = gray + (R - gray) * (1 + factor);
      G = gray + (G - gray) * (1 + factor);
      B = gray + (B - gray) * (1 + factor);
    }
    if (vibrance !== 0) {
      const factor = vibrance / 100;
      const gray = 0.299 * R + 0.587 * G + 0.114 * B;
      const maxChannel = Math.max(R, G, B);
      const satLevel = (maxChannel - Math.min(R, G, B)) / (maxChannel + 0.001);
      const vibranceFactor = factor * (1 - satLevel);
      R = gray + (R - gray) * (1 + vibranceFactor);
      G = gray + (G - gray) * (1 + vibranceFactor);
      B = gray + (B - gray) * (1 + vibranceFactor);
    }

    R = R + sliderR;
    G = G + sliderG;
    B = B + sliderB;

    R = Math.max(0, Math.min(255, Math.round(R)));
    G = Math.max(0, Math.min(255, Math.round(G)));
    B = Math.max(0, Math.min(255, Math.round(B)));

    data[i] = R;
    data[i + 1] = G;
    data[i + 2] = B;
    histR[R] += 1;
    histG[G] += 1;
    histB[B] += 1;
  }
  return { histR, histG, histB };
}

function ReverseAnalysisResults({
  reverseImage,
  fileName,
  imageWidth,
  imageHeight,
  analysis,
  styleTags,
  onReset,
  onExport,
  histogramCanvasRef,
  toneCurveCanvasRef,
  colorHistogramCanvasRef,
}) {
  const [lrParams, setLrParams] = useState(() => getLrParamsFromAnalysis(analysis));
  const [rgbParams, setRgbParams] = useState(RGB_INITIAL);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [adjustedHist, setAdjustedHist] = useState(null);
  const [originalImageUrl, setOriginalImageUrl] = useState(null);
  const [originalPixelsReady, setOriginalPixelsReady] = useState(false);
  // originalImageData：僅在圖片 onload 時寫入一次，之後只讀不寫；.data 絕不 splice/set/賦值修改
  const originalImageDataRef = useRef(null); // { data: Uint8ClampedArray, width, height }
  const offscreenCanvasRef = useRef(null); // 離屏 canvas，僅供建立備份時使用
  const initialLrParamsRef = useRef(null); // 分析出的初始值，套用時效果量 = 當前值 - 初始值

  // 圖片上傳後在 onload 中：建立離屏 canvas、深拷貝像素備份、儲存原圖 URL
  useEffect(() => {
    if (!reverseImage) {
      originalImageDataRef.current = null;
      offscreenCanvasRef.current = null;
      setOriginalImageUrl(null);
      setOriginalPixelsReady(false);
      setPreviewUrl(null);
      setAdjustedHist(null);
      return;
    }
    const img = new Image();
    if (!reverseImage.startsWith("data:")) img.crossOrigin = "anonymous";
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      if (!w || !h) return;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const dataCopy = new Uint8ClampedArray(imageData.data);
      originalImageDataRef.current = {
        data: dataCopy,
        width: canvas.width,
        height: canvas.height,
      };
      offscreenCanvasRef.current = canvas;
      setOriginalImageUrl(canvas.toDataURL("image/png"));
      setOriginalPixelsReady(true);
    };
    img.onerror = () => {
      originalImageDataRef.current = null;
      offscreenCanvasRef.current = null;
      setOriginalImageUrl(null);
      setOriginalPixelsReady(false);
    };
    img.src = reverseImage;
  }, [reverseImage]);

  const handleApplyPreview = useCallback(() => {
    const originalImageData = originalImageDataRef.current;
    if (!originalImageData) return;
    const initialLr = initialLrParamsRef.current ?? getLrParamsFromAnalysis(analysis);
    const initialRgb = getRgbParamsFromAnalysis();
    const effectLrParams = {
      exposure: lrParams.exposure - initialLr.exposure,
      contrast: lrParams.contrast - initialLr.contrast,
      highlight: lrParams.highlight - initialLr.highlight,
      shadow: lrParams.shadow - initialLr.shadow,
      white: lrParams.white - initialLr.white,
      black: lrParams.black - initialLr.black,
      temp: lrParams.temp - initialLr.temp,
      tint: lrParams.tint - initialLr.tint,
      saturation: lrParams.saturation - initialLr.saturation,
      vibrance: lrParams.vibrance - initialLr.vibrance,
    };
    const effectRgbParams = {
      r: rgbParams.r - initialRgb.r,
      g: rgbParams.g - initialRgb.g,
      b: rgbParams.b - initialRgb.b,
    };
    try {
      const workingData = new Uint8ClampedArray(originalImageData.data);
      const { histR, histG, histB } = applyLightroomPipelineInPlace(
        workingData,
        originalImageData.width,
        originalImageData.height,
        effectLrParams,
        effectRgbParams,
      );
      const previewCanvas = document.createElement("canvas");
      previewCanvas.width = originalImageData.width;
      previewCanvas.height = originalImageData.height;
      const previewCtx = previewCanvas.getContext("2d");
      const newImageData = new ImageData(workingData, originalImageData.width, originalImageData.height);
      previewCtx.putImageData(newImageData, 0, 0);
      setPreviewUrl(previewCanvas.toDataURL("image/png"));
      setAdjustedHist({ histR, histG, histB });
    } catch (err) {
      console.error("套用並預覽失敗:", err);
    }
  }, [lrParams, rgbParams, analysis]);

  useEffect(() => {
    if (analysis) {
      const initial = getLrParamsFromAnalysis(analysis);
      initialLrParamsRef.current = initial;
      setLrParams(initial);
    }
  }, [analysis]);
  const setLr = (key, value) => setLrParams((p) => ({ ...p, [key]: value }));
  const setRgb = (key, value) => setRgbParams((p) => ({ ...p, [key]: value }));
  const resetLr = () => {
    setLrParams(getLrParamsFromAnalysis(analysis));
    clearPreviewAndHist();
  };
  const resetRgb = () => {
    setRgbParams(getRgbParamsFromAnalysis());
    clearPreviewAndHist();
  };

  useEffect(() => {
    if (!analysis?.histogram) return;
    const canvas = histogramCanvasRef?.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = (canvas.width = canvas.offsetWidth || 400);
    const h = (canvas.height = 120);
    const bins = analysis.histogram;
    const max = Math.max(...bins, 1);
    ctx.fillStyle = "var(--color-bg-tertiary)";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "var(--color-accent-primary)";
    const barW = w / 256;
    for (let i = 0; i < 256; i++) {
      const x = (i / 256) * w;
      const barH = (bins[i] / max) * (h - 4);
      ctx.fillRect(x, h - barH, Math.max(1, barW + 0.5), barH);
    }
  }, [analysis?.histogram, histogramCanvasRef]);

  useEffect(() => {
    if (!analysis?.histogram) return;
    const canvas = toneCurveCanvasRef?.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = (canvas.width = canvas.offsetWidth || 400);
    const h = (canvas.height = 200);
    const bins = analysis.histogram;
    const total = bins.reduce((a, b) => a + b, 0) || 1;
    let acc = 0;
    const points = [];
    for (let i = 0; i <= 256; i++) {
      if (i > 0) acc += bins[i - 1];
      points.push({ x: (i / 256) * w, y: h - (acc / total) * h });
    }
    ctx.fillStyle = "var(--color-bg-tertiary)";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "var(--color-border-primary)";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, w, h);
    ctx.beginPath();
    ctx.strokeStyle = "var(--color-accent-primary)";
    ctx.lineWidth = 3;
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
  }, [analysis?.histogram, toneCurveCanvasRef]);

  const drawColorHistogramToCanvas = useCallback((displayCanvas, histR, histG, histB) => {
    if (!displayCanvas) return;
    const percentile99_5 = (arr) => {
      const sorted = [...arr].sort((a, b) => a - b);
      return sorted[Math.floor(256 * 0.995)] ?? 1;
    };
    const pR = percentile99_5(histR);
    const pG = percentile99_5(histG);
    const pB = percentile99_5(histB);
    const maxVal = Math.max(pR, pG, pB, 1);
    const scale = maxVal * 1.15;
    const cw = 512;
    const ch = 200;
    displayCanvas.width = cw;
    displayCanvas.height = ch;
    const dctx = displayCanvas.getContext("2d");
    const padding = 16;
    const paddingLeft = padding;
    const paddingBottom = padding;
    const drawWidth = cw - padding * 2;
    const drawHeight = ch - padding * 2;
    const topY = padding;
    dctx.fillStyle = "#f8f6f2";
    dctx.fillRect(0, 0, cw, ch);
    const drawChannel = (hist, strokeStyle, fillStyle) => {
      dctx.beginPath();
      dctx.moveTo(paddingLeft, ch - paddingBottom);
      for (let bin = 0; bin < 256; bin++) {
        const x = paddingLeft + (bin / 255) * drawWidth;
        const raw = Math.min(hist[bin], maxVal);
        const y = ch - paddingBottom - (raw / scale) * drawHeight;
        const clampedY = Math.max(topY, Math.min(ch - paddingBottom, y));
        if (bin === 0) dctx.lineTo(x, clampedY);
        else dctx.lineTo(x, clampedY);
      }
      dctx.lineTo(paddingLeft + drawWidth, ch - paddingBottom);
      dctx.closePath();
      dctx.fillStyle = fillStyle;
      dctx.fill();
      dctx.beginPath();
      dctx.moveTo(paddingLeft, ch - paddingBottom - (Math.min(hist[0], maxVal) / scale) * drawHeight);
      for (let bin = 1; bin < 256; bin++) {
        const x = paddingLeft + (bin / 255) * drawWidth;
        const raw = Math.min(hist[bin], maxVal);
        const y = ch - paddingBottom - (raw / scale) * drawHeight;
        dctx.lineTo(x, Math.max(topY, Math.min(ch - paddingBottom, y)));
      }
      dctx.strokeStyle = strokeStyle;
      dctx.lineWidth = 1.5;
      dctx.stroke();
    };
    drawChannel(histR, "rgba(220,80,80,0.8)", "rgba(220,80,80,0.15)");
    drawChannel(histG, "rgba(80,180,80,0.8)", "rgba(80,180,80,0.15)");
    drawChannel(histB, "rgba(80,120,220,0.8)", "rgba(80,120,220,0.15)");
  }, []);

  const redrawOriginalHistogram = useCallback(() => {
    const orig = originalImageDataRef.current;
    const canvas = colorHistogramCanvasRef?.current;
    if (!orig || !canvas) return;
    const data = orig.data;
    const histR = new Array(256).fill(0);
    const histG = new Array(256).fill(0);
    const histB = new Array(256).fill(0);
    for (let i = 0; i < data.length; i += 4) {
      histR[data[i]] += 1;
      histG[data[i + 1]] += 1;
      histB[data[i + 2]] += 1;
    }
    drawColorHistogramToCanvas(canvas, histR, histG, histB);
  }, [drawColorHistogramToCanvas, colorHistogramCanvasRef]);

  useEffect(() => {
    const displayCanvas = colorHistogramCanvasRef?.current;
    if (!displayCanvas) return;
    if (adjustedHist) {
      drawColorHistogramToCanvas(displayCanvas, adjustedHist.histR, adjustedHist.histG, adjustedHist.histB);
      return;
    }
    if (originalPixelsReady && originalImageDataRef.current) {
      const data = originalImageDataRef.current.data;
      const histR = new Array(256).fill(0);
      const histG = new Array(256).fill(0);
      const histB = new Array(256).fill(0);
      for (let i = 0; i < data.length; i += 4) {
        histR[data[i]] += 1;
        histG[data[i + 1]] += 1;
        histB[data[i + 2]] += 1;
      }
      drawColorHistogramToCanvas(displayCanvas, histR, histG, histB);
      return;
    }
    if (!reverseImage) return;
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      if (!w || !h) return;
      const offscreenCanvas = document.createElement("canvas");
      offscreenCanvas.width = w;
      offscreenCanvas.height = h;
      const ctx = offscreenCanvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);
      const data = imageData.data;
      const histR = new Array(256).fill(0);
      const histG = new Array(256).fill(0);
      const histB = new Array(256).fill(0);
      for (let i = 0; i < data.length; i += 4) {
        histR[data[i]] += 1;
        histG[data[i + 1]] += 1;
        histB[data[i + 2]] += 1;
      }
      drawColorHistogramToCanvas(displayCanvas, histR, histG, histB);
    };
    img.onerror = () => {};
    img.src = reverseImage;
  }, [reverseImage, colorHistogramCanvasRef, adjustedHist, originalPixelsReady, drawColorHistogramToCanvas]);

  const clearPreviewAndHist = () => {
    setPreviewUrl(null);
    setAdjustedHist(null);
    setTimeout(redrawOriginalHistogram, 0);
  };

  const a = analysis || {};
  const fmt = (v) => (v > 0 ? "+" : "") + (v ?? 0);
  const tempK = a.colorTemp?.temp ?? 5500;
  const tempStr = tempK >= 5500 ? `+${tempK - 5500}K (偏暖)` : `${tempK - 5500}K (偏冷)`;
  const tintStr = (a.tintValue ?? 0) >= 0 ? `+${a.tintValue ?? 0} (偏品紅)` : `${a.tintValue ?? 0} (偏綠)`;

  const basicParams = [
    { label: "曝光", value: (a.exposureValue != null ? (a.exposureValue >= 0 ? `+${a.exposureValue} EV` : `${a.exposureValue} EV`) : "0 EV"), val: a.exposureValue, range: 2 },
    { label: "對比度", value: fmt(a.contrastValue), val: a.contrastValue, range: 50 },
    { label: "高光", value: fmt(a.highlightValue), val: a.highlightValue, range: 50 },
    { label: "陰影", value: fmt(a.shadowValue), val: a.shadowValue, range: 50 },
    { label: "白色", value: fmt(a.whiteValue), val: a.whiteValue, range: 50 },
    { label: "黑色", value: fmt(a.blackValue), val: a.blackValue, range: 50 },
  ];
  return (
    <div className="reverse-analysis-results">
      <div className="analyzed-photo-preview">
        <img src={reverseImage} alt="分析照片" />
        <div className="photo-info">
          <span>檔案名稱：{fileName}</span>
          <span>尺寸：{imageWidth} × {imageHeight}</span>
        </div>
      </div>

      <div className="color-analysis-results">
        <div className="sectionHeader">
          <div className="sectionHeaderLeft">
            <h3 className="sectionTitle result-title">調色參數分析</h3>
          </div>
        </div>

        <div className="basic-params">
          <h4>基礎調整</h4>
          <div className="param-grid">
            {basicParams.map(({ label, value, val, range }) => (
              <div key={label} className="param-item">
                <span className="param-label">{label}</span>
                <span className="param-value">{value}</span>
                <div className="param-bar">
                  <div
                    className={`param-fill ${(val ?? 0) < 0 ? "negative" : ""}`}
                    style={{ width: `${paramBarPercent(val, range)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="tone-params">
          <h4>色調曲線</h4>
          <div className="param-grid">
            <div className="param-item">
              <span className="param-label">飽和度</span>
              <span className="param-value">{fmt(a.saturationValue)}</span>
            </div>
            <div className="param-item">
              <span className="param-label">自然飽和度</span>
              <span className="param-value">{fmt(a.vibranceValue)}</span>
            </div>
            <div className="param-item">
              <span className="param-label">色溫</span>
              <span className="param-value">{tempStr}</span>
            </div>
            <div className="param-item">
              <span className="param-label">色調</span>
              <span className="param-value">{tintStr}</span>
            </div>
          </div>
        </div>

        <div className="style-detection">
          <h4>風格識別</h4>
          <p className="style-name">{a.styleName ?? "一般調色風格"}</p>
          <p className="style-desc">{a.styleDesc ?? a.toneCurveDescription ?? ""}</p>
          <div className="color-signature">
            <h4>色彩特徵</h4>
            <div className="color-tags">
              {(styleTags || []).map((tag, index) => (
                <span key={index} className="color-tag">{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {a.bias && (
          <div className="bias-analysis-block">
            <p className="bias-style-desc">{a.bias.styleDescription}</p>
            <div className="bias-dashboard">
              <h4 className="bias-dashboard-title">偏向分析</h4>
              <div className="bias-dashboard-table bias-dashboard-single">
                <div className="bias-dashboard-row">
                  <div className="bias-dashboard-cell bias-dashboard-cell-left">亮度偏向</div>
                  <div className="bias-dashboard-cell bias-dashboard-cell-center">
                    <span className="bias-label" data-value={a.bias.brightnessLabel}>{a.bias.brightnessLabel}</span>
                    {a.bias.contrastLabel !== "正常對比" && (
                      <span className="bias-label bias-label-contrast" data-value={a.bias.contrastLabel}>{a.bias.contrastLabel}</span>
                    )}
                  </div>
                  <div className="bias-dashboard-cell bias-dashboard-cell-right bias-diff-text">
                    平均亮度 {a.bias.avgL} / 255
                  </div>
                </div>
                <div className="bias-dashboard-row">
                  <div className="bias-dashboard-cell bias-dashboard-cell-left">色溫偏向</div>
                  <div className="bias-dashboard-cell bias-dashboard-cell-center">
                    <span className="bias-label" data-value={a.bias.tempBiasLabel}>{a.bias.tempBiasLabel}</span>
                  </div>
                  <div className="bias-dashboard-cell bias-dashboard-cell-right bias-diff-text">
                    估算色溫約 {a.bias.colorTempK}K
                  </div>
                </div>
                <div className="bias-dashboard-row">
                  <div className="bias-dashboard-cell bias-dashboard-cell-left">色彩通道偏向</div>
                  <div className="bias-dashboard-cell bias-dashboard-cell-center">
                    <span className="bias-label" data-value={a.bias.channelBiasLabel}>{a.bias.channelBiasLabel}</span>
                  </div>
                  <div className="bias-dashboard-cell bias-dashboard-cell-right bias-diff-text">
                    R:{a.bias.avgR} G:{a.bias.avgG} B:{a.bias.avgB}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="color-distribution">
          <h4>顏色分佈</h4>
          <div className="color-histogram-canvas-wrap">
            <canvas ref={colorHistogramCanvasRef} id="colorHistogram" width={512} height={200} />
          </div>
          <div className="histogram-legend">
            <span className="legend-item red">紅色</span>
            <span className="legend-item green">綠色</span>
            <span className="legend-item blue">藍色</span>
          </div>
        </div>

        <div className="manual-params-card">
          <div className="manual-params-card-header">
            <h4 className="manual-params-card-title">手動調整參數</h4>
            <button type="button" className="manual-params-reset-btn" onClick={resetLr}>重置</button>
          </div>
          <p className="manual-params-card-desc">數值以系統分析結果為基準，向右調整為增強、向左為減弱</p>
          <div className="manual-params-grid">
            {LR_SLIDER_SPEC.map(({ key, label, min, max, step }) => (
              <div key={key} className="manual-param-row">
                <span className="manual-param-label">{label}</span>
                <input
                  type="range"
                  className="manual-param-slider"
                  min={min}
                  max={max}
                  step={step}
                  value={lrParams[key]}
                  onChange={(e) => setLr(key, Number(e.target.value))}
                  aria-label={label}
                />
                <span className="manual-param-value">
                  {key === "exposure"
                    ? (lrParams[key] >= 0 ? `+${Number(lrParams[key]).toFixed(1)}` : Number(lrParams[key]).toFixed(1))
                    : (lrParams[key] >= 0 ? `+${lrParams[key]}` : lrParams[key])}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="manual-params-card rgb-params-card">
          <div className="manual-params-card-header">
            <h4 className="manual-params-card-title">RGB 通道調整</h4>
            <button type="button" className="manual-params-reset-btn" onClick={resetRgb}>重置</button>
          </div>
          <p className="manual-params-card-desc">初始值為 0（原圖不變），向右增強該顏色通道，向左減弱</p>
          <div className="manual-params-grid">
            {RGB_SPEC.map(({ key, label, channel }) => (
              <div key={key} className="manual-param-row">
                <span className="manual-param-label">{label}</span>
                <input
                  type="range"
                  className={`manual-param-slider slider-channel-${channel}`}
                  min={-100}
                  max={100}
                  step={1}
                  value={rgbParams[key]}
                  onChange={(e) => setRgb(key, Number(e.target.value))}
                  aria-label={label}
                />
                <span className={`manual-param-value rgb-value-sign rgb-value-${rgbParams[key] > 0 ? "pos" : rgbParams[key] < 0 ? "neg" : "zero"}`}>
                  {rgbParams[key] >= 0 ? `+${rgbParams[key]}` : rgbParams[key]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="manual-params-apply-wrap">
          <button type="button" className="btn-primary manual-params-apply-btn" onClick={handleApplyPreview}>套用並預覽</button>
        </div>

        <div className="manual-params-preview-block" style={{ display: previewUrl ? "flex" : "none" }}>
          <div className="manual-params-preview-pair" style={{ display: "flex", gap: 16, marginTop: 16 }}>
            <div className="manual-params-preview-cell" style={{ flex: 1, textAlign: "center" }}>
              <img src={originalImageUrl || reverseImage} alt="原圖" style={{ maxWidth: "100%", borderRadius: 8 }} className="manual-params-preview-img" />
              <p className="manual-params-preview-label">原圖</p>
            </div>
            <div className="manual-params-preview-cell" style={{ flex: 1, textAlign: "center" }}>
              {previewUrl && <img src={previewUrl} alt="套用調整後" style={{ maxWidth: "100%", borderRadius: 8 }} className="manual-params-preview-img" />}
              <p className="manual-params-preview-label">套用調整後</p>
            </div>
          </div>
        </div>

      </div>

        <div className="action-buttons">
        <button type="button" className="btn-secondary" onClick={onReset}>重新上傳分析</button>
        <button type="button" className="btn-primary" onClick={() => { onExport?.(lrParams); setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000); }}>{copySuccess ? "已複製 ✓" : "匯出參數"}</button>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 拍攝後分析：上傳區 + 開始分析按鈕 + 分析結果
// -----------------------------------------------------------------------------
function AfterAnalysisPanel() {
  const [analysisMode, setAnalysisMode] = useState("compare");
  const [photoYour, setPhotoYour] = useState(null);
  const [photoRef, setPhotoRef] = useState(null);
  const [errorYour, setErrorYour] = useState(null);
  const [errorRef, setErrorRef] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisDone, setAnalysisDone] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);

  const [reverseImage, setReverseImage] = useState(null);
  const [reverseImageFile, setReverseImageFile] = useState(null);
  const [reverseAnalysis, setReverseAnalysis] = useState(null);
  const [reverseAnalyzing, setReverseAnalyzing] = useState(false);
  const [reverseError, setReverseError] = useState(null);

  const inputYourRef = useRef(null);
  const inputRefRef = useRef(null);
  const inputReverseRef = useRef(null);
  const histogramCanvasRef = useRef(null);
  const toneCurveCanvasRef = useRef(null);
  const colorHistogramCanvasRef = useRef(null);

  // 檔案驗證錯誤：各自 3 秒後自動消失
  useEffect(() => {
    if (!errorYour) return;
    const t = setTimeout(() => setErrorYour(null), 3000);
    return () => clearTimeout(t);
  }, [errorYour]);
  useEffect(() => {
    if (!errorRef) return;
    const t = setTimeout(() => setErrorRef(null), 3000);
    return () => clearTimeout(t);
  }, [errorRef]);
  useEffect(() => {
    if (!reverseError) return;
    const t = setTimeout(() => setReverseError(null), 3000);
    return () => clearTimeout(t);
  }, [reverseError]);

  const bothUploaded = !!photoYour && !!photoRef;
  const showAnalyzeButton = bothUploaded && !isAnalyzing && !analysisDone;

  const handleStartAnalysis = () => {
    if (!bothUploaded || isAnalyzing) return;
    setIsAnalyzing(true);
    setAnalysisError(null);
    analyzeImagesForColorTransfer(photoYour, photoRef)
      .then((result) => {
        setAnalysisDone(true);
        setAnalysisResult(result);
      })
      .catch((err) => {
        console.error("分析失敗:", err);
        setAnalysisResult(null);
        setAnalysisError(err?.message || "分析過程發生錯誤，請重試");
      })
      .finally(() => setIsAnalyzing(false));
  };

  const handleReset = () => {
    setPhotoYour(null);
    setPhotoRef(null);
    setErrorYour(null);
    setErrorRef(null);
    setAnalysisDone(false);
    setAnalysisResult(null);
    setAnalysisError(null);
  };

  const handleReverseImageUpload = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!validTypes.includes(file.type)) {
      setReverseError("請上傳 JPG 或 PNG 格式的圖片");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setReverseError("照片太大（超過 20MB）");
      return;
    }
    setReverseAnalyzing(true);
    setReverseError(null);
    analyzeReverseImage(file)
      .then((res) => {
        const reader = new FileReader();
        reader.onload = () => {
          setReverseImage(reader.result);
          setReverseImageFile(file.name);
          setReverseAnalysis({
            ...res.analysis,
            imageWidth: res.imageWidth,
            imageHeight: res.imageHeight,
            styleTags: res.styleTags,
          });
        };
        reader.readAsDataURL(file);
      })
      .catch(() => setReverseError("分析失敗，請重新上傳"))
      .finally(() => setReverseAnalyzing(false));
  };

  const handleResetAnalysis = () => {
    setReverseImage(null);
    setReverseImageFile(null);
    setReverseAnalysis(null);
    setReverseError(null);
  };

  const handleExport = (params) => {
    if (!params) return;
    const fmt = (v) => (v != null ? String(v) : "—");
    const exposure = fmt(params.exposure);
    const contrast = fmt(params.contrast);
    const highlights = fmt(params.highlight);
    const shadows = fmt(params.shadow);
    const whites = fmt(params.white);
    const blacks = fmt(params.black);
    const temperature = fmt(params.temp);
    const tint = fmt(params.tint);
    const saturation = fmt(params.saturation);
    const vibrance = fmt(params.vibrance);
    const text = `曝光：${exposure}\n對比：${contrast}\n高光：${highlights}\n陰影：${shadows}\n白色：${whites}\n黑色：${blacks}\n色溫：${temperature}\n色調：${tint}\n飽和度：${saturation}\n自然飽和度：${vibrance}`;
    navigator.clipboard.writeText(text).catch(() => {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    });
  };

  return (
    <section
      className="rounded-[16px] p-6 md:p-8 bg-[var(--color-bg-secondary)] shadow-[0_4px_16px_rgba(0,0,0,0.2)] mt-2 min-w-0"
      aria-label="拍攝後分析 - 上傳與分析"
    >
      <div className="sectionHeader mb-6">
        <div className="sectionHeaderLeft">
          <div className="sectionTitleStack">
            <h2 className="sectionTitle analysis-title analysis-section-title">拍攝後分析</h2>
            <p className="sectionSubtitle">上傳你的照片與想要的風格參考照，我們將為你分析並給出調整建議。</p>
          </div>
        </div>
      </div>

      <div className="analysis-mode-selector mode-card-grid">
        <button
          type="button"
          className={`mode-btn mode-card ${analysisMode === "compare" ? "active" : ""}`}
          onClick={() => setAnalysisMode("compare")}
        >
          <span className="mode-icon" aria-hidden><PxIconBalance /></span>
          <div className="mode-content">
            <span className="mode-text">對比分析</span>
            <span className="mode-desc">比較兩張照片的差異</span>
          </div>
        </button>
        <button
          type="button"
          className={`mode-btn mode-card ${analysisMode === "reverse" ? "active" : ""}`}
          onClick={() => setAnalysisMode("reverse")}
        >
          <span className="mode-icon" aria-hidden><PxIconMagnifier /></span>
          <div className="mode-content">
            <span className="mode-text">調色分析</span>
            <span className="mode-desc">逆向解析調色參數</span>
          </div>
        </button>
      </div>

      {analysisMode === "compare" && (
        <div className="compare-mode">
      {/* 雙欄上傳區：桌面並排、手機上下 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <UploadZone
          title="你的照片"
          description="上傳你想調整的拍攝成品"
          imageBase64={photoYour}
          error={errorYour}
          onSelect={(base64, err) => {
            setPhotoYour(base64 || null);
            setErrorYour(err || null);
          }}
          onClear={() => {
            setPhotoYour(null);
            setErrorYour(null);
          }}
          inputRef={inputYourRef}
          disabled={isAnalyzing}
        />
        <UploadZone
          zoneType="reference"
          title="參考照片（想要的風格）"
          description="上傳你希望達成的風格參考圖"
          imageBase64={photoRef}
          error={errorRef}
          onSelect={(base64, err) => {
            setPhotoRef(base64 || null);
            setErrorRef(err || null);
          }}
          onClear={() => {
            setPhotoRef(null);
            setErrorRef(null);
          }}
          inputRef={inputRefRef}
          disabled={isAnalyzing}
        />
      </div>

      {/* 開始分析按鈕：兩張都上傳後顯示、置中、大藍色、hover 深藍 + scale 1.05 */}
      {showAnalyzeButton && (
        <div className="flex justify-center mt-8">
          <button
            type="button"
            onClick={handleStartAnalysis}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[var(--color-accent-primary)] text-[var(--color-dark-primary)] font-semibold text-lg shadow-lg hover:bg-[var(--color-accent-secondary)] hover:shadow-xl hover:scale-105 active:scale-[1.02] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-hover)] focus:ring-offset-2"
          >
            <BarChart3 className="w-5 h-5" aria-hidden />
            開始分析
            <ChevronRight className="w-5 h-5" aria-hidden />
          </button>
        </div>
      )}

      {/* 分析錯誤提示 */}
      {analysisError && (
        <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm" role="alert">
          {analysisError}
        </div>
      )}

      {/* 分析中：按鈕變「分析中...」+ 旋轉載入、灰色 disabled */}
      {isAnalyzing && (
        <div className="flex justify-center mt-8">
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[var(--color-border-primary)] text-[var(--color-text-tertiary)] font-semibold text-lg shadow cursor-not-allowed"
            aria-busy="true"
          >
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
            分析中...
          </button>
        </div>
      )}

      {/* 分析完成：顯示完整分析結果（照片對比 + Lightroom 建議 + 調整預覽） */}
      {analysisDone && analysisResult && (
        <AnalysisResultDisplay
          result={analysisResult}
          onReset={handleReset}
          photoYour={photoYour}
          photoRef={photoRef}
        />
      )}
        </div>
      )}

      {analysisMode === "reverse" && (
        <div className="reverse-engineering-section reverse-mode">
          <div className="upload-single-photo upload-section">
            <h3>上傳要分析的照片</h3>
            <p className="upload-description">上傳任何你想了解調色參數的照片</p>
            {reverseError && (
              <p className="text-red-600 text-sm mb-2" role="alert">{reverseError}</p>
            )}
            <div className="upload-area">
              <input
                ref={inputReverseRef}
                type="file"
                accept="image/*"
                onChange={handleReverseImageUpload}
                style={{ display: "none" }}
                id="reverse-upload"
                disabled={reverseAnalyzing}
              />
              <label
                htmlFor="reverse-upload"
                className={`upload-placeholder ${reverseAnalyzing ? "upload-disabled" : ""}`}
              >
                {reverseAnalyzing ? (
                  <>
                    <Loader2 className="w-10 h-10 animate-spin mx-auto mb-2" aria-hidden />
                    <div className="upload-text">分析中...</div>
                  </>
                ) : (
                  <>
                    <div className="upload-text">點擊上傳照片</div>
                    <div className="upload-hint">支援 JPG, PNG</div>
                  </>
                )}
              </label>
            </div>
          </div>
          {reverseImage && reverseAnalysis && (
            <ReverseAnalysisResults
              reverseImage={reverseImage}
              fileName={reverseImageFile}
              imageWidth={reverseAnalysis.imageWidth}
              imageHeight={reverseAnalysis.imageHeight}
              analysis={reverseAnalysis}
              styleTags={reverseAnalysis.styleTags}
              onReset={handleResetAnalysis}
              onExport={handleExport}
              histogramCanvasRef={histogramCanvasRef}
              toneCurveCanvasRef={toneCurveCanvasRef}
              colorHistogramCanvasRef={colorHistogramCanvasRef}
            />
          )}
        </div>
      )}
    </section>
  );
}

// -----------------------------------------------------------------------------
// 主應用
// -----------------------------------------------------------------------------
function App() {
  const [showHomePage, setShowHomePage] = useState(true);
  const [activeView, setActiveView] = useState("calculator");
  const [currentTab, setCurrentTab] = useState("before");

  const handleFeatureSelect = (feature) => {
    setShowHomePage(false);
    if (feature === "calculator") {
      setActiveView("calculator");
      setCurrentTab("before");
    } else if (feature === "analysis") {
      setActiveView("analysis");
      setCurrentTab("after");
    }
  };

  return (
    <div className="app-container" data-psa-func={!showHomePage ? "true" : undefined}>
      {showHomePage ? (
        <HomePage onFeatureSelect={handleFeatureSelect} />
      ) : (
        <>
          {/* style: header */}
          <header className="site-header">
            <div className="logo-section">
              <PxCamera size={48} className="logo-px-icon" aria-hidden />
              <h1 className="site-title">攝影風格助手</h1>
            </div>
            <p className="site-subtitle">從靈感到成品的完整工作流程</p>
          </header>

          {/* style: primary switches */}
          <nav className="nav-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={currentTab === "before"}
              aria-controls="panel-before"
              id="tab-before"
              onClick={() => setCurrentTab("before")}
              className={`nav-tab ${currentTab === "before" ? "active" : ""}`}
            >
              <PxCalculator size={20} className="nav-tab-icon" aria-hidden />
              <span>拍攝計算器</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={currentTab === "after"}
              aria-controls="panel-after"
              id="tab-after"
              onClick={() => setCurrentTab("after")}
              className={`nav-tab ${currentTab === "after" ? "active" : ""}`}
            >
              <PxChart size={20} className="nav-tab-icon" aria-hidden />
              <span>拍攝後分析</span>
            </button>
          </nav>

          <main
            className="app-main"
            role="tabpanel"
            id={currentTab === "before" ? "panel-before" : "panel-after"}
            aria-labelledby={currentTab === "before" ? "tab-before" : "tab-after"}
          >
            {currentTab === "before" && <ShootingCalculatorPanel />}
            {currentTab === "after" && <AfterAnalysisPanel />}
          </main>
        </>
      )}
    </div>
  );
}

export default App;

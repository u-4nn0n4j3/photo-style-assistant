/**
 * 通用色相轉換系統
 * 處理所有類型的照片色調調整，自動識別任何色相組合
 */

const SAMPLE_STRIDE = 8; // 大圖採樣步長，確保效能

function rgbToHsv360(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  if (h < 0) h += 360;
  return { h, s, v };
}

function hsvToRgb(h, s, v) {
  h = ((h % 360) + 360) % 360 / 60;
  const c = v * s;
  const x = c * (1 - Math.abs((h % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 1) { r = c; g = x; }
  else if (h < 2) { r = x; g = c; }
  else if (h < 3) { g = c; b = x; }
  else if (h < 4) { g = x; b = c; }
  else if (h < 5) { r = x; b = c; }
  else { r = c; b = x; }
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}

function calcMean(arr) {
  if (!arr?.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function calcCircularMean(angles) {
  if (!angles?.length) return 0;
  let sinSum = 0, cosSum = 0;
  for (const a of angles) {
    const rad = (a * Math.PI) / 180;
    sinSum += Math.sin(rad);
    cosSum += Math.cos(rad);
  }
  let mean = (Math.atan2(sinSum, cosSum) * 180) / Math.PI;
  if (mean < 0) mean += 360;
  return mean;
}

function calcCircularStdDev(angles) {
  if (!angles?.length) return 0;
  const mean = calcCircularMean(angles);
  let sumSq = 0;
  for (const a of angles) {
    let d = a - mean;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    sumSq += d * d;
  }
  return Math.sqrt(sumSq / angles.length);
}

function classifyHueName(hue) {
  if (hue >= 345 || hue < 15) return "red";
  if (hue >= 15 && hue < 45) return "orange";
  if (hue >= 45 && hue < 75) return "yellow";
  if (hue >= 75 && hue < 105) return "yellowGreen";
  if (hue >= 105 && hue < 165) return "green";
  if (hue >= 165 && hue < 195) return "aqua";
  if (hue >= 195 && hue < 255) return "blue";
  if (hue >= 255 && hue < 285) return "purple";
  if (hue >= 285 && hue < 345) return "magenta";
  return "unknown";
}

const HUE_ORDER = ["red", "orange", "yellow", "yellowGreen", "green", "aqua", "blue", "purple", "magenta"];

// -----------------------------------------------------------------------------
// 1.2 完整 HSV 分析（採樣加速）
// -----------------------------------------------------------------------------
export function analyzeHSVComplete(data) {
  const hsv = { h: [], s: [], v: [] };
  const stride = data.length > 400000 ? SAMPLE_STRIDE : 1;

  for (let i = 0; i < data.length; i += 4 * stride) {
    const { h, s, v } = rgbToHsv360(data[i], data[i + 1], data[i + 2]);
    hsv.h.push(h);
    hsv.s.push(s);
    hsv.v.push(v);
  }

  const colorful = [];
  for (let i = 0; i < hsv.h.length; i++) {
    if (hsv.s[i] > 0.15 && hsv.v[i] > 0.15 && hsv.v[i] < 0.95) {
      colorful.push({ h: hsv.h[i], s: hsv.s[i], v: hsv.v[i] });
    }
  }

  return {
    all: hsv,
    colorful,
    stats: {
      hue: analyzeHueDistribution(colorful),
      saturation: { mean: calcMean(hsv.s) },
      value: { mean: calcMean(hsv.v) },
    },
  };
}

// -----------------------------------------------------------------------------
// 1.3 色相分佈分析（36 區段）
// -----------------------------------------------------------------------------
function analyzeHueDistribution(colorfulPixels) {
  if (!colorfulPixels?.length) {
    return { distribution: {}, dominant: null, average: 0, spread: 0, colorful: [], hues: [] };
  }

  const segments = new Array(36).fill(0);
  const hues = colorfulPixels.map((p) => p.h);

  for (const h of hues) {
    const seg = Math.min(35, Math.floor(h / 10));
    segments[seg]++;
  }

  const maxCount = Math.max(...segments, 1);
  const dominantSeg = segments.indexOf(maxCount);
  const dominantCenter = dominantSeg * 10 + 5;

  const dominantHues = hues.filter(
    (h) =>
      Math.abs(h - dominantCenter) < 15 ||
      Math.abs(h - dominantCenter + 360) < 15 ||
      Math.abs(h - dominantCenter - 360) < 15
  );
  const averageHue = dominantHues.length ? calcCircularMean(dominantHues) : dominantCenter;
  const spread = dominantHues.length ? calcCircularStdDev(dominantHues) : 0;
  const hueName = classifyHueName(averageHue);

  const dist = {
    red: segments.slice(0, 3).reduce((a, b) => a + b, 0) + segments.slice(33, 36).reduce((a, b) => a + b, 0),
    orange: segments.slice(3, 6).reduce((a, b) => a + b, 0),
    yellow: segments.slice(6, 9).reduce((a, b) => a + b, 0),
    yellowGreen: segments.slice(9, 12).reduce((a, b) => a + b, 0),
    green: segments.slice(12, 15).reduce((a, b) => a + b, 0),
    aqua: segments.slice(15, 18).reduce((a, b) => a + b, 0),
    blue: segments.slice(18, 24).reduce((a, b) => a + b, 0),
    purple: segments.slice(24, 27).reduce((a, b) => a + b, 0),
    magenta: segments.slice(27, 33).reduce((a, b) => a + b, 0),
  };
  const total = Math.max(1, Object.values(dist).reduce((a, b) => a + b, 0));
  for (const k of Object.keys(dist)) dist[k] = (dist[k] / total) * 100;

  return {
    distribution: dist,
    dominant: hueName,
    dominantPercentage: (maxCount / hues.length) * 100,
    average: averageHue,
    spread,
    segments,
    colorful: colorfulPixels,
    hues,
  };
}

// -----------------------------------------------------------------------------
// 1.4 色相分佈變異分析（用於打光偵測）
// -----------------------------------------------------------------------------
function analyzeColorDistribution(hueData) {
  const colorful = hueData?.colorful ?? hueData?.hues?.map((h) => ({ h, s: 0.5, v: 0.5 })) ?? [];
  const hues = hueData?.hues ?? colorful.map((p) => p.h);

  if (!hues?.length) {
    return { isUniform: true, hasMultipleHues: false, dominantHueCount: 0, dominantPercentage: 0 };
  }

  const hueSpread = calcCircularStdDev(hues);
  const hueSegments = new Array(12).fill(0);
  for (const h of hues) {
    const seg = Math.min(11, Math.floor(h / 30));
    hueSegments[seg]++;
  }

  const significantSegments = hueSegments.filter((c) => (c / hues.length) > 0.05).length;
  const hasMultipleHues = significantSegments >= 2;
  const maxCount = Math.max(...hueSegments, 1);
  const dominantPercentage = (maxCount / hues.length) * 100;

  return {
    hueSpread: hueSpread,
    hasMultipleHues: hasMultipleHues,
    significantHueCount: significantSegments,
    dominantPercentage,
    isUniform: significantSegments <= 2 && dominantPercentage > 60,
  };
}

// -----------------------------------------------------------------------------
// 1.5 偵測創意打光效果
// -----------------------------------------------------------------------------
export function detectLightingEffect(originalDist, referenceDist) {
  const origD = originalDist?.distribution ?? {};
  const refD = referenceDist?.distribution ?? {};

  const refHasBlue = (refD.blue ?? 0) > 30 || (refD.aqua ?? 0) > 20;
  const refHasMagenta = (refD.magenta ?? 0) > 25;
  const refHasUnusualColor =
    refHasBlue ||
    refHasMagenta ||
    (refD.purple ?? 0) > 25;

  const origWarm = (origD.orange ?? 0) + (origD.yellow ?? 0) + (origD.red ?? 0);
  const origIsNatural = origWarm > 40 || (originalDist?.dominantPercentage ?? 0) < 50;

  const refColorDist = analyzeColorDistribution(referenceDist);
  const hueDiff = Math.abs((referenceDist?.average ?? 0) - (originalDist?.average ?? 0));
  const hueDiffWrap = Math.min(hueDiff, 360 - hueDiff);
  const isLightingEffect =
    refHasUnusualColor &&
    origIsNatural &&
    refColorDist.hasMultipleHues &&
    hueDiffWrap > 60;

  return {
    isLightingEffect,
    lightingType: refHasBlue ? "blue" : refHasMagenta ? "magenta" : "other",
    shouldReduceIntensity: isLightingEffect,
  };
}

// -----------------------------------------------------------------------------
// 1.6 細緻色相分析（RGB 比例判斷主導色相）
// -----------------------------------------------------------------------------
export function analyzeDetailedHue(rgbStats) {
  const r = rgbStats?.r?.mean ?? rgbStats?.r ?? 128;
  const g = rgbStats?.g?.mean ?? rgbStats?.g ?? 128;
  const b = Math.max(1, rgbStats?.b?.mean ?? rgbStats?.b ?? 128);

  let dominantHue = "neutral";
  let hueAngle = 0;

  if (r > g && r > b) {
    if (g > b * 1.5) {
      dominantHue = "orange-red";
      hueAngle = 15;
    } else if (g > b) {
      dominantHue = "red";
      hueAngle = 0;
    } else {
      dominantHue = "magenta-red";
      hueAngle = 340;
    }
  } else if (g > r && g > b) {
    if (r > b) {
      dominantHue = "yellow-green";
      hueAngle = 90;
    } else {
      dominantHue = "cyan";
      hueAngle = 180;
    }
  } else if (b > r && b > g) {
    if (r > g) {
      dominantHue = "purple";
      hueAngle = 270;
    } else {
      dominantHue = "blue";
      hueAngle = 240;
    }
  }

  return {
    dominantHue,
    hueAngle,
    rGRatio: g < 1 ? r : r / g,
    rBRatio: r / b,
    gBRatio: b < 1 ? g : g / b,
  };
}

// -----------------------------------------------------------------------------
// 2.0 依 detailedHue 計算色相偏移（類型感知）
// -----------------------------------------------------------------------------
export function calculateHueShiftAmount(originalHue, referenceHue) {
  const origAngle = originalHue?.hueAngle ?? 0;
  const origType = originalHue?.dominantHue ?? "neutral";
  const refAngle = referenceHue?.hueAngle ?? 0;
  const refType = referenceHue?.dominantHue ?? "neutral";

  // 如果兩圖的主導色相都不是紅色系（magenta-red / red / orange-red），
  // 代表色相偏移不是白平衡或膚色問題，而是畫面內容差異（如葉子、背景），
  // 不應產生色相偏移建議
  const RED_FAMILY = ["magenta-red", "red", "orange-red"];
  const origIsRed = RED_FAMILY.includes(origType);
  const refIsRed = RED_FAMILY.includes(refType);
  if (!origIsRed || !refIsRed) {
    return {
      shift: 0,
      type: "none",
      intensity: "none",
      needsRGBLevelAdjustment: false,
    };
  }

  let shift = refAngle - origAngle;
  if (shift > 180) shift -= 360;
  if (shift < -180) shift += 360;

  let shiftType = "none";
  let intensity = "none";

  if (origType === "magenta-red" && refType === "orange-red") {
    shiftType = "magenta_to_orange";
    intensity = "strong";
    shift = Math.max(35, Math.min(50, shift > 0 ? shift : 42));
  } else if (origType === "magenta-red" && refType === "red") {
    shiftType = "magenta_to_red";
    intensity = "moderate";
  } else if (origType === "red" && refType === "orange-red") {
    shiftType = "red_to_orange";
    intensity = "moderate";
  }

  return {
    shift,
    type: shiftType,
    intensity,
    needsRGBLevelAdjustment: Math.abs(shift) > 20,
  };
}

// -----------------------------------------------------------------------------
// 2.1 計算色相偏移（HSV 分佈）
// -----------------------------------------------------------------------------
export function calculateUniversalHueShift(origHueData, refHueData) {
  const origHue = origHueData?.average ?? 0;
  const refHue = refHueData?.average ?? 0;

  let hueDiff = refHue - origHue;
  if (hueDiff > 180) hueDiff -= 360;
  if (hueDiff < -180) hueDiff += 360;

  const magnitude = Math.abs(hueDiff);
  let intensity = "none";
  if (magnitude > 40) intensity = "major";
  else if (magnitude > 15) intensity = "moderate";
  else if (magnitude > 5) intensity = "minor";

  return {
    original: origHue,
    reference: refHue,
    shift: hueDiff,
    magnitude,
    direction: hueDiff >= 0 ? "clockwise" : "counterclockwise",
    intensity,
    originalName: origHueData?.dominant ?? "unknown",
    referenceName: refHueData?.dominant ?? "unknown",
  };
}

// -----------------------------------------------------------------------------
// 2.1b RGB 曲線級調整（依色相轉換類型）
// -----------------------------------------------------------------------------
export function calculateRGBCurveAdjustments(hueShift, originalHue, referenceHue) {
  const adjustments = { redCurve: 0, greenCurve: 0, blueCurve: 0 };
  const type = hueShift?.type;
  if (type === "magenta_to_orange") {
    adjustments.greenCurve = 15;
    adjustments.blueCurve = -20;
    adjustments.redCurve = 5;
  } else if (type === "red_to_orange") {
    adjustments.greenCurve = 12;
    adjustments.blueCurve = -8;
  } else if (type === "magenta_to_red") {
    adjustments.blueCurve = -15;
    adjustments.greenCurve = 5;
  }
  return adjustments;
}

export function applyRGBCurveAdjustments(imageData, rgbCurve) {
  if (!rgbCurve || (rgbCurve.redCurve === 0 && rgbCurve.greenCurve === 0 && rgbCurve.blueCurve === 0)) return imageData;
  const data = imageData.data;
  const rMul = 1 + (rgbCurve.redCurve ?? 0) / 100;
  const gMul = 1 + (rgbCurve.greenCurve ?? 0) / 100;
  const bMul = 1 + (rgbCurve.blueCurve ?? 0) / 100;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.round(Math.max(0, Math.min(255, data[i] * rMul)));
    data[i + 1] = Math.round(Math.max(0, Math.min(255, data[i + 1] * gMul)));
    data[i + 2] = Math.round(Math.max(0, Math.min(255, data[i + 2] * bMul)));
  }
  return imageData;
}

// -----------------------------------------------------------------------------
// 2.2 確定受影響色相
// -----------------------------------------------------------------------------
function determineAffectedHues(originHue, shift) {
  const primaryHue = classifyHueName(originHue);
  const affected = [{ name: primaryHue, weight: 1.0 }];
  const idx = HUE_ORDER.indexOf(primaryHue);
  if (idx === -1) return affected;

  if (shift > 0) {
    const next = HUE_ORDER[(idx + 1) % HUE_ORDER.length];
    affected.push({ name: next, weight: Math.min(1, Math.abs(shift) / 45) });
    if (Math.abs(shift) > 45) {
      const next2 = HUE_ORDER[(idx + 2) % HUE_ORDER.length];
      affected.push({ name: next2, weight: Math.min(0.7, (Math.abs(shift) - 45) / 45) });
    }
  } else {
    const prev = HUE_ORDER[(idx - 1 + HUE_ORDER.length) % HUE_ORDER.length];
    affected.push({ name: prev, weight: Math.min(1, Math.abs(shift) / 45) });
    if (Math.abs(shift) > 45) {
      const prev2 = HUE_ORDER[(idx - 2 + HUE_ORDER.length) % HUE_ORDER.length];
      affected.push({ name: prev2, weight: Math.min(0.7, (Math.abs(shift) - 45) / 45) });
    }
  }
  return affected;
}

// -----------------------------------------------------------------------------
// 2.3 生成 HSL 調整映射
// -----------------------------------------------------------------------------
export function generateHSLAdjustments(hueShift, origDist, refDist, lightingEffect = null, detailedHue = null) {
  const adjustments = {
    hue: { red: 0, orange: 0, yellow: 0, green: 0, aqua: 0, blue: 0, purple: 0, magenta: 0, yellowGreen: 0 },
    saturation: { red: 0, orange: 0, yellow: 0, green: 0, aqua: 0, blue: 0, purple: 0, magenta: 0, yellowGreen: 0 },
    luminance: { red: 0, orange: 0, yellow: 0, green: 0, aqua: 0, blue: 0, purple: 0, magenta: 0, yellowGreen: 0 },
  };

  const detected = lightingEffect ?? detectLightingEffect(origDist, refDist);

  const isMagentaToOrange =
    detailedHue?.orig?.dominantHue === "magenta-red" && detailedHue?.ref?.dominantHue === "orange-red";
  const hueBoost = isMagentaToOrange ? 1.5 : 1;

  if (detected.isLightingEffect && (hueShift.intensity === "major" || hueShift.intensity === "moderate")) {
    const affected = determineAffectedHues(hueShift.original, hueShift.shift);
    for (const { name, weight } of affected) {
      if (!adjustments.hue.hasOwnProperty(name)) continue;
      const w = weight * 0.3;
      let hueAdjust = hueShift.shift * w * 0.2;
      adjustments.hue[name] = Math.round(Math.max(-15, Math.min(15, hueAdjust)));
      const origSat = (origDist?.distribution ?? {})[name] ?? 0;
      const refSat = (refDist?.distribution ?? {})[name] ?? 0;
      if (refSat > origSat + 10) {
        adjustments.saturation[name] = Math.min(8, Math.round((refSat - origSat) * 0.05));
      }
    }
    return adjustments;
  }

  if (hueShift.intensity === "none") return adjustments;

  const origD = origDist?.distribution ?? {};
  const refD = refDist?.distribution ?? {};
  const affected = determineAffectedHues(hueShift.original, hueShift.shift);

  for (const { name, weight } of affected) {
    if (!adjustments.hue.hasOwnProperty(name)) continue;

    let hueAdjust = hueShift.shift * weight * 1.0 * hueBoost;
    if (hueShift.intensity === "major") hueAdjust *= 1.4;
    else if (hueShift.intensity === "moderate") hueAdjust *= 1.1;
    else if (hueShift.intensity === "minor") hueAdjust *= 0.7;
    adjustments.hue[name] = Math.round(Math.max(-80, Math.min(80, hueAdjust)));

    const origSat = origD[name] ?? 0;
    const refSat = refD[name] ?? 0;
    if (refSat > origSat + 5) {
      let satAdj = Math.round((refSat - origSat) * 0.2);
      if (isMagentaToOrange && (name === "magenta" || name === "red" || name === "orange")) satAdj = Math.min(25, satAdj + 8);
      adjustments.saturation[name] = Math.min(25, satAdj);
    } else if (refSat < origSat - 5) {
      adjustments.saturation[name] = Math.max(-20, Math.round((refSat - origSat) * 0.2));
    }

    if (weight > 0.7 && Math.abs(hueShift.shift) > 20) {
      adjustments.luminance[name] = Math.round(Math.max(-15, Math.min(15, hueShift.shift * 0.15)));
    }
  }
  if (isMagentaToOrange && hueShift.shift > 0) {
    adjustments.hue.magenta = Math.round(Math.max(-80, Math.min(80, (adjustments.hue.magenta || 0) * 1.3)));
    adjustments.hue.red = Math.round(Math.max(-80, Math.min(80, (adjustments.hue.red || 0) * 1.2)));
    adjustments.hue.orange = Math.round(Math.max(-80, Math.min(80, (adjustments.hue.orange || 0) + 15)));
  }
  return adjustments;
}

// -----------------------------------------------------------------------------
// 3. 預覽圖：套用 HSL 調整
// -----------------------------------------------------------------------------
const HUE_RANGES = {
  red: [345, 360, 0, 15],
  orange: [15, 45],
  yellow: [45, 75],
  yellowGreen: [75, 105],
  green: [105, 165],
  aqua: [165, 195],
  blue: [195, 255],
  purple: [255, 285],
  magenta: [285, 345],
};

function findMatchingHueRange(hue, ranges) {
  for (const [name, range] of Object.entries(ranges)) {
    if (range.length === 4) {
      if ((hue >= range[0] && hue <= 360) || (hue >= 0 && hue < range[3])) return name;
    } else if (hue >= range[0] && hue < range[1]) return name;
  }
  return null;
}

function calcHueWeight(hue, range) {
  if (range.length === 4) {
    const c1 = (range[0] + 360 + range[1]) / 2;
    const c2 = (range[2] + range[3]) / 2;
    const d1 = Math.min(Math.abs(hue - c1), Math.abs(hue + 360 - c1));
    const d2 = Math.abs(hue - c2);
    return Math.max(0.3, 1 - Math.min(d1, d2) / 15);
  }
  const center = (range[0] + range[1]) / 2;
  return Math.max(0.3, 1 - Math.abs(hue - center) / 15);
}

export function applyUniversalHSLAdjustments(imageData, hslAdjustments) {
  if (!hslAdjustments) return imageData;
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const { h, s, v } = rgbToHsv360(data[i], data[i + 1], data[i + 2]);

    if (s <= 0.2) continue;

    const matched = findMatchingHueRange(h, HUE_RANGES);
    if (!matched || !hslAdjustments.hue[matched]) continue;

    const range = HUE_RANGES[matched];
    const weight = calcHueWeight(h, range);

    let hueShift = (hslAdjustments.hue[matched] || 0) * weight;
    const saturationBoost = Math.min(1.5, 0.8 + s * 1.4);
    hueShift *= saturationBoost;

    let h2 = h + hueShift;
    if (h2 < 0) h2 += 360;
    if (h2 >= 360) h2 -= 360;

    let s2 = s;
    if (hslAdjustments.saturation[matched]) {
      s2 *= 1 + (hslAdjustments.saturation[matched] || 0) * 0.01 * weight;
      s2 = Math.max(0, Math.min(1, s2));
    }

    let v2 = v;
    if (hslAdjustments.luminance[matched]) {
      v2 *= 1 + (hslAdjustments.luminance[matched] || 0) * 0.01 * weight;
      v2 = Math.max(0, Math.min(1, v2));
    }

    const rgb = hsvToRgb(h2, s2, v2);
    data[i] = Math.round(Math.max(0, Math.min(255, rgb.r)));
    data[i + 1] = Math.round(Math.max(0, Math.min(255, rgb.g)));
    data[i + 2] = Math.round(Math.max(0, Math.min(255, rgb.b)));
  }
  return imageData;
}

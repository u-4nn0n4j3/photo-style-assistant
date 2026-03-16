/**
 * 智能色調分析系統
 * 根據原圖與參考圖的色調類型自動選擇最適合的分析邏輯
 */

// -----------------------------------------------------------------------------
// 基礎統計函數
// -----------------------------------------------------------------------------
function calculateMean(arr) {
  if (!arr?.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function calculateMedian(arr) {
  if (!arr?.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function calculateStdDev(arr) {
  if (!arr?.length) return 0;
  const mean = calculateMean(arr);
  const variance = arr.reduce((a, v) => a + (v - mean) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

function calculatePercentile(arr, p) {
  if (!arr?.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx), hi = Math.ceil(idx);
  return lo === hi ? sorted[lo] : sorted[lo] + (idx - lo) * (sorted[hi] - sorted[lo]);
}

function calculateHistogram(arr, bins) {
  const hist = new Array(bins).fill(0);
  const min = Math.min(...arr, 0), max = Math.max(...arr, 1);
  const range = max - min || 1;
  for (const v of arr) {
    const i = Math.min(Math.floor(((v - min) / range) * bins), bins - 1);
    hist[Math.max(0, i)]++;
  }
  return hist;
}

function calculateCircularMean(angles) {
  if (!angles?.length) return 0;
  let sumSin = 0, sumCos = 0;
  for (const a of angles) {
    const rad = (a * Math.PI) / 180;
    sumSin += Math.sin(rad);
    sumCos += Math.cos(rad);
  }
  return (Math.atan2(sumSin, sumCos) * 180) / Math.PI + (Math.atan2(sumSin, sumCos) < 0 ? 360 : 0);
}

function calculateCircularStdDev(angles) {
  if (!angles?.length) return 0;
  const mean = calculateCircularMean(angles);
  let sumSq = 0;
  for (const a of angles) {
    let d = Math.abs(a - mean);
    if (d > 180) d = 360 - d;
    sumSq += d * d;
  }
  return Math.sqrt(sumSq / angles.length);
}

function filterHueRange(hues, lo, hi) {
  return hues.filter((h) => (lo <= hi ? h >= lo && h < hi : h >= lo || h < hi));
}

function calculateHueDistribution(hues) {
  const ranges = [
    { name: "red", lo: 0, hi: 30 },
    { name: "orange", lo: 30, hi: 60 },
    { name: "yellow", lo: 60, hi: 90 },
    { name: "green", lo: 90, hi: 150 },
    { name: "cyan", lo: 150, hi: 210 },
    { name: "blue", lo: 210, hi: 270 },
    { name: "purple", lo: 270, hi: 330 },
    { name: "red2", lo: 330, hi: 360 },
  ];
  return ranges.map((r) => ({
    ...r,
    count: filterHueRange(hues, r.lo, r.hi).length,
  }));
}

function findDominantHueRange(hues) {
  const dist = calculateHueDistribution(hues);
  const dominant = dist.reduce((a, b) => (b.count > a.count ? b : a), dist[0]);
  return { center: (dominant.lo + dominant.hi) / 2, range: dominant, name: dominant.name };
}

// -----------------------------------------------------------------------------
// RGB → HSV（H 0-360, S/V 0-1）
// -----------------------------------------------------------------------------
function rgbToHsv01(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
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

// -----------------------------------------------------------------------------
// 1.1 RGB 通道完整分析
// -----------------------------------------------------------------------------
function analyzeRGBChannels(data) {
  const channels = { r: [], g: [], b: [] };
  for (let i = 0; i < data.length; i += 4) {
    channels.r.push(data[i]);
    channels.g.push(data[i + 1]);
    channels.b.push(data[i + 2]);
  }
  const stats = {
    r: {
      mean: calculateMean(channels.r),
      median: calculateMedian(channels.r),
      stdDev: calculateStdDev(channels.r),
      p5: calculatePercentile(channels.r, 5),
      p25: calculatePercentile(channels.r, 25),
      p50: calculatePercentile(channels.r, 50),
      p75: calculatePercentile(channels.r, 75),
      p95: calculatePercentile(channels.r, 95),
    },
    g: {
      mean: calculateMean(channels.g),
      median: calculateMedian(channels.g),
      stdDev: calculateStdDev(channels.g),
      p5: calculatePercentile(channels.g, 5),
      p25: calculatePercentile(channels.g, 25),
      p50: calculatePercentile(channels.g, 50),
      p75: calculatePercentile(channels.g, 75),
      p95: calculatePercentile(channels.g, 95),
    },
    b: {
      mean: calculateMean(channels.b),
      median: calculateMedian(channels.b),
      stdDev: calculateStdDev(channels.b),
      p5: calculatePercentile(channels.b, 5),
      p25: calculatePercentile(channels.b, 25),
      p50: calculatePercentile(channels.b, 50),
      p75: calculatePercentile(channels.b, 75),
      p95: calculatePercentile(channels.b, 95),
    },
  };
  const r = stats.r.mean,
    g = stats.g.mean,
    b = stats.b.mean;
  const relationships = {
    rBRatio: b < 1 ? r : r / b,
    rGRatio: g < 1 ? r : r / g,
    gBRatio: b < 1 ? g : g / b,
    rgBalance: (r + b) / (2 * (g || 1)),
    warmthIndex: (r - b) / (r + b + g + 1e-6),
  };
  return { stats, relationships };
}

// -----------------------------------------------------------------------------
// 1.2 HSV 色彩空間完整分析
// -----------------------------------------------------------------------------
function analyzeHSVColorSpace(data) {
  const hsv = { h: [], s: [], v: [] };
  for (let i = 0; i < data.length; i += 4) {
    const { h, s, v } = rgbToHsv01(data[i], data[i + 1], data[i + 2]);
    hsv.h.push(h);
    hsv.s.push(s);
    hsv.v.push(v);
  }
  const dominantRange = findDominantHueRange(hsv.h);
  const stats = {
    hue: {
      mean: calculateCircularMean(hsv.h),
      median: calculateMedian(hsv.h),
      stdDev: calculateCircularStdDev(hsv.h),
      distribution: calculateHueDistribution(hsv.h),
      dominantRange,
    },
    saturation: {
      mean: calculateMean(hsv.s),
      median: calculateMedian(hsv.s),
      stdDev: calculateStdDev(hsv.s),
      p5: calculatePercentile(hsv.s, 5),
      p25: calculatePercentile(hsv.s, 25),
      p50: calculatePercentile(hsv.s, 50),
      p75: calculatePercentile(hsv.s, 75),
      p95: calculatePercentile(hsv.s, 95),
    },
    value: {
      mean: calculateMean(hsv.v),
      median: calculateMedian(hsv.v),
      stdDev: calculateStdDev(hsv.v),
      p5: calculatePercentile(hsv.v, 5),
      p25: calculatePercentile(hsv.v, 25),
      p50: calculatePercentile(hsv.v, 50),
      p75: calculatePercentile(hsv.v, 75),
      p95: calculatePercentile(hsv.v, 95),
    },
  };
  return { hsv, stats };
}

// -----------------------------------------------------------------------------
// 1.3 亮度分佈詳細分析
// -----------------------------------------------------------------------------
function calculateLocalContrast(luminance, width, height) {
  if (!width || !height || luminance.length < 4) return 0;
  let sumDiff = 0,
    count = 0;
  const step = Math.max(1, Math.floor(Math.min(width, height) / 50));
  for (let y = 0; y < height - step; y += step) {
    for (let x = 0; x < width - step; x += step) {
      const i = y * width + x;
      const right = luminance[i + step] ?? luminance[i];
      const down = luminance[(y + step) * width + x] ?? luminance[i];
      sumDiff += Math.abs(luminance[i] - right) + Math.abs(luminance[i] - down);
      count += 2;
    }
  }
  return count ? sumDiff / count : 0;
}

function analyzeLuminanceDistribution(data, width, height) {
  const luminance = [];
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255,
      g = data[i + 1] / 255,
      b = data[i + 2] / 255;
    luminance.push(0.299 * r + 0.587 * g + 0.114 * b);
  }
  const shadows = luminance.filter((l) => l < 0.25);
  const midtones = luminance.filter((l) => l >= 0.25 && l < 0.75);
  const highlights = luminance.filter((l) => l >= 0.75);
  const n = luminance.length || 1;

  const stats = {
    overall: {
      mean: calculateMean(luminance),
      median: calculateMedian(luminance),
      stdDev: calculateStdDev(luminance),
    },
    shadows: {
      count: shadows.length,
      percentage: (shadows.length / n) * 100,
      mean: shadows.length ? calculateMean(shadows) : 0.1,
      median: shadows.length ? calculateMedian(shadows) : 0.1,
      p5: shadows.length ? calculatePercentile(shadows, 5) : 0,
      p95: shadows.length ? calculatePercentile(shadows, 95) : 0.2,
    },
    midtones: {
      count: midtones.length,
      percentage: (midtones.length / n) * 100,
      mean: midtones.length ? calculateMean(midtones) : 0.5,
      median: midtones.length ? calculateMedian(midtones) : 0.5,
      p25: midtones.length ? calculatePercentile(midtones, 25) : 0.4,
      p75: midtones.length ? calculatePercentile(midtones, 75) : 0.6,
    },
    highlights: {
      count: highlights.length,
      percentage: (highlights.length / n) * 100,
      mean: highlights.length ? calculateMean(highlights) : 0.85,
      median: highlights.length ? calculateMedian(highlights) : 0.85,
      p5: highlights.length ? calculatePercentile(highlights, 5) : 0.76,
      p95: highlights.length ? calculatePercentile(highlights, 95) : 0.98,
      clippedPercentage: (luminance.filter((l) => l > 0.98).length / n) * 100,
    },
    contrast: {
      globalContrast: calculatePercentile(luminance, 95) - calculatePercentile(luminance, 5),
      localContrast: calculateLocalContrast(luminance, width, height),
      dynamicRange: Math.max(...luminance) - Math.min(...luminance),
    },
  };
  return stats;
}

// -----------------------------------------------------------------------------
// 1.4 飽和度分佈詳細分析
// -----------------------------------------------------------------------------
function analyzeSaturationDistribution(hsvData) {
  const saturation = hsvData.hsv.s;
  const hue = hsvData.hsv.h;
  const value = hsvData.hsv.v;
  const satByHue = {
    red: [],
    orange: [],
    yellow: [],
    green: [],
    cyan: [],
    blue: [],
    purple: [],
  };

  for (let i = 0; i < saturation.length; i++) {
    const h = hue[i];
    const s = saturation[i];
    const v = value[i];
    if (v > 0.2 && v < 0.9) {
      if ((h >= 0 && h < 30) || (h >= 330 && h <= 360)) satByHue.red.push(s);
      else if (h >= 30 && h < 60) satByHue.orange.push(s);
      else if (h >= 60 && h < 90) satByHue.yellow.push(s);
      else if (h >= 90 && h < 150) satByHue.green.push(s);
      else if (h >= 150 && h < 210) satByHue.cyan.push(s);
      else if (h >= 210 && h < 270) satByHue.blue.push(s);
      else if (h >= 270 && h < 330) satByHue.purple.push(s);
    }
  }

  const arr = (a) => (a?.length ? a : [0]);
  return {
    overall: {
      mean: Math.max(0.01, calculateMean(saturation)),
      median: calculateMedian(saturation),
      stdDev: calculateStdDev(saturation),
      p25: calculatePercentile(saturation, 25),
      p75: calculatePercentile(saturation, 75),
    },
    byHue: {
      red: calculateMean(arr(satByHue.red)),
      orange: calculateMean(arr(satByHue.orange)),
      yellow: calculateMean(arr(satByHue.yellow)),
      green: calculateMean(arr(satByHue.green)),
      cyan: calculateMean(arr(satByHue.cyan)),
      blue: calculateMean(arr(satByHue.blue)),
      purple: calculateMean(arr(satByHue.purple)),
    },
    distribution: {
      lowSat: saturation.filter((s) => s < 0.2).length / (saturation.length || 1),
      medSat: saturation.filter((s) => s >= 0.2 && s < 0.6).length / (saturation.length || 1),
      highSat: saturation.filter((s) => s >= 0.6).length / (saturation.length || 1),
    },
  };
}

// -----------------------------------------------------------------------------
// 1.5 色溫估算（細緻版本）
// -----------------------------------------------------------------------------
function estimateColorTemperature(rgbStats) {
  const r = rgbStats.stats.r.mean;
  const g = rgbStats.stats.g.mean;
  const b = rgbStats.stats.b.mean;

  const rbRatio = b < 1 ? r : r / b;
  let tempFromRB;
  if (rbRatio > 1.3) tempFromRB = 2000 + (rbRatio - 1.3) * 2000;
  else if (rbRatio > 1.0) tempFromRB = 5000 + (rbRatio - 1.0) * 10000;
  else if (rbRatio > 0.8) tempFromRB = 6500 + (1.0 - rbRatio) * 7500;
  else tempFromRB = 8000 + (0.8 - rbRatio) * 2500;

  const sum = r + g + b + 1e-6;
  const x = r / sum;
  const y = g / sum;
  const denom = 0.1858 - y;
  const n = Math.abs(denom) < 0.01 ? 0 : (x - 0.332) / denom;
  const tempFromChromaticity = Number.isFinite(n)
    ? 449 * n ** 3 + 3525 * n ** 2 + 6823.3 * n + 5520.33
    : 5500;

  const rgDiff = r - g;
  const gbDiff = g - b;
  const tempFromBalance = 5500 + rgDiff * 50 - gbDiff * 30;

  const estimatedTemp = tempFromRB * 0.5 + tempFromChromaticity * 0.3 + tempFromBalance * 0.2;
  const finalTemp = Math.max(2000, Math.min(10000, estimatedTemp));

  return {
    estimated: Math.round(finalTemp),
    rbRatio,
    methods: {
      fromRB: Math.round(tempFromRB),
      fromChromaticity: Math.round(tempFromChromaticity),
      fromBalance: Math.round(tempFromBalance),
    },
  };
}

// -----------------------------------------------------------------------------
// 2.1 色調類型完整分類
// -----------------------------------------------------------------------------
function classifyColorTone(rgbStats, hsvStats, colorTemp) {
  const rbRatio = rgbStats.relationships.rBRatio;
  const warmthIndex = rgbStats.relationships.warmthIndex;
  const dominantHue = hsvStats.stats.hue.dominantRange;
  const center = dominantHue?.center ?? 180;
  const temp = colorTemp.estimated;

  let toneCategory = "neutral";
  let toneSubtype = "balanced";
  let confidence = 0;

  if (temp < 4500 || rbRatio < 0.9 || warmthIndex < -0.1) {
    toneCategory = "cool";
    confidence = Math.min(100, Math.abs(warmthIndex) * 500);
    if (center >= 210 && center <= 270) toneSubtype = "cool-blue";
    else if (center >= 150 && center <= 210) toneSubtype = "cool-cyan";
    else if (center >= 270 && center <= 330) toneSubtype = "cool-purple";
    else toneSubtype = "cool-neutral";
  } else if (temp > 6000 || rbRatio > 1.1 || warmthIndex > 0.1) {
    toneCategory = "warm";
    confidence = Math.min(100, Math.abs(warmthIndex) * 500);
    if ((center >= 0 && center <= 30) || (center >= 330 && center <= 360)) toneSubtype = "warm-red";
    else if (center >= 30 && center <= 60) toneSubtype = "warm-orange";
    else if (center >= 60 && center <= 90) toneSubtype = "warm-yellow";
    else toneSubtype = "warm-neutral";
  } else {
    toneCategory = "neutral";
    confidence = Math.max(0, 100 - Math.abs(warmthIndex) * 500);
    if (center >= 90 && center <= 150) toneSubtype = "neutral-green";
    else toneSubtype = "neutral-balanced";
  }

  let intensity = "subtle";
  if (Math.abs(warmthIndex) > 0.25) intensity = "strong";
  else if (Math.abs(warmthIndex) > 0.15) intensity = "moderate";

  return {
    category: toneCategory,
    subtype: toneSubtype,
    intensity,
    confidence,
    colorTemp: temp,
    rbRatio,
    warmthIndex,
    dominantHue: { ...dominantHue, center },
  };
}

// -----------------------------------------------------------------------------
// 2.2 色調轉換模式判斷
// -----------------------------------------------------------------------------
function determineConversionMode(originalTone, referenceTone) {
  const origCat = originalTone.category;
  const refCat = referenceTone.category;

  let mode = {};

  if (origCat === refCat) {
    mode.type = "same_tone_adjustment";
    mode.name =
      origCat === "cool" ? "冷色調微調" : origCat === "warm" ? "暖色調微調" : "中性色調微調";
    mode.description = `原圖與參考圖均為${origCat === "cool" ? "冷" : origCat === "warm" ? "暖" : "中性"}色調，使用精細微調算法`;
    mode.maxTempChange = 20;
    mode.focusAreas = ["brightness", "saturation", "contrast"];
    mode.temperatureSensitivity = 0.3;
  } else if (origCat === "cool" && refCat === "warm") {
    mode.type = "cool_to_warm";
    mode.name = "冷調轉暖調";
    mode.description = "原圖為冷色調，參考圖為暖色調，需要大幅度色調轉換";
    mode.maxTempChange = 80;
    mode.focusAreas = ["temperature", "saturation", "hue"];
    mode.temperatureSensitivity = 1.2;
    mode.boostWarmHues = true;
  } else if (origCat === "warm" && refCat === "cool") {
    mode.type = "warm_to_cool";
    mode.name = "暖調轉冷調";
    mode.description = "原圖為暖色調，參考圖為冷色調，需要大幅度色調轉換";
    mode.maxTempChange = -80;
    mode.focusAreas = ["temperature", "saturation", "hue"];
    mode.temperatureSensitivity = 1.2;
    mode.boostCoolHues = true;
  } else if (origCat === "neutral" && refCat === "warm") {
    mode.type = "neutral_to_warm";
    mode.name = "中性轉暖調";
    mode.description = "原圖為中性色調，參考圖為暖色調，適度增加暖度";
    mode.maxTempChange = 50;
    mode.focusAreas = ["temperature", "saturation"];
    mode.temperatureSensitivity = 0.8;
    mode.boostWarmHues = true;
  } else if (origCat === "neutral" && refCat === "cool") {
    mode.type = "neutral_to_cool";
    mode.name = "中性轉冷調";
    mode.description = "原圖為中性色調，參考圖為冷色調，適度增加冷度";
    mode.maxTempChange = -50;
    mode.focusAreas = ["temperature", "saturation"];
    mode.temperatureSensitivity = 0.8;
    mode.boostCoolHues = true;
  } else if ((origCat === "warm" || origCat === "cool") && refCat === "neutral") {
    mode.type = "to_neutral";
    mode.name = `${origCat === "cool" ? "冷" : "暖"}調轉中性`;
    mode.description = `原圖為${origCat === "cool" ? "冷" : "暖"}色調，參考圖為中性色調，降低色調偏向`;
    mode.maxTempChange = 30;
    mode.focusAreas = ["temperature", "tint"];
    mode.temperatureSensitivity = 0.6;
    mode.neutralizeHues = true;
  } else {
    mode.type = "same_tone_adjustment";
    mode.name = "色調微調";
    mode.description = "色調類型相近，使用微調算法";
    mode.maxTempChange = 30;
    mode.focusAreas = ["brightness", "saturation", "contrast"];
    mode.temperatureSensitivity = 0.5;
  }

  const tempDiff = Math.abs(referenceTone.colorTemp - originalTone.colorTemp);
  const rbDiff = Math.abs(referenceTone.rbRatio - originalTone.rbRatio);
  const warmthDiff = Math.abs(referenceTone.warmthIndex - originalTone.warmthIndex);

  mode.toneDifference = {
    temperature: tempDiff,
    rbRatio: rbDiff,
    warmthIndex: warmthDiff,
    overall: (tempDiff / 1000) * 0.4 + rbDiff * 0.3 + warmthDiff * 0.3,
  };

  if (mode.toneDifference.overall > 0.5) mode.adjustmentStrength = "strong";
  else if (mode.toneDifference.overall > 0.2) mode.adjustmentStrength = "moderate";
  else mode.adjustmentStrength = "subtle";

  return mode;
}

// -----------------------------------------------------------------------------
// 3.1 色溫參數計算
// -----------------------------------------------------------------------------
function calculateTemperatureParams(originalTone, referenceTone, mode, rgbDiff) {
  const tempDiff = referenceTone.colorTemp - originalTone.colorTemp;
  const rbDiff = referenceTone.rbRatio - originalTone.rbRatio;
  const warmthDiff = referenceTone.warmthIndex - originalTone.warmthIndex;

  const tempFromDirect = tempDiff * 0.07;
  const tempFromRB = rbDiff * 100;
  const tempFromWarmth = warmthDiff * 200;

  let baseTemp = tempFromDirect * 0.5 + tempFromRB * 0.3 + tempFromWarmth * 0.2;
  let temperature = baseTemp * mode.temperatureSensitivity;

  if (mode.adjustmentStrength === "subtle") temperature *= 0.7;
  else if (mode.adjustmentStrength === "strong") temperature *= 1.2;

  if (mode.type === "same_tone_adjustment") {
    temperature = Math.max(-mode.maxTempChange, Math.min(mode.maxTempChange, temperature));
    if (Math.abs(tempDiff) < 300) temperature *= 0.5;
  } else if (mode.type === "cool_to_warm" || mode.type === "neutral_to_warm") {
    temperature = Math.max(15, temperature);
    temperature = Math.min(mode.maxTempChange, temperature);
    if (referenceTone.intensity === "strong") temperature *= 1.3;
  } else if (mode.type === "warm_to_cool" || mode.type === "neutral_to_cool") {
    temperature = Math.min(-15, temperature);
    temperature = Math.max(mode.maxTempChange, temperature);
    if (referenceTone.intensity === "strong") temperature *= 1.3;
  } else if (mode.type === "to_neutral") {
    temperature *= 0.6;
    temperature = Math.max(-mode.maxTempChange, Math.min(mode.maxTempChange, temperature));
  }

  const gDiff = rgbDiff.g;
  const avgRBDiff = (rgbDiff.r + rgbDiff.b) / 2;
  let tint = (gDiff - avgRBDiff) / 8;
  tint = Math.max(-15, Math.min(15, tint));
  if (mode.type === "same_tone_adjustment") tint *= 0.6;

  return {
    temperature: Math.round(temperature),
    tint: Math.round(tint),
  };
}

// -----------------------------------------------------------------------------
// 3.2 曝光參數計算
// -----------------------------------------------------------------------------
function calculateExposureParams(originalLum, referenceLum, mode) {
  const overallDiff = referenceLum.overall.mean - originalLum.overall.mean;
  const medianDiff = referenceLum.overall.median - originalLum.overall.median;
  const shadowDiff = referenceLum.shadows.mean - originalLum.shadows.mean;
  const midtoneDiff = referenceLum.midtones.mean - originalLum.midtones.mean;
  const highlightDiff = referenceLum.highlights.mean - originalLum.highlights.mean;

  let exposure = 0;
  const exposureFromOverall = overallDiff * 2.5;
  const exposureFromMedian = medianDiff * 2.0;
  const exposureFromMidtone = midtoneDiff * 3.0;
  let baseExposure =
    exposureFromOverall * 0.3 + exposureFromMedian * 0.3 + exposureFromMidtone * 0.4;
  exposure = Math.max(-2.0, Math.min(2.0, baseExposure));

  if (mode.type === "same_tone_adjustment" && Math.abs(overallDiff) < 0.1) {
    exposure *= 0.6;
  }

  const origContrast = originalLum.contrast.globalContrast;
  const refContrast = referenceLum.contrast.globalContrast;
  const contrastRatio = origContrast < 1e-6 ? 1 : refContrast / origContrast;
  let contrast = (contrastRatio - 1) * 120;
  contrast = Math.max(-40, Math.min(40, Math.round(contrast)));

  const highlightShift = highlightDiff * 100;
  const clippingRisk = referenceLum.highlights.clippedPercentage;

  let highlights;
  if (exposure > 0.3) {
    highlights = -15 + highlightShift * 0.3;
    if (clippingRisk < 1.0) highlights -= 10;
  } else {
    highlights = highlightShift * 0.5;
  }
  highlights = Math.max(-100, Math.min(100, Math.round(highlights)));

  const shadowShift = shadowDiff * 150;
  let shadows;
  if (exposure < -0.3) {
    shadows = 10 + shadowShift * 0.4;
  } else {
    shadows = shadowShift * 0.6;
  }
  shadows = Math.max(-100, Math.min(100, Math.round(shadows)));

  const whitesDiff = referenceLum.highlights.p95 - originalLum.highlights.p95;
  let whites = whitesDiff * 80;
  if (exposure > 0.5 && highlights < -20) whites -= 15;
  whites = Math.max(-100, Math.min(100, Math.round(whites)));

  const blacksDiff = referenceLum.shadows.p5 - originalLum.shadows.p5;
  let blacks = blacksDiff * 100;
  if (shadows > 20) blacks += 10;
  blacks = Math.max(-100, Math.min(100, Math.round(blacks)));

  return {
    exposure: Math.round(exposure * 10) / 10,
    contrast,
    highlights,
    shadows,
    whites,
    blacks,
  };
}

// -----------------------------------------------------------------------------
// 3.3 飽和度參數計算
// -----------------------------------------------------------------------------
function calculateSaturationParams(originalSat, referenceSat, originalTone, referenceTone, mode) {
  const overallRatio =
    referenceSat.overall.mean / (originalSat.overall.mean || 0.01);
  const medianRatio =
    referenceSat.overall.median / (originalSat.overall.median || 0.01);

  const satByHueRatio = {
    red: referenceSat.byHue.red / (originalSat.byHue.red || 0.01),
    orange: referenceSat.byHue.orange / (originalSat.byHue.orange || 0.01),
    yellow: referenceSat.byHue.yellow / (originalSat.byHue.yellow || 0.01),
    green: referenceSat.byHue.green / (originalSat.byHue.green || 0.01),
    cyan: referenceSat.byHue.cyan / (originalSat.byHue.cyan || 0.01),
    blue: referenceSat.byHue.blue / (originalSat.byHue.blue || 0.01),
    purple: referenceSat.byHue.purple / (originalSat.byHue.purple || 0.01),
  };

  const baseRatio = overallRatio * 0.6 + medianRatio * 0.4;

  let vibrance = 0;
  let saturation = 0;

  if (baseRatio > 1.2) {
    vibrance = 20 + (baseRatio - 1.2) * 80;
    saturation = 12 + (baseRatio - 1.2) * 60;
  } else if (baseRatio > 1.1) {
    vibrance = 12 + (baseRatio - 1.1) * 80;
    saturation = 7 + (baseRatio - 1.1) * 50;
  } else if (baseRatio > 1.02) {
    vibrance = 5 + (baseRatio - 1.02) * 87.5;
    saturation = 3 + (baseRatio - 1.02) * 50;
  } else if (baseRatio > 0.98) {
    vibrance = (baseRatio - 0.98) * 125;
    saturation = (baseRatio - 0.98) * 75;
  } else if (baseRatio > 0.9) {
    vibrance = (baseRatio - 0.94) * 125;
    saturation = (baseRatio - 0.94) * 87.5;
  } else {
    vibrance = (baseRatio - 0.9) * 125;
    saturation = (baseRatio - 0.9) * 100;
  }

  if (mode.type === "same_tone_adjustment") {
    if (Math.abs(baseRatio - 1.0) < 0.05) {
      vibrance *= 0.5;
      saturation *= 0.5;
    }
  } else if (mode.type === "cool_to_warm") {
    const warmHuesBoost =
      (satByHueRatio.red + satByHueRatio.orange + satByHueRatio.yellow) / 3;
    if (warmHuesBoost > 1.1) {
      vibrance += 8;
      saturation += 5;
    }
    if (referenceTone.subtype === "warm-orange") {
      vibrance += 5;
      saturation += 3;
    }
  } else if (mode.type === "warm_to_cool") {
    const coolHuesBoost =
      (satByHueRatio.cyan + satByHueRatio.blue + satByHueRatio.purple) / 3;
    if (coolHuesBoost > 1.1) {
      vibrance += 8;
      saturation += 5;
    }
    if (referenceTone.subtype === "cool-blue") {
      vibrance += 5;
      saturation += 3;
    }
  } else if (mode.type === "neutral_to_warm" || mode.type === "neutral_to_cool") {
    vibrance *= 0.9;
    saturation *= 0.9;
  } else if (mode.type === "to_neutral") {
    if (vibrance > 0) vibrance *= 0.6;
    if (saturation > 0) saturation *= 0.6;
  }

  vibrance = Math.max(-30, Math.min(40, Math.round(vibrance)));
  saturation = Math.max(-25, Math.min(30, Math.round(saturation)));

  return { vibrance, saturation, byHueRatio: satByHueRatio };
}

// -----------------------------------------------------------------------------
// 4. 主流程整合
// -----------------------------------------------------------------------------
export function generateIntelligentDetailedRecommendations(origImageData, refImageData) {
  const origData = origImageData.data;
  const refData = refImageData.data;
  const width = origImageData.width || 0;
  const height = origImageData.height || 0;

  const origRGB = analyzeRGBChannels(origData);
  const origHSV = analyzeHSVColorSpace(origData);
  const origLum = analyzeLuminanceDistribution(origData, width, height);
  const origSat = analyzeSaturationDistribution(origHSV);
  const origTemp = estimateColorTemperature(origRGB);
  const origTone = classifyColorTone(origRGB, origHSV, origTemp);

  const refRGB = analyzeRGBChannels(refData);
  const refHSV = analyzeHSVColorSpace(refData);
  const refLum = analyzeLuminanceDistribution(refData, width, height);
  const refSat = analyzeSaturationDistribution(refHSV);
  const refTemp = estimateColorTemperature(refRGB);
  const refTone = classifyColorTone(refRGB, refHSV, refTemp);

  const rgbDiff = {
    r: refRGB.stats.r.mean - origRGB.stats.r.mean,
    g: refRGB.stats.g.mean - origRGB.stats.g.mean,
    b: refRGB.stats.b.mean - origRGB.stats.b.mean,
  };

  const mode = determineConversionMode(origTone, refTone);

  const tempParams = calculateTemperatureParams(origTone, refTone, mode, rgbDiff);
  const exposureParams = calculateExposureParams(origLum, refLum, mode);
  const satParams = calculateSaturationParams(origSat, refSat, origTone, refTone, mode);

  const fmt = (v) => (v >= 0 ? `+${v}` : `${v}`);

  const adjustments = {
    exposure: fmt(exposureParams.exposure),
    contrast: fmt(exposureParams.contrast),
    highlights: fmt(exposureParams.highlights),
    shadows: fmt(exposureParams.shadows),
    whites: fmt(exposureParams.whites),
    blacks: fmt(exposureParams.blacks),
    saturation: fmt(satParams.saturation),
    vibrance: fmt(satParams.vibrance),
    temperature: fmt(tempParams.temperature),
    tint: fmt(tempParams.tint),
  };

  return {
    adjustments,
    mode: {
      type: mode.type,
      name: mode.name,
      description: mode.description,
      strength: mode.adjustmentStrength,
      toneDifference: mode.toneDifference,
    },
    originalAnalysis: {
      tone: origTone,
      colorTemp: origTemp,
    },
    referenceAnalysis: {
      tone: refTone,
      colorTemp: refTemp,
    },
  };
}

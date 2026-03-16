/**
 * NOAA 日照計算模組（純前端，無外部 API）
 * 基於 NOAA Solar Calculator 演算法
 */

const toRad = (deg) => (deg * Math.PI) / 180;
const toDeg = (rad) => (rad * 180) / Math.PI;

function julianDay(year, month, day) {
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
}

/**
 * 計算指定日期與地點的日出／日落時間（當地時間的分鐘數 0–1440）
 * @param {number} year - 完整年份
 * @param {number} month - 月份 1–12
 * @param {number} day - 日期 1–31
 * @param {number} lat - 緯度（十進位度數）
 * @param {number} lng - 經度（十進位度數，東正西負）
 * @param {number} tzOffset - 時區偏移（小時），例如 UTC+8 傳入 8
 * @returns {{ sunrise: number, sunset: number }} 以當地時間的分鐘數表示（0–1440），-1=永夜，-2=永晝
 */
export function calcSunriseSunset(year, month, day, lat, lng, tzOffset) {
  const JD = julianDay(year, month, day);
  const T = (JD - 2451545.0) / 36525.0;

  const L0 = ((280.46646 + T * (36000.76983 + T * 0.0003032)) % 360 + 360) % 360;
  const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
  const Mrad = toRad(M);

  const C =
    Math.sin(Mrad) * (1.914602 - T * (0.004817 + 0.000014 * T)) +
    Math.sin(2 * Mrad) * (0.019993 - 0.000101 * T) +
    Math.sin(3 * Mrad) * 0.000289;

  const sunLon = L0 + C;
  const omega = 125.04 - 1934.136 * T;
  const lambda = sunLon - 0.00569 - 0.00478 * Math.sin(toRad(omega));

  const epsilon0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
  const epsilon = epsilon0 + 0.00256 * Math.cos(toRad(omega));

  const sinDec = Math.sin(toRad(epsilon)) * Math.sin(toRad(lambda));
  const declination = toDeg(Math.asin(sinDec));

  const y = Math.tan(toRad(epsilon / 2)) ** 2;
  const L0rad = toRad(L0);
  const Mrad2 = toRad(M);
  const eot =
    4 *
    toDeg(
      y * Math.sin(2 * L0rad) -
        2 * 0.016708634 * Math.sin(Mrad2) +
        4 * 0.016708634 * y * Math.sin(Mrad2) * Math.cos(2 * L0rad) -
        0.5 * y * y * Math.sin(4 * L0rad) -
        1.25 * 0.016708634 ** 2 * Math.sin(2 * Mrad2)
    );

  const zenith = 90.833;
  const cosHA =
    (Math.cos(toRad(zenith)) - Math.sin(toRad(lat)) * Math.sin(toRad(declination))) /
    (Math.cos(toRad(lat)) * Math.cos(toRad(declination)));

  if (cosHA > 1) return { sunrise: -1, sunset: -1 };
  if (cosHA < -1) return { sunrise: -2, sunset: -2 };

  const HA = toDeg(Math.acos(cosHA));
  const solarNoon = 720 - 4 * lng - eot + tzOffset * 60;
  const sunrise = solarNoon - 4 * HA;
  const sunset = solarNoon + 4 * HA;

  return {
    sunrise: normalizeMinutes(sunrise),
    sunset: normalizeMinutes(sunset),
  };
}

function normalizeMinutes(m) {
  if (m < 0) return m + 1440;
  if (m >= 1440) return m - 1440;
  return m;
}

/**
 * 將分鐘數轉為 "HH:MM" 字串
 */
export function formatMinutesToTime(minutes) {
  if (minutes < 0) return null;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * 將 "HH:MM" 或 "H:MM" 字串解析為分鐘數
 */
export function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return null;
  const m = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

/** @typedef {'before-sunrise'|'morning-golden'|'daytime-morning'|'daytime-midday'|'daytime-prepping'|'evening-golden'|'blue-hour'|'night'} ShootingStatus */

/**
 * @param {number} currentMinutes - 當前時間（當地分鐘數）
 * @param {{ sunrise: number, sunset: number }} sun
 * @param {{ morningGoldenEnd: number, eveningGoldenStart: number, blueHourEnd: number }} windows
 * @returns {ShootingStatus}
 */
export function getShootingStatus(currentMinutes, sun, windows) {
  if (sun.sunrise < 0 || sun.sunset < 0) return "daytime-morning"; // 永晝/永夜簡化處理
  if (currentMinutes < sun.sunrise) return "before-sunrise";
  if (currentMinutes < windows.morningGoldenEnd) return "morning-golden";

  // 白天三分法
  const minsToEvening = windows.eveningGoldenStart - currentMinutes;
  if (currentMinutes < windows.eveningGoldenStart) {
    if (minsToEvening > 180) return "daytime-morning"; // 距傍晚黃金 > 3h
    if (minsToEvening > 60) return "daytime-midday"; // 距傍晚黃金 1–3h
    return "daytime-prepping"; // 距傍晚黃金 < 1h
  }

  if (currentMinutes < sun.sunset) return "evening-golden";
  if (currentMinutes < windows.blueHourEnd) return "blue-hour";
  return "night";
}

const STATUS_LABELS = {
  "before-sunrise": "日出前",
  "morning-golden": "早晨黃金時段",
  "daytime-morning": "上午",
  "daytime-midday": "午後",
  "daytime-prepping": "傍晚準備中",
  "evening-golden": "傍晚黃金時段",
  "blue-hour": "藍調時刻",
  night: "夜間",
};

export function getStatusLabel(status) {
  return STATUS_LABELS[status] ?? status;
}

/**
 * 取得近日期模式的細緻狀態顯示（標籤 + 倒數文字）
 * @param {ShootingStatus} status
 * @param {number} currentMin - 當前分鐘數
 * @param {{ sunrise: number, sunset: number }} sun
 * @param {{ morningGoldenEnd: number, eveningGoldenStart: number, blueHourEnd: number }} windows
 * @returns {{ label: string, countdown: string }}
 */
export function getStatusDisplay(status, currentMin, sun, windows) {
  const fmt = (min) => {
    const n = ((min % 1440) + 1440) % 1440;
    const h = Math.floor(n / 60);
    const m = Math.floor(n % 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const diffText = (targetMin) => {
    let diff = targetMin - currentMin;
    if (diff <= 0) diff += 1440;
    const h = Math.floor(diff / 60);
    const m = Math.floor(diff % 60);
    const timeStr = h > 0 ? `${h} 小時 ${m} 分鐘` : `${m} 分鐘`;
    return `${timeStr}（${fmt(targetMin)}）`;
  };

  switch (status) {
    case "before-sunrise":
      return { label: "日出前", countdown: `距日出：${diffText(sun.sunrise)}` };
    case "morning-golden":
      return {
        label: "早晨黃金時段進行中",
        countdown: `黃金時段還剩：${diffText(windows.morningGoldenEnd)}`,
      };
    case "daytime-morning":
      return {
        label: "上午 — 光線偏硬",
        countdown: `距傍晚黃金時段：${diffText(windows.eveningGoldenStart)}`,
      };
    case "daytime-midday":
      return {
        label: "午後 — 光線漸柔",
        countdown: `距傍晚黃金時段：${diffText(windows.eveningGoldenStart)}`,
      };
    case "daytime-prepping":
      return {
        label: "傍晚準備中",
        countdown: `距傍晚黃金時段：${diffText(windows.eveningGoldenStart)}，建議提前到場`,
      };
    case "evening-golden":
      return {
        label: "傍晚黃金時段進行中",
        countdown: `距日落：${diffText(sun.sunset)}`,
      };
    case "blue-hour":
      return {
        label: "藍調時段進行中",
        countdown: `藍調時段還剩：${diffText(windows.blueHourEnd)}`,
      };
    case "night": {
      const tomorrowSunrise = sun.sunrise + 1440;
      return {
        label: "今日拍攝時段已結束",
        countdown: `距明日日出：${diffText(tomorrowSunrise)}`,
      };
    }
    default:
      return { label: getStatusLabel(status), countdown: "" };
  }
}

/**
 * @param {Date} selectedDate - 使用者選擇的日期
 * @param {Date} now - 當前時間
 * @returns {'near'|'planning'}
 */
export function getTimeMode(selectedDate, now) {
  const diffMs = Math.abs(selectedDate.getTime() - now.getTime());
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours <= 24 ? "near" : "planning";
}

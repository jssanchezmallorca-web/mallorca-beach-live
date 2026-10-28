"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  calculateSolunarPeriods: () => calculateSolunarPeriods,
  calculateSolunarRange: () => calculateSolunarRange,
  computeDayRating: () => computeDayRating,
  computeTideStrength: () => computeTideStrength
});
module.exports = __toCommonJS(index_exports);

// src/solunar.ts
var import_suncalc3 = __toESM(require("./suncalc3.cjs"));

// src/rating.ts
var MOON_PERIGEE_KM = 363300;
var MOON_APOGEE_KM = 405500;
var OVERLAP_WINDOW_MS = 90 * 60 * 1e3;
function computeDayRating(input) {
  const { phaseValue, moonDistanceKm, periodCenters, sunEvents } = input;
  if (!Number.isFinite(phaseValue) || phaseValue < 0 || phaseValue > 1) {
    throw new RangeError(
      `phaseValue must be a finite number between 0 and 1, got ${phaseValue}`
    );
  }
  if (!Number.isFinite(moonDistanceKm)) {
    throw new RangeError(
      `moonDistanceKm must be a finite number, got ${moonDistanceKm}`
    );
  }
  const distToSyzygy = Math.min(
    phaseValue,
    Math.abs(phaseValue - 0.5),
    1 - phaseValue
  );
  const phaseScore = 2 * (1 - distToSyzygy / 0.25);
  const distanceFraction = (MOON_APOGEE_KM - moonDistanceKm) / (MOON_APOGEE_KM - MOON_PERIGEE_KM);
  const perigeeScore = 1.5 * Math.min(1, Math.max(0, distanceFraction));
  let overlapScore = 0;
  for (const center of periodCenters) {
    const overlaps = sunEvents.some(
      (sun) => Math.abs(center.getTime() - sun.getTime()) <= OVERLAP_WINDOW_MS
    );
    if (overlaps) {
      overlapScore += 0.75;
    }
  }
  overlapScore = Math.min(1.5, overlapScore);
  const rating = Math.min(
    5,
    Math.max(0, Math.round((phaseScore + perigeeScore + overlapScore) * 10) / 10)
  );
  return { rating, label: ratingLabel(rating) };
}
function ratingLabel(rating) {
  if (rating < 1.5) return "Poor";
  if (rating < 2.5) return "Fair";
  if (rating < 3.5) return "Good";
  if (rating < 4.25) return "Great";
  return "Excellent";
}

// src/tide-strength.ts
function computeTideStrength(phaseValue) {
  if (!Number.isFinite(phaseValue) || phaseValue < 0 || phaseValue > 1) {
    throw new RangeError(
      `phaseValue must be a finite number between 0 and 1, got ${phaseValue}`
    );
  }
  const distToSyzygy = Math.min(
    phaseValue,
    Math.abs(phaseValue - 0.5),
    1 - phaseValue
  );
  const strength = Math.round(100 * (1 - distToSyzygy / 0.25));
  const type = strength >= 67 ? "spring" : strength <= 33 ? "neap" : "mid";
  return { strength, type };
}

// src/solunar.ts
var MS_PER_DAY = 24 * 60 * 60 * 1e3;
function calculateSolunarRange(latitude, longitude, startDate, days, timeZone) {
  if (!Number.isInteger(days) || days < 1 || days > 366) {
    throw new RangeError(`days must be an integer between 1 and 366, got ${days}`);
  }
  return Array.from(
    { length: days },
    (_, i) => calculateSolunarPeriods(
      latitude,
      longitude,
      new Date(startDate.getTime() + i * MS_PER_DAY),
      timeZone
    )
  );
}
function validateInputs(latitude, longitude, date, timeZone) {
  if (typeof latitude !== "number" || Number.isNaN(latitude) || latitude < -90 || latitude > 90) {
    throw new RangeError(`latitude must be a number between -90 and 90, got ${latitude}`);
  }
  if (typeof longitude !== "number" || Number.isNaN(longitude) || longitude < -180 || longitude > 180) {
    throw new RangeError(`longitude must be a number between -180 and 180, got ${longitude}`);
  }
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new TypeError("date must be a valid Date");
  }
  if (timeZone !== void 0) {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone });
    } catch {
      throw new RangeError(`invalid IANA timeZone: ${timeZone}`);
    }
  }
}
function calculateSolunarPeriods(latitude, longitude, date, timeZone) {
  validateInputs(latitude, longitude, date, timeZone);
  const canSetTZ = typeof process !== "undefined" && typeof process.env === "object" && process.env !== null;
  if (timeZone && !canSetTZ) {
    const ambient = new Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (ambient !== timeZone) {
      throw new Error(
        `bite-times: timeZone '${timeZone}' requires Node.js. Outside Node, astronomy is computed in the ambient timezone ('${ambient}') and cannot be redirected. Omit timeZone, or only request the ambient zone.`
      );
    }
  }
  const originalTZ = canSetTZ ? process.env.TZ : void 0;
  if (timeZone && canSetTZ) {
    process.env.TZ = timeZone;
    const ambientZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
    const requestedZone = new Intl.DateTimeFormat(void 0, {
      timeZone
    }).resolvedOptions().timeZone;
    if (ambientZone !== requestedZone) {
      console.warn(
        `\u26A0\uFE0F process.env.TZ='${timeZone}' did not change Date behavior (ambient Intl zone is still '${ambientZone}'). Timezone data may be missing (e.g., Alpine Linux needs 'apk add tzdata'). Solunar calculations will be incorrect.`
      );
    }
  }
  const anchoredDate = toLocalDayAnchor(date, timeZone);
  const sunTimes = import_suncalc3.default.getSunTimes(anchoredDate, latitude, longitude);
  const moonTimes = import_suncalc3.default.getMoonTimes(anchoredDate, latitude, longitude);
  const moonIllum = import_suncalc3.default.getMoonIllumination(date);
  const { upperTransit, lowerTransit } = calculateMoonTransits(
    date,
    latitude,
    longitude,
    moonTimes
  );
  const moonPosition = import_suncalc3.default.getMoonPosition(date, latitude, longitude);
  if (timeZone && canSetTZ) {
    if (originalTZ === void 0) {
      delete process.env.TZ;
    } else {
      process.env.TZ = originalTZ;
    }
  }
  const moonPhase = getMoonPhaseDescription(moonIllum.phaseValue);
  const periodCenters = [
    upperTransit,
    lowerTransit,
    moonTimes.rise && !isNaN(moonTimes.rise.getTime()) ? moonTimes.rise : null,
    moonTimes.set && !isNaN(moonTimes.set.getTime()) ? moonTimes.set : null
  ].filter((d) => d instanceof Date);
  const sunEvents = [
    sunTimes.sunriseStart?.value,
    sunTimes.sunsetStart?.value
  ].filter((d) => d instanceof Date && !isNaN(d.getTime()));
  const dayRating = computeDayRating({
    phaseValue: moonIllum.phaseValue,
    moonDistanceKm: moonPosition.distance,
    periodCenters,
    sunEvents
  });
  const tide = computeTideStrength(moonIllum.phaseValue);
  const majorPeriods = [];
  if (upperTransit) {
    majorPeriods.push(createPeriod(upperTransit, 2, date, timeZone));
  }
  if (lowerTransit) {
    majorPeriods.push(createPeriod(lowerTransit, 2, date, timeZone));
  }
  const minorPeriods = [];
  if (moonTimes.rise && !isNaN(moonTimes.rise.getTime())) {
    minorPeriods.push(createPeriod(moonTimes.rise, 2, date, timeZone));
  }
  if (moonTimes.set && !isNaN(moonTimes.set.getTime())) {
    minorPeriods.push(createPeriod(moonTimes.set, 2, date, timeZone));
  }
  const sortedMajorPeriods = sortPeriods(majorPeriods);
  const sortedMinorPeriods = sortPeriods(minorPeriods);
  return {
    majorPeriods: sortedMajorPeriods,
    minorPeriods: sortedMinorPeriods,
    date: formatDate(date),
    sunRise: sunTimes.sunriseStart?.valid ? formatTime(sunTimes.sunriseStart.value, date, timeZone) : "",
    sunSet: sunTimes.sunsetStart?.valid ? formatTime(sunTimes.sunsetStart.value, date, timeZone) : "",
    moonRise: moonTimes.rise ? formatTime(moonTimes.rise, date, timeZone) : "",
    moonSet: moonTimes.set ? formatTime(moonTimes.set, date, timeZone) : "",
    moonPhase,
    moonIllumination: Math.round(moonIllum.fraction * 100),
    dayRating: dayRating.rating,
    dayRatingLabel: dayRating.label,
    tideStrength: tide.strength,
    tideType: tide.type
  };
}
function calculateMoonTransits(date, latitude, longitude, moonTimes) {
  let upperTransit = null;
  let lowerTransit = null;
  if (moonTimes.rise && moonTimes.set && !isNaN(moonTimes.rise.getTime()) && !isNaN(moonTimes.set.getTime())) {
    const transit = import_suncalc3.default.moonTransit(
      moonTimes.rise,
      moonTimes.set,
      latitude,
      longitude
    );
    if (transit.main && !isNaN(transit.main.getTime())) {
      upperTransit = transit.main;
    }
    if (transit.invert && !isNaN(transit.invert.getTime())) {
      lowerTransit = transit.invert;
    }
  }
  if (upperTransit && !lowerTransit) {
    lowerTransit = new Date(upperTransit.getTime() + 12.42 * 60 * 60 * 1e3);
  } else if (lowerTransit && !upperTransit) {
    upperTransit = new Date(lowerTransit.getTime() + 12.42 * 60 * 60 * 1e3);
  }
  if (!upperTransit && moonTimes.highest && !isNaN(moonTimes.highest.getTime())) {
    upperTransit = moonTimes.highest;
  }
  if (!lowerTransit && upperTransit) {
    lowerTransit = new Date(upperTransit.getTime() + 12.42 * 60 * 60 * 1e3);
  }
  return {
    upperTransit,
    lowerTransit
  };
}
function createPeriod(centerTime, durationHours, baseDate, timeZone) {
  const halfDuration = durationHours / 2 * 60 * 60 * 1e3;
  const startTime = new Date(centerTime.getTime() - halfDuration);
  const endTime = new Date(centerTime.getTime() + halfDuration);
  return {
    start: formatTime(startTime, baseDate, timeZone),
    end: formatTime(endTime, baseDate, timeZone),
    startISO: formatISO(startTime, timeZone),
    endISO: formatISO(endTime, timeZone)
  };
}
function formatISO(date, timeZone) {
  if (!date || isNaN(date.getTime())) {
    return "";
  }
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: timeZone ?? "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZoneName: "longOffset"
  });
  const parts = {};
  for (const part of dtf.formatToParts(date)) {
    parts[part.type] = part.value;
  }
  const rawOffset = parts.timeZoneName ?? "GMT";
  let offset = rawOffset === "GMT" ? "+00:00" : rawOffset.replace("GMT", "");
  if (/^[+-]\d{2}$/.test(offset)) {
    offset += ":00";
  }
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}${offset}`;
}
function getUtcOffsetMs(date, timeZone) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset"
  });
  const rawOffset = dtf.formatToParts(date).find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  if (rawOffset === "GMT") return 0;
  const match = /^GMT([+-])(\d{2}):(\d{2})$/.exec(rawOffset);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = Number(match[3]);
  return sign * (hours * 60 + minutes) * 60 * 1e3;
}
function toLocalDayAnchor(date, timeZone) {
  if (!timeZone) return date;
  let anchored = date;
  for (let i = 0; i < 3; i++) {
    const next = new Date(date.getTime() - getUtcOffsetMs(anchored, timeZone));
    if (next.getTime() === anchored.getTime()) break;
    anchored = next;
  }
  return anchored;
}
function formatTime(date, baseDate, timeZone) {
  if (!date || isNaN(date.getTime())) {
    return "";
  }
  if (timeZone) {
    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone,
        hour: "2-digit",
        minute: "2-digit",
        // hour12: false is NOT reliably equivalent to hourCycle: "h23" across
        // ICU versions — on some builds (verified: Node 20.20.2 / ICU 78.2)
        // it resolves to hourCycle "h24" and renders midnight as "24:56"
        // instead of "00:56". Request h23 explicitly to avoid the ambiguity.
        hourCycle: "h23"
      });
      const parts = formatter.formatToParts(date);
      const hour = parts.find((p) => p.type === "hour")?.value || "00";
      const minute = parts.find((p) => p.type === "minute")?.value || "00";
      return `${hour}:${minute}`;
    } catch (error) {
      console.warn(`Invalid timezone ${timeZone}, using UTC`);
    }
  }
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}
function formatDate(date) {
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = date.getUTCDate().toString().padStart(2, "0");
  return `${year}${month}${day}`;
}
function getMoonPhaseDescription(phase) {
  if (phase < 0.0625) return "New Moon";
  if (phase < 0.1875) return "Waxing Crescent";
  if (phase < 0.3125) return "First Quarter";
  if (phase < 0.4375) return "Waxing Gibbous";
  if (phase < 0.5625) return "Full Moon";
  if (phase < 0.6875) return "Waning Gibbous";
  if (phase < 0.8125) return "Last Quarter";
  if (phase < 0.9375) return "Waning Crescent";
  return "New Moon";
}
function sortPeriods(periods) {
  return [...periods].sort(
    (a, b) => Date.parse(a.startISO) - Date.parse(b.startISO)
  );
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  calculateSolunarPeriods,
  calculateSolunarRange,
  computeDayRating,
  computeTideStrength
});

import { RepairType, RenovationScope } from '../types';

interface RepairTypeConfig {
  rateMin: number;
  rateMax: number;
  daysPerSqm: number;
  icon: string;
  label: string;
}

export const REPAIR_RATES: Record<RepairType, RepairTypeConfig> = {
  cosmetic: { rateMin: 5000, rateMax: 8000, daysPerSqm: 0.5, icon: 'color-palette-outline', label: 'Косметический' },
  standard: { rateMin: 8000, rateMax: 15000, daysPerSqm: 0.8, icon: 'build-outline', label: 'Стандартный' },
  premium: { rateMin: 15000, rateMax: 25000, daysPerSqm: 1.2, icon: 'star-outline', label: 'Капитальный' },
  design: { rateMin: 25000, rateMax: 40000, daysPerSqm: 1.5, icon: 'diamond-outline', label: 'Дизайнерский' },
};

// ─── Room area distribution (% of typical Russian apartment) ───
const ROOM_AREA_PERCENT: Partial<Record<RenovationScope, number>> = {
  kitchen: 15,
  bathroom: 8,
  living_room: 25,
  bedroom: 18,
  hallway: 10,
  balcony: 5,
};

// Cost multiplier per room type (wet zones cost more per m²)
const ROOM_COST_MULTIPLIER: Partial<Record<RenovationScope, number>> = {
  kitchen: 1.2,
  bathroom: 1.5,
  living_room: 1.0,
  bedroom: 1.0,
  hallway: 0.8,
  balcony: 0.7,
};

export function estimateCost(repairType: RepairType, areaSqm: number) {
  const config = REPAIR_RATES[repairType];
  return {
    min: Math.round(config.rateMin * areaSqm),
    max: Math.round(config.rateMax * areaSqm),
  };
}

/**
 * Calculate cost estimate based on selected scope (rooms).
 * Uses room-specific area percentages and cost multipliers.
 * Returns { min, max, scopeArea } — scopeArea is the calculated renovation area.
 */
export function estimateScopedCost(
  repairType: RepairType,
  totalArea: number,
  scope: RenovationScope[],
) {
  const config = REPAIR_RATES[repairType];

  // Full apartment or no scope — use total area, no multiplier
  if (scope.length === 0 || scope.includes('full')) {
    return {
      ...estimateCost(repairType, totalArea),
      scopeArea: totalArea,
    };
  }

  // Calculate weighted cost per room
  let weightedMin = 0;
  let weightedMax = 0;
  let scopeArea = 0;

  for (const room of scope) {
    const pct = ROOM_AREA_PERCENT[room] ?? 15; // fallback 15%
    const roomArea = (pct / 100) * totalArea;
    const mult = ROOM_COST_MULTIPLIER[room] ?? 1.0;
    weightedMin += roomArea * config.rateMin * mult;
    weightedMax += roomArea * config.rateMax * mult;
    scopeArea += roomArea;
  }

  return {
    min: Math.round(weightedMin),
    max: Math.round(weightedMax),
    scopeArea: Math.round(scopeArea),
  };
}

export function estimateTimelineDays(repairType: RepairType, areaSqm: number): number {
  const config = REPAIR_RATES[repairType];
  return Math.max(14, Math.ceil(config.daysPerSqm * areaSqm));
}

/**
 * Calculate timeline based on scope area (not total area).
 */
export function estimateScopedTimeline(
  repairType: RepairType,
  totalArea: number,
  scope: RenovationScope[],
): number {
  if (scope.length === 0 || scope.includes('full')) {
    return estimateTimelineDays(repairType, totalArea);
  }

  let scopeArea = 0;
  for (const room of scope) {
    const pct = ROOM_AREA_PERCENT[room] ?? 15;
    scopeArea += (pct / 100) * totalArea;
  }
  return estimateTimelineDays(repairType, scopeArea);
}

export function formatRubles(amount: number): string {
  // Use non-breaking space (\u00A0) so ₽ never wraps to next line
  return amount.toLocaleString('ru-RU') + '\u00A0\u20BD';
}

export function formatTimeline(days: number): string {
  if (days < 30) return `~${days} дн.`;
  const months = Math.round(days / 30);
  return `~${days} дн. (~${months} мес.)`;
}

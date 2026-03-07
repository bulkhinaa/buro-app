import { RepairType } from '../types';

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

export function estimateCost(repairType: RepairType, areaSqm: number) {
  const config = REPAIR_RATES[repairType];
  return {
    min: Math.round(config.rateMin * areaSqm),
    max: Math.round(config.rateMax * areaSqm),
  };
}

export function estimateTimelineDays(repairType: RepairType, areaSqm: number): number {
  const config = REPAIR_RATES[repairType];
  return Math.max(14, Math.ceil(config.daysPerSqm * areaSqm));
}

export function formatRubles(amount: number): string {
  return amount.toLocaleString('ru-RU') + ' \u20BD';
}

export function formatTimeline(days: number): string {
  if (days < 30) return `~${days} \u0434\u043D.`;
  const months = Math.round(days / 30);
  return `~${days} \u0434\u043D. (~${months} \u043C\u0435\u0441.)`;
}

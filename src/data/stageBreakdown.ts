import { RepairType } from '../types';
import { estimateCost, estimateTimelineDays } from '../utils/calculator';

/**
 * Stage breakdown template — each stage gets a % of total cost and total time.
 * Percentages are realistic estimates for typical apartment renovation.
 * `applicableRepairTypes` controls which repair types include this stage.
 */
interface StageTemplate {
  title: string;
  description: string;
  checklist: string[];
  costPercent: number;   // % of total project cost
  timePercent: number;   // % of total project duration
  applicableRepairTypes: RepairType[]; // which repair types include this stage
}

const ALL_TYPES: RepairType[] = ['cosmetic', 'standard', 'premium', 'design'];
const NON_COSMETIC: RepairType[] = ['standard', 'premium', 'design'];

const STAGE_TEMPLATES: StageTemplate[] = [
  {
    title: 'Демонтаж',
    description: 'Снятие старых покрытий, демонтаж перегородок, вынос строительного мусора',
    checklist: [
      'Снятие обоев и старой краски',
      'Демонтаж старого пола',
      'Демонтаж сантехники',
      'Вынос строительного мусора',
    ],
    costPercent: 3,
    timePercent: 5,
    applicableRepairTypes: ALL_TYPES,
  },
  {
    title: 'Электрика (черновая)',
    description: 'Прокладка кабелей, установка подрозетников, электрощита',
    checklist: [
      'Разводка электропроводки',
      'Установка подрозетников',
      'Монтаж электрощита',
      'Прокладка слаботочных сетей',
    ],
    costPercent: 8,
    timePercent: 8,
    applicableRepairTypes: NON_COSMETIC, // Skip for cosmetic
  },
  {
    title: 'Сантехника (черновая)',
    description: 'Разводка труб водоснабжения и канализации',
    checklist: [
      'Разводка труб водоснабжения',
      'Прокладка канализации',
      'Установка коллекторов',
      'Гидроизоляция мокрых зон',
    ],
    costPercent: 7,
    timePercent: 7,
    applicableRepairTypes: NON_COSMETIC, // Skip for cosmetic
  },
  {
    title: 'Стяжка пола',
    description: 'Выравнивание основания пола, устройство стяжки',
    checklist: [
      'Подготовка основания',
      'Установка маяков',
      'Заливка стяжки',
      'Сушка и проверка уровня',
    ],
    costPercent: 8,
    timePercent: 8,
    applicableRepairTypes: NON_COSMETIC, // Skip for cosmetic
  },
  {
    title: 'Штукатурка стен',
    description: 'Выравнивание стен, штукатурка по маякам',
    checklist: [
      'Грунтовка стен',
      'Установка маяков',
      'Нанесение штукатурки',
      'Проверка плоскости',
    ],
    costPercent: 10,
    timePercent: 10,
    applicableRepairTypes: NON_COSMETIC, // Skip for cosmetic
  },
  {
    title: 'Укладка плитки',
    description: 'Облицовка стен и пола плиткой в мокрых зонах',
    checklist: [
      'Раскладка плитки',
      'Укладка на стены',
      'Укладка на пол',
      'Затирка швов',
    ],
    costPercent: 12,
    timePercent: 10,
    applicableRepairTypes: NON_COSMETIC, // Skip for cosmetic
  },
  {
    title: 'Электрика (чистовая)',
    description: 'Установка розеток, выключателей, светильников',
    checklist: [
      'Установка розеток',
      'Установка выключателей',
      'Монтаж светильников',
      'Проверка работоспособности',
    ],
    costPercent: 5,
    timePercent: 5,
    applicableRepairTypes: ALL_TYPES,
  },
  {
    title: 'Сантехника (чистовая)',
    description: 'Установка смесителей, унитаза, раковин, ванны/душа',
    checklist: [
      'Установка унитаза',
      'Установка раковин',
      'Монтаж смесителей',
      'Подключение ванны/душевой',
    ],
    costPercent: 5,
    timePercent: 5,
    applicableRepairTypes: ALL_TYPES,
  },
  {
    title: 'Шпаклёвка и покраска',
    description: 'Финишное выравнивание стен, покраска или поклейка обоев',
    checklist: [
      'Шпаклёвка стен',
      'Шлифовка поверхностей',
      'Грунтовка под финиш',
      'Покраска или поклейка обоев',
    ],
    costPercent: 12,
    timePercent: 12,
    applicableRepairTypes: ALL_TYPES,
  },
  {
    title: 'Напольное покрытие',
    description: 'Укладка ламината, паркета или линолеума',
    checklist: [
      'Подготовка основания',
      'Укладка подложки',
      'Монтаж покрытия',
      'Установка плинтусов',
    ],
    costPercent: 10,
    timePercent: 8,
    applicableRepairTypes: ALL_TYPES,
  },
  {
    title: 'Установка дверей',
    description: 'Монтаж межкомнатных и входной двери',
    checklist: [
      'Установка дверных коробок',
      'Навеска дверных полотен',
      'Монтаж наличников',
      'Установка фурнитуры',
    ],
    costPercent: 5,
    timePercent: 5,
    applicableRepairTypes: ALL_TYPES,
  },
  {
    title: 'Монтаж потолков',
    description: 'Установка натяжных или подвесных потолков',
    checklist: [
      'Разметка уровня',
      'Монтаж каркаса/профилей',
      'Установка полотна/панелей',
      'Врезка светильников',
    ],
    costPercent: 7,
    timePercent: 7,
    applicableRepairTypes: NON_COSMETIC, // Skip for cosmetic
  },
  {
    title: 'Чистовая отделка',
    description: 'Финальные работы: декор, молдинги, мелкие доработки',
    checklist: [
      'Установка карнизов',
      'Монтаж декоративных элементов',
      'Доводка мелочей',
      'Силиконирование стыков',
    ],
    costPercent: 6,
    timePercent: 8,
    applicableRepairTypes: ALL_TYPES,
  },
  {
    title: 'Финальная уборка',
    description: 'Генеральная уборка после ремонта',
    checklist: [
      'Уборка строительной пыли',
      'Мойка окон и зеркал',
      'Уборка всех поверхностей',
      'Вынос остатков мусора',
    ],
    costPercent: 2,
    timePercent: 2,
    applicableRepairTypes: ALL_TYPES,
  },
];

export interface StageBreakdownItem {
  orderIndex: number;
  title: string;
  description: string;
  checklist: string[];
  costMin: number;
  costMax: number;
  days: number;
}

/**
 * Calculate a detailed breakdown of renovation stages
 * filtered by repair type, with recalculated percentages.
 */
export function getStageBreakdown(
  repairType: RepairType,
  areaSqm: number,
): StageBreakdownItem[] {
  const totalCost = estimateCost(repairType, areaSqm);
  const totalDays = estimateTimelineDays(repairType, areaSqm);

  // Filter stages applicable to this repair type
  const applicable = STAGE_TEMPLATES.filter(
    (s) => s.applicableRepairTypes.includes(repairType),
  );

  // Recalculate percentages so they sum to 100%
  const totalCostPct = applicable.reduce((sum, s) => sum + s.costPercent, 0);
  const totalTimePct = applicable.reduce((sum, s) => sum + s.timePercent, 0);

  return applicable.map((stage, i) => ({
    orderIndex: i + 1,
    title: stage.title,
    description: stage.description,
    checklist: stage.checklist,
    costMin: Math.round((totalCost.min * stage.costPercent) / totalCostPct),
    costMax: Math.round((totalCost.max * stage.costPercent) / totalCostPct),
    days: Math.max(1, Math.round((totalDays * stage.timePercent) / totalTimePct)),
  }));
}

/**
 * Get count of applicable stages for a given repair type.
 */
export function getStageCount(repairType: RepairType): number {
  return STAGE_TEMPLATES.filter(
    (s) => s.applicableRepairTypes.includes(repairType),
  ).length;
}

/** Total number of standard renovation stages (all types) */
export const TOTAL_STAGES = STAGE_TEMPLATES.length;

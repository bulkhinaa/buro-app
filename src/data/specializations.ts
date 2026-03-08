// Master specializations — 16 professions grouped into 3 categories

export type SpecializationCategory = 'construction' | 'specialized' | 'service';

export interface Specialization {
  id: SpecializationId;
  label: string;
  icon: string; // Ionicons name
  category: SpecializationCategory;
}

export type SpecializationId =
  | 'demolition'
  | 'electrician'
  | 'plumber'
  | 'screed'
  | 'plasterer'
  | 'tiler'
  | 'flooring'
  | 'carpenter'
  | 'ceiling'
  | 'designer'
  | 'furniture'
  | 'hvac'
  | 'windows'
  | 'general'
  | 'waste'
  | 'cleaning';

export const SPECIALIZATION_CATEGORY_LABELS: Record<SpecializationCategory, string> = {
  construction: 'Строительные',
  specialized: 'Специализированные',
  service: 'Сервисные',
};

export const SPECIALIZATIONS: Specialization[] = [
  // Construction
  { id: 'demolition', label: 'Демонтажник', icon: 'hammer-outline', category: 'construction' },
  { id: 'electrician', label: 'Электрик', icon: 'flash-outline', category: 'construction' },
  { id: 'plumber', label: 'Сантехник', icon: 'water-outline', category: 'construction' },
  { id: 'screed', label: 'Стяжечник', icon: 'tablet-landscape-outline', category: 'construction' },
  { id: 'plasterer', label: 'Маляр-штукатур', icon: 'brush-outline', category: 'construction' },
  { id: 'tiler', label: 'Плиточник', icon: 'grid-outline', category: 'construction' },
  { id: 'flooring', label: 'Укладчик полов', icon: 'cube-outline', category: 'construction' },
  { id: 'carpenter', label: 'Столяр', icon: 'construct-outline', category: 'construction' },
  { id: 'ceiling', label: 'Монтажник потолков', icon: 'layers-outline', category: 'construction' },

  // Specialized
  { id: 'designer', label: 'Дизайнер интерьера', icon: 'color-palette-outline', category: 'specialized' },
  { id: 'furniture', label: 'Мебельщик', icon: 'bed-outline', category: 'specialized' },
  { id: 'hvac', label: 'Кондиционерщик', icon: 'thermometer-outline', category: 'specialized' },
  { id: 'windows', label: 'Оконщик', icon: 'albums-outline', category: 'specialized' },

  // Service
  { id: 'general', label: 'Разнорабочий', icon: 'body-outline', category: 'service' },
  { id: 'waste', label: 'Вывоз мусора', icon: 'trash-outline', category: 'service' },
  { id: 'cleaning', label: 'Клининг', icon: 'sparkles-outline', category: 'service' },
];

export const SPECIALIZATION_MAP: Record<SpecializationId, Specialization> =
  Object.fromEntries(SPECIALIZATIONS.map((s) => [s.id, s])) as Record<SpecializationId, Specialization>;

export function getSpecializationsByCategory(): { category: SpecializationCategory; label: string; items: Specialization[] }[] {
  const categories: SpecializationCategory[] = ['construction', 'specialized', 'service'];
  return categories.map((cat) => ({
    category: cat,
    label: SPECIALIZATION_CATEGORY_LABELS[cat],
    items: SPECIALIZATIONS.filter((s) => s.category === cat),
  }));
}

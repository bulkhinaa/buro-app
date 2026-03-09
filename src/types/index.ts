export type UserRole = 'client' | 'master' | 'supervisor' | 'admin';

export type SupportedLanguage = 'ru' | 'uz' | 'tg' | 'ky' | 'kk' | 'hy' | 'ro';

export interface User {
  id: string;
  phone: string;
  name: string;
  role: UserRole;
  city?: string;
  preferred_language?: SupportedLanguage;
  avatar_url?: string;
  created_at: string;
  is_active: boolean;
}

export interface MasterProfile extends User {
  role: 'master';
  specializations: string[];
  portfolio_urls: string[];
  rating: number;
  reviews_count: number;
  is_verified: boolean;
}

export interface Project {
  id: string;
  client_id: string;
  supervisor_id?: string;
  object_id?: string;
  title: string;
  address: string;
  area_sqm: number;
  repair_type: RepairType;
  scope?: RenovationScope[];
  budget_min?: number;
  budget_max?: number;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export type RepairType = 'cosmetic' | 'standard' | 'premium' | 'design';

export type ProjectStatus =
  | 'new'
  | 'planning'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface Stage {
  id: string;
  project_id: string;
  master_id?: string;
  template_id?: string;
  title: string;
  description?: string;
  order_index: number;
  status: StageStatus;
  deadline?: string;
  started_at?: string;
  completed_at?: string;
  approved_at?: string;
}

export type StageStatus =
  | 'pending'
  | 'in_progress'
  | 'done_by_master'
  | 'approved'
  | 'rejected';

export interface PhotoReport {
  id: string;
  stage_id: string;
  uploaded_by: string;
  url: string;
  comment?: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  project_id: string;
  sender_id: string;
  text?: string;
  image_url?: string;
  reply_to?: string;
  created_at: string;
}

export interface Review {
  id: string;
  project_id: string;
  master_id: string;
  client_id: string;
  rating: number;
  text?: string;
  photo_urls?: string[];
  created_at: string;
}

export interface StageTemplate {
  id: string;
  title: string;
  description: string;
  order_index: number;
  checklist: string[];
}

// --- Property Objects ---

export type PropertyType = 'apartment' | 'house' | 'commercial';

export type RenovationGoal = 'living' | 'rental' | 'sale' | 'new_build';

export type RoomCount = 0 | 1 | 2 | 3 | 4; // 0 = studio

export type BathroomConfig = 'combined_1' | 'separate_1' | 'separate_2';

export type KitchenType = 'separate' | 'open'; // open = kitchen-living (euro format)

export type RenovationScope =
  | 'full'        // Whole apartment
  | 'kitchen'     // Kitchen
  | 'bathroom'    // Bathroom
  | 'living_room' // Living room
  | 'bedroom'     // Bedroom
  | 'hallway'     // Hallway/corridor
  | 'balcony';    // Balcony/loggia

export interface PropertyObject {
  id: string;
  user_id: string;
  address: string;
  total_area: number;
  property_type: PropertyType;
  rooms: RoomCount;
  bathrooms: BathroomConfig;
  kitchen_type: KitchenType;
  renovation_goal: RenovationGoal;
  layout_id: string | null;
  custom_layout_url: string | null;
  created_at: string;
}

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  apartment: 'Квартира',
  house: 'Дом',
  commercial: 'Коммерция',
};

export const RENOVATION_GOAL_LABELS: Record<RenovationGoal, string> = {
  living: 'Для себя',
  rental: 'Для сдачи',
  sale: 'Для продажи',
  new_build: 'После покупки',
};

export const ROOM_COUNT_LABELS: Record<RoomCount, string> = {
  0: 'Студия',
  1: '1-комнатная',
  2: '2-комнатная',
  3: '3-комнатная',
  4: '4+ комнатная',
};

export const BATHROOM_LABELS: Record<BathroomConfig, string> = {
  combined_1: '1 совмещённый',
  separate_1: '1 раздельный',
  separate_2: '2 раздельных',
};

export const KITCHEN_TYPE_LABELS: Record<KitchenType, string> = {
  separate: 'Отдельная',
  open: 'Кухня-гостиная',
};

export const RENOVATION_SCOPE_LABELS: Record<RenovationScope, string> = {
  full: 'Вся квартира',
  kitchen: 'Кухня',
  bathroom: 'Санузел',
  living_room: 'Гостиная',
  bedroom: 'Спальня',
  hallway: 'Прихожая',
  balcony: 'Балкон',
};

export const REPAIR_TYPE_LABELS: Record<RepairType, string> = {
  cosmetic: 'Косметический',
  standard: 'Стандартный',
  premium: 'Капитальный',
  design: 'Дизайнерский',
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  new: 'Новый',
  planning: 'Планирование',
  in_progress: 'В работе',
  completed: 'Завершён',
  cancelled: 'Отменён',
};

export const STAGE_STATUS_LABELS: Record<StageStatus, string> = {
  pending: 'Ожидает',
  in_progress: 'В работе',
  done_by_master: 'На проверке',
  approved: 'Принят',
  rejected: 'Отклонён',
};

// --- Master Profile ---

import type { SpecializationId } from '../data/specializations';
export type { SpecializationId };

export type SkillLevel = 'beginner' | 'experienced' | 'expert';
export type ExperienceRange = 'less_1' | '1_3' | '3_5' | '5_10' | 'more_10';
export type VerificationStatus = 'none' | 'pending' | 'approved' | 'rejected';
export type PriceType = 'per_sqm' | 'fixed' | 'hourly';

export const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  beginner: 'Начинающий',
  experienced: 'Опытный',
  expert: 'Эксперт',
};

export const EXPERIENCE_RANGE_LABELS: Record<ExperienceRange, string> = {
  less_1: '< 1 года',
  '1_3': '1–3 года',
  '3_5': '3–5 лет',
  '5_10': '5–10 лет',
  more_10: '10+ лет',
};

export const PRICE_TYPE_LABELS: Record<PriceType, string> = {
  per_sqm: '₽/м²',
  fixed: 'Фикс',
  hourly: '₽/час',
};

export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  none: 'Не верифицирован',
  pending: 'На проверке',
  approved: 'Верифицирован',
  rejected: 'Отклонён',
};

export interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  photos: string[]; // URLs
  created_at: string;
}

export interface MasterPricing {
  specialization: SpecializationId;
  price: number;
  price_type: PriceType;
}

export interface MasterSetupData {
  // Step 1: Basic info
  name: string;
  city: string;
  phone: string;
  avatar_url: string | null;
  // Step 2: Specializations
  specializations: SpecializationId[];
  // Step 3: Experience
  experience: ExperienceRange;
  about: string;
  skill_level: SkillLevel;
  // Step 4: Portfolio
  portfolio: PortfolioProject[];
  // Step 5: Pricing
  pricing: MasterPricing[];
  // Step 6: Agreement
  certificates: string[]; // URLs
  agreed_to_terms: boolean;
}

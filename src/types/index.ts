export type UserRole = 'client' | 'master' | 'supervisor' | 'admin';

export interface User {
  id: string;
  phone: string;
  name: string;
  role: UserRole;
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
  title: string;
  address: string;
  area_sqm: number;
  repair_type: RepairType;
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
  created_at: string;
}

export interface Review {
  id: string;
  project_id: string;
  master_id: string;
  client_id: string;
  rating: number;
  text?: string;
  created_at: string;
}

export interface StageTemplate {
  id: string;
  title: string;
  description: string;
  order_index: number;
  checklist: string[];
}

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

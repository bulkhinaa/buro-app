import { create } from 'zustand';
import { Project, ProjectStatus, User, UserRole } from '../types';

// ---------- Lead type ----------

export interface Lead {
  id: string;
  name: string;
  phone: string;
  address?: string;
  area_sqm?: number;
  repair_type?: string;
  budget?: string;
  message?: string;
  status: 'new' | 'contacted' | 'converted' | 'rejected';
  created_at: string;
  converted_project_id?: string;
}

// ---------- Admin stats ----------

export interface AdminStats {
  totalProjects: number;
  newProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalMasters: number;
  totalSupervisors: number;
  totalClients: number;
  totalLeads: number;
}

// ---------- Filter types ----------

export type ProjectFilter = 'all' | 'new' | 'planning' | 'in_progress' | 'completed' | 'cancelled';
export type UserFilter = 'all' | 'client' | 'master' | 'supervisor' | 'admin';
export type LeadFilter = 'all' | 'new' | 'contacted' | 'converted' | 'rejected';

// ---------- Admin user with extra fields ----------

export interface AdminUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  role: UserRole;
  is_active: boolean;
  is_verified?: boolean;
  created_at: string;
  avatar_url?: string;
  specializations?: string[];
  rating?: number;
  reviews_count?: number;
}

// ---------- Store ----------

interface AdminState {
  // Projects
  projects: Project[];
  projectFilter: ProjectFilter;
  projectSearch: string;
  setProjects: (projects: Project[]) => void;
  setProjectFilter: (filter: ProjectFilter) => void;
  setProjectSearch: (search: string) => void;

  // Leads
  leads: Lead[];
  leadFilter: LeadFilter;
  setLeads: (leads: Lead[]) => void;
  setLeadFilter: (filter: LeadFilter) => void;

  // Users
  users: AdminUser[];
  userFilter: UserFilter;
  userSearch: string;
  setUsers: (users: AdminUser[]) => void;
  setUserFilter: (filter: UserFilter) => void;
  setUserSearch: (search: string) => void;

  // Stats
  stats: AdminStats;
  setStats: (stats: AdminStats) => void;

  // Filtered getters (computed via selectors)
}

// ---------- Mock data for dev users ----------

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'mock-p1',
    client_id: 'client-1',
    title: 'Ремонт ванной',
    address: 'ул. Гагарина, 22, кв. 7',
    area_sqm: 8,
    repair_type: 'standard',
    status: 'new',
    created_at: '2026-03-06T09:00:00Z',
    updated_at: '2026-03-06T09:00:00Z',
  },
  {
    id: 'mock-p2',
    client_id: 'client-2',
    title: 'Капремонт 3-комнатной',
    address: 'пр. Мира, 101, кв. 55',
    area_sqm: 78,
    repair_type: 'premium',
    status: 'new',
    created_at: '2026-03-05T14:00:00Z',
    updated_at: '2026-03-05T14:00:00Z',
  },
  {
    id: 'mock-p3',
    client_id: 'client-3',
    title: 'Косметический ремонт студии',
    address: 'ул. Лесная, 5, кв. 18',
    area_sqm: 34,
    repair_type: 'cosmetic',
    status: 'planning',
    supervisor_id: 'sv-1',
    created_at: '2026-03-04T11:00:00Z',
    updated_at: '2026-03-04T11:00:00Z',
  },
  {
    id: 'mock-p4',
    client_id: 'client-4',
    title: 'Дизайнерский ремонт',
    address: 'ул. Пушкина, 10, кв. 3',
    area_sqm: 95,
    repair_type: 'design',
    status: 'in_progress',
    supervisor_id: 'sv-2',
    created_at: '2026-03-08T10:00:00Z',
    updated_at: '2026-03-15T15:00:00Z',
  },
  {
    id: 'mock-p5',
    client_id: 'client-5',
    title: 'Стандартный ремонт',
    address: 'ул. Кирова, 33, кв. 12',
    area_sqm: 52,
    repair_type: 'standard',
    status: 'completed',
    supervisor_id: 'sv-1',
    created_at: '2026-03-01T08:00:00Z',
    updated_at: '2026-03-12T12:00:00Z',
  },
];

export const MOCK_LEADS: Lead[] = [
  {
    id: 'lead-1',
    name: 'Петрова Анна',
    phone: '+7 (916) 111-22-33',
    address: 'ул. Ленина, 15',
    area_sqm: 65,
    repair_type: 'standard',
    budget: '500 000 - 800 000 ₽',
    status: 'new',
    created_at: '2026-03-15T10:00:00Z',
  },
  {
    id: 'lead-2',
    name: 'Иванов Сергей',
    phone: '+7 (903) 444-55-66',
    address: 'пр. Победы, 42',
    area_sqm: 120,
    repair_type: 'premium',
    budget: '2 000 000 - 3 000 000 ₽',
    status: 'new',
    created_at: '2026-03-14T14:30:00Z',
  },
  {
    id: 'lead-3',
    name: 'Козлова Мария',
    phone: '+7 (925) 777-88-99',
    area_sqm: 45,
    repair_type: 'cosmetic',
    budget: '200 000 - 300 000 ₽',
    status: 'contacted',
    created_at: '2026-03-12T09:00:00Z',
  },
  {
    id: 'lead-4',
    name: 'Смирнов Дмитрий',
    phone: '+7 (926) 333-22-11',
    address: 'ул. Советская, 8',
    area_sqm: 80,
    repair_type: 'design',
    budget: '1 500 000 ₽',
    status: 'converted',
    converted_project_id: 'mock-p4',
    created_at: '2026-03-10T16:00:00Z',
  },
];

export const MOCK_USERS: AdminUser[] = [
  {
    id: 'user-c1',
    name: 'Сидоров Василий',
    phone: '+7 (916) 123-45-67',
    email: 'sidorov@mail.ru',
    city: 'Москва',
    role: 'client',
    is_active: true,
    created_at: '2026-03-05T10:00:00Z',
  },
  {
    id: 'user-c2',
    name: 'Козлова Ирина',
    phone: '+7 (903) 987-65-43',
    city: 'Москва',
    role: 'client',
    is_active: true,
    created_at: '2026-03-07T14:00:00Z',
  },
  {
    id: 'user-m1',
    name: 'Николаев Алексей',
    phone: '+7 (925) 111-22-33',
    city: 'Москва',
    role: 'master',
    is_active: true,
    is_verified: true,
    specializations: ['electrician', 'plumber'],
    rating: 4.8,
    reviews_count: 23,
    created_at: '2026-03-02T08:00:00Z',
  },
  {
    id: 'user-m2',
    name: 'Григорьев Павел',
    phone: '+7 (926) 444-55-66',
    city: 'Москва',
    role: 'master',
    is_active: true,
    is_verified: false,
    specializations: ['tiler', 'painter'],
    rating: 4.5,
    reviews_count: 12,
    created_at: '2026-03-09T09:00:00Z',
  },
  {
    id: 'user-m3',
    name: 'Борисов Иван',
    phone: '+7 (903) 222-33-44',
    city: 'Москва',
    role: 'master',
    is_active: false,
    is_verified: false,
    specializations: ['carpenter'],
    rating: 3.9,
    reviews_count: 5,
    created_at: '2026-03-11T11:00:00Z',
  },
  {
    id: 'user-sv1',
    name: 'Алексеев Пётр',
    phone: '+7 (916) 555-66-77',
    city: 'Москва',
    role: 'supervisor',
    is_active: true,
    created_at: '2026-03-03T10:00:00Z',
  },
  {
    id: 'user-sv2',
    name: 'Борисова Елена',
    phone: '+7 (903) 888-99-00',
    city: 'Москва',
    role: 'supervisor',
    is_active: true,
    created_at: '2026-03-06T12:00:00Z',
  },
  {
    id: 'user-a1',
    name: 'Бульхин Артём',
    phone: '+7 (999) 000-00-00',
    email: 'admin@buro.ru',
    city: 'Москва',
    role: 'admin',
    is_active: true,
    created_at: '2026-03-01T10:00:00Z',
  },
];

export const MOCK_STATS: AdminStats = {
  totalProjects: 5,
  newProjects: 2,
  activeProjects: 2,
  completedProjects: 1,
  totalMasters: 3,
  totalSupervisors: 2,
  totalClients: 2,
  totalLeads: 4,
};

// ---------- Zustand store ----------

export const useAdminStore = create<AdminState>((set) => ({
  // Projects
  projects: [],
  projectFilter: 'all',
  projectSearch: '',
  setProjects: (projects) => set({ projects }),
  setProjectFilter: (projectFilter) => set({ projectFilter }),
  setProjectSearch: (projectSearch) => set({ projectSearch }),

  // Leads
  leads: [],
  leadFilter: 'all',
  setLeads: (leads) => set({ leads }),
  setLeadFilter: (leadFilter) => set({ leadFilter }),

  // Users
  users: [],
  userFilter: 'all',
  userSearch: '',
  setUsers: (users) => set({ users }),
  setUserFilter: (userFilter) => set({ userFilter }),
  setUserSearch: (userSearch) => set({ userSearch }),

  // Stats
  stats: MOCK_STATS,
  setStats: (stats) => set({ stats }),
}));

// ---------- Selectors ----------

export const selectFilteredProjects = (state: AdminState): Project[] => {
  let filtered = state.projects;
  if (state.projectFilter !== 'all') {
    filtered = filtered.filter((p) => p.status === state.projectFilter);
  }
  if (state.projectSearch.trim()) {
    const q = state.projectSearch.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q),
    );
  }
  return filtered;
};

export const selectFilteredLeads = (state: AdminState): Lead[] => {
  let filtered = state.leads;
  if (state.leadFilter !== 'all') {
    filtered = filtered.filter((l) => l.status === state.leadFilter);
  }
  return filtered;
};

export const selectFilteredUsers = (state: AdminState): AdminUser[] => {
  let filtered = state.users;
  if (state.userFilter !== 'all') {
    filtered = filtered.filter((u) => u.role === state.userFilter);
  }
  if (state.userSearch.trim()) {
    const q = state.userSearch.toLowerCase();
    filtered = filtered.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.phone.includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)),
    );
  }
  return filtered;
};

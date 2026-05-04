import { create } from 'zustand';
import { Project, ProjectStatus, User, UserRole } from '../types';
import { supabase } from '../lib/supabase';

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

/** Raw row shape from Supabase join: profiles LEFT JOIN master_profiles */
interface ProfileWithMasterJoin {
  id: string;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  role: string;
  is_active: boolean;
  is_verified?: boolean;
  created_at: string;
  avatar_url?: string;
  master_profiles: {
    specializations?: string[];
    rating?: number;
    reviews_count?: number;
    is_verified?: boolean;
  } | null;
}

// ---------- Empty defaults ----------

const EMPTY_STATS: AdminStats = {
  totalProjects: 0,
  newProjects: 0,
  activeProjects: 0,
  completedProjects: 0,
  totalMasters: 0,
  totalSupervisors: 0,
  totalClients: 0,
  totalLeads: 0,
};

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

  // Loading
  isLoading: boolean;

  // Async data fetchers (real Supabase queries)
  fetchAll: () => Promise<void>;
  fetchStats: () => Promise<AdminStats>;
  fetchProjects: () => Promise<Project[]>;
  fetchLeads: () => Promise<Lead[]>;
  fetchUsers: () => Promise<AdminUser[]>;
}

// ---------- Zustand store ----------

export const useAdminStore = create<AdminState>((set, get) => ({
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
  stats: EMPTY_STATS,
  setStats: (stats) => set({ stats }),

  // Loading
  isLoading: false,

  // Fetch all admin data in parallel
  fetchAll: async () => {
    set({ isLoading: true });
    try {
      const [stats, projects, leads, users] = await Promise.all([
        get().fetchStats(),
        get().fetchProjects(),
        get().fetchLeads(),
        get().fetchUsers(),
      ]);
      set({ stats, projects, leads, users, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  // Fetch stats from Supabase using count queries
  fetchStats: async () => {
    try {
      const [
        projectsRes,
        newProjectsRes,
        activeProjectsRes,
        completedProjectsRes,
        mastersRes,
        supervisorsRes,
        clientsRes,
        leadsRes,
      ] = await Promise.all([
        supabase.from('projects').select('id', { count: 'exact', head: true }),
        supabase.from('projects').select('id', { count: 'exact', head: true }).eq('status', 'new'),
        supabase.from('projects').select('id', { count: 'exact', head: true }).in('status', ['planning', 'in_progress']),
        supabase.from('projects').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'master'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'supervisor'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'client'),
        supabase.from('leads').select('id', { count: 'exact', head: true }),
      ]);

      return {
        totalProjects: projectsRes.count ?? 0,
        newProjects: newProjectsRes.count ?? 0,
        activeProjects: activeProjectsRes.count ?? 0,
        completedProjects: completedProjectsRes.count ?? 0,
        totalMasters: mastersRes.count ?? 0,
        totalSupervisors: supervisorsRes.count ?? 0,
        totalClients: clientsRes.count ?? 0,
        totalLeads: leadsRes.count ?? 0,
      };
    } catch {
      return EMPTY_STATS;
    }
  },

  // Fetch projects from Supabase
  fetchProjects: async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as Project[]) || [];
    } catch {
      return [];
    }
  },

  // Fetch leads from Supabase
  fetchLeads: async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as Lead[]) || [];
    } catch {
      return [];
    }
  },

  // Fetch users (profiles) from Supabase with master profile data
  fetchUsers: async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, master_profiles(specializations, rating, reviews_count, is_verified)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Flatten nested master_profiles into AdminUser shape
      const users: AdminUser[] = (data as ProfileWithMasterJoin[] ?? []).map((row) => {
        const mp = row.master_profiles;
        return {
          id: row.id,
          name: row.name,
          phone: row.phone,
          email: row.email,
          city: row.city,
          role: row.role as UserRole,
          is_active: row.is_active,
          is_verified: mp?.is_verified ?? row.is_verified,
          created_at: row.created_at,
          avatar_url: row.avatar_url,
          specializations: mp?.specializations ?? undefined,
          rating: mp?.rating ?? undefined,
          reviews_count: mp?.reviews_count ?? undefined,
        };
      });

      return users;
    } catch {
      return [];
    }
  },
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

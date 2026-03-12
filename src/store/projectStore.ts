import { create } from 'zustand';
import { Project, Stage, RepairType, RenovationScope } from '../types';
import {
  fetchClientProjects,
  fetchProjectStages,
  createProject as createProjectService,
  generateStagesForProject,
} from '../services/projectService';
import { estimateScopedCost } from '../utils/calculator';
import { useAuthStore } from './authStore';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  stages: Stage[];
  isLoading: boolean;
  error: string | null;

  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  setStages: (stages: Stage[]) => void;
  setLoading: (loading: boolean) => void;

  loadProjects: (clientId: string) => Promise<void>;
  loadStages: (projectId: string) => Promise<void>;
  submitProject: (params: {
    clientId: string;
    title: string;
    address: string;
    areaSqm: number;
    repairType: RepairType;
    objectId?: string;
    scope?: RenovationScope[];
  }) => Promise<Project>;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  currentProject: null,
  stages: [],
  isLoading: false,
  error: null,

  setProjects: (projects) => set({ projects }),
  setCurrentProject: (currentProject) => set({ currentProject }),
  setStages: (stages) => set({ stages }),
  setLoading: (isLoading) => set({ isLoading }),

  loadProjects: async (clientId) => {
    set({ isLoading: true, error: null });
    try {
      // Dev users — keep local projects, skip Supabase
      if (clientId.startsWith('dev-')) {
        set({ isLoading: false });
        return;
      }
      const projects = await fetchClientProjects(clientId);
      set({ projects, isLoading: false });
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
    }
  },

  loadStages: async (projectId) => {
    set({ isLoading: true, error: null });
    try {
      // Dev users — skip Supabase, keep local stages
      const userId = useAuthStore.getState().user?.id;
      if (userId?.startsWith('dev-')) {
        set({ isLoading: false });
        return;
      }
      const stages = await fetchProjectStages(projectId);
      set({ stages, isLoading: false });
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
    }
  },

  submitProject: async ({ clientId, title, address, areaSqm, repairType, objectId, scope }) => {
    set({ isLoading: true, error: null });
    try {
      const { min, max } = estimateScopedCost(repairType, areaSqm, scope || []);

      // Dev users — create locally without Supabase
      if (clientId.startsWith('dev-')) {
        const localProject: Project = {
          id: `proj-${Date.now()}`,
          client_id: clientId,
          title,
          address,
          area_sqm: areaSqm,
          repair_type: repairType,
          scope: scope || undefined,
          budget_min: min,
          budget_max: max,
          object_id: objectId || undefined,
          status: 'new',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const state = useProjectStore.getState();
        set({
          projects: [localProject, ...state.projects],
          isLoading: false,
        });
        return localProject;
      }

      const project = await createProjectService({
        clientId,
        title,
        address,
        areaSqm,
        repairType,
        budgetMin: min,
        budgetMax: max,
        objectId,
        scope: scope || undefined,
      });

      await generateStagesForProject(project.id, repairType, areaSqm);

      const projects = await fetchClientProjects(clientId);
      set({ projects, isLoading: false });
      return project;
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
      throw e;
    }
  },
}));

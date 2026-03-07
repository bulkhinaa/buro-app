import { create } from 'zustand';
import { Project, Stage, RepairType } from '../types';
import {
  fetchClientProjects,
  fetchProjectStages,
  createProject as createProjectService,
  generateStagesForProject,
} from '../services/projectService';
import { estimateCost } from '../utils/calculator';

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
      const projects = await fetchClientProjects(clientId);
      set({ projects, isLoading: false });
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
    }
  },

  loadStages: async (projectId) => {
    set({ isLoading: true, error: null });
    try {
      const stages = await fetchProjectStages(projectId);
      set({ stages, isLoading: false });
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
    }
  },

  submitProject: async ({ clientId, title, address, areaSqm, repairType }) => {
    set({ isLoading: true, error: null });
    try {
      const { min, max } = estimateCost(repairType, areaSqm);
      const project = await createProjectService({
        clientId,
        title,
        address,
        areaSqm,
        repairType,
        budgetMin: min,
        budgetMax: max,
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

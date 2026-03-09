import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stage, StageStatus, PhotoReport } from '../types';
import { fetchMasterStages, updateStageStatus as updateStageStatusApi } from '../services/projectService';
import { supabase } from '../lib/supabase';

// Extended task item with project context
export interface TaskItem extends Stage {
  projectTitle: string;
  address: string;
  rejection_reason?: string;
}

// Local photo (before upload to Supabase Storage)
export interface LocalPhoto {
  uri: string;
  stageId: string;
}

const TASKS_KEY = 'master_tasks';
const PHOTOS_KEY = 'master_photo_reports';

// Default mock tasks for dev users
const DEV_MOCK_TASKS: TaskItem[] = [
  {
    id: 'mt-1',
    project_id: 'proj-1',
    master_id: 'dev-master',
    title: 'Штукатурка стен',
    order_index: 4,
    status: 'in_progress',
    started_at: '2025-02-05',
    deadline: '2025-02-15',
    projectTitle: 'Ремонт квартиры на Ленина 15',
    address: 'ул. Ленина, 15, кв. 42',
  },
  {
    id: 'mt-2',
    project_id: 'proj-2',
    master_id: 'dev-master',
    title: 'Укладка плитки в ванной',
    order_index: 6,
    status: 'pending',
    deadline: '2025-02-25',
    projectTitle: 'Ремонт студии на Пушкина 8',
    address: 'ул. Пушкина, 8, кв. 12',
  },
  {
    id: 'mt-3',
    project_id: 'proj-1',
    master_id: 'dev-master',
    title: 'Электрика (чистовая)',
    order_index: 7,
    status: 'pending',
    deadline: '2025-03-01',
    projectTitle: 'Ремонт квартиры на Ленина 15',
    address: 'ул. Ленина, 15, кв. 42',
  },
];

interface TaskState {
  tasks: TaskItem[];
  photoReports: Record<string, LocalPhoto[]>; // stageId → photos
  isLoading: boolean;

  // Actions
  loadTasks: (userId: string) => Promise<void>;
  updateStatus: (stageId: string, status: StageStatus) => Promise<void>;
  addPhoto: (stageId: string, uri: string) => void;
  removePhoto: (stageId: string, uri: string) => void;
  getPhotos: (stageId: string) => LocalPhoto[];
  clearPhotos: (stageId: string) => void;
  uploadPhotos: (stageId: string, userId: string, comment?: string) => Promise<string[]>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  photoReports: {},
  isLoading: false,

  loadTasks: async (userId: string) => {
    set({ isLoading: true });

    const isDev = userId.startsWith('dev-');

    if (isDev) {
      // Dev user — load from AsyncStorage or use defaults
      try {
        const stored = await AsyncStorage.getItem(TASKS_KEY);
        if (stored) {
          set({ tasks: JSON.parse(stored), isLoading: false });
        } else {
          await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(DEV_MOCK_TASKS));
          set({ tasks: DEV_MOCK_TASKS, isLoading: false });
        }
      } catch {
        set({ tasks: DEV_MOCK_TASKS, isLoading: false });
      }
    } else {
      // Real user — fetch from Supabase
      try {
        const stages = await fetchMasterStages(userId);
        const taskItems: TaskItem[] = stages.map((s) => ({
          ...s,
          // TODO: join with project table for title/address
          projectTitle: '',
          address: '',
        }));
        set({ tasks: taskItems, isLoading: false });
      } catch {
        // Fallback to stored tasks
        try {
          const stored = await AsyncStorage.getItem(TASKS_KEY);
          set({ tasks: stored ? JSON.parse(stored) : [], isLoading: false });
        } catch {
          set({ tasks: [], isLoading: false });
        }
      }
    }

    // Load photo reports from local storage
    try {
      const storedPhotos = await AsyncStorage.getItem(PHOTOS_KEY);
      if (storedPhotos) {
        set({ photoReports: JSON.parse(storedPhotos) });
      }
    } catch {
      // Ignore
    }
  },

  updateStatus: async (stageId: string, status: StageStatus) => {
    const { tasks } = get();
    const task = tasks.find((t) => t.id === stageId);
    if (!task) return;

    // Update locally first (optimistic)
    const now = new Date().toISOString();
    const updates: Partial<TaskItem> = { status };
    if (status === 'in_progress') updates.started_at = now;
    if (status === 'done_by_master') updates.completed_at = now;
    if (status === 'approved') updates.approved_at = now;

    const updatedTasks = tasks.map((t) =>
      t.id === stageId ? { ...t, ...updates } : t,
    );
    set({ tasks: updatedTasks });

    // Persist locally
    try {
      await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(updatedTasks));
    } catch {
      // Ignore
    }

    // Try to update in Supabase (non-blocking for dev users)
    try {
      await updateStageStatusApi(stageId, status);
    } catch {
      // Dev mode fallback — already updated locally
    }
  },

  addPhoto: (stageId: string, uri: string) => {
    const { photoReports } = get();
    const existing = photoReports[stageId] || [];
    const updated = {
      ...photoReports,
      [stageId]: [...existing, { uri, stageId }],
    };
    set({ photoReports: updated });
    AsyncStorage.setItem(PHOTOS_KEY, JSON.stringify(updated)).catch(() => {});
  },

  removePhoto: (stageId: string, uri: string) => {
    const { photoReports } = get();
    const existing = photoReports[stageId] || [];
    const updated = {
      ...photoReports,
      [stageId]: existing.filter((p) => p.uri !== uri),
    };
    set({ photoReports: updated });
    AsyncStorage.setItem(PHOTOS_KEY, JSON.stringify(updated)).catch(() => {});
  },

  getPhotos: (stageId: string) => {
    return get().photoReports[stageId] || [];
  },

  clearPhotos: (stageId: string) => {
    const { photoReports } = get();
    const { [stageId]: _, ...rest } = photoReports;
    set({ photoReports: rest });
    AsyncStorage.setItem(PHOTOS_KEY, JSON.stringify(rest)).catch(() => {});
  },

  uploadPhotos: async (stageId: string, userId: string, comment?: string): Promise<string[]> => {
    const isDev = userId.startsWith('dev-');
    const photos = get().getPhotos(stageId);
    if (photos.length === 0) return [];

    // Dev users — keep local URIs
    if (isDev) return photos.map((p) => p.uri);

    const uploadedUrls: string[] = [];

    for (const photo of photos) {
      try {
        const fileName = `${stageId}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.jpg`;
        const response = await fetch(photo.uri);
        const blob = await response.blob();

        const { error: uploadError } = await supabase.storage
          .from('photo-reports')
          .upload(fileName, blob, { contentType: 'image/jpeg' });

        if (uploadError) {
          console.warn('Photo upload error:', uploadError.message);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('photo-reports')
          .getPublicUrl(fileName);

        const publicUrl = urlData.publicUrl;
        uploadedUrls.push(publicUrl);

        // Insert into photo_reports table
        await supabase.from('photo_reports').insert({
          stage_id: stageId,
          uploaded_by: userId,
          url: publicUrl,
          comment: comment || null,
        });
      } catch (err) {
        console.warn('Photo upload failed:', err);
      }
    }

    return uploadedUrls;
  },
}));

import { create } from 'zustand';

export type ToastType = 'error' | 'success' | 'info' | 'warning';

interface ToastMessage {
  id: string;
  text: string;
  type: ToastType;
  duration: number;
}

interface ToastState {
  toast: ToastMessage | null;
  show: (text: string, type?: ToastType, duration?: number) => void;
  hide: () => void;
}

let counter = 0;

export const useToastStore = create<ToastState>((set) => ({
  toast: null,

  show: (text, type = 'error', duration = 3000) => {
    counter += 1;
    set({
      toast: { id: String(counter), text, type, duration },
    });
  },

  hide: () => set({ toast: null }),
}));

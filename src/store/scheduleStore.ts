import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ScheduleSlot, ScheduleTemplate, MasterVacation, ScheduleSlotStatus } from '../types';
import { supabase } from '../lib/supabase';

const SCHEDULE_KEY = 'master_schedule_data';
const TEMPLATE_KEY = 'master_schedule_template';
const VACATIONS_KEY = 'master_vacations';

// Hours range: 8:00 - 23:00
export const SCHEDULE_HOURS = Array.from({ length: 16 }, (_, i) => i + 8);
// Days: Mon-Sun (0-6)
export const SCHEDULE_DAYS = [0, 1, 2, 3, 4, 5, 6] as const;

export const DAY_LABELS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
export const DAY_LABELS_FULL = [
  'Понедельник', 'Вторник', 'Среда', 'Четверг',
  'Пятница', 'Суббота', 'Воскресенье',
];

/** Get Monday of the week containing the given date */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon...
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Format date as YYYY-MM-DD */
export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Get array of 7 dates for a week starting from Monday */
export function getWeekDates(mondayDate: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mondayDate);
    d.setDate(d.getDate() + i);
    return d;
  });
}

interface ScheduleState {
  slots: ScheduleSlot[];
  template: ScheduleTemplate[];
  vacations: MasterVacation[];
  isLoading: boolean;

  // Actions
  init: (masterId: string) => Promise<void>;
  fetchWeek: (masterId: string, weekStart: Date) => Promise<void>;
  toggleSlot: (masterId: string, date: string, hour: number) => Promise<void>;
  batchToggleSlots: (masterId: string, slots: { date: string; hour: number }[], status: ScheduleSlotStatus) => Promise<void>;

  // Templates
  fetchTemplate: (masterId: string) => Promise<void>;
  saveTemplate: (masterId: string, workingSlots: { day: number; hour: number }[]) => Promise<void>;
  applyTemplate: (masterId: string, fromDate: Date) => Promise<void>;

  // Vacations
  fetchVacations: (masterId: string) => Promise<void>;
  addVacation: (masterId: string, dateFrom: string, dateTo: string, reason?: string) => Promise<MasterVacation | null>;
  removeVacation: (masterId: string, vacationId: string) => Promise<void>;

  // Computed
  getOccupancy: (weekStart: Date) => { working: number; total: number; percent: number };
}

const isDevUser = (id: string) => id.startsWith('dev-');

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  slots: [],
  template: [],
  vacations: [],
  isLoading: false,

  init: async (masterId: string) => {
    const { fetchTemplate, fetchVacations } = get();
    await Promise.all([
      fetchTemplate(masterId),
      fetchVacations(masterId),
    ]);
  },

  fetchWeek: async (masterId: string, weekStart: Date) => {
    set({ isLoading: true });
    const dates = getWeekDates(weekStart);
    const dateFrom = formatDate(dates[0]);
    const dateTo = formatDate(dates[6]);

    if (isDevUser(masterId)) {
      // Dev user: load from AsyncStorage
      try {
        const raw = await AsyncStorage.getItem(SCHEDULE_KEY);
        const allSlots: ScheduleSlot[] = raw ? JSON.parse(raw) : [];
        const weekSlots = allSlots.filter(
          (s) => s.master_id === masterId && s.date >= dateFrom && s.date <= dateTo
        );
        set({ slots: weekSlots, isLoading: false });
      } catch {
        set({ isLoading: false });
      }
      return;
    }

    try {
      const { data, error } = await supabase
        .from('master_schedule')
        .select('*')
        .eq('master_id', masterId)
        .gte('date', dateFrom)
        .lte('date', dateTo);

      if (error) throw error;
      set({ slots: (data as ScheduleSlot[]) || [], isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  toggleSlot: async (masterId: string, date: string, hour: number) => {
    const { slots } = get();
    const existing = slots.find((s) => s.date === date && s.hour === hour && s.master_id === masterId);

    // Can't toggle booked slots
    if (existing?.status === 'booked') return;

    const newStatus: ScheduleSlotStatus = existing?.status === 'working' ? 'available' : 'working';

    if (isDevUser(masterId)) {
      const updatedSlots = existing
        ? slots.map((s) =>
            s.date === date && s.hour === hour && s.master_id === masterId
              ? { ...s, status: newStatus }
              : s
          )
        : [...slots, {
            id: `${masterId}-${date}-${hour}`,
            master_id: masterId,
            date,
            hour,
            status: newStatus,
          }];
      set({ slots: updatedSlots });
      // Persist all dev user slots
      try {
        const raw = await AsyncStorage.getItem(SCHEDULE_KEY);
        const allSlots: ScheduleSlot[] = raw ? JSON.parse(raw) : [];
        const otherSlots = allSlots.filter(
          (s) => !(s.master_id === masterId && s.date === date && s.hour === hour)
        );
        if (newStatus !== 'available') {
          otherSlots.push({
            id: `${masterId}-${date}-${hour}`,
            master_id: masterId,
            date,
            hour,
            status: newStatus,
          });
        }
        await AsyncStorage.setItem(SCHEDULE_KEY, JSON.stringify(otherSlots));
      } catch { /* ignore */ }
      return;
    }

    try {
      if (existing) {
        if (newStatus === 'available') {
          await supabase
            .from('master_schedule')
            .delete()
            .eq('master_id', masterId)
            .eq('date', date)
            .eq('hour', hour);
          set({ slots: slots.filter((s) => !(s.date === date && s.hour === hour && s.master_id === masterId)) });
        } else {
          await supabase
            .from('master_schedule')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('master_id', masterId)
            .eq('date', date)
            .eq('hour', hour);
          set({
            slots: slots.map((s) =>
              s.date === date && s.hour === hour && s.master_id === masterId
                ? { ...s, status: newStatus }
                : s
            ),
          });
        }
      } else {
        const { data } = await supabase
          .from('master_schedule')
          .insert({ master_id: masterId, date, hour, status: newStatus })
          .select()
          .single();
        if (data) set({ slots: [...slots, data as ScheduleSlot] });
      }
    } catch { /* ignore */ }
  },

  batchToggleSlots: async (masterId, slotsToToggle, status) => {
    const { slots } = get();

    if (isDevUser(masterId)) {
      let updatedSlots = [...slots];
      for (const { date, hour } of slotsToToggle) {
        const idx = updatedSlots.findIndex(
          (s) => s.date === date && s.hour === hour && s.master_id === masterId
        );
        if (idx >= 0) {
          if (updatedSlots[idx].status === 'booked') continue;
          updatedSlots[idx] = { ...updatedSlots[idx], status };
        } else if (status !== 'available') {
          updatedSlots.push({
            id: `${masterId}-${date}-${hour}`,
            master_id: masterId,
            date,
            hour,
            status,
          });
        }
      }
      // Remove 'available' entries (default state)
      updatedSlots = updatedSlots.filter((s) => s.status !== 'available');
      set({ slots: updatedSlots });
      try {
        const raw = await AsyncStorage.getItem(SCHEDULE_KEY);
        const allSlots: ScheduleSlot[] = raw ? JSON.parse(raw) : [];
        const otherUserSlots = allSlots.filter((s) => s.master_id !== masterId);
        await AsyncStorage.setItem(SCHEDULE_KEY, JSON.stringify([...otherUserSlots, ...updatedSlots]));
      } catch { /* ignore */ }
      return;
    }

    // Supabase batch upsert
    try {
      const rows = slotsToToggle.map(({ date, hour }) => ({
        master_id: masterId,
        date,
        hour,
        status,
      }));
      if (status === 'available') {
        // Delete these slots
        for (const { date, hour } of slotsToToggle) {
          await supabase
            .from('master_schedule')
            .delete()
            .eq('master_id', masterId)
            .eq('date', date)
            .eq('hour', hour);
        }
      } else {
        await supabase.from('master_schedule').upsert(rows, {
          onConflict: 'master_id,date,hour',
        });
      }
      // Refresh
      const weekStart = getWeekStart(new Date(slotsToToggle[0].date));
      await get().fetchWeek(masterId, weekStart);
    } catch { /* ignore */ }
  },

  fetchTemplate: async (masterId: string) => {
    if (isDevUser(masterId)) {
      try {
        const raw = await AsyncStorage.getItem(TEMPLATE_KEY);
        const all: ScheduleTemplate[] = raw ? JSON.parse(raw) : [];
        set({ template: all.filter((t) => t.master_id === masterId) });
      } catch { /* ignore */ }
      return;
    }

    try {
      const { data } = await supabase
        .from('master_schedule_templates')
        .select('*')
        .eq('master_id', masterId);
      set({ template: (data as ScheduleTemplate[]) || [] });
    } catch { /* ignore */ }
  },

  saveTemplate: async (masterId: string, workingSlots: { day: number; hour: number }[]) => {
    if (isDevUser(masterId)) {
      const entries: ScheduleTemplate[] = workingSlots.map(({ day, hour }) => ({
        id: `tmpl-${masterId}-${day}-${hour}`,
        master_id: masterId,
        day_of_week: day,
        hour,
        is_working: true,
      }));
      set({ template: entries });
      try {
        const raw = await AsyncStorage.getItem(TEMPLATE_KEY);
        const all: ScheduleTemplate[] = raw ? JSON.parse(raw) : [];
        const others = all.filter((t) => t.master_id !== masterId);
        await AsyncStorage.setItem(TEMPLATE_KEY, JSON.stringify([...others, ...entries]));
      } catch { /* ignore */ }
      return;
    }

    try {
      // Delete old template
      await supabase
        .from('master_schedule_templates')
        .delete()
        .eq('master_id', masterId);

      // Insert new
      const rows = workingSlots.map(({ day, hour }) => ({
        master_id: masterId,
        day_of_week: day,
        hour,
        is_working: true,
      }));
      if (rows.length > 0) {
        await supabase.from('master_schedule_templates').insert(rows);
      }

      await get().fetchTemplate(masterId);
    } catch { /* ignore */ }
  },

  applyTemplate: async (masterId: string, fromDate: Date) => {
    const { template, fetchWeek } = get();
    if (template.length === 0) return;

    // Apply template for 4 weeks starting from fromDate
    const monday = getWeekStart(fromDate);
    const slotsToInsert: { date: string; hour: number }[] = [];

    for (let week = 0; week < 4; week++) {
      const weekDates = getWeekDates(new Date(monday.getTime() + week * 7 * 24 * 60 * 60 * 1000));
      for (const tmpl of template) {
        const date = formatDate(weekDates[tmpl.day_of_week]);
        slotsToInsert.push({ date, hour: tmpl.hour });
      }
    }

    await get().batchToggleSlots(masterId, slotsToInsert, 'working');
    await fetchWeek(masterId, monday);
  },

  fetchVacations: async (masterId: string) => {
    if (isDevUser(masterId)) {
      try {
        const raw = await AsyncStorage.getItem(VACATIONS_KEY);
        const all: MasterVacation[] = raw ? JSON.parse(raw) : [];
        set({ vacations: all.filter((v) => v.master_id === masterId) });
      } catch { /* ignore */ }
      return;
    }

    try {
      const { data } = await supabase
        .from('master_vacations')
        .select('*')
        .eq('master_id', masterId)
        .order('date_from', { ascending: true });
      set({ vacations: (data as MasterVacation[]) || [] });
    } catch { /* ignore */ }
  },

  addVacation: async (masterId: string, dateFrom: string, dateTo: string, reason?: string) => {
    const vacation: MasterVacation = {
      id: `vac-${Date.now()}`,
      master_id: masterId,
      date_from: dateFrom,
      date_to: dateTo,
      reason,
      created_at: new Date().toISOString(),
    };

    if (isDevUser(masterId)) {
      const { vacations } = get();
      const updated = [...vacations, vacation];
      set({ vacations: updated });
      try {
        const raw = await AsyncStorage.getItem(VACATIONS_KEY);
        const all: MasterVacation[] = raw ? JSON.parse(raw) : [];
        await AsyncStorage.setItem(VACATIONS_KEY, JSON.stringify([...all, vacation]));
      } catch { /* ignore */ }
      return vacation;
    }

    try {
      const { data, error } = await supabase
        .from('master_vacations')
        .insert({ master_id: masterId, date_from: dateFrom, date_to: dateTo, reason })
        .select()
        .single();
      if (error) throw error;
      const { vacations } = get();
      set({ vacations: [...vacations, data as MasterVacation] });
      return data as MasterVacation;
    } catch {
      return null;
    }
  },

  removeVacation: async (masterId: string, vacationId: string) => {
    const { vacations } = get();
    set({ vacations: vacations.filter((v) => v.id !== vacationId) });

    if (isDevUser(masterId)) {
      try {
        const raw = await AsyncStorage.getItem(VACATIONS_KEY);
        const all: MasterVacation[] = raw ? JSON.parse(raw) : [];
        await AsyncStorage.setItem(
          VACATIONS_KEY,
          JSON.stringify(all.filter((v) => v.id !== vacationId))
        );
      } catch { /* ignore */ }
      return;
    }

    try {
      await supabase.from('master_vacations').delete().eq('id', vacationId);
    } catch { /* ignore */ }
  },

  getOccupancy: (weekStart: Date) => {
    const { slots } = get();
    const dates = getWeekDates(weekStart);
    const dateStrings = dates.map(formatDate);

    const weekSlots = slots.filter((s) => dateStrings.includes(s.date));
    const working = weekSlots.filter((s) => s.status === 'working' || s.status === 'booked').length;
    const total = SCHEDULE_HOURS.length * 7; // 112

    return {
      working,
      total,
      percent: total > 0 ? Math.round((working / total) * 100) : 0,
    };
  },
}));

import { create } from 'zustand';
import {
  PropertyObject,
  PropertyType,
  RoomCount,
  BathroomConfig,
  KitchenType,
  RenovationGoal,
} from '../types';
import {
  createObject as createObjectService,
  fetchUserObjects,
  deleteObject as deleteObjectService,
} from '../services/projectService';

interface ObjectState {
  objects: PropertyObject[];
  currentObject: PropertyObject | null;
  isLoading: boolean;
  error: string | null;

  setObjects: (objects: PropertyObject[]) => void;
  setCurrentObject: (object: PropertyObject | null) => void;

  loadObjects: (userId: string) => Promise<void>;
  addObject: (params: {
    userId: string;
    address: string;
    totalArea: number;
    propertyType: PropertyType;
    rooms: RoomCount;
    bathrooms: BathroomConfig;
    kitchenType: KitchenType;
    renovationGoal: RenovationGoal;
    layoutId: string | null;
    customLayoutUrl: string | null;
  }) => Promise<PropertyObject>;
  removeObject: (objectId: string) => Promise<void>;
}

export const useObjectStore = create<ObjectState>((set) => ({
  objects: [],
  currentObject: null,
  isLoading: false,
  error: null,

  setObjects: (objects) => set({ objects }),
  setCurrentObject: (currentObject) => set({ currentObject }),

  loadObjects: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      // Dev users — use local mock data
      if (userId.startsWith('dev-')) {
        set({ isLoading: false });
        return;
      }
      const objects = await fetchUserObjects(userId);
      set({ objects, isLoading: false });
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
    }
  },

  addObject: async (params) => {
    set({ isLoading: true, error: null });
    try {
      // Dev users — create locally
      if (params.userId.startsWith('dev-')) {
        const localObject: PropertyObject = {
          id: `obj-${Date.now()}`,
          user_id: params.userId,
          address: params.address,
          total_area: params.totalArea,
          property_type: params.propertyType,
          rooms: params.rooms,
          bathrooms: params.bathrooms,
          kitchen_type: params.kitchenType,
          renovation_goal: params.renovationGoal,
          layout_id: params.layoutId,
          custom_layout_url: params.customLayoutUrl,
          created_at: new Date().toISOString(),
        };

        const state = useObjectStore.getState();
        set({
          objects: [localObject, ...state.objects],
          isLoading: false,
        });
        return localObject;
      }

      const object = await createObjectService({
        userId: params.userId,
        address: params.address,
        totalArea: params.totalArea,
        propertyType: params.propertyType,
        rooms: params.rooms,
        bathrooms: params.bathrooms,
        kitchenType: params.kitchenType,
        renovationGoal: params.renovationGoal,
        layoutId: params.layoutId,
        customLayoutUrl: params.customLayoutUrl,
      });

      // Add returned object to local state (skip redundant fetchUserObjects)
      const state = useObjectStore.getState();
      set({
        objects: [object, ...state.objects],
        isLoading: false,
      });
      return object;
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
      throw e;
    }
  },

  removeObject: async (objectId) => {
    const state = useObjectStore.getState();
    const userId = state.objects.find((o) => o.id === objectId)?.user_id;

    // Optimistic removal
    set({
      objects: state.objects.filter((o) => o.id !== objectId),
    });

    // Dev users — local only
    if (userId?.startsWith('dev-')) return;

    try {
      await deleteObjectService(objectId);
    } catch (e) {
      // Revert on failure
      set({ objects: state.objects });
      throw e;
    }
  },
}));

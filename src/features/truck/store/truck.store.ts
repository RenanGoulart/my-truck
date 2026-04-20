import { create } from 'zustand';

import { trucksRepo } from '../repository/truck.repository';
import type { NewTruck, Truck } from '../types';

type State = {
  truck: Truck | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  create: (input: NewTruck) => Promise<Truck>;
};

export const useTruckStore = create<State>((set) => ({
  truck: null,
  hydrated: false,
  hydrate: async () => {
    const truck = await trucksRepo.getActive();
    set({ truck, hydrated: true });
  },
  create: async (input) => {
    const truck = await trucksRepo.create(input);
    set({ truck });
    return truck;
  },
}));

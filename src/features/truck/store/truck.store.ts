import { create } from 'zustand';

import { trucksRepo } from '../repository/truck.repository';
import type { NewTruck, Truck } from '../types';

type State = {
  truck: Truck | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  create: (input: NewTruck) => Promise<Truck>;
  update: (input: NewTruck) => Promise<void>;
};

export const useTruckStore = create<State>((set, get) => ({
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
  update: async (input) => {
    const current = get().truck;
    if (!current) throw new Error('Nenhum caminhão ativo');
    await trucksRepo.update(current.id, input);
    set({
      truck: {
        ...current,
        nickname: input.nickname,
        plate: input.plate,
        initialOdometer: input.initialOdometer,
        updatedAt: new Date(),
      },
    });
  },
}));

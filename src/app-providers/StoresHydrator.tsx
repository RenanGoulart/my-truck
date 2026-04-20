import { type ReactNode, useEffect } from 'react';

import { useCategoriesStore } from '@/features/categories/store/categories.store';
import { useTransactionsStore } from '@/features/transactions/store/transactions.store';
import { useTruckStore } from '@/features/truck/store/truck.store';

type Props = { children: ReactNode };

export function StoresHydrator({ children }: Props) {
  const truck = useTruckStore((s) => s.truck);
  const hydrateCategories = useCategoriesStore((s) => s.hydrate);
  const setTruck = useTransactionsStore((s) => s.setTruck);

  useEffect(() => {
    void hydrateCategories();
  }, [hydrateCategories]);

  useEffect(() => {
    if (truck) setTruck(truck.id);
  }, [truck, setTruck]);

  return <>{children}</>;
}

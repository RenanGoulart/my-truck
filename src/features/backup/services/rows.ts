export type TruckRow = {
  id: string;
  nickname: string;
  plate: string | null;
  initial_odometer: number;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
};

export type CategoryRow = {
  id: string;
  name: string;
  kind: 'income' | 'expense';
  icon: string | null;
  color: string | null;
  is_system: number;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
};

export type TransactionRow = {
  id: string;
  truck_id: string;
  category_id: string;
  kind: 'income' | 'expense';
  amount_cents: number;
  occurred_at: number;
  description: string | null;
  odometer: number | null;
  liters: number | null;
  price_per_liter_cents: number | null;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
  sync_status: 'pending' | 'synced' | 'conflict';
  server_id: string | null;
  server_updated_at: number | null;
};

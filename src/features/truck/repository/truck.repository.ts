import { getDb } from '@/db/client';
import { uuid } from '@/shared/lib/uuid';

import type { NewTruck, Truck } from '../types';

type Row = {
  id: string;
  nickname: string;
  plate: string | null;
  initial_odometer: number;
  created_at: number;
  updated_at: number;
};

const rowToTruck = (r: Row): Truck => ({
  id: r.id,
  nickname: r.nickname,
  plate: r.plate ?? undefined,
  initialOdometer: r.initial_odometer,
  createdAt: new Date(r.created_at),
  updatedAt: new Date(r.updated_at),
});

export const trucksRepo = {
  async getActive(): Promise<Truck | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<Row>(
      `SELECT * FROM trucks
       WHERE deleted_at IS NULL
       ORDER BY created_at ASC
       LIMIT 1`
    );
    return row ? rowToTruck(row) : null;
  },

  async create(input: NewTruck): Promise<Truck> {
    const db = await getDb();
    const now = Date.now();
    const id = uuid();
    await db.runAsync(
      `INSERT INTO trucks
       (id, nickname, plate, initial_odometer, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, input.nickname, input.plate ?? null, input.initialOdometer, now, now]
    );
    return {
      id,
      nickname: input.nickname,
      plate: input.plate,
      initialOdometer: input.initialOdometer,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    };
  },

  async update(id: string, input: NewTruck): Promise<void> {
    const db = await getDb();
    const now = Date.now();
    await db.runAsync(
      `UPDATE trucks
       SET nickname = ?, plate = ?, initial_odometer = ?, updated_at = ?
       WHERE id = ?`,
      [input.nickname, input.plate ?? null, input.initialOdometer, now, id]
    );
  },
};

export type Truck = {
  id: string;
  nickname: string;
  plate?: string;
  initialOdometer: number;
  createdAt: Date;
  updatedAt: Date;
};

export type NewTruck = {
  nickname: string;
  plate?: string;
  initialOdometer: number;
};

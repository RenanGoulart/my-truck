export type TransactionKind = 'income' | 'expense';

export type Transaction = {
  id: string;
  truckId: string;
  categoryId: string;
  kind: TransactionKind;
  amountCents: number;
  occurredAt: Date;
  description?: string;
  odometer?: number;
  liters?: number;
  pricePerLiterCents?: number;
};

export type NewTransaction = Omit<Transaction, 'id'>;

export type TransactionPatch = Partial<Omit<Transaction, 'id' | 'truckId'>>;

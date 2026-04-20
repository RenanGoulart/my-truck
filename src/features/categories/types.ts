export type CategoryKind = 'income' | 'expense';

export type Category = {
  id: string;
  name: string;
  kind: CategoryKind;
  icon?: string;
  color?: string;
  isSystem: boolean;
};

export type NewCategory = Omit<Category, 'id' | 'isSystem'>;

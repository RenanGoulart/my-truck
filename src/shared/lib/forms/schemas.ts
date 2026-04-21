import { z } from 'zod';

const decimalString = z
  .string()
  .refine(
    (v) => v.trim() === '' || !Number.isNaN(Number(v.trim().replace(',', '.'))),
    { message: 'Número inválido' }
  );

export const truckFormSchema = z.object({
  nickname: z.string().trim().min(1, 'Informe o apelido').max(40, 'Máx. 40 caracteres'),
  plate: z.string().trim().max(8, 'Máx. 8 caracteres'),
  odometer: decimalString,
});
export type TruckFormValues = z.infer<typeof truckFormSchema>;

export const transactionFormSchema = z.object({
  kind: z.enum(['income', 'expense']),
  amountCents: z
    .number({ message: 'Informe um valor' })
    .int()
    .positive('Informe um valor'),
  categoryId: z.string().min(1, 'Selecione uma categoria'),
  description: z.string().max(500, 'Máx. 500 caracteres'),
  odometer: decimalString,
  liters: decimalString,
  pricePerLiter: decimalString,
});
export type TransactionFormValues = z.infer<typeof transactionFormSchema>;

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome').max(60, 'Máx. 60 caracteres'),
  kind: z.enum(['income', 'expense']),
  color: z.string().min(1),
});
export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export function parseDecimal(v: string | undefined | null): number | undefined {
  if (!v || v.trim() === '') return undefined;
  const n = Number(v.trim().replace(',', '.'));
  return Number.isNaN(n) ? undefined : n;
}

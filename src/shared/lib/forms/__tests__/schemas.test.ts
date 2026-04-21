import {
  categoryFormSchema,
  transactionFormSchema,
  truckFormSchema,
} from '../schemas';

describe('truckFormSchema', () => {
  const base = { nickname: 'Truck', plate: 'ABC1D23', odometer: '1000' };

  it('aceita apelido dentro do limite', () => {
    const r = truckFormSchema.safeParse({ ...base, nickname: 'a'.repeat(40) });
    expect(r.success).toBe(true);
  });

  it('rejeita apelido acima de 40 caracteres', () => {
    const r = truckFormSchema.safeParse({ ...base, nickname: 'a'.repeat(41) });
    expect(r.success).toBe(false);
  });

  it('rejeita apelido vazio', () => {
    const r = truckFormSchema.safeParse({ ...base, nickname: '' });
    expect(r.success).toBe(false);
  });
});

describe('transactionFormSchema', () => {
  const base = {
    kind: 'expense' as const,
    amountCents: 1000,
    categoryId: 'cat-1',
    description: '',
    odometer: '',
    liters: '',
    pricePerLiter: '',
  };

  it('aceita descrição dentro do limite', () => {
    const r = transactionFormSchema.safeParse({
      ...base,
      description: 'a'.repeat(500),
    });
    expect(r.success).toBe(true);
  });

  it('rejeita descrição acima de 500 caracteres', () => {
    const r = transactionFormSchema.safeParse({
      ...base,
      description: 'a'.repeat(501),
    });
    expect(r.success).toBe(false);
  });
});

describe('categoryFormSchema', () => {
  const base = { name: 'Combustível', kind: 'expense' as const, color: '#fff' };

  it('aceita nome dentro do limite', () => {
    const r = categoryFormSchema.safeParse({ ...base, name: 'a'.repeat(60) });
    expect(r.success).toBe(true);
  });

  it('rejeita nome acima de 60 caracteres', () => {
    const r = categoryFormSchema.safeParse({ ...base, name: 'a'.repeat(61) });
    expect(r.success).toBe(false);
  });

  it('rejeita kind inválido', () => {
    const r = categoryFormSchema.safeParse({ ...base, kind: 'other' as never });
    expect(r.success).toBe(false);
  });
});

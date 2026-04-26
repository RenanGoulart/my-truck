import {
  categoryFormSchema,
  formatDateBR,
  parseDateBR,
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
    occurredAt: new Date(),
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

  it('rejeita data muito no futuro', () => {
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const r = transactionFormSchema.safeParse({ ...base, occurredAt: future });
    expect(r.success).toBe(false);
  });

  it('aceita data de hoje', () => {
    const r = transactionFormSchema.safeParse({ ...base, occurredAt: new Date() });
    expect(r.success).toBe(true);
  });
});

describe('parseDateBR', () => {
  it('parseia data válida', () => {
    const d = parseDateBR('15/03/2026');
    expect(d).toBeInstanceOf(Date);
    expect(d?.getFullYear()).toBe(2026);
    expect(d?.getMonth()).toBe(2);
    expect(d?.getDate()).toBe(15);
  });

  it('rejeita 31/02/2026 (dia inválido)', () => {
    expect(parseDateBR('31/02/2026')).toBeUndefined();
  });

  it('aceita 29/02/2024 (ano bissexto)', () => {
    expect(parseDateBR('29/02/2024')).toBeInstanceOf(Date);
  });

  it('rejeita 29/02/2025 (não bissexto)', () => {
    expect(parseDateBR('29/02/2025')).toBeUndefined();
  });

  it('rejeita string mal formada', () => {
    expect(parseDateBR('1/2/2026')).toBeUndefined();
    expect(parseDateBR('15-03-2026')).toBeUndefined();
    expect(parseDateBR('')).toBeUndefined();
  });
});

describe('formatDateBR', () => {
  it('formata em dd/MM/yyyy', () => {
    expect(formatDateBR(new Date(2026, 2, 5))).toBe('05/03/2026');
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

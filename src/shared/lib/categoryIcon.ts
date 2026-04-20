import type { ComponentProps } from 'react';

import { AntDesign } from '@expo/vector-icons';

import type { CategoryKind } from '@/features/categories/types';

export type AntDesignName = ComponentProps<typeof AntDesign>['name'];

const NAME_TO_ICON: Record<string, AntDesignName> = {
  frete: 'car',
  'outros ganhos': 'plus-circle',
  combustível: 'dashboard',
  pedágio: 'swap',
  manutenção: 'tool',
  pneus: 'loading',
  alimentação: 'coffee',
  hospedagem: 'home',
  documentação: 'file-text',
  'outros gastos': 'ellipsis',
};

export const iconForCategory = (
  name: string | undefined,
  kind: CategoryKind
): AntDesignName => {
  if (name) {
    const key = name.toLowerCase().trim();
    if (NAME_TO_ICON[key]) return NAME_TO_ICON[key];
  }
  return kind === 'income' ? 'arrow-down' : 'arrow-up';
};

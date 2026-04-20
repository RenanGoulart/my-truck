import { Text } from 'react-native';

import { Screen } from '@/shared/ui/Screen';

export default function Transactions() {
  return (
    <Screen>
      <Text className="text-white mt-6 text-xl font-semibold">Transações</Text>
      <Text className="text-muted mt-2">Implementado no Passo 4.</Text>
    </Screen>
  );
}

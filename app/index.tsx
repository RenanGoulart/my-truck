import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View } from 'react-native';

export default function Home() {
  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-primary text-3xl font-bold">My Truck</Text>
        <Text className="text-muted mt-2 text-center">
          Fundação pronta. Próximo: banco de dados.
        </Text>
      </View>
    </SafeAreaView>
  );
}

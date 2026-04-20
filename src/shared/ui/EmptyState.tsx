import { AntDesign } from '@expo/vector-icons';
import { Text, View } from 'react-native';

type IconName = React.ComponentProps<typeof AntDesign>['name'];

type Props = {
  icon?: IconName;
  title: string;
  description?: string;
};

export function EmptyState({ icon = 'inbox', title, description }: Props) {
  return (
    <View
      className="items-center justify-center py-10"
      accessibilityRole="text"
      accessibilityLabel={`${title}${description ? `. ${description}` : ''}`}
    >
      <View className="w-16 h-16 rounded-full bg-surface items-center justify-center mb-3">
        <AntDesign name={icon} size={28} color="#94A3B8" />
      </View>
      <Text className="text-white text-base font-semibold text-center">
        {title}
      </Text>
      {description ? (
        <Text className="text-muted text-sm text-center mt-1 px-6">
          {description}
        </Text>
      ) : null}
    </View>
  );
}

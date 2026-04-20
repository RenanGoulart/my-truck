import { AntDesign } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { useCategoriesStore } from '@/features/categories/store/categories.store';
import type { Category } from '@/features/categories/types';
import { iconForCategory } from '@/shared/lib/categoryIcon';
import {
  categoryFormSchema,
  type CategoryFormValues,
} from '@/shared/lib/forms/schemas';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Screen } from '@/shared/ui/Screen';

const COLORS = [
  '#22C55E',
  '#16A34A',
  '#EF4444',
  '#F97316',
  '#EAB308',
  '#A855F7',
  '#EC4899',
  '#06B6D4',
  '#64748B',
  '#FFC107',
];

export default function CategoriesSettings() {
  const items = useCategoriesStore((s) => s.items);
  const hydrated = useCategoriesStore((s) => s.hydrated);
  const hydrate = useCategoriesStore((s) => s.hydrate);
  const create = useCategoriesStore((s) => s.create);
  const remove = useCategoriesStore((s) => s.remove);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: { name: '', kind: 'expense', color: COLORS[0] },
    mode: 'onTouched',
  });

  useEffect(() => {
    if (!hydrated) void hydrate();
  }, [hydrated, hydrate]);

  const onSubmit = async (values: CategoryFormValues) => {
    try {
      await create({ name: values.name.trim(), kind: values.kind, color: values.color });
      reset({ name: '', kind: values.kind, color: values.color });
    } catch (e) {
      Alert.alert('Erro', (e as Error).message);
    }
  };

  const handleDelete = (c: Category) => {
    if (c.isSystem) return;
    Alert.alert('Excluir categoria', `Remover "${c.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => void remove(c.id),
      },
    ]);
  };

  const income = items.filter((c) => c.kind === 'income');
  const expense = items.filter((c) => c.kind === 'expense');

  return (
    <>
      <Stack.Screen options={{ title: 'Categorias' }} />
      <Screen>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingVertical: 16, gap: 20 }}
            showsVerticalScrollIndicator={false}
          >
            <View className="gap-4">
              <Text className="text-white text-base font-semibold">
                Nova categoria
              </Text>

              <Controller
                control={control}
                name="kind"
                render={({ field: { value, onChange } }) => (
                  <View className="flex-row gap-2">
                    <KindChip
                      label="Gasto"
                      active={value === 'expense'}
                      onPress={() => onChange('expense')}
                      activeColor="#EF4444"
                    />
                    <KindChip
                      label="Ganho"
                      active={value === 'income'}
                      onPress={() => onChange('income')}
                      activeColor="#22C55E"
                    />
                  </View>
                )}
              />

              <Controller
                control={control}
                name="name"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    label="Nome"
                    placeholder="Ex.: Estacionamento"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    autoCapitalize="sentences"
                    error={errors.name?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="color"
                render={({ field: { value, onChange } }) => (
                  <View>
                    <Text className="text-muted mb-2 text-sm font-medium">Cor</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {COLORS.map((c) => (
                        <Pressable
                          key={c}
                          onPress={() => onChange(c)}
                          className={`w-9 h-9 rounded-full items-center justify-center border-2 ${
                            value === c ? 'border-white' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: c }}
                        >
                          {value === c ? (
                            <AntDesign name="check" size={16} color="#0B0F14" />
                          ) : null}
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}
              />

              <Button
                label="Adicionar"
                onPress={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                loading={isSubmitting}
              />
            </View>

            <Section title="Ganhos" list={income} onDelete={handleDelete} />
            <Section title="Gastos" list={expense} onDelete={handleDelete} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Screen>
    </>
  );
}

function KindChip({
  label,
  active,
  onPress,
  activeColor,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  activeColor: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 h-12 items-center justify-center rounded-xl border ${
        active ? 'border-transparent' : 'border-border bg-card'
      }`}
      style={active ? { backgroundColor: activeColor } : undefined}
    >
      <Text className={`text-base font-semibold ${active ? 'text-white' : 'text-muted'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

function Section({
  title,
  list,
  onDelete,
}: {
  title: string;
  list: Category[];
  onDelete: (c: Category) => void;
}) {
  return (
    <View>
      <Text className="text-muted text-xs uppercase tracking-wide mb-2">{title}</Text>
      <View className="gap-2">
        {list.map((c) => (
          <View
            key={c.id}
            className="flex-row items-center bg-surface border border-border rounded-2xl px-4 py-3"
          >
            <View
              className="w-9 h-9 rounded-full items-center justify-center"
              style={{ backgroundColor: (c.color ?? '#334155') + '33' }}
            >
              <AntDesign
                name={iconForCategory(c.name, c.kind)}
                size={18}
                color={c.color ?? '#94A3B8'}
              />
            </View>
            <Text className="ml-3 flex-1 text-white font-semibold">{c.name}</Text>
            {c.isSystem ? (
              <Text className="text-muted text-xs">padrão</Text>
            ) : (
              <Pressable onPress={() => onDelete(c)} className="p-2">
                <AntDesign name="delete" size={18} color="#EF4444" />
              </Pressable>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

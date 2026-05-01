import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';

import { formatDateBR } from '@/shared/lib/forms/schemas';

type Props = {
  valueDate: Date | undefined;
  onChange: (d: Date | undefined) => void;
  label?: string;
  error?: string;
  placeholder?: string;
};

const today = () => new Date();

export function DateInput({
  valueDate,
  onChange,
  label,
  error,
  placeholder,
}: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const [draftDate, setDraftDate] = useState(valueDate ?? today());

  useEffect(() => {
    if (valueDate) {
      setDraftDate(valueDate);
    }
  }, [valueDate]);

  const displayValue = valueDate ? formatDateBR(valueDate) : '';

  const openPicker = () => {
    setDraftDate(valueDate ?? today());
    setShowPicker(true);
  };

  const handleAndroidChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    setShowPicker(false);
    if (event.type === 'set' && selectedDate) {
      onChange(selectedDate);
    }
  };

  const handleIosChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) {
      setDraftDate(selectedDate);
    }
  };

  const confirmIosDate = () => {
    onChange(draftDate);
    setShowPicker(false);
  };

  const cancelIosDate = () => {
    setDraftDate(valueDate ?? today());
    setShowPicker(false);
  };

  return (
    <View>
      {label ? (
        <Text className="text-muted mb-2 text-sm font-medium">{label}</Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label ?? 'Selecionar data'}
        onPress={openPicker}
        className={`bg-card rounded-xl px-4 h-14 border justify-center ${
          error ? 'border-expense' : 'border-border'
        }`}
      >
        <Text
          className={
            displayValue ? 'text-white text-base' : 'text-slate-500 text-base'
          }
        >
          {displayValue || placeholder || 'Selecionar data'}
        </Text>
      </Pressable>

      {error ? (
        <Text className="text-expense mt-1 text-xs">{error}</Text>
      ) : null}

      {showPicker && Platform.OS === 'android' ? (
        <DateTimePicker
          value={valueDate ?? today()}
          mode="date"
          display="default"
          maximumDate={today()}
          onChange={handleAndroidChange}
        />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal
          visible={showPicker}
          transparent
          animationType="fade"
          onRequestClose={cancelIosDate}
        >
          <View className="flex-1 bg-black/60 justify-end">
            <Pressable className="flex-1" onPress={cancelIosDate} />
            <View className="bg-bg border-t border-border p-4">
              <View className="flex-row justify-between items-center mb-2">
                <Pressable onPress={cancelIosDate} className="px-2 py-3">
                  <Text className="text-muted text-base">Cancelar</Text>
                </Pressable>
                <Pressable onPress={confirmIosDate} className="px-2 py-3">
                  <Text className="text-primary text-base font-semibold">OK</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={draftDate}
                mode="date"
                display="spinner"
                maximumDate={today()}
                onChange={handleIosChange}
              />
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

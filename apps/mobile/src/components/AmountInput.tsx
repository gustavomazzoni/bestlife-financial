import { StyleProp, TextStyle } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';

interface AmountInputProps {
  /** Decimal string with '.' as separator, e.g. "1234.56", or '' when empty. */
  value: string;
  onChangeValue: (value: string) => void;
  style?: StyleProp<TextStyle>;
  placeholder?: string;
  placeholderTextColor?: string;
  testID?: string;
}

function centsFromValue(value: string): number {
  const n = Number(value);
  if (!value || Number.isNaN(n)) return 0;
  return Math.round(Math.abs(n) * 100);
}

function formatCents(cents: number): string {
  if (cents === 0) return '';
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/**
 * BRL-masked amount input: user types digits only, the field renders them
 * grouped with a comma decimal separator (calculator-style, e.g. "1.234,56").
 */
export function AmountInput({
  value,
  onChangeValue,
  style,
  placeholder = '0,00',
  placeholderTextColor,
  testID,
}: AmountInputProps) {
  const display = formatCents(centsFromValue(value));

  function handleChangeText(text: string) {
    const digits = text.replace(/[^0-9]/g, '');
    if (!digits) {
      onChangeValue('');
      return;
    }
    onChangeValue((parseInt(digits, 10) / 100).toFixed(2));
  }

  return (
    <BottomSheetTextInput
      style={style}
      keyboardType="number-pad"
      value={display}
      onChangeText={handleChangeText}
      placeholder={placeholder}
      placeholderTextColor={placeholderTextColor}
      testID={testID}
    />
  );
}

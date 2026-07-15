import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AccountsScreen } from '../screens/AccountsScreen';
import { CategoriesScreen } from '../screens/CategoriesScreen';
import { colors } from '../theme';

export type AccountsStackParamList = {
  AccountsHome: undefined;
  Categories: undefined;
};

const Stack = createNativeStackNavigator<AccountsStackParamList>();

export function AccountsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: colors.accent }}>
      <Stack.Screen
        name="AccountsHome"
        component={AccountsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{ title: 'Categorias' }}
      />
    </Stack.Navigator>
  );
}
